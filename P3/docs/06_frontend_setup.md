# 프론트엔드 — 설정 & 진입점

---

## package.json

```json
{
  "name": "frontend",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "axios": "^1.13.6",
    "react": "^19.2.4",
    "react-dom": "^19.2.4",
    "react-router-dom": "^7.13.1"
  },
  "devDependencies": {
    "@eslint/js": "^9.39.4",
    "@tailwindcss/vite": "^4.2.2",
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^6.0.1",
    "eslint": "^9.39.4",
    "eslint-plugin-react-hooks": "^7.0.1",
    "eslint-plugin-react-refresh": "^0.5.2",
    "globals": "^17.4.0",
    "tailwindcss": "^4.2.2",
    "vite": "^8.0.1"
  }
}
```

---

## vite.config.js

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': 'http://localhost:8081',
    },
  },
})
```

> `/api`로 시작하는 모든 요청을 백엔드 `http://localhost:8081`로 프록시. 프론트엔드에서 `baseURL: '/api'`만 설정하면 됨.

---

## index.html

```html
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>DevClass</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

---

## src/main.jsx

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

---

## src/App.jsx — 라우팅

```jsx
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

// 로그인 필요
function RequireAuth({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

// 강사만 접근 가능
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
          {/* 인증 불필요 */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* 강의 시청 (Layout 없음, 전체화면) */}
          <Route
            path="/courses/:id/watch"
            element={<RequireAuth><CourseWatchPage /></RequireAuth>}
          />

          {/* Layout이 있는 페이지들 */}
          <Route element={<RequireAuth><Layout /></RequireAuth>}>
            <Route path="/" element={<MainPage />} />
            <Route path="/courses" element={<CourseListPage />} />
            <Route
              path="/courses/new"
              element={<RequireInstructor><CourseFormPage /></RequireInstructor>}
            />
            <Route path="/courses/:id" element={<CourseDetailPage />} />
            <Route
              path="/courses/:id/edit"
              element={<RequireInstructor><CourseFormPage /></RequireInstructor>}
            />
            <Route path="/my-courses" element={<MyCoursesPage />} />
            <Route
              path="/courses/:id/students"
              element={<RequireInstructor><CourseStudentsPage /></RequireInstructor>}
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
```

---

## src/api/client.js

```js
import axios from 'axios';

const client = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

export default client;
```

> `Content-Type: application/json`이 기본값. multipart 요청 시 해당 헤더를 `undefined`로 설정해야 axios가 자동으로 `multipart/form-data`를 붙임.

---

## src/api/auth.js

```js
import client from './client';

export const signup = (data) => client.post('/auth/signup', data);
export const login = (data) => client.post('/auth/login', data);
```

## src/api/courses.js

```js
import client from './client';

export const getCourses = (params) => client.get('/courses', { params });
export const getCourse = (id) => client.get(`/courses/${id}`);

// lectures: [{ title, orderIndex, file }]
export const createCourse = (data, lectures) => {
  const formData = new FormData();
  const { lectures: _omit, ...courseData } = data;
  const lecturesMeta = lectures.map(({ title, orderIndex }) => ({ title, orderIndex }));
  formData.append(
    'data',
    new Blob([JSON.stringify({ ...courseData, lectures: lecturesMeta })], { type: 'application/json' })
  );
  lectures.forEach(({ file, orderIndex }) => {
    if (file) formData.append(`video_${orderIndex}`, file);
  });
  return client.post('/courses', formData, {
    headers: { 'Content-Type': undefined },  // multipart/form-data 자동 설정
  });
};

export const updateCourse = (id, data) => client.put(`/courses/${id}`, data);
export const deleteCourse = (id, instructorId) =>
  client.delete(`/courses/${id}`, { params: { instructorId } });

export const getCourseStudents = (courseId, instructorId) =>
  client.get(`/courses/${courseId}/students`, { params: { instructorId } });
```

> `createCourse`에서 `headers: { 'Content-Type': undefined }`가 핵심. 기본 `application/json` 헤더를 제거해야 브라우저가 boundary 포함 multipart/form-data를 자동으로 설정.

## src/api/enrollments.js

```js
import client from './client';

export const createEnrollment = (data) => client.post('/enrollments', data);
export const deleteEnrollment = (enrollmentId) =>
  client.delete(`/enrollments/${enrollmentId}`);
export const getEnrollmentsByStudent = (studentId) =>
  client.get(`/enrollments/student/${studentId}`);
```

## src/api/progress.js

```js
import client from './client';

export const updateLectureProgress = (lectureId, data) =>
  client.put(`/progress/lectures/${lectureId}`, data);

export const getCourseProgress = (courseId, studentId) =>
  client.get(`/progress/courses/${courseId}`, { params: { studentId } });
```

## src/api/reviews.js

```js
import client from './client';

export const getReviews = (courseId) => client.get(`/courses/${courseId}/reviews`);
export const createReview = (courseId, data) => client.post(`/courses/${courseId}/reviews`, data);
export const updateReview = (courseId, reviewId, data) =>
  client.put(`/courses/${courseId}/reviews/${reviewId}`, data);
export const deleteReview = (courseId, reviewId, studentId) =>
  client.delete(`/courses/${courseId}/reviews/${reviewId}`, { params: { studentId } });
```

---

## src/context/AuthContext.jsx

```jsx
import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('devclass_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const saveUser = useCallback((userData) => {
    localStorage.setItem('devclass_user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('devclass_user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, saveUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
```

> `localStorage`의 `devclass_user` 키에 `{ id, email, name, role }` JSON 저장. 새로고침 후에도 로그인 유지.

---

## src/data/mockData.js

```js
export const CATEGORIES = [
  { label: '알고리즘/자료구조', value: '알고리즘/자료구조', icon: '🧮' },
  { label: '웹 개발', value: '웹 개발', icon: '🌐' },
  { label: '앱 개발', value: '앱 개발', icon: '📱' },
  { label: '데이터베이스', value: '데이터베이스', icon: '🗄️' },
  { label: 'AI/데이터', value: 'AI/데이터', icon: '🤖' },
  { label: 'DevOps', value: 'DevOps', icon: '⚙️' },
];
```

> `CATEGORIES`는 MainPage 카테고리 아이콘 버튼에서 사용. `MOCK_COURSES`, `MOCK_REVIEWS`, `MOCK_ENROLLMENTS`도 있지만 실제 앱에서는 API 응답을 사용.
