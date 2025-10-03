# app.py — גרסה מינימלית שעובדת
from flask import Flask, request, jsonify
from flask_cors import CORS
import os, requests, certifi

app = Flask(__name__)

# CORS פשוט שעובד
ALLOWED_ORIGINS = [
    "https://talkapi.ai",
    "https://talkapi.netlify.app",
    "http://localhost:5173"
    
]
CORS(app, resources={r"/*": {"origins": ALLOWED_ORIGINS}},
     methods=["GET", "POST", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin", "X-API-Key"],
     expose_headers=["Content-Type", "Authorization"],
     max_age=86400)

# תעודות SSL תקינות בכל סביבה
os.environ["SSL_CERT_FILE"] = certifi.where()

# בריאות
@app.get("/health")
def health():
    return {"ok": True}

# סטטוס קצר
@app.get("/status")
def status():
    return jsonify({
        "routes": [r.rule for r in app.url_map.iter_rules()]
    })

# נקודת הרצה אחת — /api/run
# לא בטוח להישאיר פתוח לכול URL. כדי לעבוד עכשיו — נדגים עם 2 בסיסים מאושרים.
ALLOWED_BASES = {
    "exchangerate": "https://api.exchangerate.host",
    "openweather": "https://api.openweathermap.org",
}

@app.post("/api/run")
def api_run():
    data = request.get_json(force=True) or {}
    base_key = data.get("base_key")
    path = data.get("path", "/")
    method = (data.get("method") or "GET").upper()
    headers = data.get("headers") or {}
    params = data.get("params") or {}
    body = data.get("body")

    base_url = ALLOWED_BASES.get(base_key)
    if not base_url:
        return jsonify({"error": "BASE_NOT_ALLOWED", "allowed": list(ALLOWED_BASES.keys())}), 400

    url = f"{base_url}{path}"
    try:
        resp = requests.request(method, url, headers=headers, params=params, json=body, timeout=30)
        try:
            payload = resp.json()
        except Exception:
            payload = {"text": resp.text[:5000]}
        return jsonify({"status": resp.status_code, "data": payload}), 200
    except Exception as e:
        return jsonify({"error": "REQUEST_FAILED", "details": str(e)}), 502

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 5000)))