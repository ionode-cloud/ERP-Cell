import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/useAuth';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import Students from './pages/Students';
import Teachers from './pages/Teachers';
import Branches from './pages/Branches';
import Fees from './pages/Fees';
import Attendance from './pages/Attendance';
import MyFees from './pages/MyFees';
import MyAttendance from './pages/MyAttendance';
import CreateClass from './pages/CreateClass';
import Marks from './pages/Marks';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loading"><div className="spinner-lg" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/student-dashboard" element={<ProtectedRoute roles={['student']}><StudentDashboard /></ProtectedRoute>} />
        <Route path="/teacher-dashboard" element={<ProtectedRoute roles={['teacher']}><TeacherDashboard /></ProtectedRoute>} />
        <Route path="/students" element={<ProtectedRoute roles={['admin', 'teacher']}><Students /></ProtectedRoute>} />
        <Route path="/teachers" element={<ProtectedRoute roles={['admin']}><Teachers /></ProtectedRoute>} />
        <Route path="/branches" element={<ProtectedRoute roles={['admin']}><Branches /></ProtectedRoute>} />
        <Route path="/fees" element={<ProtectedRoute roles={['admin']}><Fees /></ProtectedRoute>} />
        <Route path="/attendance" element={<ProtectedRoute roles={['admin', 'teacher']}><Attendance /></ProtectedRoute>} />
        <Route path="/my-fees" element={<ProtectedRoute roles={['student']}><MyFees /></ProtectedRoute>} />
        <Route path="/my-attendance" element={<ProtectedRoute roles={['student']}><MyAttendance /></ProtectedRoute>} />
        <Route path="/create-class" element={<ProtectedRoute roles={['teacher']}><CreateClass /></ProtectedRoute>} />
        <Route path="/marks" element={<ProtectedRoute roles={['teacher', 'admin']}><Marks /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" toastOptions={{ duration: 3000, style: { borderRadius: '10px', background: '#1e293b', color: '#fff' } }} />
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
