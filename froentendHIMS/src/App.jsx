import { BrowserRouter, Routes, Route } from "react-router-dom";
import PatientRegister from "./component/PatientRegister.jsx";
import PatientList from "./component/PatientList.jsx";
import PatientUpdate from "./component/PatientUpdate.jsx";
import BillList from "./component/BillList.jsx";
import BillCreate from "./component/BillCreate.jsx";
import FinalBill from "./component/FinalBill.jsx";
import FinalBillReport from "./component/FinalBillReport.jsx";
import DepositPage from "./component/DepositPage.jsx";
import QueueManagement from "./component/QueueManagement.jsx";
import Navbar from "./component/Navbar.jsx";
import TemplateManager from "./component/TemplateManager.jsx";
import ReportsPage from "./component/ReportsPage.jsx";
import DoctorReports from "./component/DoctorReports.jsx";
import DepartmentWorklist from "./component/DepartmentWorklist.jsx";
// Discharge Summary
import DischargeTemplateManager from "./component/DischargeTemplateManager.jsx";
import DischargeSummaries from "./component/DischargeSummaries.jsx";

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<PatientRegister />} />
        <Route path="/view" element={<PatientList />} />
        <Route path="/update/:uhid" element={<PatientUpdate />} />

        <Route path="/billing" element={<BillList />} />
        <Route path="/billing/new" element={<BillCreate />} />
        <Route path="/billing/final" element={<FinalBill />} />
        <Route
          path="/billing/final/report/:finalNo"
          element={<FinalBillReport />}
        />
        <Route path="/billing/deposit" element={<DepositPage />} />
        <Route path="/queue" element={<QueueManagement />} />

        <Route path="/report-templates" element={<TemplateManager />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/doctor" element={<DoctorReports />} />
        <Route path="/department" element={<DepartmentWorklist />} />

        
        {/** Discharge Template */}
        <Route
          path="/discharge/templates"
          element={<DischargeTemplateManager />}
        />
        <Route
          path="/discharge/nurse"
          element={<DischargeSummaries role="NURSE" />}
        />
        <Route
          path="/discharge/doctor"
          element={<DischargeSummaries role="DOCTOR" />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
