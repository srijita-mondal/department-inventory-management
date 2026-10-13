import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { StoreProvider } from './context/StoreContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/layout/ProtectedRoute';

// Auth
import LoginPage from './components/auth/LoginPage';

// Admin pages
import Dashboard from './components/admin/Dashboard';
import InventoryPage from './components/admin/InventoryPage';
import AssetsPage from './components/admin/AssetsPage';
import StudentsPage from './components/admin/StudentsPage';
import IssuePage from './components/admin/IssuePage';
import ReturnsPage from './components/admin/ReturnsPage';
import RenewalsPage from './components/admin/RenewalsPage';
import OverduePage from './components/admin/OverduePage';
import TransactionsPage from './components/admin/TransactionsPage';
import AdjustmentsPage from './components/admin/AdjustmentsPage';
import ReportsPage from './components/admin/ReportsPage';

// Student pages
import StudentDashboard from './components/student/StudentDashboard';
import StudentIssuesPage from './components/student/StudentIssuesPage';
import StudentRenewalsPage from './components/student/StudentRenewalsPage';

import './styles/global.css';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <StoreProvider>
          <ToastProvider>
            <Routes>
              {/* Public */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<Navigate to="/login" replace />} />

              {/* Admin only routes */}
              <Route path="/admin" element={
                <ProtectedRoute requiredRole="admin">
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/admin/inventory" element={
                <ProtectedRoute requiredRole="admin">
                  <InventoryPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/assets" element={
                <ProtectedRoute requiredRole="admin">
                  <AssetsPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/students" element={
                <ProtectedRoute requiredRole="admin">
                  <StudentsPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/issues" element={
                <ProtectedRoute requiredRole="admin">
                  <IssuePage />
                </ProtectedRoute>
              } />
              <Route path="/admin/returns" element={
                <ProtectedRoute requiredRole="admin">
                  <ReturnsPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/renewals" element={
                <ProtectedRoute requiredRole="admin">
                  <RenewalsPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/overdue" element={
                <ProtectedRoute requiredRole="admin">
                  <OverduePage />
                </ProtectedRoute>
              } />
              <Route path="/admin/transactions" element={
                <ProtectedRoute requiredRole="admin">
                  <TransactionsPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/adjustments" element={
                <ProtectedRoute requiredRole="admin">
                  <AdjustmentsPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/reports" element={
                <ProtectedRoute requiredRole="admin">
                  <ReportsPage />
                </ProtectedRoute>
              } />

              {/* Student only routes */}
              <Route path="/student" element={
                <ProtectedRoute requiredRole="student">
                  <StudentDashboard />
                </ProtectedRoute>
              } />
              <Route path="/student/issues" element={
                <ProtectedRoute requiredRole="student">
                  <StudentIssuesPage />
                </ProtectedRoute>
              } />
              <Route path="/student/renewals" element={
                <ProtectedRoute requiredRole="student">
                  <StudentRenewalsPage />
                </ProtectedRoute>
              } />

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </ToastProvider>
        </StoreProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
