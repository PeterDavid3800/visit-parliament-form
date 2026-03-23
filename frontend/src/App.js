import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import VisitForm from "./components/VisitForm";
import AdminDashboard from "./components/AdminDashboard";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<VisitForm />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;