import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function Layout() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (keyword.trim()) {
      navigate(`/courses?keyword=${encodeURIComponent(keyword.trim())}`);
    }
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
            <Link to="/my-courses" className="text-gray-600 hover:text-indigo-600">내 수강</Link>
            <Link
              to="/courses/new"
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
            >
              강의 등록
            </Link>
          </nav>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
