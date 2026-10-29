
import { reportImageUrl } from "../api/ApiReporting";
import "../style/reports.css";

export default function ReportSheet({
  title,
  reportNo,
  patient,
  doctor,
  sections = [],
  images = [],
}) {
  return (
    <div className="rp-sheet">
      <div className="rp-letterhead">
        <div className="rp-lh-name">YOUR CENTRE NAME</div>
        <div className="rp-lh-tag">
          X-Ray | CT-Scan | MRI | USG | Lab
        </div>
        <div className="rp-lh-small">Address line, City - PIN</div>
        <div className="rp-lh-small">
          Phone: 0000000000 | email@example.com
        </div>
      </div>

      <div className="rp-patient">
        <div>
          <div className="rp-pname">{patient?.name || "-"}</div>
          <div>UHID: {patient?.uhid || "-"}</div>
        </div>

        <div>
          <div>
            Report No: <b>{reportNo || "-"}</b>
          </div>
          <div>
            Ref. by: <b>{doctor?.name || "-"}</b>
          </div>
        </div>
      </div>

      <h2 className="rp-test-title">{title}</h2>

      {sections.map((s, i) => (
        <div className="rp-section" key={s.id ?? i}>
          <h3>{s.heading}</h3>

          {/bullet/i.test(s.layout || "") ? (
            <ul className="rp-bullets">
              {(s.content || "")
                .split("\n")
                .filter((line) => line.trim())
                .map((line, j) => (
                  <li key={j}>{line}</li>
                ))}
            </ul>
          ) : (
            <div
              className={`rp-pre ${
                /bold/i.test(s.layout || "") ? "rp-bold" : ""
              }`}
            >
              {s.content || ""}
            </div>
          )}
        </div>
      ))}

      {images.length > 0 && (
        <div className="rp-section">
          <h3>Images</h3>

          <div className="rp-images">
            {images.map((im) => (
              <figure className="rp-img-wrap" key={im.id}>
                <img
                  src={reportImageUrl(im.id)}
                  alt={im.caption || im.fileName || "Report image"}
                />
                {im.caption && (
                  <figcaption className="rp-hint">
                    {im.caption}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
