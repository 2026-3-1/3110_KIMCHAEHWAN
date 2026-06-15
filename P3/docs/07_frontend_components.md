# 프론트엔드 — 공통 컴포넌트

---

## src/components/Layout.jsx

네비게이션 헤더 + `<Outlet />` 구조. `RequireAuth`로 감싸진 모든 페이지에서 사용.

```jsx
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [keyword, setKeyword] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (keyword.trim()) {
      navigate(`/courses?keyword=${encodeURIComponent(keyword.trim())}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-6">
          <Link to="/" className="text-xl font-bold text-indigo-600 shrink-0">
            DevClass
          </Link>
          <form onSubmit={handleSearch} className="flex-1 max-w-lg">
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="강의 검색..."
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </form>
          <nav className="flex items-center gap-4 text-sm shrink-0">
            <Link to="/courses" className="text-gray-600 hover:text-indigo-600">강의 목록</Link>
            {user?.role === 'student' && (
              <Link to="/my-courses" className="text-gray-600 hover:text-indigo-600">내 수강</Link>
            )}
            {user?.role === 'instructor' && (
              <Link
                to="/courses/new"
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
              >
                강의 등록
              </Link>
            )}
            <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
              <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-xs shrink-0">
                {user?.name?.[0]}
              </div>
              <span className="text-gray-700 text-sm font-medium">{user?.name}</span>
              <span className="text-xs text-gray-400">
                {user?.role === 'instructor' ? '강사' : '수강생'}
              </span>
              <button
                onClick={handleLogout}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors ml-1"
              >
                로그아웃
              </button>
            </div>
          </nav>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
```

**헤더 요소:**
- 로고 (DevClass) — `/` 링크
- 검색 인풋 — Enter 시 `/courses?keyword=...` 이동
- 강의 목록 링크
- 학생: 내 수강 링크 / 강사: 강의 등록 버튼
- 아바타 + 이름 + 역할 표시 + 로그아웃 버튼

---

## src/components/CourseCard.jsx

강의 카드 — CourseListPage, MainPage에서 사용.

```jsx
import { Link } from 'react-router-dom';

const LEVEL_LABEL = { beginner: '입문', intermediate: '중급', advanced: '고급' };
const LEVEL_COLOR = {
  beginner: 'bg-green-100 text-green-700',
  intermediate: 'bg-yellow-100 text-yellow-700',
  advanced: 'bg-red-100 text-red-700',
};

export default function CourseCard({ course, isEnrolled = false }) {
  return (
    <Link
      to={`/courses/${course.id}`}
      className="block bg-white rounded-2xl border border-gray-200 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden group relative"
    >
      {/* 수강 중 배지 */}
      {isEnrolled && (
        <div className="absolute top-2 right-2 z-10 bg-green-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full shadow">
          수강 중
        </div>
      )}

      {/* 썸네일 */}
      <div className="aspect-video bg-gray-100 overflow-hidden">
        {course.thumbnailUrl ? (
          <img
            src={course.thumbnailUrl}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">📖</div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-xs text-indigo-600 font-medium">{course.category}</span>
          <span className="text-gray-300">·</span>
          <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${LEVEL_COLOR[course.level]}`}>
            {LEVEL_LABEL[course.level] ?? course.level}
          </span>
        </div>

        <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-1 leading-snug group-hover:text-indigo-600 transition-colors">
          {course.title}
        </h3>

        <p className="text-xs text-gray-400 mb-3">{course.instructorName}</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="text-yellow-400 text-xs">★</span>
            <span className="text-xs font-semibold text-gray-800">
              {course.averageRating?.toFixed(1) ?? '-'}
            </span>
            <span className="text-xs text-gray-400">
              ({course.enrollmentCount?.toLocaleString()})
            </span>
          </div>
          <span className={`text-sm font-bold ${course.price === 0 ? 'text-indigo-600' : 'text-gray-900'}`}>
            {course.price === 0 ? '무료' : `${course.price.toLocaleString()}원`}
          </span>
        </div>
      </div>
    </Link>
  );
}
```

**Props:**
- `course` — CourseResponse 객체
- `isEnrolled` — `true`이면 우측 상단에 "수강 중" 초록 배지 표시

**레이아웃:** 썸네일(aspect-video) + 카테고리/난이도 태그 + 제목 + 강사명 + 평점/수강생수/가격
