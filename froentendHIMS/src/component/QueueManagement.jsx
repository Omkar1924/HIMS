import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getQueueByEmployee } from "../api/ApiQueue.js";
import "../style/queue.css";
import receptionistVideo from "../assets/A simple animated scene of a receptionist at a desk while people in a queue walk toward the receptionist..mp4";

const POLL_INTERVAL_MS = 5000; // refresh every 5 seconds

const getQueueRows = (response) => {
  let result = response;
  while (result && !Array.isArray(result)) {
    const rows =
      result.data ??
      result.content ??
      result.queue ??
      result.patients ??
      result.patientQueues;
    if (Array.isArray(rows)) return rows;
    if (!rows || typeof result !== "object" || rows === result) break;
    result = rows;
  }
  if (Array.isArray(result)) return result;
  throw new Error("The patient queue response did not contain a list.");
};

const patientName = (patient) =>
  (
    patient.patientName ||
    patient.name ||
    patient.outPatientDTO?.patient?.patientName ||
    [patient.firstName, patient.middleName, patient.lastName]
      .filter(Boolean)
      .join(" ") ||
    [
      patient.outPatientDTO?.patient?.firstName,
      patient.outPatientDTO?.patient?.middleName,
      patient.outPatientDTO?.patient?.lastName,
    ]
      .filter(Boolean)
      .join(" ") ||
    "-"
  ).trim();

const doctorName = (patient) =>
  patient.doctorName ||
  patient.drName ||
  patient.doctor?.name ||
  patient.doctor?.doctorName ||
  patient.outPatientDTO?.addDoctor?.doctorName ||
  "";

const doctorDegree = (patient) =>
  patient.degree ||
  patient.doctor?.degree ||
  patient.outPatientDTO?.addDoctor?.degree ||
  "";

const specialization = (patient) =>
  patient.specialization ||
  patient.doctorSpecialization ||
  patient.doctor?.specialization ||
  patient.outPatientDTO?.addDoctor?.specialization ||
  patient.outPatientDTO?.addDoctor?.specialisationId?.specialisationName ||
  patient.department ||
  "";

// Scan all rows so the header stays correct even if the first row has no doctor.
const doctorFromRows = (rows) => {
  for (const patient of rows) {
    const name = doctorName(patient);
    if (name) {
      return {
        name,
        details: [doctorDegree(patient), specialization(patient)]
          .filter(Boolean)
          .join(" • "),
      };
    }
  }
  return null;
};

const queueKey = (patient, index) =>
  patient.patientQueueId ??
  patient.queueId ??
  patient.id ??
  patient.uhid ??
  `${patient.patientName || patient.name || "patient"}-${index}`;

const statusOf = (patient) => (patient.status || "").trim().toLowerCase();

const queueStatus = (patient) => {
  const status = patient.status?.trim();
  return status ? status.charAt(0).toUpperCase() + status.slice(1) : "-";
};

// Completed patients leave the queue display.
const isCompleted = (patient) =>
  ["complete", "completed"].includes(statusOf(patient));

const formatTime = (date) =>
  date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

// Keep the queue in turn order (QN-8, QN-9, ...)
const queueOrder = (patient) => {
  const n = parseInt(
    String(patient.queueNumber || patient.queueNo || "").replace(/\D/g, ""),
    10,
  );
  return Number.isNaN(n) ? Number.MAX_SAFE_INTEGER : n;
};

// ---------------- Waiting time = appointment time - current time ----------------

// Builds a local Date from "2026-11-03" + "1:40 PM" (or "13:40").
const parseAppointment = (dateStr, timeStr) => {
  const d = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(dateStr || "").trim());
  const t = /^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i.exec(
    String(timeStr || "").trim(),
  );
  if (!d || !t) return null;

  let hours = Number(t[1]);
  const minutes = Number(t[2]);
  const meridiem = t[3]?.toUpperCase();
  if (meridiem === "PM" && hours < 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;

  return new Date(Number(d[1]), Number(d[2]) - 1, Number(d[3]), hours, minutes);
};

const appointmentDateTime = (patient) =>
  parseAppointment(
    patient.outPatientDTO?.appointmentDate ??
      patient.appointmentDate ??
      patient.date,
    patient.outPatientDTO?.appointmentTime ?? patient.appointmentTime,
  );

