import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import MainPage from './pages/MainPage';
import CourseListPage from './pages/CourseListPage';
import CourseDetailPage from './pages/CourseDetailPage';
import CourseFormPage from './pages/CourseFormPage';
import MyCoursesPage from './pages/MyCoursesPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<MainPage />} />
          <Route path="/courses" element={<CourseListPage />} />
          <Route path="/courses/new" element={<CourseFormPage />} />
          <Route path="/courses/:id" element={<CourseDetailPage />} />
          <Route path="/courses/:id/edit" element={<CourseFormPage />} />
          <Route path="/my-courses" element={<MyCoursesPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
