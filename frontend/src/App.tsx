import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Footer } from './components/Footer';

// Pages
import { LandingPage } from './pages/LandingPage';
import { SetupPage } from './pages/SetupPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminCreators } from './pages/AdminCreators';
import { AdminPlatforms } from './pages/AdminPlatforms';
import { AdminSettings } from './pages/AdminSettings';
import { AdminAuditLogs } from './pages/AdminAuditLogs';
import { UserManagementPage } from './pages/UserManagementPage';

import { CreatorDashboard } from './pages/CreatorDashboard';
import { AssessmentsList } from './pages/AssessmentsList';
import { AssessmentBuilder } from './pages/AssessmentBuilder';
import { QuestionBankPage } from './pages/QuestionBankPage';
import { CodingProblemEditor } from './pages/CodingProblemEditor';
import { LiveMonitoringPage } from './pages/LiveMonitoringPage';
import { ResultsPage } from './pages/ResultsPage';
import { ViolationsReviewPage } from './pages/ViolationsReviewPage';
import { AttenderDashboard } from './pages/AttenderDashboard';
import { AssessmentInstructions } from './pages/AssessmentInstructions';
import { SystemCheckPage } from './pages/SystemCheckPage';
import { AssessmentRoom } from './pages/AssessmentRoom';
import { ResultSummaryPage } from './pages/ResultSummaryPage';
import { SuspensionScreen } from './pages/SuspensionScreen';
import { ReattemptRequestPage } from './pages/ReattemptRequestPage';
import { ProfilePage } from './pages/ProfilePage';
import { CertificateVerificationPage } from './pages/CertificateVerificationPage';

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({
  children,
  allowedRoles
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#070a13] text-slate-500 dark:text-slate-400 font-mono text-xs">
        Authenticating session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'PORTAL_ADMIN') return <Navigate to="/portal-admin" replace />;
    if (user.role === 'TEST_CREATOR') return <Navigate to="/creator" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Smart Settings Route Redirector
const SettingsRedirect: React.FC = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'PORTAL_ADMIN') return <Navigate to="/portal-admin/settings" replace />;
  return <Navigate to="/profile" replace />;
};

