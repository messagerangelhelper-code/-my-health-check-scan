import { useCallback, useEffect, useState } from "react";
import Scanner from "./Scanner.jsx";
import Settings from "./Settings.jsx";
import ResultView from "./ResultView.jsx";
import { analyze } from "./analyze.js";
import { fetchProduct, cleanBarcode, productName } from "./foodApi.js";
import { loadSettings, saveSettings, loadHistory, addToHistory, clearHistory } from "./storage.js";
import { ALLERGENS, AVOID_OPTIONS } from "./ingredients.js";
import { BRAND } from "./brand.js";

const VERDICT_ICON = { red: "⛔", amber: "⚠️", green: "✅", unknown: "❔" };

function ManualCheck({ onCheck, title = "Check an ingredient list", hint }) {
  const [text, setText] = useState("");
  return (
    <form className="manual" onSubmit={(e) => { e.preventDefault(); if (text.trim().length > 3) onCheck(text); }}>
      <label htmlFor="manual-text" className="label">{title}</label>
      {hint && <p className="muted small">{hint}</p>}
      <textarea id="manual-text" rows={4} value={text} onChange={(e) => setText(e.target.value)}
        placeholder="e.g. Sugar, enriched flour, Red 40, Yellow 5, BHA…" />
      <button type="submit" className="btn-secondary" disabled={text.trim().length <= 3}>Check ingredients</button>
    </form>
  );
}

export default function App() {
  const [settings, setSettings] = useState(loadSettings);
  const [history, setHistory] = useState(loadHistory);
  const [view, setView] = useState(() => (loadSettings().setupDone ? "home" : "settings"));
  const [barcode, setBarcode] = useState("");
  const [product, setProduct] = useState(null);
  const [error, setError] = useState("");
  const [lastCode, setLastCode] = useState("");

  useEffect(() => {
    const root = document.documentElement.style;
    root.setProperty("--green", BRAND.colors.main);
    root.setProperty("--green-2", BRAND.colors.mainHover);
    root.setProperty("--mint", BRAND.colors.soft);
    document.title = BRAND.name;
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("big-text", !!settings.bigText);
  }, [settings.bigText]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [view]);

  const updateSettings = (s) => {
    setSettings(s);
    saveSettings(s);
  };

  const lookUp = useCallback(async (code) => {
    const clean = cleanBarcode(code);
    setError("");
    setLastCode(clean);
    setView("loading");
    try {
      const p = await fetchProduct(clean);
      if (!p) {
        setView("notfound");
        return;
      }
      setProduct(p);
      const r = analyze(p, loadSettings());
      setHistory(addToHistory({ code: p.code, name: productName(p), brand: p.brands || "", verdict: r.verdict, time: Date.now() }));
      setView("result");
    } catch (e) {
      setError(e.message || "Something went wrong. Please try again.");
      setView("home");
    }
  }, []);

  const onScanned = useCallback((code) => lookUp(code), [lookUp]);
  const closeScanner = useCallback(() => setView("home"), []);

  function checkText(text, base = {}) {
    setProduct({ ...base, product_name: base.product_name || "Ingredients you entered", ingredients_text: text });
    setView("result");
  }

  const result = product ? analyze(product, settings) : null;
  const chosen = [
    ...ALLERGENS.filter((a) => settings.allergens.includes(a.id)).map((a) => a.name),
    ...AVOID_OPTIONS.filter((o) => settings.avoid.includes(o.id)).map((o) => o.name),
  ];

  return (
    <div className="app">
      <header className="top">
        <button type="button" className="brand" onClick={() => setView("home")} aria-label={`${BRAND.name} home`}>
          <span className="logo" aria-hidden="true">✓</span>
          <span>{BRAND.name}</span>
        </button>
        {view !== "settings" && (
          <button type="button" className="link light" onClick={() => setView("settings")}>My checks</button>
        )}
      </header>

      <main>
        {view === "settings" && (
          <Settings
            settings={settings}
            firstTime={!settings.setupDone}
            onChange={updateSettings}
            onDone={() => { updateSettings({ ...settings, setupDone: true }); setView(product ? "result" : "home"); }}
          />
        )}

        {view === "home" && (
          <>
            <section className="card hero">
              <h1>What's really in your food?</h1>
              <p>{BRAND.tagline}</p>
              <button type="button" className="btn-primary big" onClick={() => { setError(""); setView("scan"); }}>
                <span aria-hidden="true">📷</span> Scan a barcode
              </button>
              <form className="barcode-form" onSubmit={(e) => { e.preventDefault(); if (cleanBarcode(barcode).length >= 6) lookUp(barcode); }}>
                <label htmlFor="barcode" className="label">Or type the barcode numbers</label>
                <div className="inline">
                  <input id="barcode" inputMode="numeric" autoComplete="off" value={barcode}
                    onChange={(e) => setBarcode(e.target.value)} placeholder="e.g. 016000275287" />
                  <button type="submit" className="btn-secondary" disabled={cleanBarcode(barcode).length < 6}>Look up</button>
                </div>
              </form>
              {error && <p className="error">{error}</p>}
            </section>

            <section className="card">
              <div className="row-between">
                <h2>Your checks</h2>
                <button type="button" className="link" onClick={() => setView("settings")}>Change</button>
              </div>
              <p className="muted">Always checking for banned and restricted ingredients{chosen.length ? ", plus:" : "."}</p>
              {chosen.length > 0 && <div className="chips">{chosen.map((c) => <span key={c} className="chip on static">{c}</span>)}</div>}
            </section>

            <section className="card">
              <ManualCheck onCheck={(t) => checkText(t)} hint="No barcode? Type or paste the ingredients from the package." />
            </section>

            {history.length > 0 && (
              <section className="card">
                <div className="row-between">
                  <h2>Recent scans</h2>
                  <button type="button" className="link" onClick={() => setHistory(clearHistory())}>Clear</button>
                </div>
                <ul className="history">
                  {history.map((h) => (
                    <li key={h.code}>
                      <button type="button" onClick={() => lookUp(h.code)}>
                        <span aria-hidden="true">{VERDICT_ICON[h.verdict] || "•"}</span>
                        <span className="h-name">{h.name}<span className="muted small">{h.brand}</span></span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <p className="disclaimer">
              Information only, not medical advice. Product data comes from Open Food Facts, a free public database.
            </p>
          </>
        )}

        {view === "scan" && (
          <section className="card">
            <h2>Scan a barcode</h2>
            <Scanner onCode={onScanned} onClose={closeScanner} />
          </section>
        )}

        {view === "loading" && (
          <section className="card center">
            <div className="spinner" aria-hidden="true" />
            <p>Looking up barcode {lastCode}…</p>
          </section>
        )}

        {view === "notfound" && (
          <section className="card">
            <h2>We couldn't find that product</h2>
            <p>Barcode {lastCode} isn't in the food database yet. You can still check it: type or paste the ingredients from the package.</p>
            <ManualCheck onCheck={(t) => checkText(t, { product_name: `Product ${lastCode}` })} title="Ingredients from the package" />
            <div className="button-row">
              <button type="button" className="btn-primary" onClick={() => setView("scan")}>Scan again</button>
              <button type="button" className="link" onClick={() => setView("home")}>Back</button>
            </div>
          </section>
        )}

        {view === "result" && product && result && (
          <>
            <ResultView key={product.code || product.ingredients_text} product={product} result={result} settings={settings}
              onScanAgain={() => setView("scan")} />
            {result.verdict === "unknown" && (
              <section className="card">
                <ManualCheck onCheck={(t) => checkText(t, { ...product })} title="Ingredients from the package" />
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
