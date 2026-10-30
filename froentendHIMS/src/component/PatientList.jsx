import { useEffect, useState } from "react";
import { useNavigate,Link } from "react-router-dom";
import { getPatients, deletePatient } from "../api/ApiPatient.js";
import "../style/plist.css";

const initials = (p) =>
  `${(p.firstName || "")[0] || ""}${(p.lastName || "")[0] || ""}`.toUpperCase() ||
  "?";

export default function PatientList() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const load = async () => {
    try {
      setPatients(await getPatients());
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (p) => {
    if (
      !window.confirm(`Delete ${p.uhid} (${p.firstName} ${p.lastName || ""})?`)
    )
      return;
    try {
      await deletePatient(p.uhid);
      setMessage(`${p.uhid} deleted successfully`);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const q = search.toLowerCase();
  const filtered = patients.filter((p) =>
    [p.uhid, p.firstName, p.lastName, p.contact].some((v) =>
      (v || "").toLowerCase().includes(q),
    ),
  );

  return (
    <div className="page list-page">
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Patients</h2>
            <p className="card-subtitle">
              {filtered.length} record{filtered.length !== 1 && "s"}
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate("/")}>
            + Register patient
          </button>
        </div>

        <div className="card-body">
          {message && (
            <div className="alert alert-success">
              <span>{message}</span>
              <button
                type="button"
                className="alert-close"
                onClick={() => setMessage("")}
              >
                ×
              </button>
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

          <div className="toolbar">
            <input
              className="search-input"
              placeholder="Search by UHID, name or contact..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="loader">
              <div className="spinner"></div>
            </div>
          ) : filtered.length === 0 ? (
            <p className="empty">No patients found.</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>UHID</th>
                    <th>Patient</th>
                    <th>Contact</th>
                    <th>Age</th>
                    <th>Blood</th>
                    <th>Height / Weight</th>
                    <th>Address</th>
                    <th>Doctor</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id}>
                      <td className="uhid">{p.uhid}</td>
                      <td>
                        <div className="patient-cell">
                          <span className="avatar">{initials(p)}</span>
                          <div>
                            <div className="patient-name">
                              {[p.firstName, p.middleName, p.lastName]
                                .filter(Boolean)
                                .join(" ")}
                            </div>
                            <div className="patient-sub">{p.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>{p.contact || <span className="muted">-</span>}</td>
                      <td>{p.age ?? <span className="muted">-</span>}</td>
                      <td>
                        {p.bloodGroup ? (
                          <span className="badge">{p.bloodGroup}</span>
                        ) : (
                          <span className="muted">-</span>
                        )}
                      </td>
                      <td>
                        {p.height || p.weight ? (
                          `${p.height ?? "-"} cm / ${p.weight ?? "-"} kg`
                        ) : (
                          <span className="muted">-</span>
                        )}
                      </td>
                      <td>{p.address || <span className="muted">-</span>}</td>
                      <td>
                        {p.doctor?.doctorName || <span className="muted">-</span>}
                      </td>
                      <td>
                        <div className="actions">
                          <button
                            className="btn btn-sm btn-warning"
                            onClick={() => navigate(`/reports?uhid=${p.uhid}`)}
                          >
                            View Report
                          </button>
                          <button
                            className="btn btn-sm btn-warning"
                            onClick={() => navigate(`/update/${p.uhid}`)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDelete(p)}
                          >
                            Delete
                          </button>
                        </div>
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
