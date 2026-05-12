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
