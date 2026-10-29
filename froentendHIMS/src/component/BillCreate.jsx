import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  searchBillPatients,
  getServices,
  getPaymentModes,
  createBill,
} from "../api/ApiPatient.js";
import "../style/form.css";
import "../style/bill.css";
import "../style/bcreate.css";

const money = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function BillCreate() {
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [patient, setPatient] = useState(null);

  const [services, setServices] = useState([]);
  const [modes, setModes] = useState([]);
  const [items, setItems] = useState([]);
  const [pick, setPick] = useState({ serviceId: "", quantity: 1 });

  const [useDep, setUseDep] = useState(false);
  const [paid, setPaid] = useState("");
  const [mode, setMode] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    getServices()
      .then(setServices)
      .catch((e) => setError(e.message));
    getPaymentModes()
      .then((m) => {
        setModes(m);
        setMode(m[0] || "");
      })
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (patient || !query.trim()) {
      setResults([]);
      return;
    }
    const t = setTimeout(() => {
      searchBillPatients(query.trim())
        .then((r) => {
          setResults(r);
          setShowResults(true);
        })
        .catch((e) => setError(e.message));
    }, 300);
    return () => clearTimeout(t);
  }, [query, patient]);

  const selectPatient = (p) => {
    setPatient(p);
    setQuery(`${p.uhid} - ${p.patientName}`);
    setShowResults(false);
    setUseDep(false);
  };

  const onSearchChange = (e) => {
    setQuery(e.target.value);
    setPatient(null);
  };

  const addItem = () => {
    const s = services.find((x) => String(x.id) === String(pick.serviceId));
    if (!s) return;
    const qty = Math.max(1, Number(pick.quantity) || 1);
    setItems((prev) => {
      const existing = prev.find((i) => i.serviceId === s.id);
      if (existing) {
        return prev.map((i) =>
          i.serviceId === s.id ? { ...i, quantity: i.quantity + qty } : i,
        );
      }
      return [
        ...prev,
        {
          serviceId: s.id,
          name: s.name,
          category: s.category,
          charge: Number(s.charge),
          quantity: qty,
        },
      ];
    });
    setPick({ serviceId: "", quantity: 1 });
  };

  const removeItem = (id) =>
    setItems((prev) => prev.filter((i) => i.serviceId !== id));

  // ---------- calculations ----------
  const doctorFee = Number(patient?.doctorFee || 0);
  const servicesTotal = items.reduce(
    (sum, i) => sum + i.charge * i.quantity,
    0,
  );
  const total = doctorFee + servicesTotal;
  const depositAvail = Number(patient?.depositAvailable || 0);
  const depositUsed = useDep ? Math.min(depositAvail, total) : 0;
  const due = total - depositUsed;
  const paidNum = Number(paid) || 0;
  const toBill = Math.min(paidNum, due);
  const extra = Math.max(0, paidNum - due); // goes to deposit
  const balance = due - toBill;
  const depositRemaining = depositAvail - depositUsed + extra;
  const previewStatus =
    total > 0 && balance <= 0
      ? "PAID"
      : depositUsed + toBill > 0
        ? "PARTIAL"
        : "PENDING";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!patient) return setError("Search and select a patient first");
    if (paidNum < 0) return setError("Paid amount cannot be negative");
    if (paidNum > 0 && !mode) return setError("Select a payment mode");

    setSaving(true);
    try {
      const saved = await createBill({
        uhid: patient.uhid,
        items: items.map((i) => ({
          serviceId: i.serviceId,
          quantity: i.quantity,
        })),
        paidAmount: paidNum > 0 ? paidNum : null,
        paymentMode: paidNum > 0 ? mode : null,
        useDeposit: useDep,
      });
      setSuccess(
        `Bill ${saved.billNo} created - status ${saved.status}` +
          (extra > 0 ? `. Extra ${money(extra)} added to deposit.` : ""),
      );
      setTimeout(() => navigate("/billing"), 1800);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page bill-create">
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Create Bill</h2>
            <p className="card-subtitle">
              Doctor fee is added automatically. Extra payment is saved as
              deposit.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => navigate("/billing")}
          >
            View bills
          </button>
        </div>

        <div className="card-body">
          {success && (
            <div className="alert alert-success">
              <span>{success}</span>
            </div>
          )}
          {error && (
            <div className="alert alert-error">
              <span>{error}</span>
              <button
                type="button"
                className="alert-close"
                onClick={() => setError("")}
              >
                ×
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* ---------- Patient ---------- */}
            <div className="form-section">
              <h3 className="form-section-title">Patient</h3>
              <div className="form-grid">
                <div className="field span-12 search-box">
                  <label className="label">Search by UHID or name</label>
                  <input
                    className="input"
                    placeholder="e.g. UHID0001 or Rahul"
                    value={query}
                    onChange={onSearchChange}
                    onFocus={() => results.length && setShowResults(true)}
                  />
                  {showResults && !patient && (
                    <div className="search-results">
                      {results.length === 0 ? (
                        <div className="search-empty">No patients found</div>
                      ) : (
                        results.map((p) => (
                          <div
                            key={p.uhid}
                            className="search-item"
                            onClick={() => selectPatient(p)}
                          >
                            <span>
                              <strong>{p.uhid}</strong> - {p.patientName}
                            </span>
                            <small>
                              {p.doctorName} · Deposit{" "}
                              {money(p.depositAvailable)}
                            </small>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                <div className="field span-3">
                  <label className="label">Bill ID</label>
                  <input className="input" value="Generated on save" disabled />
                </div>
                <div className="field span-3">
                  <label className="label">UHID</label>
                  <input
                    className="input"
                    value={patient?.uhid || ""}
                    disabled
                  />
                </div>
                <div className="field span-6">
                  <label className="label">Patient name</label>
                  <input
                    className="input"
                    value={patient?.patientName || ""}
                    disabled
                  />
                </div>
                <div className="field span-6">
                  <label className="label">Doctor</label>
                  <input
                    className="input"
                    value={
                      patient
                        ? `${patient.doctorName} (${patient.specialization || "-"})`
                        : ""
                    }
                    disabled
                  />
                </div>
                <div className="field span-3">
                  <label className="label">Doctor fee</label>
                  <input
                    className="input"
                    value={patient ? money(doctorFee) : ""}
                    disabled
                  />
                </div>
                <div className="field span-3">
                  <label className="label">Deposit available</label>
                  <input
                    className="input"
                    value={patient ? money(depositAvail) : ""}
                    disabled
                  />
                </div>
                <div className="field span-12 dep-check">
                  <label>
                    <input
                      type="checkbox"
                      checked={useDep}
                      disabled={!patient || depositAvail <= 0}
                      onChange={(e) => setUseDep(e.target.checked)}
                    />{" "}
                    Use available deposit for this bill
                  </label>
                </div>
              </div>
            </div>

            {/* ---------- Services ---------- */}
            <div className="form-section">
              <h3 className="form-section-title">
                Extra services (X-Ray, MRI, lab tests)
              </h3>
              <div className="add-row">
                <div className="grow">
                  <label className="label">Service</label>
                  <select
                    className="input"
                    value={pick.serviceId}
                    onChange={(e) =>
                      setPick({ ...pick, serviceId: e.target.value })
                    }
                  >
                    <option value="">Select service</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.category} - {s.name} ({money(s.charge)})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="qty">
                  <label className="label">Qty</label>
                  <input
                    className="input"
                    type="number"
                    min="1"
                    value={pick.quantity}
                    onChange={(e) =>
                      setPick({ ...pick, quantity: e.target.value })
                    }
                  />
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={addItem}
                  disabled={!pick.serviceId}
                >
                  + Add
                </button>
              </div>

              {items.length > 0 && (
                <div className="table-box">
                  <table className="bill-table">
                    <thead>
                      <tr>
                        <th>Service</th>
                        <th>Category</th>
                        <th className="num">Charge</th>
                        <th className="num">Qty</th>
                        <th className="num">Amount</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((i) => (
                        <tr key={i.serviceId}>
                          <td>{i.name}</td>
                          <td>{i.category}</td>
                          <td className="num">{money(i.charge)}</td>
                          <td className="num">{i.quantity}</td>
                          <td className="num">
                            {money(i.charge * i.quantity)}
                          </td>
                          <td className="num">
                            <button
                              type="button"
                              className="btn btn-sm btn-danger"
                              onClick={() => removeItem(i.serviceId)}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ---------- Payment ---------- */}
            <div className="form-section">
              <h3 className="form-section-title">Payment</h3>
              <div className="pay-layout">
                <div className="form-grid pay-fields">
                  <div className="field span-6">
                    <label className="label">Payment mode</label>
                    <select
                      className="input"
                      value={mode}
                      onChange={(e) => setMode(e.target.value)}
                    >
                      {modes.length === 0 && (
                        <option value="">Loading modes...</option>
                      )}
                      {modes.map((m) => (
                        <option key={m} value={m}>
                          {m.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field span-6">
                    <label className="label">Amount paying now</label>
                    <input
                      className="input"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0 = pay later"
                      value={paid}
                      onChange={(e) => setPaid(e.target.value)}
                    />
                  </div>
                  <div className="field span-12 quick-btns">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline"
                      onClick={() => setPaid("")}
                    >
                      Pay later
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline"
                      onClick={() => setPaid((due / 2).toFixed(2))}
                      disabled={due <= 0}
                    >
                      Pay half
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline"
                      onClick={() => setPaid(due.toFixed(2))}
                      disabled={due <= 0}
                    >
                      Pay full
                    </button>
                  </div>
                  {extra > 0 && (
                    <div className="field span-12 extra-note">
                      {money(extra)} is more than the bill. It will be saved as
                      the patient's deposit.
                    </div>
                  )}
                </div>

                <div className="summary">
                  <div className="summary-head">
                    <span className="summary-title">Bill summary</span>
                    <span className={`status status-${previewStatus}`}>
                      {previewStatus}
                    </span>
                  </div>

                  {/* 1. Bill */}
                  <div className="summary-row">
                    <span>Doctor fee</span>
                    <span>{money(doctorFee)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Services</span>
                    <span>{money(servicesTotal)}</span>
                  </div>
                  <div className="summary-row bill-total">
                    <span>Bill total</span>
                    <span>{money(total)}</span>
                  </div>

                  {/* 2. Deposit + amount to pay */}
                  {depositUsed > 0 && (
                    <div className="summary-row deposit-used">
                      <span>Deposit used</span>
                      <span>- {money(depositUsed)}</span>
                    </div>
                  )}
                  <div className="pay-box">
                    <span>Amount to pay</span>
                    <strong>{money(due)}</strong>
                  </div>

                  {/* 3. Payment */}
                  <div className="summary-row">
                    <span>Paying now</span>
                    <span>{money(paidNum)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Balance due</span>
                    <span>{money(Math.max(balance, 0))}</span>
                  </div>

                  {/* 4. Deposit left */}
                  {patient && (depositAvail > 0 || extra > 0) && (
                    <div className="deposit-left-box">
                      <div className="summary-row deposit-left">
                        <span>Deposit left</span>
                        <span>{money(depositRemaining)}</span>
                      </div>
                      {extra > 0 && (
                        <div className="summary-note">
                          includes {money(extra)} extra payment
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving || !patient}
              >
                {saving ? "Saving..." : "Generate bill"}
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => navigate("/billing")}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
