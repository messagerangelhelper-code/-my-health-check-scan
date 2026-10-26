import { useEffect, useRef, useState } from "react";

const FORMATS = ["ean_13", "ean_8", "upc_a", "upc_e"];

// Opens the back camera and reads a product barcode.
// Uses the phone browser's built-in barcode reader when it has one (most Android phones),
// otherwise a small barcode library (iPhone).
export default function Scanner({ onCode, onClose }) {
  const videoRef = useRef(null);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let stream = null;
    let stopped = false;
    let timer = null;
    let zxingControls = null;

    function finish(code) {
      if (stopped) return;
      stopped = true;
      if (navigator.vibrate) navigator.vibrate(80);
      onCode(code);
    }

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("This browser can't open the camera. Type the barcode numbers instead.");
        return;
      }
      try {
        if ("BarcodeDetector" in window) {
          const supported = await window.BarcodeDetector.getSupportedFormats?.().catch(() => []) || [];
          const formats = FORMATS.filter((f) => supported.length === 0 || supported.includes(f));
          if (formats.length) {
            const detector = new window.BarcodeDetector({ formats });
            stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
            if (stopped) return;
            videoRef.current.srcObject = stream;
            await videoRef.current.play();
            setReady(true);
            const tick = async () => {
              if (stopped) return;
              try {
                const codes = await detector.detect(videoRef.current);
                const hit = codes.find((c) => /^\d{6,14}$/.test(c.rawValue));
                if (hit) return finish(hit.rawValue);
              } catch {
                /* frame not ready yet */
              }
              timer = setTimeout(tick, 200);
            };
            tick();
            return;
          }
        }
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        if (stopped) return;
        const reader = new BrowserMultiFormatReader();
        zxingControls = await reader.decodeFromConstraints(
          { video: { facingMode: { ideal: "environment" } }, audio: false },
          videoRef.current,
          (result) => {
            const text = result?.getText?.();
            if (text && /^\d{6,14}$/.test(text)) finish(text);
          }
        );
        setReady(true);
      } catch (e) {
        const name = e?.name || "";
        if (name === "NotAllowedError" || name === "SecurityError") {
          setError("Camera permission was blocked. Allow the camera for this site in your browser settings, or type the barcode numbers instead.");
        } else if (name === "NotFoundError" || name === "OverconstrainedError") {
          setError("No camera was found. Type the barcode numbers instead.");
        } else {
          setError("The camera couldn't start. Type the barcode numbers instead.");
        }
      }
    }

    start();
    return () => {
      stopped = true;
      clearTimeout(timer);
      try { zxingControls?.stop(); } catch { /* already stopped */ }
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [onCode]);

  return (
    <div className="scanner">
      <div className="scanner-view">
        <video ref={videoRef} playsInline muted />
        <div className="scanner-frame" aria-hidden="true" />
        {!ready && !error && <p className="scanner-hint">Starting camera…</p>}
      </div>
      {error ? <p className="error">{error}</p> : <p className="muted center">Point the camera at the barcode and hold steady.</p>}
      <button type="button" className="btn-secondary" onClick={onClose}>Close camera</button>
    </div>
  );
}
