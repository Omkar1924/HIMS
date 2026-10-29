import { Link } from "react-router-dom";
import "../style/navbar.css";

export default function Navbar() {
  return (
    <nav className="navbar">
      {/* <Link className="navbar-brand" to="/">
        HIMS
      </Link> */}
      <div className="flex gap-2">
        {/* <Link className="btn btn-sm btn-primary" to="/">
          Register
        </Link>
        <Link className="btn btn-sm btn-outline-light" to="/view">
          Patients
        </Link>
        <Link className="btn btn-sm btn-outline-light" to="/billing">
          Billing
        </Link>
        <Link className="btn btn-sm btn-outline-light" to="/billing/final">
          Final Bill
        </Link>
        <Link className="btn btn-sm btn-outline-light" to="/queue">
          Queue
        </Link> */}
        {/* <Link className="rp-btn rp-btn-primary" to="/report-templates">
          Report Templates
        </Link>
        <Link className="rp-btn rp-btn-primary" to="/clinical-summary">
          Clinical Summary
        </Link> */}
        <Link className="rp-btn rp-btn-primary" to="/discharge/templates">
          Discharge Templates
        </Link>
        {/* <Link className="btn btn-sm btn-outline-light" to="/reports">
          Reports
        </Link>
        <Link className="btn btn-sm btn-outline-light" to="/doctor">
          Doctor
        </Link>
        <Link className="btn btn-sm btn-outline-light" to="/department">
          Department
        </Link> */}
      </div>
    </nav>
  );
}

