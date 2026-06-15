import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const MainPage = lazy(() => import('./pages/MainPage'));
const CourseListPage = lazy(() => import('./pages/CourseListPage'));
const CourseDetailPage = lazy(() => import('./pages/CourseDetailPage'));
const CourseFormPage = lazy(() => import('./pages/CourseFormPage'));
const MyCoursesPage = lazy(() => import('./pages/MyCoursesPage'));
const CourseWatchPage = lazy(() => import('./pages/CourseWatchPage'));
const CourseStudentsPage = lazy(() => import('./pages/CourseStudentsPage'));
const InstructorDashboardPage = lazy(() => import('./pages/InstructorDashboardPage'));
const PaymentPage = lazy(() => import('./pages/PaymentPage').then((m) => ({ default: m.PaymentPage })));
const PaymentSuccessPage = lazy(() => import('./pages/PaymentPage').then((m) => ({ default: m.PaymentSuccessPage })));
const PaymentFailPage = lazy(() => import('./pages/PaymentPage').then((m) => ({ default: m.PaymentFailPage })));
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const CourseQnaPage = lazy(() => import('./pages/CourseQnaPage'));

function PageSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
    </div>
  );
}

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
        <Suspense fallback={<PageSpinner />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route
              path="/courses/:id/watch"
              element={
                <RequireAuth>
                  <CourseWatchPage />
                </RequireAuth>
              }
            />
            <Route
              path="/payment/:id"
              element={
                <RequireAuth>
                  <PaymentPage />
                </RequireAuth>
              }
            />
            <Route path="/payment/success" element={<PaymentSuccessPage />} />
            <Route path="/payment/fail" element={<PaymentFailPage />} />
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
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/courses/:id/qna" element={<CourseQnaPage />} />
              <Route
                path="/my-dashboard"
                element={
                  <RequireInstructor>
                    <InstructorDashboardPage />
                  </RequireInstructor>
                }
              />
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
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
