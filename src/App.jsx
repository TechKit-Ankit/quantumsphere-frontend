import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuthContext } from './contexts/AuthContext.jsx'; // Custom Auth Context
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Leaves from './pages/Leaves';
import Profile from './pages/Profile';
import NotEnrolled from './pages/NotEnrolled';
import LandingPage from './pages/LandingPage';
import Auth from './pages/Auth';
import Departments from './pages/Departments';
import EnrollmentManagement from './pages/EnrollmentManagement';
import TimeTracking from './pages/TimeTracking';
import CompanyRegistration from './pages/CompanyRegistration';

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuthContext();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" />;
  }

  return children;
}

function AdminRoute({ children }) {
  const { isAuthenticated, isLoading, user } = useAuthContext();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" />;
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }

  return children;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/register-company" element={<CompanyRegistration />} />
          <Route path="/not-enrolled" element={<NotEnrolled />} />

          {/* Protected Routes with Layout */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="employees" element={<Employees />} />
            <Route path="leaves" element={<Leaves />} />
            <Route path="time-tracking" element={<TimeTracking />} />
            <Route path="profile" element={<Profile />} />
            <Route path="departments" element={<Departments />} />
            <Route path="enroll" element={
              <AdminRoute>
                <EnrollmentManagement />
              </AdminRoute>
            } />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
