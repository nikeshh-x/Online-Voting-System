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
import AdminDashboardPage from "./pages/AdminDashboardPage";
import ResultsListPage from "./pages/ResultsListPage";

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

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <ProfilePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/elections"
          element={
            <PrivateRoute>
              <ElectionsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/elections/:id"
          element={
            <PrivateRoute>
              <ElectionDetailPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/results/:id"
          element={
            <PrivateRoute>
              <ResultsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/results"
          element={
            <PrivateRoute>
              <ResultsListPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <PrivateRoute>
              <AdminDashboardPage />
            </PrivateRoute>
          }
        />

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
