import { NOT_DOCUMENTED } from "./DischargeUtils";

import "../style/reports.css";
import "../style/discharge.css";

const fmtDate = (d) => {
  if (!d) return "—";
  const [y, m, day] = String(d).slice(0, 10).split("-");
  return y && m && day ? `${day}/${m}/${y}` : d;
};

function Text({ text }) {
  const parts = (text || "").split(NOT_DOCUMENTED);
  return (
    <>
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 && (
            <mark className="ds-missing">{NOT_DOCUMENTED}</mark>
          )}
        </span>
      ))}
    </>
  );
}

export default function DischargeDocument({
  header,
  patient,
  doctor,
  admissionDate,
  dischargeDate,
  rendered,
  preparedBy,
  approvedBy,
  approved = false,
  onLogoChange,
  onPrint,
}) {
  const handleLogo = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
      window.alert("Logo must be smaller than 500 KB.");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => onLogoChange?.(reader.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const contactLine = [header.centreAddress, header.centrePhone]
    .filter(Boolean)
    .join(" • ");

  return (
    <div className="rp-preview-panel">
      <div className="ds-toolbar rp-noprint">
        <strong>Live Preview</strong>

        <div className="ds-toolbar-actions">
          {onLogoChange && (
            <label className="rp-btn rp-logo-upload">
              Upload logo
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={handleLogo}
              />
            </label>
          )}

          {onPrint && (
            <button type="button" className="rp-btn" onClick={onPrint}>
              Print / Save PDF
            </button>
          )}
        </div>
      </div>

      <div className="ds-scroll">
        <div className="ds-sheet rp-print-area">
          <div className="ds-header">
            <div className="ds-logo">
              {header.logoUrl ? (
                <img src={header.logoUrl} alt="Logo" />
              ) : (
                <span>🏥</span>
              )}
            </div>

            <div className="ds-head-text">
              <h2>{header.centreName || "HOSPITAL NAME"}</h2>
              <p>{contactLine || "Hospital address • Contact details"}</p>
              <h3>{header.documentTitle || "PATIENT DISCHARGE SUMMARY"}</h3>
            </div>
          </div>

          <div className="ds-patient">
            <div>
              <b>Patient:</b> {patient?.name || "—"}
            </div>
            <div>
              <b>UHID:</b> {patient?.uhid || "—"}
            </div>
            <div>
              <b>Age:</b> {patient?.age || "—"}
            </div>
            <div>
              <b>Contact:</b> {patient?.phone || "—"}
            </div>
            <div>
              <b>Admission date:</b> {fmtDate(admissionDate)}
            </div>
            <div>
              <b>Discharge date:</b> {fmtDate(dischargeDate)}
            </div>
            <div className="ds-span-2">
              <b>Consultant:</b>{" "}
              {doctor?.name ? `Dr. ${doctor.name.replace(/^Dr\.?\s*/i, "")}` : "—"}
              {doctor?.qualification ? ` (${doctor.qualification})` : ""}
              {doctor?.registrationNo ? ` • Reg. No. ${doctor.registrationNo}` : ""}
            </div>
          </div>

          <div className="ds-course">
            <h3>Clinical Summary / Hospital Course</h3>
            <p className="ds-muted">
              Summary of the patient's admission, treatment and clinical
              progress during hospitalization.
            </p>

            <div className="ds-sections">
              {rendered.map((s) => (
                <div className="ds-section" key={s.id}>
                  <h4>{s.heading}</h4>
                  <p
                    className={`ds-section-text ${
                      s.layout === "bold" ? "bold" : ""
                    }`}
                  >
                    <Text text={s.text} />
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="ds-signs">
            <div>
              <div className="ds-sign-line">{preparedBy || ""}</div>
              <div>Prepared / entered by</div>
            </div>
            <div>
              <div className="ds-sign-line">{approved ? approvedBy : ""}</div>
              <div>Reviewed and approved by</div>
              <div>Doctor's signature and registration number</div>
            </div>
          </div>

          {!approved && (
            <p className="ds-note rp-noprint">
              Preview only — bracketed content is replaced with verified
              information before the final document is generated.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}