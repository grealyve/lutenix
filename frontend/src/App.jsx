import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './App.css';

import { AuthProvider } from './context/AuthContext';

import ProtectedRoute from './components/ProtectedRoute';

import Layout from './components/Layout';
import Login from './pages/Login';
import Home from './pages/Home';

import SemgrepScans from './pages/semgrep/Scans';
import SemgrepFindings from './pages/semgrep/Findings';
import SemgrepDeployments from './pages/semgrep/Deployments';

import OwaspZapScans from './pages/owasp-zap/Scans';
import OwaspZapFindings from './pages/owasp-zap/Findings';
import OwaspZapReports from './pages/owasp-zap/Reports';
import OwaspZapGenerateReport from './pages/owasp-zap/GenerateReport';

import AcunetixAssets from './pages/acunetix/Assets';
import AcunetixScans from './pages/acunetix/Scans';
import AcunetixFindings from './pages/acunetix/Findings';
import AcunetixReports from './pages/acunetix/Reports';
import AcunetixGenerateReport from './pages/acunetix/GenerateReport';

import Settings from './pages/Settings';
import ProfileSettings from './pages/ProfileSettings';
import AdminPanel from './pages/AdminPanel';
import UserCreationPanel from './pages/UserCreationPanel';
import CompanyRelationPanel from './pages/CompanyRelationPanel';
import Help from './pages/Help';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              
              {/* Semgrep Routes */}
              <Route path="semgrep">
                <Route index element={<Navigate to="scans" replace />} />
                <Route path="scans" element={<SemgrepScans />} />
                <Route path="findings" element={<SemgrepFindings />} />
                <Route path="deployments" element={<SemgrepDeployments />} />
              </Route>
              
              {/* OWASP ZAP Routes */}
              <Route path="owasp-zap">
                <Route index element={<Navigate to="/owasp-zap/scans" replace />} />
                <Route path="scans" element={<OwaspZapScans />} />
                <Route path="findings" element={<OwaspZapFindings />} />
                <Route path="reports" element={<OwaspZapReports />} />
                <Route path="generate-report" element={<OwaspZapGenerateReport />} />
              </Route>
              
              {/* Acunetix Routes */}
              <Route path="acunetix">
                <Route index element={<Navigate to="/acunetix/scans" replace />} />
                <Route path="assets" element={<AcunetixAssets />} />
                <Route path="scans" element={<AcunetixScans />} />
                <Route path="findings" element={<AcunetixFindings />} />
                <Route path="reports" element={<AcunetixReports />} />
                <Route path="generate-report" element={<AcunetixGenerateReport />} />
              </Route>
              
              {/* Other Routes */}
              <Route path="settings" element={<Settings />} />
              <Route path="profile-settings" element={<ProfileSettings />} />
              <Route path="admin" element={<AdminPanel />} />
              <Route path="user-creation" element={<UserCreationPanel />} />
              <Route path="company-relation" element={<CompanyRelationPanel />} />
              <Route path="help" element={<Help />} />
            </Route>
          </Route>
          
          {/* Redirect any unknown routes to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
