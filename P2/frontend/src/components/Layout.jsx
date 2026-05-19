import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

function SearchIcon() {
  return (
    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
    </svg>
  );
}

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

  const roleLabel = user?.role === 'instructor' ? '강사' : '수강생';
  const roleColor = user?.role === 'instructor' ? 'text-violet-500' : 'text-indigo-500';

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-5">
          {/* 로고 */}
          <Link
            to="/"
            className="text-xl font-extrabold shrink-0 bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
          >
            DevClass
          </Link>

          {/* 검색창 */}
          <form onSubmit={handleSearch} className="flex-1 max-w-md relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <SearchIcon />
            </span>
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="강의 검색..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white focus:border-transparent transition-all"
            />
          </form>

          {/* 네비 */}
          <nav className="flex items-center gap-1 text-sm shrink-0">
            <Link
              to="/courses"
              className="px-3 py-2 rounded-lg text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 font-medium transition-all"
            >
              강의 목록
            </Link>
            {user?.role === 'student' && (
              <Link
                to="/my-courses"
                className="px-3 py-2 rounded-lg text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 font-medium transition-all"
              >
                내 수강
              </Link>
            )}
            {user?.role === 'instructor' && (
              <Link
                to="/courses/new"
                className="ml-1 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 font-semibold transition-colors shadow-sm shadow-indigo-200"
              >
                + 강의 등록
              </Link>
            )}

            {/* 유저 정보 */}
            <div className="flex items-center gap-2.5 ml-2 pl-3 border-l border-gray-100">
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-sm">
                {user?.name?.[0]}
              </div>
              <div className="hidden sm:block leading-none">
                <div className="text-sm font-semibold text-gray-800">{user?.name}</div>
                <div className={`text-xs font-medium mt-0.5 ${roleColor}`}>{roleLabel}</div>
              </div>
              <button
                onClick={handleLogout}
                className="ml-1 text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 px-2 py-1 rounded-lg transition-all"
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