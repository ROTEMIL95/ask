import React from "react";

const LANGS = ["JavaScript", "Python", "cURL", "C#", "Java", "Go"];

export function LanguageSelector({
  value,
  onChange,
}: { value: string; onChange: (v: string) => void }) {
  return (
    <label style={{ display: "block", marginBottom: 12 }}>
      Language:&nbsp;
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {LANGS.map((l) => (
          <option key={l} value={l}>{l}</option>
        ))}
      </select>
    </label>
  );
}
