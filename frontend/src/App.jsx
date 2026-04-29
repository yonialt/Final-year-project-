import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedLayout from './components/ProtectedLayout';
import Login     from './pages/Login';
import Dashboard from './pages/Dashboard';
import Resources from './pages/Resources';
import Requests  from './pages/Requests';
import Maintenance from './pages/Maintenance';
import Analytics from './pages/Analytics';
import Users     from './pages/Users';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedLayout />}>
        <Route path="/dashboard"   element={<Dashboard />} />
        <Route path="/resources"   element={<Resources />} />
        <Route path="/requests"    element={<Requests />} />
        <Route path="/maintenance" element={<Maintenance />} />
        <Route path="/analytics"   element={<Analytics />} />
        <Route path="/users"       element={<Users />} />
      </Route>

      <Route path="/"  element={<Navigate to="/dashboard" replace />} />
      <Route path="*"  element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