// Layout with Nav & Sidebar
const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#070a13] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <Navbar />
      <div className="flex-1 flex">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
      <Footer />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route
            path="/"
            element={
              <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#070a13] text-slate-900 dark:text-slate-100 transition-colors duration-200">
                <Navbar />
                <main className="flex-1">
                  <LandingPage />
                </main>
                <Footer />
              </div>
            }
          />
          <Route
            path="/setup"
            element={
              <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#070a13] text-slate-900 dark:text-slate-100 transition-colors duration-200">
                <Navbar />
                <main className="flex-1">
                  <SetupPage />
                </main>
                <Footer />
              </div>
            }
          />
          <Route
            path="/login"
            element={
              <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#070a13] text-slate-900 dark:text-slate-100 transition-colors duration-200">
                <Navbar />
                <main className="flex-1">
                  <LoginPage />
                </main>
                <Footer />
              </div>
            }
          />
          <Route
            path="/register"
            element={
              <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#070a13] text-slate-900 dark:text-slate-100 transition-colors duration-200">
                <Navbar />
                <main className="flex-1">
                  <RegisterPage />
                </main>
                <Footer />
              </div>
            }
          />
          <Route
            path="/verify/:certificateId"
            element={
              <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#070a13] text-slate-900 dark:text-slate-100 transition-colors duration-200">
                <Navbar />
                <main className="flex-1">
                  <CertificateVerificationPage />
                </main>
                <Footer />
              </div>
            }
          />

          {/* Portal Admin Routes */}
          <Route
            path="/portal-admin"
            element={
              <ProtectedRoute allowedRoles={['PORTAL_ADMIN']}>
                <DashboardLayout>
                  <AdminDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/portal-admin/users"
            element={
              <ProtectedRoute allowedRoles={['PORTAL_ADMIN']}>
                <DashboardLayout>
                  <UserManagementPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/portal-admin/creators"
            element={
              <ProtectedRoute allowedRoles={['PORTAL_ADMIN']}>
                <DashboardLayout>
                  <AdminCreators />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/portal-admin/platforms"
            element={
              <ProtectedRoute allowedRoles={['PORTAL_ADMIN']}>
                <DashboardLayout>
                  <AdminPlatforms />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/portal-admin/settings"
            element={
              <ProtectedRoute allowedRoles={['PORTAL_ADMIN']}>
                <DashboardLayout>
                  <AdminSettings />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/portal-admin/proctoring"
            element={
              <ProtectedRoute allowedRoles={['PORTAL_ADMIN']}>
                <DashboardLayout>
                  <AdminSettings />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/portal-admin/audit-logs"
            element={
              <ProtectedRoute allowedRoles={['PORTAL_ADMIN']}>
                <DashboardLayout>
                  <AdminAuditLogs />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Test Creator Routes */}
          <Route
            path="/creator"
            element={
              <ProtectedRoute allowedRoles={['TEST_CREATOR', 'PORTAL_ADMIN']}>
                <DashboardLayout>
                  <CreatorDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/creator/assessments"
            element={
              <ProtectedRoute allowedRoles={['TEST_CREATOR', 'PORTAL_ADMIN']}>
                <DashboardLayout>
                  <AssessmentsList />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/creator/assessments/create"
            element={
              <ProtectedRoute allowedRoles={['TEST_CREATOR', 'PORTAL_ADMIN']}>
                <DashboardLayout>
                  <AssessmentBuilder />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/creator/question-bank"
            element={
              <ProtectedRoute allowedRoles={['TEST_CREATOR', 'PORTAL_ADMIN']}>
                <DashboardLayout>
                  <QuestionBankPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/creator/coding"
            element={
              <ProtectedRoute allowedRoles={['TEST_CREATOR', 'PORTAL_ADMIN']}>
                <DashboardLayout>
                  <CodingProblemEditor />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/creator/live-monitoring"
            element={
              <ProtectedRoute allowedRoles={['TEST_CREATOR', 'PORTAL_ADMIN']}>
                <DashboardLayout>
                  <LiveMonitoringPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/creator/results"
            element={
              <ProtectedRoute allowedRoles={['TEST_CREATOR', 'PORTAL_ADMIN']}>
                <DashboardLayout>
                  <ResultsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/creator/violations"
            element={
              <ProtectedRoute allowedRoles={['TEST_CREATOR', 'PORTAL_ADMIN']}>
                <DashboardLayout>
                  <ViolationsReviewPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Test Attender / Candidate Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['TEST_ATTENDER', 'TEST_CREATOR', 'PORTAL_ADMIN']}>
                <DashboardLayout>
                  <AttenderDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/assessment/:id/instructions"
            element={
              <ProtectedRoute>
                <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#070a13] text-slate-900 dark:text-slate-100 transition-colors duration-200">
                  <Navbar />
                  <main className="flex-1">
                    <AssessmentInstructions />
                  </main>
                  <Footer />
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/assessment/:id/system-check"
            element={
              <ProtectedRoute>
                <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#070a13] text-slate-900 dark:text-slate-100 transition-colors duration-200">
                  <Navbar />
                  <main className="flex-1">
                    <SystemCheckPage />
                  </main>
                  <Footer />
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/assessment/:id/attempt"
            element={
              <ProtectedRoute>
                <AssessmentRoom />
              </ProtectedRoute>
            }
          />
          <Route
            path="/assessment/:id/result"
            element={
              <ProtectedRoute>
                <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#070a13] text-slate-900 dark:text-slate-100 transition-colors duration-200">
                  <Navbar />
                  <main className="flex-1">
                    <ResultSummaryPage />
                  </main>
                  <Footer />
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/assessment/:id/suspended"
            element={
              <ProtectedRoute>
                <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#070a13] text-slate-900 dark:text-slate-100 transition-colors duration-200">
                  <Navbar />
                  <main className="flex-1">
                    <SuspensionScreen />
                  </main>
                  <Footer />
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/assessment/:id/reattempt"
            element={
              <ProtectedRoute>
                <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#070a13] text-slate-900 dark:text-slate-100 transition-colors duration-200">
                  <Navbar />
                  <main className="flex-1">
                    <ReattemptRequestPage />
                  </main>
                  <Footer />
                </div>
              </ProtectedRoute>
            }
          />

          {/* User Profile & Account Settings Route */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <ProfilePage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Global /settings Route */}
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsRedirect />
              </ProtectedRoute>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </ThemeProvider>
  );
};
