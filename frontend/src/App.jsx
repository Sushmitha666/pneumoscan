import Vortex from "./components/Vortex";
import Scanner from "./components/Scanner";

const go = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

const STATS = [
  { value: "98.97%", label: "Recall", note: "386 of 390 pneumonia cases caught" },
  { value: "83.55%", label: "Precision", note: "the cost of a high-recall threshold" },
  { value: "0.9576", label: "ROC-AUC", note: "on the held-out test set" },
  { value: "624", label: "Test X-rays", note: "official test split, evaluated once" },
];

const STEPS = [
  { n: "01", title: "Upload", text: "Choose a frontal chest X-ray image." },
  { n: "02", title: "Preprocess", text: "Resized to 224×224 and normalised like the pretrained weights expect." },
  { n: "03", title: "Classify", text: "A fine-tuned ResNet-18 scores the scan. The threshold is tuned so sick patients are rarely missed." },
  { n: "04", title: "Explain", text: "Grad-CAM highlights the regions that drove the prediction." },
];

export default function App() {
  return (
    <>
      <header className="nav">
        <div className="logo">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12h4l2-6 4 12 2-6h6" />
          </svg>
          PneumoScan
        </div>
        <nav>
          <button onClick={() => go("demo")}>Demo</button>
          <button onClick={() => go("performance")}>Performance</button>
          <button onClick={() => go("how")}>How it works</button>
          <button onClick={() => go("limits")}>Limitations</button>
        </nav>
      </header>

      <main>
        <section className="hero-wrap">
          <Vortex baseHue={180} className="hero">
            <span className="pill">Deep learning · Explainable AI</span>
            <h1>Catch pneumonia <span className="grad">before it spreads</span></h1>
            <p className="lead">
              A fine-tuned ResNet-18 reads chest X-rays, is tuned to rarely miss a sick patient,
              and shows exactly where in the lungs it is looking.
            </p>
            <svg className="ecg" viewBox="0 0 600 80" preserveAspectRatio="none">
              <path d="M0 40 H190 L210 12 L238 68 L258 40 H600" />
            </svg>
            <div className="cta">
              <button className="btn primary big" onClick={() => go("demo")}>Try the demo</button>
              <button className="btn ghost big" onClick={() => go("how")}>How it works</button>
            </div>
          </Vortex>
        </section>

        <section id="demo" className="section">
          <h2>Analyze an X-ray</h2>
          <p className="sub">Upload a scan and get a prediction with a visual explanation.</p>
          <Scanner />
          <p className="disclaimer">
            Learning project, not a medical device. Never use it for diagnosis or treatment decisions.
          </p>
        </section>

        <section id="performance" className="section">
          <h2>Model performance</h2>
          <p className="sub">Measured once on the official test set, using a threshold chosen on validation data.</p>
          <div className="stats">
            {STATS.map((s) => (
              <div className="stat" key={s.label}>
                <strong>{s.value}</strong>
                <span>{s.label}</span>
                <small>{s.note}</small>
              </div>
            ))}
          </div>
        </section>

        <section id="how" className="section">
          <h2>How it works</h2>
          <div className="steps">
            {STEPS.map((s) => (
              <div className="step" key={s.n}>
                <span className="num">{s.n}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="limits" className="section">
          <h2>Limitations</h2>
          <ul className="limits">
            <li>Trained on pediatric chest X-rays from a single source, so results may not carry over to adults or other hospitals.</li>
            <li>The high-recall threshold produces false alarms: 76 healthy scans were flagged in testing.</li>
            <li>Validation scores were higher than test scores, a known quirk of this dataset, so the test numbers are the realistic ones.</li>
            <li>Grad-CAM heatmaps are coarse and cannot rule out every shortcut the model might use.</li>
            <li>This is an educational project and not a medical device.</li>
          </ul>
        </section>
      </main>

      <footer className="footer">
        Built with PyTorch, FastAPI and React · Learning project, not a medical device
      </footer>
    </>
  );
}
