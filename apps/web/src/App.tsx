import { Route, Routes } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { AttendanceOverviewPage } from './pages/AttendanceOverviewPage';
import { AttendancePage } from './pages/AttendancePage';
import { AddEmployeePage } from './pages/AddEmployeePage';
import { AddEmployeeSuccessPage } from './pages/AddEmployeeSuccessPage';
import { CreatePeriodPage } from './pages/CreatePeriodPage';
import { CreateTasksPage } from './pages/CreateTasksPage';
import { EditEmployeePage } from './pages/EditEmployeePage';
import { EditEmployeeSelectPage } from './pages/EditEmployeeSelectPage';
import { HomePage } from './pages/HomePage';
import { WorkReportPage } from './pages/WorkReportPage';

export default function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/employees/new" element={<AddEmployeePage />} />
        <Route path="/employees/new/success" element={<AddEmployeeSuccessPage />} />
        <Route path="/employees/edit" element={<EditEmployeeSelectPage />} />
        <Route path="/employees/:id/edit" element={<EditEmployeePage />} />
        <Route path="/attendance" element={<AttendanceOverviewPage />} />
        <Route path="/attendance/log" element={<AttendancePage />} />
        <Route path="/reports/work" element={<WorkReportPage />} />
        <Route path="/periods/new" element={<CreatePeriodPage />} />
        <Route path="/tasks/new" element={<CreateTasksPage />} />
      </Routes>
    </AppLayout>
  );
}
