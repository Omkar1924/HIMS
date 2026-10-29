import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getFinalBills, getPatientByUhid, searchBills } from "../api/ApiPatient.js";
import HimsBrand from "./HimsBrand.jsx";
import "../style/form.css";
import "../style/bill.css";
import "../style/final-report.css";
import "../style/hims-brand.css";

const money = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d) => (d ? new Date(d).toLocaleString("en-IN") : "-");
const modeLabel = (mode) => mode?.replaceAll("_", " ") || "-";

export default function FinalBillReport() {
  const { finalNo } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const passedFinalBill = location.state?.finalBill;
  const passedDetails = location.state?.details;
  const [savedFinalBill, setSavedFinalBill] = useState(null);
  const [patientBills, setPatientBills] = useState(null);
  const [patientDetails, setPatientDetails] = useState(location.state?.details?.patient || null);
  const [error, setError] = useState("");

  const finalBill = passedFinalBill?.finalNo === finalNo
    ? passedFinalBill
    : savedFinalBill?.finalNo === finalNo ? savedFinalBill : null;
  const details = passedFinalBill?.finalNo === finalNo ? passedDetails : null;
  const finalUhid = finalBill?.uhid;
  const currentFinalNo = finalBill?.finalNo;
  const finalBillNumbers = finalBill?.billNos;

  useEffect(() => {
    if (passedFinalBill?.finalNo === finalNo) return undefined;
    let active = true;
    getFinalBills(finalNo)
      .then((bills) => {
        const savedBill = bills.find((bill) => bill.finalNo === finalNo);
        if (!savedBill) {
          if (active) setError(`Final bill ${finalNo} was not found.`);
          return;
        }
        if (active) setSavedFinalBill(savedBill);
      })
      .catch((err) => {
        if (active) setError(err.message);
      });
    return () => { active = false; };
  }, [finalNo, passedFinalBill]);

  useEffect(() => {
    if (!finalUhid) return undefined;
    let active = true;
    searchBills(finalUhid, "ALL")
      .then((patientBills) => {
        const matchedBills = patientBills.filter((bill) => bill.uhid === finalUhid);
        if (active) setPatientBills(matchedBills);
      })
      .catch((err) => {
        if (active) setError(`Could not load service and payment details: ${err.message}`);
      });
    return () => { active = false; };
  }, [finalUhid, currentFinalNo, finalBillNumbers]);

  useEffect(() => {
    if (!finalUhid || patientDetails) return undefined;
    let active = true;
    getPatientByUhid(finalUhid)
      .then((details) => {
        if (active) setPatientDetails(details);
      })
      .catch((err) => {
        if (active) setError(`Could not load patient details: ${err.message}`);
      });
    return () => { active = false; };
  }, [finalUhid, patientDetails]);

  const printReport = () => window.print();
  const bills = patientBills || details?.bills || [];
  const billDetailsLoaded = patientBills !== null;
  const billedTotal = finalBill?.totalBilled ?? details?.totalBilled;
  const depositUsed = finalBill?.depositUsed ?? details?.depositUsed;
  const amountCollected = finalBill?.amountCollected ?? details?.amountToPay;
  const refundAmount = finalBill?.refundAmount ?? details?.refundAmount;
  const finalPaymentMode = details?.payMode || finalBill?.payMode || finalBill?.paymentMode;
  const finalRefundMode = details?.refundMode || finalBill?.refundMode;
  const billNos = finalBill?.billNos || bills.map((bill) => bill.billNo);
  const patientName = patientDetails?.patientName ||
    [patientDetails?.firstName, patientDetails?.middleName, patientDetails?.lastName].filter(Boolean).join(" ") ||
    finalBill?.patientName || "-";
  const consultant = patientDetails?.doctorName ||
    patientDetails?.doctor?.dname ||
    patientDetails?.doctor?.name ||
    bills.find((bill) => bill.doctorName)?.doctorName || "-";
  const paymentEntries = (patientBills || []).flatMap((bill) =>
    (bill.payments || []).map((payment) => ({ ...payment, billNo: bill.billNo })),
  );
  const checkoutBills = details?.bills || [];
  const checkoutBillByNo = new Map(checkoutBills.map((bill) => [bill.billNo, bill]));
  const allBillsTotal = bills.reduce((sum, bill) => sum + Number(bill.totalAmount || 0), 0);
  const allBillsPaid = bills.reduce((sum, bill) => sum + Number(bill.paidAmount || 0), 0);
  const allBillsBalance = bills.reduce((sum, bill) => sum + Number(bill.balance || 0), 0);

  return (
    <div className="page final-report-page">
      <div className="card">
        <div className="card-header report-toolbar">
          <div>
            <h2 className="card-title">Final Bill Report</h2>
            <p className="card-subtitle">Final bill {finalNo}</p>
          </div>
          <div className="header-actions report-actions">
            <button type="button" className="btn btn-outline" onClick={() => navigate("/billing/final")}>
              Back to final bills
            </button>
            <button type="button" className="btn btn-primary" onClick={printReport}
                    disabled={!finalBill || !billDetailsLoaded}>
              Generate / Print report
            </button>
          </div>
        </div>

        <div className="card-body">
          {error && <div className="alert alert-error"><span>{error}</span></div>}
          {!finalBill && !error && <div className="loader"><div className="spinner"></div></div>}
          {finalBill && (
            <article className="final-report">
              <HimsBrand />
              <header className="report-heading">
                <h1>Final Bill</h1>
                <div className="report-document-meta">
                  <span>Final No: <strong>{finalBill.finalNo}</strong></span>
                  <span>Date: <strong>{fmtDate(finalBill.createdAt)}</strong></span>
                </div>
              </header>

              <section className="report-section">
                <h3 className="report-section-title">Patient details</h3>
                <div className="report-patient">
                  <div className="report-patient-row">
                    <span><small>Patient ID / UHID</small><strong>{finalBill.uhid || "-"}</strong></span>
                    <span><small>Consultant Dr.</small><strong>{consultant}</strong></span>
                  </div>
                  <div className="report-patient-row">
                    <span><small>Patient name</small><strong>{patientName}</strong></span>
                    <span><small>Age</small><strong>{patientDetails?.age ?? "-"}</strong></span>
                  </div>
                  <div className="report-patient-row">
                    <span><small>Contact</small><strong>{patientDetails?.contact || patientDetails?.phone || patientDetails?.mobileNumber || "-"}</strong></span>
                    <span><small>Email</small><strong>{patientDetails?.email || "-"}</strong></span>
                  </div>
                  <div className="report-patient-row report-address">
                    <span><small>Address</small><strong>{patientDetails?.address || "-"}</strong></span>
                  </div>
                </div>
              </section>

              <section className="report-section">
                <h3 className="report-section-title">Services</h3>
                {billDetailsLoaded && bills.length > 0 ? bills.map((bill) => (
                  <div className="report-bill" key={bill.billNo}>
                    <h4>
                      <span>Bill No: <strong>{bill.billNo}</strong></span>
                      <span>{fmtDate(bill.createdAt)} · {bill.status}</span>
                    </h4>
                    <div className="table-box">
                      <table className="bill-table">
                        <thead>
                          <tr><th>Category</th><th>Service</th><th className="num">Rate</th><th className="num">Qty</th><th className="num">Amount</th></tr>
                        </thead>
                        <tbody>
                          {Number(bill.doctorFee) > 0 && (
                            <tr>
                              <td>Consultation</td>
                              <td>Consultation - {bill.doctorName || "Doctor"}</td>
                              <td className="num">{money(bill.doctorFee)}</td>
                              <td className="num">1</td>
                              <td className="num">{money(bill.doctorFee)}</td>
                            </tr>
                          )}
                          {(bill.items || []).map((item, index) => (
                            <tr key={item.id || `${item.serviceName}-${index}`}>
                              <td>{item.category || "-"}</td>
                              <td>{item.serviceName}</td>
                              <td className="num">{money(item.charge)}</td>
                              <td className="num">{item.quantity}</td>
                              <td className="num">{money(item.amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="report-bill-summary">
                      <span>Bill total <strong>{money(bill.totalAmount)}</strong></span>
                      <span>Previously paid <strong>{money(checkoutBillByNo.get(bill.billNo)?.paidAmount ?? bill.paidAmount)}</strong></span>
                      <span>Pending before final payment <strong>{money(checkoutBillByNo.get(bill.billNo)?.balance ?? bill.balance)}</strong></span>
                    </div>
                  </div>
                )) : (
                  <p className="report-value">
                    {billDetailsLoaded
                      ? `No bill details found for this patient. Checkout bills: ${billNos.join(", ") || "-"}.`
                      : `Loading all bills for patient ${finalBill.uhid}…`}
                  </p>
                )}
              </section>

              <section className="report-section">
                <h3 className="report-section-title">Billing details</h3>
                {paymentEntries.length > 0 ? (
                  <div className="table-box">
                    <table className="bill-table">
                      <thead><tr><th>Bill No</th><th>Date</th><th>Payment method</th><th className="num">Paid amount</th></tr></thead>
                      <tbody>
                        {paymentEntries.map((payment, index) => (
                          <tr key={`${payment.billNo}-${payment.paidAt}-${index}`}>
                            <td>{payment.billNo}</td>
                            <td>{fmtDate(payment.paidAt)}</td>
                            <td>{modeLabel(payment.mode)}</td>
                            <td className="num">{money(payment.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : <p className="report-value">No individual bill payment entries are available.</p>}
                <div className="report-billing-total">
                  <div><span>Total billed</span><strong>{money(billedTotal ?? allBillsTotal)}</strong></div>
                  <div><span>Previously paid</span><strong>{money(details?.totalPaid ?? finalBill.paidBefore ?? allBillsPaid)}</strong></div>
                  <div><span>Deposit adjusted</span><strong>{money(depositUsed)}</strong></div>
                  <div><span>Payment received now {finalPaymentMode ? `(${modeLabel(finalPaymentMode)})` : ""}</span><strong>{money(amountCollected)}</strong></div>
                  <div><span>Refund paid {finalRefundMode ? `(${modeLabel(finalRefundMode)})` : ""}</span><strong>{money(refundAmount)}</strong></div>
                  <div className="report-grand-total"><span>Outstanding after checkout</span><strong>{money(allBillsBalance)}</strong></div>
                </div>
              </section>
              <footer className="report-authorization">
                <div className="report-signature">
                  <div className="signature-line"></div>
                  <span>Authorized signature</span>
                  <span>Name / designation: ____________________</span>
                </div>
              </footer>
            </article>
          )}
        </div>
      </div>
    </div>
  );
}
