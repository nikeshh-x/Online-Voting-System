import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PrivateRoute from "./components/PrivateRoute";
import PublicRoute from "./components/PublicRoute";
import VerifyCitizenship from "./pages/VerifyCitizenship";
import RegisterForm from "./pages/RegisterForm";
import VerificationNotice from "./pages/VerificationNotice";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ProfilePage from "./pages/ProfilePage";
import ElectionsPage from "./pages/ElectionsPage";
import ElectionDetailPage from "./pages/ElectionDetailPage";
import ResultsPage from "./pages/ResultsPage";
import ResultsListPage from "./pages/ResultsListPage";
import VoteHistoryPage from "./pages/VoteHistoryPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AuditLogPage from "./pages/AuditLogPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminElections from "./pages/admin/AdminElections";
import VoterRoute from "./components/VoterRoute";
import AnalyticsDashboardPage from "./pages/AnalyticsDashboardPage";
import AdminCitizens from "./pages/admin/AdminCitizens";
import AdminCandidates from "./pages/admin/AdminCandidates";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/verify-citizenship"
          element={
            <PublicRoute>
              <VerifyCitizenship />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterForm />
            </PublicRoute>
          }
        />
        <Route
          path="/verification-notice"
          element={
            <PublicRoute>
              <VerificationNotice />
            </PublicRoute>
          }
        />
        <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
        <Route path="/admin-login" element={<AdminLoginPage />} />

        {/* Protected Routes - Regular Users */}
        <Route
          path="/dashboard"
          element={
            <VoterRoute>
              <DashboardPage />
            </VoterRoute>
          }
        />
        <Route
          path="/elections"
          element={
            <VoterRoute>
              <ElectionsPage />
            </VoterRoute>
          }
        />
        <Route
          path="/elections/:id"
          element={
            <VoterRoute>
              <ElectionDetailPage />
            </VoterRoute>
          }
        />
        <Route
          path="/results/:id"
          element={
            <VoterRoute>
              <ResultsPage />
            </VoterRoute>
          }
        />
        <Route
          path="/results"
          element={
            <VoterRoute>
              <ResultsListPage />
            </VoterRoute>
          }
        />
        <Route
          path="/vote-history"
          element={
            <VoterRoute>
              <VoteHistoryPage />
            </VoterRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <VoterRoute>
              <ProfilePage />
            </VoterRoute>
          }
        />

        {/* Admin Routes - New Dedicated Admin Dashboard */}
        <Route
          path="/admin"
          element={
            <PrivateRoute requireAdmin={true}>
              <AdminDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/elections"
          element={
            <PrivateRoute requireAdmin={true}>
              <AdminElections />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/citizens"
          element={
            <PrivateRoute requireAdmin={true}>
              <AdminCitizens />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/elections/:electionId/candidates"
          element={
            <PrivateRoute requireAdmin={true}>
              <AdminCandidates />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/audit-logs"
          element={
            <PrivateRoute requireAdmin={true}>
              <AuditLogPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <PrivateRoute requireAdmin={true}>
              <AnalyticsDashboardPage />
            </PrivateRoute>
          }
        />

        {/* Backup Admin Route (Old Dashboard) */}
        <Route
          path="/admin-old"
          element={
            <PrivateRoute requireAdmin={true}>
              <AdminDashboardPage />
            </PrivateRoute>
          }
        />

        {/* Default Route */}
        <Route
          path="/"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
