import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signup } from '../api/auth';

export default function SignupPage() {
  const { saveUser } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: '', password: '', passwordConfirm: '', name: '', role: 'student',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (form.password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await signup({
        email: form.email.trim(),
        password: form.password,
        name: form.name.trim(),
        role: form.role,
      });
      saveUser(res.data.data);
      navigate('/', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message ?? '회원가입에 실패했습니다.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const isValid = form.email.trim() && form.password && form.passwordConfirm && form.name.trim();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-indigo-600 mb-2">DevClass</h1>
          <p className="text-gray-500 text-sm">새 계정을 만드세요</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">이름</label>
            <input
              type="text"
              value={form.name}
              onChange={set('name')}
              placeholder="홍길동"
              autoFocus
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">이메일</label>
            <input
              type="email"
              value={form.email}
              onChange={set('email')}
              placeholder="example@email.com"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">비밀번호</label>
            <input
              type="password"
              value={form.password}
              onChange={set('password')}
              placeholder="6자 이상"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">비밀번호 확인</label>
            <input
              type="password"
              value={form.passwordConfirm}
              onChange={set('passwordConfirm')}
              placeholder="비밀번호 재입력"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">역할</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'student', label: '수강생', icon: '📚' },
                { value: 'instructor', label: '강사', icon: '🎓' },
              ].map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, role: r.value }))}
                  className={`py-3 rounded-xl text-sm font-medium border-2 transition-all ${
                    form.role === r.value
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <span className="block text-lg mb-0.5">{r.icon}</span>
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !isValid}
            className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-40 transition-colors"
          >
            {loading ? '처리 중...' : '회원가입'}
          </button>

          <p className="text-center text-sm text-gray-500">
            이미 계정이 있으신가요?{' '}
            <Link to="/login" className="text-indigo-600 font-semibold hover:underline">
              로그인
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
