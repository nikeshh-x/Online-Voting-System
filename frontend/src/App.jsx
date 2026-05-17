import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import VerifyCitizenship from "./pages/VerifyCitizenship";
import RegisterForm from "./pages/RegisterForm";
import VerificationNotice from "./pages/VerificationNotice";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/verify-citizenship" element={<VerifyCitizenship />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/verification-notice" element={<VerificationNotice />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
      </Routes>
    </Router>
  );
}

export default App;

// Add this route
