import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getPatientByUhid,
  updatePatient,
  getDoctors,
} from "../api/ApiPatient.js";
import "../style/form.css";
import "../style/pupdate.css";

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function PatientUpdate() {
  const { uhid } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    getDoctors()
      .then(setDoctors)
      .catch((e) => setError(e.message));
    getPatientByUhid(uhid)
      .then((data) => {
        const clean = Object.fromEntries(
          Object.entries(data).map(([k, v]) => [k, v ?? ""]),
        );
        clean.doctorId = data.doctor?.id ?? "";
        delete clean.doctor;
        setForm(clean);
      })
      .catch((err) => setError(err.message));
  }, [uhid]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const { doctorId, ...rest } = form;
    const payload = {
      ...rest,
      age: form.age === "" ? null : Number(form.age),
      height: form.height === "" ? null : Number(form.height),
      weight: form.weight === "" ? null : Number(form.weight),
      doctor: { id: Number(doctorId) },
    };

    try {
      await updatePatient(uhid, payload);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!form) {
    return (
      <div className="page update-page">
        {error ? (
          <div className="alert alert-error">{error}</div>
        ) : (
          <div className="loader">
            <div className="spinner"></div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="page update-page">
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Update Patient</h2>
            <p className="card-subtitle">Edit the details below and save.</p>
          </div>
          <span className="uhid-badge">{uhid}</span>
        </div>

        <div className="card-body">
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
            <div className="form-section">
              <h3 className="form-section-title">Personal details</h3>
              <div className="form-grid">
                <div className="field">
                  <label className="label">
                    First name<span className="req">*</span>
                  </label>
                  <input
                    name="firstName"
                    className="input"
                    value={form.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="field">
                  <label className="label">Middle name</label>
                  <input
                    name="middleName"
                    className="input"
                    value={form.middleName}
                    onChange={handleChange}
                  />
                </div>
                <div className="field">
                  <label className="label">Last name</label>
                  <input
                    name="lastName"
                    className="input"
                    value={form.lastName}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3 className="form-section-title">Contact</h3>
              <div className="form-grid">
                <div className="field span-6">
                  <label className="label">Mobile number</label>
                  <input
                    name="contact"
                    type="tel"
                    className="input"
                    value={form.contact}
                    onChange={handleChange}
                    pattern="[0-9]{10}"
                    title="Enter a 10 digit mobile number"
                  />
                </div>
                <div className="field span-6">
                  <label className="label">Email</label>
                  <input
                    name="email"
                    type="email"
                    className="input"
                    value={form.email}
                    onChange={handleChange}
                  />
                </div>
                <div className="field span-12">
                  <label className="label">Address</label>
                  <textarea
                    name="address"
                    rows="2"
                    className="input"
                    value={form.address}
                    onChange={handleChange}
                  ></textarea>
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3 className="form-section-title">Consulting doctor</h3>
              <div className="form-grid">
                <div className="field span-6">
                  <label className="label">
                    Doctor<span className="req">*</span>
                  </label>
                  <select
                    name="doctorId"
                    className="input"
                    value={form.doctorId}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select doctor</option>
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.dname} - {d.specialization} (₹{d.fee})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3 className="form-section-title">Medical details</h3>
              <div className="form-grid">
                <div className="field span-3">
                  <label className="label">Age</label>
                  <input
                    name="age"
                    type="number"
                    min="0"
                    max="150"
                    className="input"
                    value={form.age}
                    onChange={handleChange}
                  />
                </div>
                <div className="field span-3">
                  <label className="label">Blood group</label>
                  <select
                    name="bloodGroup"
                    className="input"
                    value={form.bloodGroup}
                    onChange={handleChange}
                  >
                    <option value="">Select</option>
                    {bloodGroups.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field span-3">
                  <label className="label">Height (cm)</label>
                  <input
                    name="height"
                    type="number"
                    step="0.1"
                    className="input"
                    value={form.height}
                    onChange={handleChange}
                  />
                </div>
                <div className="field span-3">
                  <label className="label">Weight (kg)</label>
                  <input
                    name="weight"
                    type="number"
                    step="0.1"
                    className="input"
                    value={form.weight}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-success"
                disabled={saving}
              >
                {saving ? "Updating..." : "Update patient"}
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => navigate("/")}
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
