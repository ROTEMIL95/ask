import { useMemo, useRef, useState, useEffect } from "react";

/**
 * ApiDocsViewer (Step 7 - UX polish)
 * ------------------------------------------------------
 * Adds:
 *  - Expand All / Collapse All buttons to open/close all endpoints.
 *  - Clear button next to the search box.
 *  - Keeps "/" keyboard shortcut to focus search.
 *
 * Preserves Step 6 features:
 *  - Load OpenAPI/Swagger spec by URL
 *  - Endpoint search (method/path/summary/operationId)
 *  - Auto-generate request body from schema for POST/PUT/PATCH
 *  - Content-Type/Accept headers when needed
 *  - Example code (JS / Python / cURL)
 *
 * NOTE:
 * - Copy buttons are not included here (you said you already have them).
 * - Plug your auth/headers UI into `headersFromCreds()` if needed.
 */

export default function ApiDocsViewer() {
  // Core UI state
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [spec, setSpec] = useState(null);
  const [endpoints, setEndpoints] = useState([]);
  const [error, setError] = useState("");

  // Search + keyboard focus
  const [search, setSearch] = useState("");
  const searchRef = useRef(null);

  // Open state: allow multiple endpoints open (for Expand All)
  const [openKeys, setOpenKeys] = useState(() => new Set());

  // Optional creds placeholder if you have your own headers/auth system
  const [creds] = useState({}); // reserved for integration, not used directly here

  // Focus search on "/" key
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /** Build a stable key for an endpoint */
  const keyFor = (ep) => `${ep.method} ${ep.path}`;

  /**
   * Fetch and parse the OpenAPI/Swagger spec by URL.
   * Tries direct fetch; if it fails (e.g., CORS/HTML), attempts a demo proxy.
   */
  const fetchSpec = async () => {
    setError("");
    setEndpoints([]);
    setSpec(null);
    setOpenKeys(new Set());

    if (!url) {
      setError("Please paste a valid OpenAPI/Swagger URL.");
      return;
    }

    setLoading(true);
    try {
      let res = await fetch(url);
      let data;

      try {
        data = await res.json();
      } catch {
        // DEMO-ONLY: naive proxy fallback for CORS/HTML responses.
        const proxied = `https://cors.isomorphic.app/${encodeURIComponent(url)}`;
        const res2 = await fetch(proxied);
        data = await res2.json();
      }

      if (!(data && (data.openapi || data.swagger))) {
        throw new Error("This does not look like a valid OpenAPI/Swagger document.");
      }


setSpec(data);
window.__apiSpec = data;

// Flatten endpoints list...
const paths = data.paths || {};
// ...

      const list = [];
      Object.entries(paths).forEach(([path, methods]) => {
        Object.entries(methods).forEach(([method, details]) => {
          list.push({
            method: method.toUpperCase(),
            path,
            summary: details.summary || "",
            operationId: details.operationId || "",
            details,
            security: details.security,
          });
        });
      });

      setEndpoints(list);
    } catch (e) {
      setError(e.message || "Failed to load the spec.");
    } finally {
      setLoading(false);
    }
  };

  /** Resolve base URL for endpoints */
  const serverBase = spec?.servers?.[0]?.url || "";
 const fullUrl = (p) => {
  if (!serverBase) return p;
  const base = String(serverBase).replace(/\/+$/, "");
  const path = String(p || "").replace(/^\/+/, "");
  return `${base}/${path}`;
};


  /** Choose a preferred content type for requestBody */
  const pickContentType = (contentObj) => {
    if (!contentObj || typeof contentObj !== "object") return null;
    const prefs = ["application/json", "application/x-www-form-urlencoded", "multipart/form-data"];
    for (const ct of prefs) if (contentObj[ct]) return ct;
    const first = Object.keys(contentObj)[0];
    return first || null;
  };

  /** Generate a sample payload from schema */
  const sampleFromSchema = (schema, depth = 0) => {
    if (!schema || depth > 6) return null;
    if (schema.example !== undefined) return schema.example;
    if (schema.default !== undefined) return schema.default;
    if (schema.const !== undefined) return schema.const;
    if (Array.isArray(schema.enum) && schema.enum.length) return schema.enum[0];

    const t =
      schema.type ||
      (schema.oneOf?.[0]?.type) ||
      (schema.anyOf?.[0]?.type) ||
      (schema.allOf ? "object" : undefined);

    if (t === "object" || schema.properties || schema.allOf) {
      const obj = {};
      const sources = [];
      if (schema.allOf) sources.push(...schema.allOf);
      if (schema.properties) sources.push({ properties: schema.properties, required: schema.required });

      for (const s of sources) {
        const props = s.properties || {};
        const required = new Set(s.required || []);
        for (const [k, v] of Object.entries(props)) {
          let val = sampleFromSchema(v, depth + 1);
          if (val === null || val === undefined) {
            val =
              v.type === "number" || v.type === "integer" ? 0 :
              v.type === "boolean" ? false :
              v.type === "array" ? [] :
              v.type === "object" ? {} :
              required.has(k) ? "" : "";
          }
          obj[k] = val;
        }
      }
      return obj;
    }

    if (t === "array" || schema.items) {
      return [sampleFromSchema(schema.items || {}, depth + 1)];
    }

    if (t === "number" || t === "integer") return 0;
    if (t === "boolean") return false;

    if (t === "string" || !t) {
      const f = schema.format;
      if (f === "date-time") return new Date().toISOString();
      if (f === "date") return new Date().toISOString().slice(0, 10);
      if (f === "email") return "user@example.com";
      if (f === "uuid") return "00000000-0000-0000-0000-000000000000";
      if (f === "uri" || f === "url") return "https://example.com";
      if (schema.pattern) return "string";
      return "string";
    }
    return null;
  };

  /** Build query string from parameters (in: "query") */
  const buildQueryFromParams = (params = []) => {
    const usp = new URLSearchParams();
    params
      .filter((p) => p.in === "query")
      .forEach((p) => {
        const key = p.name;
        const v =
          (p.example !== undefined && p.example) ||
          (Array.isArray(p.examples) && p.examples[0]) ||
          sampleFromSchema(p.schema) ||
          "";
        usp.set(key, typeof v === "object" ? JSON.stringify(v) : String(v));
      });
    return usp;
  };

  /** Plug your headers/auth system here (merge your own headers) */
  const headersFromCreds = () => {
    // Example: return { Authorization: `Bearer ${token}`, "X-API-KEY": apiKey }
    return {};
  };

  /** Build example code for an endpoint */
  const codeFor = (ep) => {
    const d = ep.details || {};
    const params = d.parameters || [];
    const query = buildQueryFromParams(params);

    const base = fullUrl(ep.path);
    const qs = query.toString();
    const u = qs ? `${base}${base.includes("?") ? "&" : "?"}${qs}` : base;

    // requestBody
    const rb = d.requestBody?.content ? d.requestBody.content : null;
    const contentType = pickContentType(rb);
    let bodySample = null;
    if (contentType) {
      const schema = rb[contentType]?.schema;
      bodySample = sampleFromSchema(schema);
    }

    // Headers
    const headers = {
      ...headersFromCreds(),
      ...(contentType ? { "Content-Type": contentType } : {}),
      ...(contentType === "application/json" ? { Accept: "application/json" } : {}),
    };

    // JavaScript (fetch)
    const initJs = {
      method: ep.method,
      headers,
      ...(bodySample !== null
        ? (contentType === "application/json"
            ? { body: JSON.stringify(bodySample, null, 2) }
            : { body: typeof bodySample === "string" ? bodySample : JSON.stringify(bodySample) })
        : {}),
    };

    const js = `fetch("${u}", ${JSON.stringify(initJs, null, 2)})
  .then(r => r.json().catch(()=>r.text()))
  .then(console.log)
  .catch(console.error);`;

    // Python (requests)
    const headersPy = Object.entries(headers)
      .map(([k, v]) => `'${k}': '${v}'`)
      .join(", ");

    const py = `import requests

headers = {${headersPy}}
${bodySample !== null ? `data = ${contentType === "application/json" ? JSON.stringify(bodySample, null, 2) : JSON.stringify(bodySample)}` : ""}
resp = requests.${ep.method.toLowerCase()}("${u}", headers=headers${bodySample !== null ? `, data=${contentType === "application/json" ? "requests.utils.requote_uri(\"\"\"" + JSON.stringify(bodySample) + "\"\"\")" : "data"}` : ""})
print(resp.status_code)
try:
    print(resp.json())
except Exception:
    print(resp.text)`;

    // cURL
    const curlHeaders = Object.entries(headers)
      .map(([k, v]) => `-H "${k}: ${v}"`)
      .join(" ");

    const curlBody =
      bodySample !== null
        ? (contentType === "application/json"
            ? ` --data '${JSON.stringify(bodySample)}'`
            : ` --data '${typeof bodySample === "string" ? bodySample : JSON.stringify(bodySample)}'`)
        : "";

    const curl = `curl -X ${ep.method} ${curlHeaders ? curlHeaders + " " : ""}"${u}"${curlBody}`;

    return { js, python: py, curl, contentType, bodySample };
  };

  /** Filter endpoints by the search string (method/path/summary/operationId) */
  const filtered = useMemo(() => {
    const q = (search || "").trim().toLowerCase();
    if (!q) return endpoints;
    return endpoints.filter((ep) => {
      const hay = `${ep.method} ${ep.path} ${ep.summary || ""} ${ep.operationId || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [endpoints, search]);

  /** Expand all / Collapse all helpers */
  const expandAll = () => {
    const all = new Set(filtered.map((ep) => keyFor(ep)));
    setOpenKeys(all);
  };
  const collapseAll = () => setOpenKeys(new Set());

  /** Toggle a single endpoint open/closed */
  const toggleKey = (k) => {
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };

  /** Clear search box */
  const clearSearch = () => setSearch("");

  return (
    <div style={{ padding: 16, border: "1px solid #ccc", borderRadius: 8, margin: "16px 0" }}>
      <h3>📄 API Docs Viewer</h3>

      {/* Spec URL input + Load button */}
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <input
          style={{ flex: 1, padding: 8 }}
          placeholder="https://…/openapi.json  (e.g., https://petstore.swagger.io/v2/swagger.json)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button onClick={fetchSpec} disabled={loading}>
          {loading ? "Loading…" : "Load Spec"}
        </button>
      </div>

      {/* Error box */}
      {error && <div style={{ color: "red", marginTop: 8 }}>{error}</div>}

      {/* Spec info */}
      {spec && (
        <div style={{ marginTop: 8, fontSize: 14, color: "#555" }}>
          ✓ Loaded: <b>{spec.info?.title}</b> (v{spec.info?.version}) · Base URL: {serverBase || "Not specified"}
        </div>
      )}

      {/* Search + controls */}
      {endpoints.length > 0 && (
        <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 8, flex: 1, minWidth: 260 }}>
            <input
              ref={searchRef}
              style={{ flex: 1, padding: 8 }}
              placeholder="Search endpoints (tip: press / to focus)…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button onClick={clearSearch} disabled={!search}>Clear</button>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={expandAll} disabled={filtered.length === 0}>Expand All</button>
            <button onClick={collapseAll} disabled={openKeys.size === 0}>Collapse All</button>
          </div>
        </div>
      )}

      {/* Endpoints list (filtered) */}
      {filtered.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <h4>Endpoints ({filtered.length}{search ? ` / ${endpoints.length} total` : ""})</h4>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {filtered.map((ep) => {
              const k = keyFor(ep);
              const open = openKeys.has(k);
              const result = open ? codeFor(ep) : null;

              return (
                <li key={k} style={{ border: "1px solid #e5e5e5", borderRadius: 8, padding: 12, marginBottom: 10 }}>
                  <div
                    onClick={() => toggleKey(k)}
                    style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  >
                    <div>
                      <b>{ep.method}</b> <code>{ep.path}</code> — {ep.summary || ep.operationId || ""}
                    </div>
                    <div style={{ fontSize: 12, color: "#666" }}>{open ? "Close ▲" : "Open ▼"}</div>
                  </div>

                  {/* Expanded block with code samples */}
                  {open && result && (
                    <div style={{ marginTop: 10 }}>
                      <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>
                        Full URL: <code>{fullUrl(ep.path)}</code>
                        {result.contentType ? <> · Content-Type: <code>{result.contentType}</code></> : null}
                      </div>

                      {/* Auto-generated request body preview */}
                      {result.bodySample !== null && (
                        <div style={{ margin: "8px 0", fontSize: 12, color: "#555" }}>
                          Request Body (auto-generated from schema):
                          <pre style={{ background: "#f7f7f7", padding: 8, overflowX: "auto" }}>
{JSON.stringify(result.bodySample, null, 2)}
                          </pre>
                        </div>
                      )}

                      {/* Code samples (no copy buttons; you already have them) */}
                      <div style={{ display: "grid", gap: 8 }}>
                        <div>
                          <div style={{ fontWeight: 600 }}>JavaScript (fetch)</div>
                          <pre style={{ background: "#f7f7f7", padding: 8, overflowX: "auto" }}>{result.js}</pre>
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>Python (requests)</div>
                          <pre style={{ background: "#f7f7f7", padding: 8, overflowX: "auto" }}>{result.python}</pre>
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>cURL</div>
                          <pre style={{ background: "#f7f7f7", padding: 8, overflowX: "auto" }}>{result.curl}</pre>
                        </div>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
