import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { ResilienceIntelligencePage } from './pages/ResilienceIntelligencePage';
import { CommandCenterPage } from './pages/CommandCenterPage';
import { AlertsPage } from './pages/AlertsPage';
import { EndpointDetailPage } from './pages/EndpointDetailPage';
import { SettingsPage } from './pages/SettingsPage';
import { MalwareScannerPage } from './pages/MalwareScannerPage';
import { TeamManagementPage } from './pages/TeamManagementPage';
import { AddEndpointPage } from './pages/AddEndpointPage';
import { IncidentsPage } from './pages/IncidentsPage';
import AuditLogsPage from './pages/AuditLogsPage';
import { FleetCommandCenter } from './pages/FleetCommandCenter';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <CommandCenterPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/resilience"
            element={
              <ProtectedRoute>
                <ResilienceIntelligencePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/malware-scanner"
            element={
              <ProtectedRoute>
                <MalwareScannerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/alerts"
            element={
              <ProtectedRoute>
                <AlertsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/endpoints/:hostname"
            element={
              <ProtectedRoute>
                <EndpointDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/fleet"
            element={
              <ProtectedRoute>
                <FleetCommandCenter />
              </ProtectedRoute>
            }
          />
          <Route
            path="/snapshots"
            element={
              <ProtectedRoute>
                <FleetCommandCenter />
              </ProtectedRoute>
            }
          />
          <Route
            path="/fleet/endpoint/:hostname"
            element={
              <ProtectedRoute>
                <EndpointDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/team"
            element={
              <ProtectedRoute>
                <TeamManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/add-endpoint"
            element={
              <ProtectedRoute>
                <AddEndpointPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/incidents"
            element={
              <ProtectedRoute>
                <IncidentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/audit-logs"
            element={
              <ProtectedRoute>
                <AuditLogsPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
