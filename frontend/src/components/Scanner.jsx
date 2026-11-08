import { useEffect, useRef, useState } from "react";
import { API_URL } from "../config";

const CIRC = 2 * Math.PI * 54;

function Gauge({ value, danger }) {
  const pct = Math.round(value * 100);
  return (
    <div className="gauge">
      <svg viewBox="0 0 128 128">
        <circle cx="64" cy="64" r="54" className="gauge-bg" />
        <circle
          cx="64" cy="64" r="54"
          className={`gauge-fg ${danger ? "danger" : "ok"}`}
          strokeDasharray={CIRC}
          strokeDashoffset={CIRC * (1 - value)}
        />
      </svg>
      <div className="gauge-text">
        <strong>{pct}%</strong>
        <span>pneumonia<br />probability</span>
      </div>
    </div>
  );
}

export default function Scanner() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [drag, setDrag] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const pick = (f) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setError("Please choose an image file (JPG or PNG).");
      return;
    }
    setFile(f); setResult(null); setError("");
    setPreview(URL.createObjectURL(f));
  };

  const reset = () => {
    setFile(null); setPreview(null); setResult(null); setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const analyze = async () => {
    if (!file) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(API_URL, { method: "POST", body: fd });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      setResult(await res.json());
    } catch (e) {
      setError("Could not reach the model server. Make sure the backend is running: uvicorn server:app --reload");
    } finally {
      setLoading(false);
    }
  };

  const danger = result?.label === "PNEUMONIA";

  return (
    <div className="scanner">
      <div className="panel">
        <div className="panel-head"><span className="dot" /> Upload chest X-ray</div>

        {!preview ? (
          <div
            className={`drop ${drag ? "drag" : ""}`}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files[0]); }}
          >
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 16V4M7 9l5-5 5 5M4 20h16" />
            </svg>
            <p><b>Drop an X-ray here</b> or click to browse</p>
            <small>JPG or PNG. Frontal chest view works best.</small>
          </div>
        ) : (
          <div className="preview">
            <img src={preview} alt="Uploaded chest X-ray" />
            {loading && <div className="scanline" />}
          </div>
        )}

        <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files[0])} />

        <div className="actions">
          <button className="btn primary" disabled={!file || loading} onClick={analyze}>
            {loading ? "Analyzing…" : "Analyze X-ray"}
          </button>
          {file && <button className="btn ghost" onClick={reset} disabled={loading}>Clear</button>}
        </div>
        {error && <p className="error">{error}</p>}
      </div>

      <div className="panel">
        <div className="panel-head"><span className="dot teal" /> AI analysis</div>

        {!result && !loading && (
          <div className="empty">
            <svg viewBox="0 0 200 60" className="ecg-small"><path d="M0 30 H55 L65 8 L80 52 L92 30 H200" /></svg>
            <p>The prediction and the Grad-CAM heatmap will appear here.</p>
          </div>
        )}

        {loading && (
          <div className="empty"><div className="spinner" /><p>Running ResNet-18 and generating heatmap…</p></div>
        )}

        {result && (
          <div className="result">
            <div className="verdict-row">
              <Gauge value={result.probability} danger={danger} />
              <div>
                <span className={`badge ${danger ? "danger" : "ok"}`}>
                  {danger ? "Pneumonia likely" : "No pneumonia detected"}
                </span>
                <p className="muted small">
                  {danger
                    ? "The model flagged this scan. A clinician should review it."
                    : "The model did not flag this scan. This does not rule out disease."}
                </p>
              </div>
            </div>

            {result.heatmap && (
              <div className="compare">
                <figure><img src={preview} alt="Original" /><figcaption>Original</figcaption></figure>
                <figure>
                  <img src={`data:image/png;base64,${result.heatmap}`} alt="Grad-CAM heatmap" />
                  <figcaption>Grad-CAM: where the model looked</figcaption>
                </figure>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
