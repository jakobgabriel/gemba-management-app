import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './store/AuthContext.js';
import Layout from './components/layout/Layout.js';
import LoginPage from './pages/LoginPage.js';
import Level1Page from './pages/Level1Page.js';
import Level2Page from './pages/Level2Page.js';
import Level3Page from './pages/Level3Page.js';
import EscalationsPage from './pages/EscalationsPage.js';
import ResolutionPage from './pages/ResolutionPage.js';
import DashboardPage from './pages/DashboardPage.js';
import IssueHistoryPage from './pages/IssueHistoryPage.js';
import SafetyCrossPage from './pages/SafetyCrossPage.js';
import GembaWalkPage from './pages/GembaWalkPage.js';
import HandoverPage from './pages/HandoverPage.js';
import AnalyticsPage from './pages/AnalyticsPage.js';
import AdminConfigPage from './pages/AdminConfigPage.js';

function ProtectedRoute({ children, minLevel = 1 }: { children: React.ReactNode; minLevel?: number }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user && user.role_level < minLevel) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  const defaultRoute = user?.role === 'admin' ? '/admin/config' :
    user?.role_level === 1 ? '/level1' :
    user?.role_level === 2 ? '/level2' : '/level3';

  return (
    <Routes>
      <Route path="/login" element={<Navigate to={defaultRoute} replace />} />
      <Route element={<Layout />}>
        <Route path="/level1" element={<ProtectedRoute><Level1Page /></ProtectedRoute>} />
        <Route path="/level2" element={<ProtectedRoute minLevel={2}><Level2Page /></ProtectedRoute>} />
        <Route path="/level3" element={<ProtectedRoute minLevel={3}><Level3Page /></ProtectedRoute>} />
        <Route path="/escalations" element={<ProtectedRoute><EscalationsPage /></ProtectedRoute>} />
        <Route path="/resolution" element={<ProtectedRoute minLevel={2}><ResolutionPage /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute minLevel={2}><DashboardPage /></ProtectedRoute>} />
        <Route path="/issue-history" element={<ProtectedRoute minLevel={2}><IssueHistoryPage /></ProtectedRoute>} />
        <Route path="/safety-cross" element={<ProtectedRoute><SafetyCrossPage /></ProtectedRoute>} />
        <Route path="/gemba-walk" element={<ProtectedRoute minLevel={2}><GembaWalkPage /></ProtectedRoute>} />
        <Route path="/handover" element={<ProtectedRoute><HandoverPage /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute minLevel={2}><AnalyticsPage /></ProtectedRoute>} />
        <Route path="/admin/config" element={<ProtectedRoute minLevel={99}><AdminConfigPage /></ProtectedRoute>} />
      </Route>
      <Route path="/" element={<Navigate to={defaultRoute} replace />} />
      <Route path="*" element={<Navigate to={defaultRoute} replace />} />
    </Routes>
  );
}

export default function App() {
  return <AppRoutes />;
}
