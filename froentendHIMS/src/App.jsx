import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import Navbar from "./component/Navbar.jsx";
import QueueManagement from "./component/QueueManagement.jsx";
import PatientRegister from "./component/PatientRegister.jsx";
import PatientList from "./component/PatientList.jsx";
import PatientUpdate from "./component/PatientUpdate.jsx";
import BillList from "./component/BillList.jsx";
import BillCreate from "./component/BillCreate.jsx";
import FinalBill from "./component/FinalBill.jsx";
import FinalBillReport from "./component/FinalBillReport.jsx";
import DepositPage from "./component/DepositPage.jsx";
import TemplateManager from "./component/TemplateManager.jsx";
import ReportsPage from "./component/ReportsPage.jsx";
import DoctorReports from "./component/DoctorReports.jsx";
import DepartmentWorklist from "./component/DepartmentWorklist.jsx";
import DischargeTemplateManager from "./component/DischargeTemplateManager.jsx";
import DischargeSummaries from "./component/DischargeSummaries.jsx";

// Layout that shows Navbar for staff screens
function StaffLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Staff screens with Navbar */}
        <Route element={<StaffLayout />}>
          <Route path="/" element={<PatientRegister />} />
          <Route path="/view" element={<PatientList />} />
          <Route path="/update/:uhid" element={<PatientUpdate />} />
          <Route path="/billing" element={<BillList />} />
          <Route path="/billing/new" element={<BillCreate />} />
          <Route path="/billing/final" element={<FinalBill />} />
          <Route path="/billing/final/report/:finalNo" element={<FinalBillReport />} />
          <Route path="/billing/deposit" element={<DepositPage />} />
          <Route path="/queue" element={<QueueManagement />} />
          <Route path="/report-templates" element={<TemplateManager />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/doctor" element={<DoctorReports />} />
          <Route path="/department" element={<DepartmentWorklist />} />
          <Route path="/discharge/templates" element={<DischargeTemplateManager />} />
          <Route path="/discharge/nurse" element={<DischargeSummaries role="NURSE" />} />
          <Route path="/discharge/doctor" element={<DischargeSummaries role="DOCTOR" />} />
        </Route>

        {/* Display-only queue: no Navbar */}
        <Route path="/queue-display/:employeeId" element={<QueueManagement />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;