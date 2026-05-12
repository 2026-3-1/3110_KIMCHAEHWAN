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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-indigo-600 mb-2">DevClass</h1>
          <p className="text-gray-500 text-sm">계정에 로그인하세요</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">이메일</label>
            <input
              type="email"
              value={form.email}
              onChange={set('email')}
              placeholder="example@email.com"
              autoFocus
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">비밀번호</label>
            <input
              type="password"
              value={form.password}
              onChange={set('password')}
              placeholder="비밀번호 입력"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !form.email.trim() || !form.password}
            className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-40 transition-colors"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>

          <p className="text-center text-sm text-gray-500">
            계정이 없으신가요?{' '}
            <Link to="/signup" className="text-indigo-600 font-semibold hover:underline">
              회원가입
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
