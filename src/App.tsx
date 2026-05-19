/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { LogIn, Users, ClipboardList, CreditCard, AlertCircle, Info, Home, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Login from "./components/Login";
import AdminDashboard from "./components/AdminDashboard";
import GuardianDashboard from "./components/GuardianDashboard";

// Mock Auth State (will be replaced with real Firestore logic)
export default function App() {
  const [user, setUser] = useState<{ username: string; role: 'admin' | 'guardian', linkedSantriId?: string, linkedWa?: string, adminType?: 'putra' | 'putri' } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem("santriaf_user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = (userData: any) => {
    setUser(userData);
    localStorage.setItem("santriaf_user", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("santriaf_user");
  };

  if (loading) return <div className="flex h-screen items-center justify-center font-sans">Loading...</div>;

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login onLogin={login} />} />
          <Route
            path="/dashboard/*"
            element={
              user ? (
                user.role === "admin" ? (
                  <AdminDashboard user={user} onLogout={logout} />
                ) : (
                  <GuardianDashboard user={user} onLogout={logout} />
                )
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
}
