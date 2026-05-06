import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import api from "./services/api";

const App = () => {
  const [apiStatus, setApiStatus] = useState("Checking...");

  useEffect(() => {
    api
      .get("/health/")
      .then((response) => {
        setApiStatus("Connected");
        console.log("API Response:", response.data);
      })
      .catch((error) => {
        setApiStatus("Disconnected");
        console.error("API Error", error);
      });
  }, []);

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-600 to-purple-700">
              <div className="text-center bg-white p-8 rounded-lg shadow-xl">
                <h1 className="text-3xl font-bold text-gray-800">
                  Online Voting System
                </h1>
                <p className="mt-2 text-gray-600">
                  Backend Status: {apiStatus}
                </p>
                <div className="mt-4 text-sm text-gray-500">
                  <p>Backend URL: http://localhost:8000/api/</p>
                  <p>Frontend URL: http://localhost:5173</p>
                </div>
              </div>
            </div>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
