import { Router, Route } from './components/Router';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './components/ui/Toast';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/admin/Dashboard';
import { StaffManagement } from './pages/admin/StaffManagement';
import { SitesManagement } from './pages/admin/SitesManagement';
import { StaffDashboard } from './pages/staff/StaffDashboard';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <Router>
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
              path="/"
              element={<Login />}
            />
          </Router>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
