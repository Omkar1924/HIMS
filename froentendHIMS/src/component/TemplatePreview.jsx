
import { useEffect, useMemo, useState } from "react";
import { Rnd } from "react-rnd";
import { parseSections, patientName } from "./reportUtils";
import "../style/reports.css";
import "../style/templateManager.css";

const DEFAULT_SECTIONS = [
  {
    id: "patient",
    heading: "Patient Details",
    layout: "paragraph",
    content: "",
    filledBy: "doctor",
  },
  {
    id: "clinical",
    heading: "Clinical Details",
    layout: "paragraph",
    content: "",
    filledBy: "doctor",
  },
  {
    id: "results",
    heading: "Results",
    layout: "paragraph",
    content: "",
    filledBy: "doctor",
  },
  {
    id: "impression",
    heading: "Impression",
    layout: "bold",
    content: "",
    filledBy: "doctor",
  },
];

const DEFAULT_LOGO = {
  x: 12,
  y: 10,
  width: 90,
  height: 70,
};

const SECTION_GAP = 100;
const SECTION_HEIGHT = 85;

function readSections(template) {
  const raw =
    template?.sectionsJson ??
    template?.templateStructure ??
    template?.structureJson ??
    template?.structure;

  const list = raw ? parseSections(raw) : [];

  return list.length ? list : DEFAULT_SECTIONS;
}

function SectionBody({ layout, text }) {
  const value = String(text ?? "");

  if (!value.trim()) {
    return <span className="rp-muted">Report details</span>;
  }

  if (/<\/?[a-z][\s\S]*?>/i.test(value)) {
    return (
      <div
        className="rp-rich-preview"
        dangerouslySetInnerHTML={{ __html: value }}
      />
    );
  }

  if (layout === "bullets") {
    return (
      <ul className="rp-live-list">
        {value
          .split("\n")
          .filter(Boolean)
          .map((line, index) => (
            <li key={index}>{line}</li>
          ))}
      </ul>
    );
  }

  if (layout === "bold") {
    return (
      <strong style={{ whiteSpace: "pre-wrap" }}>
        {value}
      </strong>
    );
  }

  return <div style={{ whiteSpace: "pre-wrap" }}>{value}</div>;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result));

    reader.onerror = () => {
      reject(new Error("Unable to read the selected logo."));
    };

    reader.readAsDataURL(file);
  });
}

