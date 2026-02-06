import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './components/ui/Toast';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/admin/Dashboard';
import { StaffManagement } from './pages/admin/StaffManagement';
import { ClientsManagement } from './pages/admin/ClientsManagement';
import { SitesManagement } from './pages/admin/SitesManagement';
import { JobsManagement } from './pages/admin/JobsManagement';
import { TasksManagement } from './pages/admin/TasksManagement';
import { IncidentsManagement } from './pages/admin/IncidentsManagement';
import { AssetsManagement } from './pages/admin/AssetsManagement';
import { ReportsPage } from './pages/admin/ReportsPage';
import { SettingsPage } from './pages/admin/SettingsPage';
import { StaffDashboard } from './pages/staff/StaffDashboard';
import { StaffJobDetail } from './pages/staff/StaffJobDetail';
import { ClientDashboard } from './pages/client/ClientDashboard';
import { ClientJobReport } from './pages/client/ClientJobReport';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <Layout>
                    <AdminDashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/staff"
              element={
                <ProtectedRoute requiredRole="admin">
                  <Layout>
                    <StaffManagement />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/clients"
              element={
                <ProtectedRoute requiredRole="admin">
                  <Layout>
                    <ClientsManagement />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/sites"
              element={
                <ProtectedRoute requiredRole="admin">
                  <Layout>
                    <SitesManagement />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/jobs"
              element={
                <ProtectedRoute requiredRole="admin">
                  <Layout>
                    <JobsManagement />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/tasks"
              element={
                <ProtectedRoute requiredRole="admin">
                  <Layout>
                    <TasksManagement />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/incidents"
              element={
                <ProtectedRoute requiredRole="admin">
                  <Layout>
                    <IncidentsManagement />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/assets"
              element={
                <ProtectedRoute requiredRole="admin">
                  <Layout>
                    <AssetsManagement />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/reports"
              element={
                <ProtectedRoute requiredRole="admin">
                  <Layout>
                    <ReportsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute requiredRole="admin">
                  <Layout>
                    <SettingsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/staff"
              element={
                <ProtectedRoute requiredRole="staff">
                  <Layout>
                    <StaffDashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/staff/jobs/:id"
              element={
                <ProtectedRoute requiredRole="staff">
                  <Layout>
                    <StaffJobDetail />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/client"
              element={
                <ProtectedRoute requiredRole="client">
                  <Layout>
                    <ClientDashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/client/jobs/:id"
              element={
                <ProtectedRoute requiredRole="client">
                  <Layout>
                    <ClientJobReport />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/"
              element={<Navigate to="/login" replace />}
            />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
