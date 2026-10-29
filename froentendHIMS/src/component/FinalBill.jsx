import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  searchBillPatients, getCheckoutPreview, checkout, getFinalBills, getPaymentModes,
} from "../api/ApiPatient.js";
import "../style/form.css";
import "../style/bill.css";
import "../style/bcreate.css";
import "../style/final.css";

const money = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d) => (d ? new Date(d).toLocaleString("en-IN") : "-");
const defaultPaymentMode = (paymentModes) =>
  paymentModes.find((mode) => mode.toUpperCase() === "CASH") || paymentModes[0] || "";

export default function FinalBill() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [patient, setPatient] = useState(null);
  const [preview, setPreview] = useState(null);

  const [modes, setModes] = useState([]);
  const [payMode, setPayMode] = useState("");
  const [refundMode, setRefundMode] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [history, setHistory] = useState([]);

  useEffect(() => {
    getPaymentModes()
      .then((m) => {
        const defaultMode = defaultPaymentMode(m);
        setModes(m);
        setPayMode(defaultMode);
        setRefundMode(defaultMode);
      })
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    const uhid = patient?.uhid;
    if (!uhid) return undefined;
    let active = true;
    getFinalBills(uhid)
      .then((bills) => {
        if (active) setHistory(bills.filter((bill) => bill.uhid === uhid));
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => { active = false; };
  }, [patient?.uhid]);

  // debounced patient search
  useEffect(() => {
    if (patient || !query.trim()) return undefined;
    const t = setTimeout(() => {
      searchBillPatients(query.trim())
        .then((r) => { setResults(r); setShowResults(true); })
        .catch((e) => setError(e.message));
    }, 300);
    return () => clearTimeout(t);
  }, [query, patient]);

  const loadPreview = (uhid) =>
    getCheckoutPreview(uhid).then(setPreview).catch((e) => { setPreview(null); setError(e.message); });

  const selectPatient = (p) => {
    setPatient(p);
    setHistory([]);
    setQuery(`${p.uhid} - ${p.patientName}`);
    setResults([]);
    setShowResults(false);
    setError("");
    loadPreview(p.uhid);
  };

  const onSearchChange = (e) => {
    setQuery(e.target.value);
    setPatient(null);
    setPreview(null);
    setHistory([]);
    setResults([]);
  };

  const toPay = Number(preview?.amountToPay || 0);
  const refund = Number(preview?.refundAmount || 0);

  const handleCheckout = async () => {
    setError("");
    if (!window.confirm("Complete the payment or refund, generate the final bill, and clear all open bills for this patient?")) return;
    setSaving(true);
    try {
      const res = await checkout({
        uhid: patient.uhid,
        payAmount: toPay > 0 ? toPay : null,
        payMode: toPay > 0 ? payMode : null,
        refundMode: refund > 0 ? refundMode : null,
      });
      navigate(`/billing/final/report/${encodeURIComponent(res.finalNo)}`, {
        state: {
          finalBill: {
            ...res,
            patientName: patient.patientName,
            uhid: patient.uhid,
          },
          details: {
            bills: preview.bills,
            totalPaid: preview.totalPaid,
            totalBalance: preview.totalBalance,
            depositAvailable: preview.depositAvailable,
            depositUsed: preview.depositToUse,
            amountToPay: toPay,
            refundAmount: refund,
            payMode: toPay > 0 ? payMode : null,
            refundMode: refund > 0 ? refundMode : null,
            patient,
          },
        },
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const modeOptions = modes.map((m) => <option key={m} value={m}>{m.replace("_", " ")}</option>);

  return (
    <div className="page bill-create final-page">
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Final Bill / Checkout</h2>
            <p className="card-subtitle">Deposit is adjusted first, then the remaining amount is collected or refunded before all bills are cleared.</p>
          </div>
          <button className="btn btn-outline" onClick={() => navigate("/billing")}>Back to bills</button>
        </div>

        <div className="card-body">
          {error && (
            <div className="alert alert-error">
              <span>{error}</span>
              <button type="button" className="alert-close" onClick={() => setError("")}>×</button>
            </div>
          )}

          <div className="form-section">
            <h3 className="form-section-title">Find patient</h3>
            <div className="field search-box">
              <input className="input" placeholder="Search by UHID or name"
                     value={query} onChange={onSearchChange}
                     onFocus={() => results.length && setShowResults(true)} />
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

          {preview && (
            <div className="form-section">
              <h3 className="form-section-title">Open bills</h3>
              {preview.bills.length === 0 ? (
                <p className="empty">No open bills for this patient.</p>
              ) : (
                <>
                  <div className="table-box">
                    <table className="bill-table">
                      <thead>
                        <tr><th>Bill No</th><th>Status</th><th className="num">Total</th>
                            <th className="num">Paid</th><th className="num">Balance</th></tr>
                      </thead>
                      <tbody>
                        {preview.bills.map((b) => (
                          <tr key={b.billNo}>
                            <td><strong>{b.billNo}</strong></td>
                            <td><span className={`status status-${b.status}`}>{b.status}</span></td>
                            <td className="num">{money(b.totalAmount)}</td>
                            <td className="num">{money(b.paidAmount)}</td>
                            <td className="num">{money(b.balance)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="pay-layout final-layout">
                    <div className="form-grid">
                      {toPay > 0 && (
                        <>
                          <div className="field span-6">
                            <label className="label">Amount to collect</label>
                            <input className="input" value={money(toPay)} disabled />
                          </div>
                          <div className="field span-6">
                            <label className="label">Payment mode</label>
                            <select className="input" value={payMode} onChange={(e) => setPayMode(e.target.value)}>
                              {modeOptions}
                            </select>
                          </div>
                        </>
                      )}
                      {refund > 0 && (
                        <>
                          <div className="field span-6">
                            <label className="label">Refund to patient</label>
                            <input className="input" value={money(refund)} disabled />
                          </div>
                          <div className="field span-6">
                            <label className="label">Refund mode</label>
                            <select className="input" value={refundMode} onChange={(e) => setRefundMode(e.target.value)}>
                              {modeOptions}
                            </select>
                          </div>
                        </>
                      )}
                      {toPay <= 0 && refund <= 0 && (
                        <div className="field span-12 sub">Nothing to collect or refund. Bills are fully settled.</div>
                      )}
                    </div>

                    <div className="summary">
                      <div className="summary-row"><span>Total billed</span><span>{money(preview.totalBilled)}</span></div>
                      <div className="summary-row"><span>Already paid</span><span>{money(preview.totalPaid)}</span></div>
                      <div className="summary-row total"><span>Balance</span><span>{money(preview.totalBalance)}</span></div>
                      <div className="summary-row"><span>Deposit available</span><span>{money(preview.depositAvailable)}</span></div>
                      <div className="summary-row"><span>Deposit used</span><span>- {money(preview.depositToUse)}</span></div>
                      <div className="summary-row total"><span>Pay now</span><span>{money(toPay)}</span></div>
                      <div className="summary-row extra"><span>Refund</span><span>{money(refund)}</span></div>
                    </div>
                  </div>

                  <div className="form-actions">
                    <button className="btn btn-success" onClick={handleCheckout} disabled={saving}>
                      {saving ? "Processing..." : "Complete payment/refund & generate final bill"}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="form-section">
            <h3 className="form-section-title">
              Final bill history{patient ? ` — ${patient.patientName} (${patient.uhid})` : ""}
            </h3>
            {!patient ? (
              <p className="empty">Select a patient to view their final bills.</p>
            ) : history.length === 0 ? (
              <p className="empty">No final bills yet.</p>
            ) : (
              <div className="table-box">
                <table className="bill-table">
                  <thead>
                    <tr><th>Final No</th><th>Patient</th><th>Bills</th>
                        <th className="num">Billed</th><th className="num">Deposit used</th>
                        <th className="num">Collected</th><th className="num">Refunded</th><th>Date</th><th></th></tr>
                  </thead>
                  <tbody>
                    {history.map((f) => (
                      <tr key={f.finalNo}>
                        <td><strong>{f.finalNo}</strong></td>
                        <td><div>{f.patientName}</div><div className="sub">{f.uhid}</div></td>
                        <td className="sub">{f.billNos.join(", ")}</td>
                        <td className="num">{money(f.totalBilled)}</td>
                        <td className="num">{money(f.depositUsed)}</td>
                        <td className="num">{money(f.amountCollected)}</td>
                        <td className="num">{money(f.refundAmount)}</td>
                        <td className="sub">{fmtDate(f.createdAt)}</td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline"
                            onClick={() => navigate(`/billing/final/report/${encodeURIComponent(f.finalNo)}`, {
                              state: { finalBill: f },
                            })}
                          >
                            Report
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}