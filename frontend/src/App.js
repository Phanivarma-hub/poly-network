import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import AdminRegister from './pages/AdminRegister';
import AdminLayout from './components/layouts/AdminLayout';
import AdminSettings from './pages/admin/AdminSettings';
import './App.css';

// Placeholder Dashboards
const AdminDashboardHome = () => <div className="p-20 text-white">Admin Dashboard Overview</div>;
const TeacherDashboard = () => <div className="p-20 text-white">Teacher Dashboard</div>;
const StudentDashboard = () => <div className="p-20 text-white">Student Dashboard</div>;

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register-college" element={<AdminRegister />} />

          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminLayout>
                  <Routes>
                    <Route index element={<AdminDashboardHome />} />
                    <Route path="settings" element={<AdminSettings />} />
                    <Route path="*" element={<div className="text-white">Module coming soon...</div>} />
                  </Routes>
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher/*"
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <TeacherDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/*"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
