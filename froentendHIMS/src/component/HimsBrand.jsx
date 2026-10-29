export default function HimsBrand() {
  return (
    <div className="hims-brand">
      <svg className="hims-brand-logo" viewBox="0 0 48 48" role="img" aria-label="Hospital logo">
        <rect x="2" y="2" width="44" height="44" rx="13" fill="#e8f1ff" />
        <path d="M24 9v30M9 24h30" stroke="#2563eb" strokeWidth="7" strokeLinecap="round" />
        <path d="M8 29h9l4-8 6 14 5-9h8" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div>
        <span className="hims-brand-name">HIMS</span>
        <small className="hims-brand-caption">Hospital Information Management System</small>
      </div>
    </div>
  );
}
