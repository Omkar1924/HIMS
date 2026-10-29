
import { useEffect, useState } from "react";
import "../style/reports.css";

export default function ImageViewer({
  images = [],
  startIndex = 0,
  onClose,
}) {
  const [i, setI] = useState(startIndex);
  const last = images.length - 1;

  const prev = () => setI((n) => Math.max(0, n - 1));
  const next = () => setI((n) => Math.min(last, n + 1));

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, [last, onClose]);

  const im = images[i];

  if (!im) return null;

  return (
    <div
      className="rp-noprint"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(15, 23, 42, 0.95)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close image viewer"
        style={{
          position: "absolute",
          top: 20,
          right: 24,
          background: "transparent",
          border: 0,
          color: "#fff",
          fontSize: 28,
          cursor: "pointer",
        }}
      >
        ×
      </button>

      <img
        src={im.url}
        alt={im.caption || im.fileName || "Report image"}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "90vw",
          maxHeight: "80vh",
          objectFit: "contain",
        }}
      />

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "absolute",
          bottom: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          flexWrap: "wrap",
          color: "#fff",
        }}
      >
        <button
          className="rp-btn"
          onClick={prev}
          disabled={i === 0}
        >
          ← Prev
        </button>

        <span>
          {i + 1} / {images.length}
          {im.caption ? ` · ${im.caption}` : ""}
        </span>

        <button
          className="rp-btn"
          onClick={next}
          disabled={i === last}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