export default function TemplatePreview({
  template,
  sections: sectionsProp,
  patient,
  content = {},
  editable = true,
  flow = false,
  onLayoutChange,
  onLogoChange,
}) {
  const [layout, setLayout] = useState({});
  const [logoUrl, setLogoUrl] = useState("");
  const [sheetWidth, setSheetWidth] = useState(650);
  const [logoError, setLogoError] = useState("");
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(true);

  const sections = useMemo(
    () =>
      sectionsProp
        ? parseSections(sectionsProp)
        : readSections(template),
    [
      sectionsProp,
      template?.sectionsJson,
      template?.templateStructure,
      template?.structureJson,
      template?.structure,
    ]
  );

  const logo = {
    ...DEFAULT_LOGO,
    ...(layout.logo ?? {}),
  };

  // Load the selected template's saved logo.
  useEffect(() => {
    const savedLogo = template?.logoUrl ?? template?.logo ?? "";

    setLogoUrl(savedLogo);
    setLogoError("");
  }, [template?.id, template?.logoUrl, template?.logo]);

  // Load the selected template's saved layout.
  useEffect(() => {
    try {
      const raw = template?.layoutJson;
      const saved = typeof raw === "string" ? JSON.parse(raw) : raw;

      setLayout(
        saved && typeof saved === "object" ? saved : {}
      );
    } catch {
      setLayout({});
    }
  }, [template?.id]);

  // Calculate the preview width responsively.
  useEffect(() => {
    const updateWidth = () => {
      setSheetWidth(
        Math.max(300, Math.min(650, window.innerWidth - 80))
      );
    };

    updateWidth();

    window.addEventListener("resize", updateWidth);

    return () => {
      window.removeEventListener("resize", updateWidth);
    };
  }, []);

  const changeLayout = (key, value) => {
    setLayout((previous) => {
      const next = {
        ...previous,
        [key]: value,
      };

      onLayoutChange?.(next);

      return next;
    });
  };

  const handleLogoUpload = async (event) => {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setLogoError("Please select an image file.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setLogoError("Please choose a logo smaller than 2 MB.");
      return;
    }

    try {
      setLogoError("");

      const dataUrl = await fileToDataUrl(file);

      setLogoUrl(dataUrl);
      onLogoChange?.(dataUrl);
    } catch (error) {
      setLogoError(
        error.message || "Unable to upload logo."
      );
    }
  };

  const sectionWidth = sheetWidth - 60;

  const textOf = (section) =>
    content?.[section.id] ??
    content?.[section.heading] ??
    section.defaultText ??
    section.defaultValue ??
    section.content;

  const sectionsHeight =
    Math.max(
      0,
      ...sections.map((section, index) => {
        const saved = layout[`section-${section.id}`] ?? {};

        return (
          (saved.y ?? index * SECTION_GAP) +
          (saved.height ?? SECTION_HEIGHT)
        );
      })
    ) + 12;

  return (
    <div
      className={`rp-preview-panel ${
        mobilePreviewOpen
          ? "rp-mobile-preview-open"
          : "rp-mobile-preview-closed"
      }`}
    >
      <div className="rp-preview-toolbar">
        <div>
          <strong>
            {flow ? "Live report preview" : "Live template preview"}
          </strong>

          <div className="rp-muted">
            {flow
              ? "Updates as you type."
              : editable
                ? "Drag to move; resize using the handles."
                : "Preview"}
          </div>
        </div>

        <div className="rp-preview-toolbar-actions">
          {editable && !flow && (
            <label className="rp-btn rp-logo-upload">
              Upload logo

              <input
                hidden
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
              />
            </label>
          )}

          <button
            type="button"
            className="rp-btn rp-mobile-preview-toggle"
            onClick={() =>
              setMobilePreviewOpen((open) => !open)
            }
            aria-expanded={mobilePreviewOpen}
          >
            {mobilePreviewOpen ? "Hide Preview" : "Show Preview"}
          </button>
        </div>
      </div>

      {logoError && (
        <div className="rp-error-box" role="alert">
          {logoError}
        </div>
      )}

      <div className="rp-preview-content">
        <div className="rp-preview-scroll">
          <div
            className="rp-sheet rp-live-sheet rp-print-area"
            style={{
              width: sheetWidth,
              minWidth: sheetWidth,
            }}
          >
            <div className="rp-live-header">
              {/* Three-column header:
                  left = logo
                  center = hospital details
                  right = balancing column
              */}
              <div className="rp-live-header-grid">
                <div className="rp-live-header-left">
                  <Rnd
                    bounds="parent"
                    position={{
                      x: logo.x,
                      y: logo.y,
                    }}
                    size={{
                      width: logo.width,
                      height: logo.height,
                    }}
                    minWidth={40}
                    minHeight={35}
                    disableDragging={!editable || flow}
                    enableResizing={editable && !flow}
                    onDragStop={(_, data) =>
                      changeLayout("logo", {
                        ...logo,
                        x: data.x,
                        y: data.y,
                      })
                    }
                    onResizeStop={(_, __, ref, ___, position) =>
                      changeLayout("logo", {
                        x: position.x,
                        y: position.y,
                        width: ref.offsetWidth,
                        height: ref.offsetHeight,
                      })
                    }
                    className={
                      editable && !flow ? "rp-rnd-element" : ""
                    }
                  >
                    <div className="rp-live-logo">
                      {logoUrl ? (
                        <img
                          src={logoUrl}
                          alt="Report logo"
                        />
                      ) : (
                        <span>LOGO</span>
                      )}
                    </div>
                  </Rnd>
                </div>

                <div className="rp-live-clinic">
                  <h2>
                    {template?.centreName || "Medical Centre"}
                  </h2>

                  <p>
                    {template?.centreAddress || "Centre address"}
                  </p>

                  <p>
                    {template?.centrePhone || "Contact information"}
                  </p>

                  <h3>
                    {template?.name || "Report Template"}
                  </h3>
                </div>

                <div
                  className="rp-live-header-right"
                  aria-hidden="true"
                />
              </div>
            </div>

            <div className="rp-live-patient">
              <div>
                <strong>Patient:</strong>{" "}
                {patientName(patient) || "—"}
              </div>

              <div>
                <strong>UHID:</strong>{" "}
                {patient?.uhid || "—"}
              </div>

              <div>
                <strong>Age / Sex:</strong>{" "}
                {[
                  patient?.age,
                  patient?.gender ?? patient?.sex,
                ]
                  .filter(Boolean)
                  .join(" / ") || "—"}
              </div>

              <div>
                <strong>Test:</strong>{" "}
                {template?.testName || template?.name || "—"}
              </div>

              <div>
                <strong>Category:</strong>{" "}
                {template?.category || "—"}
              </div>
            </div>

            {flow ? (
              <div className="rp-flow-sections">
                {sections.map((section, index) => (
                  <section
                    key={section.id ?? `flow-section-${index}`}
                    className="rp-flow-section"
                  >
                    <h4>
                      {section.heading || "Untitled section"}
                    </h4>

                    <SectionBody
                      layout={section.layout}
                      text={textOf(section)}
                    />
                  </section>
                ))}
              </div>
            ) : (
              <div
                className="rp-live-sections"
                style={{
                  position: "relative",
                  height: sectionsHeight,
                }}
              >
                {sections.map((section, index) => {
                  const key = `section-${section.id ?? index}`;
                  const saved = layout[key] ?? {};

                  return (
                    <Rnd
                      key={key}
                      bounds="parent"
                      position={{
                        x: saved.x ?? 0,
                        y: saved.y ?? index * SECTION_GAP,
                      }}
                      size={{
                        width: saved.width ?? sectionWidth,
                        height: saved.height ?? SECTION_HEIGHT,
                      }}
                      minWidth={140}
                      minHeight={55}
                      disableDragging={!editable}
                      enableResizing={editable}
                      onDragStop={(_, data) =>
                        changeLayout(key, {
                          ...saved,
                          x: data.x,
                          y: data.y,
                          width: saved.width ?? sectionWidth,
                          height: saved.height ?? SECTION_HEIGHT,
                        })
                      }
                      onResizeStop={(_, __, ref, ___, position) =>
                        changeLayout(key, {
                          x: position.x,
                          y: position.y,
                          width: ref.offsetWidth,
                          height: ref.offsetHeight,
                        })
                      }
                      className={
                        editable ? "rp-rnd-element" : ""
                      }
                    >
                      <section className="rp-live-section">
                        <h4>
                          {section.heading || "Untitled section"}
                        </h4>

                        <div className="rp-live-section-content">
                          <SectionBody
                            layout={section.layout}
                            text={textOf(section)}
                          />
                        </div>
                      </section>
                    </Rnd>
                  );
                })}
              </div>
            )}

            <div className="rp-live-footer">
              <span>Prepared by: __________________</span>
              <span>Signature / Stamp: ______________</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
