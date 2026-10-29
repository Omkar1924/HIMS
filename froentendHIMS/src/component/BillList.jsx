import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  searchBills, addPayment, getPaymentModes, payFromDeposit, getPatientByUhid,
} from "../api/ApiPatient.js";
import HimsBrand from "./HimsBrand.jsx";
import "../style/bill.css";
import "../style/blist.css";
import "../style/hims-brand.css";

const STATUSES = ["ALL", "PENDING", "PARTIAL", "PAID"];
const LABELS = { ALL: "All", PENDING: "Pending", PARTIAL: "Half paid", PAID: "Paid" };

const money = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d) => (d ? new Date(d).toLocaleString("en-IN") : "-");

export default function BillList() {
  const navigate = useNavigate();
  const [bills, setBills] = useState([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [modes, setModes] = useState([]);
  const [selected, setSelected] = useState(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMode, setPayMode] = useState("");
  const [paying, setPaying] = useState(false);
  const [modalError, setModalError] = useState("");

  const printBill = () => {
    const cleanup = () => document.body.classList.remove("printing-bill");
    document.body.classList.add("printing-bill");
    window.addEventListener("afterprint", cleanup, { once: true });
    window.print();
  };

  const load = async (query = q, st = status) => {
    try {
      setBills(await searchBills(query.trim(), st));
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getPaymentModes()
      .then((m) => { setModes(m); setPayMode(m[0] || ""); })
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(q, status), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, status]);

  const openBill = async (bill) => {
    setSelected({ ...bill, patientDetailsLoading: true });
    setPayAmount(String(bill.balance));
    setModalError("");
    try {
      const patient = await getPatientByUhid(bill.uhid);
      setSelected((current) => current?.billNo === bill.billNo ? {
        ...current,
        ...patient,
        ...bill,
        age: patient.age ?? bill.age,
        contact: patient.contact ?? bill.contact,
        email: patient.email ?? bill.email,
        address: patient.address ?? bill.address,
        patientDetailsLoading: false,
      } : current);
    } catch (err) {
      setSelected((current) => current?.billNo === bill.billNo
        ? { ...current, patientDetailsLoading: false }
        : current);
      setModalError(`Could not load full patient details: ${err.message}`);
    }
  };

  const handlePay = async (e) => {
    e.preventDefault();
    setModalError("");
    const amount = Number(payAmount);
    if (!amount || amount <= 0) return setModalError("Enter a valid amount");

    setPaying(true);
    try {
      const updated = await addPayment(selected.billNo, { amount, mode: payMode });
      const extra = Math.max(0, amount - Number(selected.balance));
      setSelected((current) => ({
        ...current,
        ...updated,
        age: updated.age ?? current.age,
        contact: updated.contact ?? current.contact,
        email: updated.email ?? current.email,
        address: updated.address ?? current.address,
      }));
      setPayAmount(String(updated.balance));
      setMessage(
        `Payment of ${money(amount)} recorded for ${updated.billNo}` +
        (extra > 0 ? `. ${money(extra)} added to deposit.` : "")
      );
      await load();
    } catch (err) {
      setModalError(err.message);
    } finally {
      setPaying(false);
    }
  };

  const handleUseDeposit = async () => {
    setModalError("");
    setPaying(true);
    try {
      const updated = await payFromDeposit(selected.billNo);
      setSelected((current) => ({
        ...current,
        ...updated,
        age: updated.age ?? current.age,
        contact: updated.contact ?? current.contact,
        email: updated.email ?? current.email,
        address: updated.address ?? current.address,
      }));
      setPayAmount(String(updated.balance));
      setMessage(`Deposit applied to ${updated.billNo}`);
      await load();
    } catch (err) {
      setModalError(err.message);
    } finally {
      setPaying(false);
    }
  };

  const canPay = selected && Number(selected.balance) > 0 && !selected.finalNo;

  return (
    <div className="page bill-list">
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Bills</h2>
            <p className="card-subtitle">{bills.length} bill{bills.length !== 1 && "s"}</p>
          </div>
          <div className="header-actions">
            <button className="btn btn-outline" onClick={() => navigate("/billing/deposit")}>Deposits</button>
            <button className="btn btn-success" onClick={() => navigate("/billing/final")}>Final bill / Checkout</button>
            <button className="btn btn-primary" onClick={() => navigate("/billing/new")}>+ New bill</button>
          </div>
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

          <div className="toolbar">
            <input
              className="search-input"
              placeholder="Search by Bill No, UHID or patient name..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <div className="tabs">
              {STATUSES.map((s) => (
                <button
                  key={s} type="button"
                  className={`tab ${status === s ? "active" : ""}`}
                  onClick={() => setStatus(s)}
                >
                  {LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="loader"><div className="spinner"></div></div>
          ) : bills.length === 0 ? (
            <p className="empty">No bills found.</p>
          ) : (
            <div className="table-box">
              <table className="bill-table">
                <thead>
                  <tr>
                    <th>Bill No</th><th>Patient</th><th>Doctor</th>
                    <th className="num">Total</th><th className="num">Paid</th>
                    <th className="num">Balance</th>
                    <th className="num">Deposit</th>
                    {/* <th className="num">Refundable</th> */}
                    <th>Status</th><th>Date</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {bills.map((b) => (
                    <tr key={b.billNo}>
                      <td className="bill-no">{b.billNo}</td>
                      <td>
                        <div>{b.patientName}</div>
                        <div className="sub">{b.uhid}</div>
                      </td>
                      <td>{b.doctorName}</td>
                      <td className="num">{money(b.totalAmount)}</td>
                      <td className="num">{money(b.paidAmount)}</td>
                      <td className="num">{money(b.balance)}</td>
                      <td className="num">{money(b.depositAvailable)}</td>
                      {/* <td className="num">{money(b.refundable)}</td> */}
                      <td>
                        <span className={`status status-${b.status}`}>{b.status}</span>
                        {b.finalNo && <div className="sub">{b.finalNo}</div>}
                      </td>
                      <td className="sub">{fmtDate(b.createdAt)}</td>
                      <td className="num">
                        <button className="btn btn-sm btn-outline" onClick={() => openBill(b)}>
                          {b.status === "PAID" || b.finalNo ? "View" : "View / Pay"}
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

      {/* ---------- Bill details modal ---------- */}
      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <HimsBrand />
            <div className="modal-head">
              <div>
                <p className="invoice-kicker">Patient Bill</p>
                <h3>{selected.billNo}</h3>
                <p className="sub">{fmtDate(selected.createdAt)}</p>
              </div>
              <div className="modal-head-right">
                <span className={`status status-${selected.status}`}>{selected.status}</span>
                {selected.finalNo && <span className="chip">{selected.finalNo}</span>}
                <div className="bill-modal-actions">
                  <button type="button" className="btn btn-sm btn-primary no-print" onClick={printBill}>
                    Print bill
                  </button>
                  <button className="alert-close no-print" onClick={() => setSelected(null)}>×</button>
                </div>
              </div>
            </div>

            <div className="modal-info">
              <div className="patient-info-row patient-info-id">
                <div><span className="sub">Patient ID / UHID</span><strong>{selected.uhid}</strong></div>
                <div><span className="sub">Consultant Dr.</span><strong>{selected.doctorName || "-"}</strong></div>
              </div>
              <div className="patient-info-row">
                <div><span className="sub">Patient name</span><strong>{selected.patientName || "-"}</strong></div>
                <div><span className="sub">Age</span><strong>{selected.age ?? "-"}</strong></div>
              </div>
              <div className="patient-info-row">
                <div><span className="sub">Contact</span><strong>{selected.contact || (selected.patientDetailsLoading ? "Loading..." : "-")}</strong></div>
                <div><span className="sub">Email</span><strong>{selected.email || (selected.patientDetailsLoading ? "Loading..." : "-")}</strong></div>
              </div>
              <div className="patient-info-row patient-address">
                <div><span className="sub">Address</span><strong>{selected.address || (selected.patientDetailsLoading ? "Loading..." : "-")}</strong></div>
              </div>
            </div>
            {modalError && <div className="alert alert-error"><span>{modalError}</span></div>}

            <div className="invoice-section">
              <h4 className="modal-sub">Services</h4>
              <table className="bill-table">
                <thead>
                  <tr><th>Category</th><th>Service</th><th className="num">Unit charge</th><th className="num">Qty</th><th className="num">Amount</th></tr>
                </thead>
                <tbody>
                  {Number(selected.doctorFee) > 0 && (
                    <tr>
                      <td>Consultation</td>
                      <td>Consultation - {selected.doctorName || "Doctor"}</td>
                      <td className="num">{money(selected.doctorFee)}</td>
                      <td className="num">1</td>
                      <td className="num">{money(selected.doctorFee)}</td>
                    </tr>
                  )}
                  {(selected.items || []).map((i, idx) => (
                    <tr key={i.id || `${i.serviceName}-${idx}`}>
                      <td>{i.category || "-"}</td>
                      <td>{i.serviceName}</td>
                      <td className="num">{money(i.charge)}</td>
                      <td className="num">{i.quantity}</td>
                      <td className="num">{money(i.amount)}</td>
                    </tr>
                  ))}
                  <tr className="invoice-total-row">
                    <td colSpan="4">Bill total</td>
                    <td className="num">{money(selected.totalAmount)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="invoice-section">
              <h4 className="modal-sub">Billing and payment details</h4>
              <div className="summary modal-summary invoice-summary">
                <div className="summary-row"><span>Bill total</span><span>{money(selected.totalAmount)}</span></div>
                <div className="summary-row"><span>Paid</span><span>{money(selected.paidAmount)}</span></div>
                <div className="summary-row total"><span>Balance due</span><span>{money(selected.balance)}</span></div>
                {Number(selected.refundable) > 0 && (
                  <div className="summary-row extra"><span>Refundable</span><span>{money(selected.refundable)}</span></div>
                )}
              </div>
              {(selected.payments || []).length > 0 ? (
                <ul className="pay-history invoice-payments">
                  {selected.payments.map((p, idx) => (
                    <li key={idx}>
                      <span>{fmtDate(p.paidAt)}</span>
                      <span className="chip">{(p.mode || "Payment").replaceAll("_", " ")}</span>
                      <strong>{money(p.amount)}</strong>
                    </li>
                  ))}
                </ul>
              ) : <p className="sub">No payment transactions recorded.</p>}
              {Number(selected.depositUsed) > 0 && (
                <p className="sub">Deposit applied to bill: {money(selected.depositUsed)}</p>
              )}
              <p className="invoice-status">Payment status: <strong>{selected.status}</strong></p>
            </div>

            <footer className="bill-authorization">
              <div className="bill-signature">
                <div className="bill-signature-line"></div>
                <span>Authorized signature</span>
                <span>Name / designation: ____________________</span>
              </div>
            </footer>

            {canPay && (
              <form className="pay-form no-print" onSubmit={handlePay}>
                <h4 className="modal-sub">Receive payment</h4>
                <div className="pay-form-row">
                  <input
                    className="input" type="number" step="0.01" min="0"
                    value={payAmount} onChange={(e) => setPayAmount(e.target.value)}
                  />
                  <select className="input" value={payMode} onChange={(e) => setPayMode(e.target.value)}>
                    {modes.map((m) => <option key={m} value={m}>{m.replace("_", " ")}</option>)}
                  </select>
                  <button className="btn btn-success" disabled={paying}>
                    {paying ? "Saving..." : "Pay"}
                  </button>
                </div>
                <p className="sub hint">An amount above the balance is saved as deposit.</p>
                {Number(selected.depositAvailable) > 0 && (
                  <button type="button" className="btn btn-outline" onClick={handleUseDeposit} disabled={paying}>
                    Use deposit ({money(selected.depositAvailable)})
                  </button>
                )}
              </form>
            )}

            {selected.finalNo && (
              <p className="sub hint no-print">This bill is cleared under {selected.finalNo} and can no longer be changed.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}