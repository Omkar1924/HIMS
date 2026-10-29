
import { useEffect, useState } from "react";
import {
  listReports,
  getPendingTests,
  createReport,
  getTemplates,
  getServices,
  getDoctors,
  searchPatients,
} from "../api/ApiReporting";
import ReportBuilder from "./ReportBuilder";
import "../style/reports.css";

const LAB_RAD = ["LAB", "XRAY", "MRI", "CT", "USG"];
const catOf = (c) => (c === "LAB" ? "LAB" : "RADIOLOGY");

export default function ReportsPage({ reviewerDoctorId = null }) {
  const [tab, setTab] = useState(reviewerDoctorId ? "review" : "reports");
  const [openId, setOpenId] = useState(null);

  if (openId) {
    return (
      <ReportBuilder
        reportId={openId}
        reviewerMode={!!reviewerDoctorId}
        onBack={() => setOpenId(null)}
      />
    );
  }

  const tabs = reviewerDoctorId
    ? [
        ["review", "Waiting for my review"],
        ["approved", "Approved by me"],
      ]
    : [
        ["reports", "Reports"],
        ["pending", "Pending tests"],
        ["new", "New report"],
      ];

  return (
    <div className="rp-page">
      <div className="rp-card">
        <div className="rp-pad">
          <div className="rp-row">
            <h2 className="rp-title flex-1">Reports Management</h2>
          </div>

          <div className="rp-row rp-mb">
            {tabs.map(([key, label]) => (
              <button
                key={key}
                className={`rp-btn ${
                  tab === key ? "rp-btn-primary" : ""
                }`}
                onClick={() => setTab(key)}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === "reports" && (
            <ReportList params={{}} onOpen={setOpenId} />
          )}

          {tab === "review" && (
            <ReportList
              params={{
                reviewingDoctorId: reviewerDoctorId,
                status: "SENT_FOR_REVIEW",
              }}
              onOpen={setOpenId}
            />
          )}

          {tab === "approved" && (
            <ReportList
              params={{
                reviewingDoctorId: reviewerDoctorId,
                status: "APPROVED",
              }}
              onOpen={setOpenId}
            />
          )}

          {tab === "pending" && <Pending onOpen={setOpenId} />}
          {tab === "new" && <NewReport onCreated={setOpenId} />}
        </div>
      </div>
    </div>
  );
}

function ReportList({ params, onOpen }) {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    listReports(params)
      .then((data) => {
        if (active) setRows(data);
      })
      .catch((e) => {
        if (active) {
          setError(
            e?.response?.data?.message || e.message || "Unable to load reports"
          );
        }
      });

    return () => {
      active = false;
    };
  }, [JSON.stringify(params)]);

  return (
    <div className="rp-scroll">
      {error && <p className="rp-error">{error}</p>}

      <table className="rp-table">
        <thead>
          <tr>
            <th>No</th>
            <th>Patient</th>
            <th>Test</th>
            <th>Doctor</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((r) => (
            <tr
              key={r.id}
              onClick={() => onOpen(r.id)}
              style={{ cursor: "pointer" }}
            >
              <td>{r.reportNo}</td>
              <td>
                {r.patient?.name} ({r.patient?.uhid})
              </td>
              <td>{r.testName}</td>
              <td>{r.referringDoctor?.name || "-"}</td>
              <td>
                <span className={`rp-badge rp-st-${r.status}`}>
                  {r.status?.replaceAll("_", " ")}
                </span>
              </td>
              <td>
                {r.createdAt
                  ? new Date(r.createdAt).toLocaleString("en-IN")
                  : "-"}
              </td>
            </tr>
          ))}

          {rows.length === 0 && !error && (
            <tr>
              <td colSpan={6} className="rp-empty">
                Nothing here yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function Pending({ onOpen }) {
  const [rows, setRows] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [error, setError] = useState("");
  const [startingId, setStartingId] = useState(null);

  useEffect(() => {
    Promise.all([
      getPendingTests(LAB_RAD),
      getTemplates(),
    ])
      .then(([pending, templateList]) => {
        setRows(pending);
        setTemplates(templateList);
      })
      .catch((e) => {
        setError(e?.response?.data?.message || e.message);
      });
  }, []);

  const start = async (p) => {
    setStartingId(p.billItemId);
    setError("");

    try {
      const tpl =
        templates.find((t) => t.testName === p.testName) ||
        templates.find(
          (t) =>
            t.category === catOf(p.category) && t.defaultTemplate
        );

      const r = await createReport({
        templateId: tpl?.id,
        category: catOf(p.category),
        testName: p.testName,
        patientUhid: p.uhid,
        referringDoctorId: p.doctorId,
        billItemId: p.billItemId,
        visitType: "OPD",
        contentJson: "{}",
        createdBy: "technician",
      });

      onOpen(r.id);
    } catch (e) {
      setError(e?.response?.data?.message || e.message);
    } finally {
      setStartingId(null);
    }
  };

  return (
    <div>
      {error && <p className="rp-error">{error}</p>}

      <div className="rp-scroll">
        <table className="rp-table">
          <thead>
            <tr>
              <th>Bill</th>
              <th>Patient</th>
              <th>Test</th>
              <th>Doctor</th>
              <th className="rp-right">Action</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((p) => (
              <tr key={p.billItemId}>
                <td>{p.billNo}</td>
                <td>
                  {p.patientName} ({p.uhid})
                </td>
                <td>{p.testName}</td>
                <td>{p.doctorName || "-"}</td>
                <td className="rp-right">
                  <button
                    className="rp-btn rp-btn-primary"
                    disabled={startingId !== null}
                    onClick={() => start(p)}
                  >
                    {startingId === p.billItemId
                      ? "Starting..."
                      : "Start report"}
                  </button>
                </td>
              </tr>
            ))}

            {rows.length === 0 && !error && (
              <tr>
                <td colSpan={5} className="rp-empty">
                  No pending tests.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NewReport({ onCreated }) {
  const [q, setQ] = useState("");
  const [patients, setPatients] = useState([]);
  const [patient, setPatient] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [services, setServices] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [doctorId, setDoctorId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [visitType, setVisitType] = useState("OPD");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    getDoctors().then(setDoctors).catch(() => {});

    getServices()
      .then((s) => setServices(s.filter((x) => LAB_RAD.includes(x.category))))
      .catch(() => {});

    getTemplates().then(setTemplates).catch(() => {});
  }, []);

  const service = services.find((s) => String(s.id) === serviceId);
  const category = service ? catOf(service.category) : "";

  const tplOptions = templates.filter(
    (t) => !category || t.category === category
  );

  const nameOf = (p) =>
    p.name ||
    [p.firstName, p.middleName, p.lastName].filter(Boolean).join(" ");

  const search = async () => {
    setSearching(true);
    setErr("");

    try {
      setPatients(await searchPatients(q));
    } catch (e) {
      setErr(e?.response?.data?.message || e.message);
    } finally {
      setSearching(false);
    }
  };

  const create = async () => {
    setErr("");

    if (!patient || !service) {
      setErr("Choose a patient and a test");
      return;
    }

    setLoading(true);

    try {
      const r = await createReport({
        templateId: templateId ? Number(templateId) : null,
        category,
        testName: service.name || service.serviceName,
        serviceId: service.id,
        patientUhid: patient.uhid,
        referringDoctorId: doctorId ? Number(doctorId) : null,
        visitType,
        contentJson: "{}",
        createdBy: "technician",
      });

      onCreated(r.id);
    } catch (e) {
      setErr(e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rp-page-sm" style={{ padding: 0 }}>
      <div className="rp-stack">
        <div>
          <label className="rp-label">Search patient by UHID or name</label>

          <div className="rp-row">
            <input
              className="rp-input flex-1"
              placeholder="Enter patient name or UHID"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search()}
            />

            <button
              className="rp-btn rp-btn-primary"
              disabled={searching}
              onClick={search}
            >
              {searching ? "Searching..." : "Search"}
            </button>
          </div>

          {!patient && patients.length > 0 && (
            <ul className="rp-results">
              {patients.map((p) => (
                <li key={p.uhid}>
                  <span>
                    {nameOf(p)} — {p.uhid}
                  </span>
                  <button
                    className="rp-btn"
                    onClick={() => setPatient(p)}
                  >
                    Select
                  </button>
                </li>
              ))}
            </ul>
          )}

          {patient && (
            <div className="rp-selected rp-row">
              <div className="flex-1">
                <b>{nameOf(patient)}</b>
                <div className="rp-muted">UHID: {patient.uhid}</div>
              </div>
              <button
                className="rp-btn"
                onClick={() => setPatient(null)}
              >
                Change
              </button>
            </div>
          )}
        </div>

        <div className="rp-grid3">
          <div>
            <label className="rp-label">Referring doctor</label>
            <select
              className="rp-input"
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
            >
              <option value="">Default patient's doctor</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.dname || d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="rp-label">Test</label>
            <select
              className="rp-input"
              value={serviceId}
              onChange={(e) => {
                setServiceId(e.target.value);
                setTemplateId("");
              }}
            >
              <option value="">Select test</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name || s.serviceName} ({s.category})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="rp-label">Template (optional)</label>
            <select
              className="rp-input"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
            >
              <option value="">Select template</option>
              {tplOptions.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="rp-label">Visit type</label>
            <select
              className="rp-input"
              value={visitType}
              onChange={(e) => setVisitType(e.target.value)}
            >
              <option value="OPD">OPD</option>
              <option value="IPD">IPD</option>
            </select>
          </div>
        </div>

        {err && <div className="rp-error">{err}</div>}

        <div className="rp-row">
          <button
            className="rp-btn rp-btn-primary"
            disabled={loading}
            onClick={create}
          >
            {loading ? "Creating..." : "Create report"}
          </button>
        </div>
      </div>
    </div>
  );
}
