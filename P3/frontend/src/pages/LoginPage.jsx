import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login } from '../api/auth';

export default function LoginPage() {
  const { saveUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname ?? '/';

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email.trim() || !form.password) return;
    setError('');
    setLoading(true);
    try {
      const res = await login({ email: form.email.trim(), password: form.password });
      saveUser(res.data.data);
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message ?? '로그인에 실패했습니다.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* 왼쪽 브랜딩 패널 */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 text-white flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/3" />

        <div className="relative">
          <Link to="/" className="text-2xl font-extrabold tracking-tight">DevClass</Link>
        </div>

        <div className="relative">
          <h2 className="text-4xl font-black leading-tight mb-4">
            배움의 시작,<br />
            <span className="text-indigo-200">DevClass와 함께</span>
          </h2>
          <p className="text-indigo-200 text-base leading-relaxed mb-10">
            수천 개의 IT 강의로 커리어를 성장시키세요.<br />
            알고리즘, 웹개발, AI/데이터, DevOps까지.
          </p>
          <div className="flex flex-col gap-4">
            {[
              { icon: '🚀', text: '1,000+ 전문 강의' },
              { icon: '🎯', text: '입문부터 고급까지' },
              { icon: '⭐', text: '평균 4.8점 강의 퀄리티' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <span className="text-xl">{icon}</span>
                <span className="text-indigo-100 text-sm font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-indigo-300 text-xs">
          © 2025 DevClass. All rights reserved.
        </div>
      </div>

      {/* 오른쪽 로그인 폼 */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 bg-gray-50">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8 lg:hidden">
            <Link to="/" className="text-2xl font-extrabold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              DevClass
            </Link>
          </div>
          <div className="mb-8">
            <h1 className="text-2xl font-extrabold text-gray-900 mb-1">로그인</h1>
            <p className="text-gray-500 text-sm">계속하려면 로그인하세요.</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">이메일</label>
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="example@email.com"
                autoFocus
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">비밀번호</label>
              <input
                type="password"
                value={form.password}
                onChange={set('password')}
                placeholder="비밀번호 입력"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                <span className="text-red-500 shrink-0">⚠</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !form.email.trim() || !form.password}
              className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-40 transition-colors shadow-sm shadow-indigo-200 text-sm"
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>

            <p className="text-center text-sm text-gray-500 pt-1">
              계정이 없으신가요?{' '}
              <Link to="/signup" className="text-indigo-600 font-bold hover:underline">
                회원가입
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}