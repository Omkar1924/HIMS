// src/component/DepartmentWorklist.jsx
import { useCallback, useEffect, useState } from "react";
import { listReports } from "../api/ApiReporting";
import ReportBuilder from "./ReportBuilder";
import { errMsg, patientName, guessCategory, CATEGORIES } from "./reportUtils";
import "../style/reports.css";
import "../style/templateManager.css";


const fmt = (d) =>
  d
    ? new Date(d).toLocaleString("en-GB", {
        day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false,
      })
    : "—";

export default function DepartmentWorklist() {
  const [dept, setDept] = useState("RADIOLOGY");
  const [showAll, setShowAll] = useState(false);
  const [rows, setRows] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listReports({ department: dept, status: "SENT_TO_DEPARTMENT" });
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setRows([]);
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, [dept]);

  // reload when the list is shown again (after closing a report) and when the department changes
  useEffect(() => {
    if (!openId) load();
  }, [openId, load]);

  if (openId) {
    return <ReportBuilder reportId={openId} departmentMode onBack={() => setOpenId(null)} />;
  }

  // The server may ignore the "department" parameter, so also filter here.
  const belongsHere = (r) => {
    const value = guessCategory(r.department) || guessCategory(r.category);
    return !value || value === dept;
  };
  const visible = showAll ? rows : rows.filter(belongsHere);
  const hidden = rows.length - visible.length;

  return (
    <div className="rp-page">
      <div className="rp-row rp-dept-toolbar">
        <h2 className="rp-title" style={{ flex: 1, margin: 0 }}>Department worklist</h2>
        <select
          className="rp-input rp-dept-select"
          value={dept}
          onChange={(e) => setDept(e.target.value)}
          aria-label="Department"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <button type="button" className="rp-btn" disabled={loading} onClick={load}>
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {error && <div className="rp-error rp-error-box">{error}</div>}

      <div className="rp-card rp-pad rp-mt">
        <div className="rp-scroll">
          <table className="rp-table rp-dept-table">
            <thead>
              <tr>
                <th>Report</th>
                <th>Patient</th>
                <th>Test</th>
                <th>Referred by</th>
                <th>Sent</th>
                <th className="rp-right"></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr key={r.id}>
                  <td>{r.reportNo}</td>
                  <td>
                    {patientName(r.patient)}
                    <div className="rp-muted">{r.patient?.uhid}</div>
                  </td>
                  <td>{r.testName}</td>
                  <td>{r.referringDoctor?.name ?? r.referringDoctor?.dname ?? "—"}</td>
                  <td>{fmt(r.sentToDeptAt ?? r.updatedAt ?? r.createdAt)}</td>
                  <td className="rp-right">
                    <button type="button" className="rp-btn rp-btn-primary" onClick={() => setOpenId(r.id)}>
                      Open
                    </button>
                  </td>
                </tr>
              ))}
              {visible.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="rp-empty">Nothing waiting for this department.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <label className="rp-dept-all rp-muted">
          <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />{" "}
          Show reports from all departments
          {!showAll && hidden > 0 ? ` (${hidden} hidden)` : ""}
        </label>
      </div>
    </div>
  );
}
