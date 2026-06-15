import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminLogin, initAdmin } from '../api/admin';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', adminCode: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [initMsg, setInitMsg] = useState('');
  const [initLoading, setInitLoading] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await adminLogin(form);
      const { token, ...user } = res.data.data;
      localStorage.setItem('admin_token', token);
      localStorage.setItem('admin_user', JSON.stringify(user));
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message ?? '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleInit = async () => {
    if (!form.adminCode) {
      setInitMsg('관리자 코드를 먼저 입력하세요.');
      return;
    }
    setInitLoading(true);
    setInitMsg('');
    try {
      const res = await initAdmin(form.adminCode);
      setInitMsg(res.data.data);
    } catch (err) {
      setInitMsg(err.response?.data?.message ?? '초기화에 실패했습니다.');
    } finally {
      setInitLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-red-600 rounded-2xl mb-4">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">관리자 포털</h1>
          <p className="text-gray-400 text-sm mt-1">DevClass Admin</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-800 rounded-2xl p-8 space-y-4 border border-gray-700">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">이메일</label>
            <input
              type="email"
              value={form.email}
              onChange={set('email')}
              placeholder="admin@devclass.com"
              autoFocus
              className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">비밀번호</label>
            <input
              type="password"
              value={form.password}
              onChange={set('password')}
              placeholder="비밀번호"
              className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">관리자 코드</label>
            <input
              type="password"
              value={form.adminCode}
              onChange={set('adminCode')}
              placeholder="관리자 전용 코드"
              className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          {error && (
            <div className="bg-red-900/40 border border-red-700 text-red-300 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !form.email || !form.password || !form.adminCode}
            className="w-full bg-red-600 text-white py-3.5 rounded-xl font-bold hover:bg-red-700 disabled:opacity-40 transition-colors text-sm"
          >
            {loading ? '인증 중...' : '관리자 로그인'}
          </button>
        </form>

        <div className="mt-6 bg-gray-800/50 border border-gray-700 rounded-xl p-4">
          <p className="text-gray-500 text-xs mb-2">처음 사용 시 관리자 계정을 초기화하세요.</p>
          {initMsg && (
            <p className="text-xs mb-2 text-yellow-400">{initMsg}</p>
          )}
          <button
            type="button"
            onClick={handleInit}
            disabled={initLoading}
            className="w-full text-xs text-gray-400 border border-gray-600 rounded-lg py-2 hover:border-gray-400 hover:text-white transition-colors disabled:opacity-40"
          >
            {initLoading ? '초기화 중...' : '관리자 계정 초기화 (admin@devclass.com / admin1234)'}
          </button>
        </div>

        <p className="text-center text-gray-600 text-xs mt-4">
          일반 사용자는 <a href="/login" className="text-gray-400 hover:text-white">여기</a>에서 로그인하세요.
        </p>
      </div>
    </div>
  );
}
