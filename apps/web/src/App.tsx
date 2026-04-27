import { Route, Routes } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { HomePage } from './pages/HomePage';
import { AddEmployeePage } from './pages/AddEmployeePage';
import { AddEmployeeSuccessPage } from './pages/AddEmployeeSuccessPage';
import { EditEmployeeSelectPage } from './pages/EditEmployeeSelectPage';
import { EditEmployeePage } from './pages/EditEmployeePage';

export default function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/employees/new" element={<AddEmployeePage />} />
        <Route path="/employees/new/success" element={<AddEmployeeSuccessPage />} />
        <Route path="/employees/edit" element={<EditEmployeeSelectPage />} />
        <Route path="/employees/:id/edit" element={<EditEmployeePage />} />
      </Routes>
    </AppLayout>
  );
}
