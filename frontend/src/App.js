import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/layouts/MainLayout';

// Auth pages
import Login from './pages/Login';
import AdminRegister from './pages/AdminRegister';
import StudentRegister from './pages/StudentRegister';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminSettings from './pages/admin/AdminSettings';
import ClassManagement from './pages/admin/ClassManagement';
import TeacherManagement from './pages/admin/TeacherManagement';
import TimetableManagement from './pages/admin/TimetableManagement';
import AttendanceOverview from './pages/admin/AttendanceOverview';
import ConcernsManagement from './pages/admin/ConcernsManagement';

// Teacher pages
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import AttendanceMarking from './pages/teacher/AttendanceMarking';
import TeacherQuizzes from './pages/teacher/TeacherQuizzes';
import TeacherMaterials from './pages/teacher/TeacherMaterials';
import TeacherTimetable from './pages/teacher/TeacherTimetable';
import StudentTracker from './pages/teacher/StudentTracker';

// Student pages
import StudentDashboard from './pages/student/StudentDashboard';
import StudentTimetable from './pages/student/StudentTimetable';
import StudentQuizzes from './pages/student/StudentQuizzes';
import StudentMaterials from './pages/student/StudentMaterials';
import StudentConcerns from './pages/student/StudentConcerns';

import './styles/styles.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register-college" element={<AdminRegister />} />
          <Route path="/register-student" element={<StudentRegister />} />

          {/* Admin routes */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <MainLayout>
                  <Routes>
                    <Route index element={<AdminDashboard />} />
                    <Route path="settings" element={<AdminSettings />} />
                    <Route path="classes" element={<ClassManagement />} />
                    <Route path="teachers" element={<TeacherManagement />} />
                    <Route path="timetables" element={<TimetableManagement />} />
                    <Route path="attendance" element={<AttendanceOverview />} />
                    <Route path="concerns" element={<ConcernsManagement />} />
                  </Routes>
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Teacher routes */}
          <Route
            path="/teacher/*"
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <MainLayout>
                  <Routes>
                    <Route index element={<TeacherDashboard />} />
                    <Route path="attendance" element={<AttendanceMarking />} />
                    <Route path="quizzes" element={<TeacherQuizzes />} />
                    <Route path="materials" element={<TeacherMaterials />} />
                    <Route path="timetable" element={<TeacherTimetable />} />
                    <Route path="tracker" element={<StudentTracker />} />
                  </Routes>
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Student routes */}
          <Route
            path="/student/*"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <MainLayout>
                  <Routes>
                    <Route index element={<StudentDashboard />} />
                    <Route path="timetable" element={<StudentTimetable />} />
                    <Route path="quizzes" element={<StudentQuizzes />} />
                    <Route path="materials" element={<StudentMaterials />} />
                    <Route path="concerns" element={<StudentConcerns />} />
                  </Routes>
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Redirects */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
