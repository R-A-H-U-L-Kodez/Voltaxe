import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

// Eagerly load login/register for immediate access
import { LoginPage } from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Lazy load all other pages for code splitting
const CommandCenterPage = lazy(() => import('./pages/CommandCenterPage').then(m => ({ default: m.CommandCenterPage })));
const ResilienceIntelligencePage = lazy(() => import('./pages/ResilienceIntelligencePage').then(m => ({ default: m.ResilienceIntelligencePage })));
const AlertsPage = lazy(() => import('./pages/AlertsPage').then(m => ({ default: m.AlertsPage })));
const EndpointDetailPage = lazy(() => import('./pages/EndpointDetailPage').then(m => ({ default: m.EndpointDetailPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const MalwareScannerPage = lazy(() => import('./pages/MalwareScannerPage').then(m => ({ default: m.MalwareScannerPage })));
const TeamManagementPage = lazy(() => import('./pages/TeamManagementPage').then(m => ({ default: m.TeamManagementPage })));
const AddEndpointPage = lazy(() => import('./pages/AddEndpointPage').then(m => ({ default: m.AddEndpointPage })));
const IncidentsPage = lazy(() => import('./pages/IncidentsPage').then(m => ({ default: m.IncidentsPage })));
const AuditLogsPage = lazy(() => import('./pages/AuditLogsPage'));
const FleetCommandCenter = lazy(() => import('./pages/FleetCommandCenter').then(m => ({ default: m.FleetCommandCenter })));
const NetworkTrafficInspector = lazy(() => import('./pages/NetworkTrafficInspector'));

// Loading component
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-amber-400 mx-auto mb-4"></div>
      <p className="text-amber-400 font-semibold">Loading Voltaxe...</p>
    </div>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<LoadingFallback />}>
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
              path="/traffic"
              element={
                <ProtectedRoute>
                  <NetworkTrafficInspector />
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
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
