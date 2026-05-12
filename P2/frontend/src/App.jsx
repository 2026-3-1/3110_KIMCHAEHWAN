import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import MainPage from './pages/MainPage';
import CourseListPage from './pages/CourseListPage';
import CourseDetailPage from './pages/CourseDetailPage';
import CourseFormPage from './pages/CourseFormPage';
import MyCoursesPage from './pages/MyCoursesPage';
import CourseWatchPage from './pages/CourseWatchPage';
import CourseStudentsPage from './pages/CourseStudentsPage';

function RequireAuth({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

function RequireInstructor({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (user.role !== 'instructor') {
    return <Navigate to="/courses" replace />;
  }
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route
            path="/courses/:id/watch"
            element={
              <RequireAuth>
                <CourseWatchPage />
              </RequireAuth>
            }
          />
          <Route
            element={
              <RequireAuth>
                <Layout />
              </RequireAuth>
            }
          >
            <Route path="/" element={<MainPage />} />
            <Route path="/courses" element={<CourseListPage />} />
            <Route
              path="/courses/new"
              element={
                <RequireInstructor>
                  <CourseFormPage />
                </RequireInstructor>
              }
            />
            <Route path="/courses/:id" element={<CourseDetailPage />} />
            <Route
              path="/courses/:id/edit"
              element={
                <RequireInstructor>
                  <CourseFormPage />
                </RequireInstructor>
              }
            />
            <Route path="/my-courses" element={<MyCoursesPage />} />
            <Route
              path="/courses/:id/students"
              element={
                <RequireInstructor>
                  <CourseStudentsPage />
                </RequireInstructor>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
