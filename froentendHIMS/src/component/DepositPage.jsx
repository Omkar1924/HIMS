import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  searchBillPatients, getDepositSummary, addDeposit, getPaymentModes,
} from "../api/ApiPatient.js";
import "../style/form.css";
import "../style/bill.css";
import "../style/bcreate.css";
import "../style/deposit.css";

const money = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d) => (d ? new Date(d).toLocaleString("en-IN") : "-");

export default function DepositPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [patient, setPatient] = useState(null);
  const [summary, setSummary] = useState(null);

  const [modes, setModes] = useState([]);
  const [mode, setMode] = useState("");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    getPaymentModes()
      .then((m) => { setModes(m); setMode(m[0] || ""); })
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (patient || !query.trim()) { setResults([]); return; }
    const t = setTimeout(() => {
      searchBillPatients(query.trim())
        .then((r) => { setResults(r); setShowResults(true); })
        .catch((e) => setError(e.message));
    }, 300);
    return () => clearTimeout(t);
  }, [query, patient]);

  const selectPatient = (p) => {
    setPatient(p);
    setQuery(`${p.uhid} - ${p.patientName}`);
    setShowResults(false);
    setMessage("");
    getDepositSummary(p.uhid).then(setSummary).catch((e) => setError(e.message));
  };

  const onSearchChange = (e) => {
    setQuery(e.target.value);
    setPatient(null);
    setSummary(null);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setError("");
    const amt = Number(amount);
    if (!patient) return setError("Select a patient first");
    if (!amt || amt <= 0) return setError("Enter a valid amount");
    setSaving(true);
    try {
      const s = await addDeposit({ uhid: patient.uhid, amount: amt, mode });
      setSummary(s);
      setAmount("");
      setMessage(`Deposit of ${money(amt)} added`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page bill-create deposit-page">
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Patient Deposit</h2>
            <p className="card-subtitle">Add an advance deposit and see deposit and refund history.</p>
          </div>
          <button className="btn btn-outline" onClick={() => navigate("/billing")}>Back to bills</button>
        </div>

        <div className="card-body">
          {message && (
            <div className="alert alert-success">
              <span>{message}</span>
              <button type="button" className="alert-close" onClick={() => setMessage("")}>×</button>
            </div>
          )}
          {error && (
            <div className="alert alert-error">
              <span>{error}</span>
              <button type="button" className="alert-close" onClick={() => setError("")}>×</button>
            </div>
          )}

          <div className="form-section">
            <h3 className="form-section-title">Find patient</h3>
            <div className="field search-box">
              <input
                className="input" placeholder="Search by UHID or name"
                value={query} onChange={onSearchChange}
                onFocus={() => results.length && setShowResults(true)}
              />
              {showResults && !patient && (
                <div className="search-results">
                  {results.length === 0 ? (
                    <div className="search-empty">No patients found</div>
                  ) : results.map((p) => (
                    <div key={p.uhid} className="search-item" onClick={() => selectPatient(p)}>
                      <span><strong>{p.uhid}</strong> - {p.patientName}</span>
                      <small>Deposit {money(p.depositAvailable)}</small>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {summary && (
            <>
              <div className="stat-grid">
                <div className="stat"><span>Total deposited</span><strong>{money(summary.deposited)}</strong></div>
                <div className="stat"><span>Used on bills</span><strong>{money(summary.adjusted)}</strong></div>
                <div className="stat"><span>Refunded</span><strong>{money(summary.refunded)}</strong></div>
                <div className="stat highlight"><span>Available</span><strong>{money(summary.available)}</strong></div>
                <div className="stat"><span>Open bills balance</span><strong>{money(summary.outstanding)}</strong></div>
                <div className="stat highlight"><span>Refundable</span><strong>{money(summary.refundable)}</strong></div>
              </div>

              <form className="form-section" onSubmit={handleAdd}>
                <h3 className="form-section-title">Add deposit</h3>
                <div className="add-row">
                  <div className="grow">
                    <label className="label">Amount</label>
                    <input
                      className="input" type="number" min="0" step="0.01"
                      value={amount} onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                  <div className="grow">
                    <label className="label">Payment mode</label>
                    <select className="input" value={mode} onChange={(e) => setMode(e.target.value)}>
                      {modes.map((m) => <option key={m} value={m}>{m.replace("_", " ")}</option>)}
                    </select>
                  </div>
                  <button className="btn btn-primary" disabled={saving}>
                    {saving ? "Saving..." : "Add deposit"}
                  </button>
                </div>
              </form>

              <div className="form-section">
                <h3 className="form-section-title">Deposit history</h3>
                {summary.history.length === 0 ? (
                  <p className="empty">No deposit activity yet.</p>
                ) : (
                  <div className="table-box">
                    <table className="bill-table">
                      <thead>
                        <tr><th>Date</th><th>Type</th><th>Mode</th><th>Bill</th>
                            <th>Note</th><th className="num">Amount</th></tr>
                      </thead>
                      <tbody>
                        {summary.history.map((h, i) => (
                          <tr key={i}>
                            <td className="sub">{fmtDate(h.createdAt)}</td>
                            <td><span className={`dtype dtype-${h.type}`}>{h.type}</span></td>
                            <td>{h.mode ? h.mode.replace("_", " ") : "-"}</td>
                            <td>{h.billNo || "-"}</td>
                            <td className="sub">{h.note}</td>
                            <td className="num">{money(h.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}