const formatDuration = (minutes) => {
  if (minutes < 60) return `${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins ? `${hrs} hr ${mins} min` : `${hrs} hr`;
};

// Minutes left from the current time until the appointment time.
// "Now" for the patient being seen, 0 min once the appointment time has passed.
const waitingLabel = (patient, now) => {
  const status = statusOf(patient);
  if (status === "serving") return "Now";
  if (status === "skipped") return "-";

  const appointment = appointmentDateTime(patient);
  if (!appointment) return "-";

  const minutes = Math.max(0, Math.ceil((appointment - now) / 60000));
  return formatDuration(minutes);
};

export default function QueueManagement() {
  const { employeeId } = useParams();
  const [patients, setPatients] = useState([]);
  const [doctor, setDoctor] = useState({ name: "", details: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [now, setNow] = useState(new Date());

  // Shareable link for this doctor's queue page.
  const pageUrl = window.location.href;
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    if (!pageUrl) return;
    const done = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(pageUrl).then(done, done);
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = pageUrl;
      textarea.readOnly = true;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand("copy");
      } catch (err) {
        // clipboard unavailable
      }
      document.body.removeChild(textarea);
      done();
    }
  };

  // Clock for the marquee and the waiting times.
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const response = await getQueueByEmployee(employeeId);
        if (!active) return;

        const rows = getQueueRows(response);

        const rowDoctor = doctorFromRows(rows);
        if (rowDoctor) setDoctor(rowDoctor);

        // Completed patients leave the list; the rest stay in turn order.
        setPatients(
          rows
            .filter((patient) => !isCompleted(patient))
            .sort((a, b) => queueOrder(a) - queueOrder(b)),
        );
        setError("");
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    const intervalId = setInterval(load, POLL_INTERVAL_MS);

    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, [employeeId]);

  return (
    <div className="queue-page">
      {/* Header: hospital brand (left) and doctor card (right) */}
      <header className="qd-header">
        <div className="qd-brand">
          <div className="qd-brand-icon">❤</div>
          <div>
            <div className="qd-brand-name">157 Hospital</div>
            <div className="qd-brand-tag">Care Today, Healthier Tomorrow</div>
          </div>
        </div>

        <div className="qd-doctor">
          <div className="qd-avatar">🧑‍⚕️</div>
          <div>
            <div className="qd-doctor-name">
              {doctor.name || `Doctor ${employeeId}`}
            </div>
            <div className="qd-doctor-sub">{doctor.details || "\u00A0"}</div>
          </div>
        </div>
        <div className="qd-share">
            <div className="qd-share-label">Share link</div>
            <div className="qd-share-row">
              <input
                type="text"
                className="qd-share-input"
                value={pageUrl}
                readOnly
                aria-label="Queue page link"
              />
              <button
                type="button"
                className="btn-copy"
                onClick={copyLink}
                disabled={copied}
              >
                {copied ? "Copied!" : "Copy link"}
              </button>
            </div>
          </div>
      </header>

      <div className="qd-layout">
        {/* Queue table: 6 rows visible, the rest scroll inside the table */}
        <section className="qd-main">
          <h2 className="qd-title">
            <span>👥</span> Patient Queue
          </h2>

          {error && (
            <div className="alert alert-error">
              <span>{error}</span>
            </div>
          )}

          <div className="qd-scroll">
            {loading ? (
              <p className="empty">Loading patient queue...</p>
            ) : patients.length === 0 ? (
              <p className="empty">No patients are waiting in this queue.</p>
            ) : (
              <table className="queue-table">
                <thead>
                  <tr>
                    <th scope="col">Queue Number</th>
                    <th scope="col">UHID</th>
                    <th scope="col">Patient Name</th>
                    <th scope="col">Waiting Time</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((patient, index) => (
                    <tr key={queueKey(patient, index)}>
                      <td>{patient.queueNumber || patient.queueNo || "-"}</td>
                      <td className="queue-uhid">
                        {patient.uhid ||
                          patient.patientUhid ||
                          patient.patient?.uhid ||
                          patient.outPatientDTO?.patient?.uhid ||
                          "-"}
                      </td>
                      <td>{patientName(patient)}</td>
                      <td className="queue-waiting">
                        {waitingLabel(patient, now)}
                      </td>
                      <td>
                        <span
                          className={`queue-status queue-status-${statusOf(patient)}`}
                        >
                          {queueStatus(patient)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Side panel (hidden on small screens) */}
        <aside className="qd-side">
          <video
            className="qd-side-video"
            autoPlay
            loop
            muted
            playsInline
            src={receptionistVideo}
            aria-label="Receptionist queue animation"
          />
          <div>
            <div className="qd-side-line1">Your Health</div>
            <div className="qd-side-line2">Our Priority</div>
          </div>
        </aside>
      </div>

      {/* Animated left-to-right marquee at the bottom */}
      <div className="page-footer">
        <div className="page-marquee">
          <div className="page-marquee-content">
            <span className="page-marquee-item">🏥 157 Hospital</span>
            <span className="page-marquee-sep">│</span>
            <span className="page-marquee-item">www.157hospital.com</span>
            <span className="page-marquee-sep">│</span>
            <span className="page-marquee-item">
              Current Time: {formatTime(now)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
