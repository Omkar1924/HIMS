import { useCallback, useEffect, useState } from "react";
import { getQueueByEmployee } from "../api/ApiQueue.js";
import "../style/queue.css";

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
    if (!rows || typeof rows !== "object" || rows === result) break;
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
  patient.doctor?.dname ||
  patient.outPatientDTO?.addDoctor?.doctorName ||
  "-";

const specialization = (patient) =>
  patient.specialization ||
  patient.doctorSpecialization ||
  patient.doctor?.specialization ||
  patient.outPatientDTO?.addDoctor?.specialization ||
  patient.outPatientDTO?.addDoctor?.specialisationId?.specialisationName ||
  patient.department ||
  "-";

const queueKey = (patient, index) =>
  patient.patientQueueId ??
  patient.queueId ??
  patient.id ??
  patient.uhid ??
  `${patient.patientName || patient.name || "patient"}-${index}`;

const queueStatus = (patient) => {
  const status = patient.status?.trim();
  return status ? status.charAt(0).toUpperCase() + status.slice(1) : "-";
};

export default function QueueManagement() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshQueue = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getQueueByEmployee(1);
      setPatients(getQueueRows(response));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    getQueueByEmployee(1)
      .then((response) => {
        if (!active) return;
        setPatients(getQueueRows(response));
        setError("");
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="page queue-page">
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Queue Management</h2>
            <p className="card-subtitle">
              {loading
                ? "Loading patient queue..."
                : `${patients.length} patient${patients.length === 1 ? "" : "s"} in queue`}
            </p>
          </div>
          <button
            type="button"
            className="btn btn-outline"
            onClick={refreshQueue}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div className="card-body">
          {error && (
            <div className="alert alert-error">
              <span>{error}</span>
            </div>
          )}
          {loading ? (
            <div className="loader">
              <div className="spinner"></div>
            </div>
          ) : patients.length === 0 ? (
            <p className="empty">No patients are waiting in this queue.</p>
          ) : (
            <div className="queue-table-wrap">
              <table className="queue-table">
                <thead>
                  <tr>
                    <th scope="col">Queue Number</th>
                    <th scope="col">UHID</th>
                    <th scope="col">Patient Name</th>
                    <th scope="col">Doctor Name</th>
                    <th scope="col">Specialization</th>
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
                      <td>{doctorName(patient)}</td>
                      <td>{specialization(patient)}</td>
                      <td>
                        <span
                          className={`queue-status queue-status-${(patient.status || "").toLowerCase()}`}
                        >
                          {queueStatus(patient)}
                        </span>
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
  );
}
