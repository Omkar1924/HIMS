import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPatient, getDoctors } from "../api/ApiPatient.js";
import "../style/form.css";
import "../style/pregister.css";

const emptyForm = {
  firstName: "",
  middleName: "",
  lastName: "",
  contact: "",
  email: "",
  age: "",
  bloodGroup: "",
  height: "",
  weight: "",
  address: "",
  doctorId: "",
};
const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function PatientRegister({ onRegistered }) {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [doctors, setDoctors] = useState([]);
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // load docter for dropdown
  useEffect(() => {
    getDoctors()
      .then(setDoctors)
      .catch((e) => setError(e.message));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess("");
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
      const saved = await createPatient(payload);
      setSuccess(`Patient registered successfully. UHID: ${saved.uhid}`);
      setForm(emptyForm);
      if (onRegistered) onRegistered(saved);
      setTimeout(() => navigate("/"), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page register-page">
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Register Patient</h2>
          </div>
        </div>

        <div className="card-body">
          {success && (
            <div className="alert alert-success">
              <span>{success}</span>
              <button
                type="button"
                className="alert-close"
                onClick={() => setSuccess("")}
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
                    placeholder="10 digit number"
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
                    placeholder="name@example.com"
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
                        {d.doctorName} - {d.specialization} (₹{d.fee})
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
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? "Saving..." : "Register patient"}
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setForm(emptyForm)}
              >
                Reset
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
