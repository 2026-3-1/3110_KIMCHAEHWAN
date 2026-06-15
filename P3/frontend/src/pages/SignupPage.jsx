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
            지금 시작하세요,<br />
            <span className="text-indigo-200">당신의 성장 여정</span>
          </h2>
          <p className="text-indigo-200 text-base leading-relaxed mb-10">
            수강생으로 학습을 시작하거나<br />
            강사로 지식을 공유해보세요.
          </p>
          <div className="flex flex-col gap-4">
            {[
              { icon: '📚', label: '수강생', desc: '원하는 강의를 마음껏 수강' },
              { icon: '🎓', label: '강사', desc: '나만의 강의를 만들고 수익 창출' },
            ].map(({ icon, label, desc }) => (
              <div key={label} className="flex items-center gap-4 bg-white/10 rounded-xl p-4 border border-white/10">
                <span className="text-2xl">{icon}</span>
                <div>
                  <div className="font-bold text-white text-sm">{label}</div>
                  <div className="text-indigo-200 text-xs">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-indigo-300 text-xs">
          © 2025 DevClass. All rights reserved.
        </div>
      </div>

      {/* 오른쪽 회원가입 폼 */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 bg-gray-50 overflow-y-auto">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8 lg:hidden">
            <Link to="/" className="text-2xl font-extrabold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              DevClass
            </Link>
          </div>
          <div className="mb-8">
            <h1 className="text-2xl font-extrabold text-gray-900 mb-1">회원가입</h1>
            <p className="text-gray-500 text-sm">새 계정을 만드세요.</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">이름</label>
              <input
                type="text"
                value={form.name}
                onChange={set('name')}
                placeholder="홍길동"
                autoFocus
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">이메일</label>
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="example@email.com"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">비밀번호</label>
              <input
                type="password"
                value={form.password}
                onChange={set('password')}
                placeholder="6자 이상"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">비밀번호 확인</label>
              <input
                type="password"
                value={form.passwordConfirm}
                onChange={set('passwordConfirm')}
                placeholder="비밀번호 재입력"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">역할</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'student', label: '수강생', icon: '📚', desc: '강의 수강' },
                  { value: 'instructor', label: '강사', icon: '🎓', desc: '강의 제작' },
                ].map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, role: r.value }))}
                    className={`py-3.5 rounded-xl text-sm border-2 transition-all ${
                      form.role === r.value
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-100'
                        : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'
                    }`}
                  >
                    <span className="block text-xl mb-1">{r.icon}</span>
                    <span className="font-semibold">{r.label}</span>
                    <span className="block text-xs mt-0.5 opacity-70">{r.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                <span className="text-red-500 shrink-0">⚠</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !isValid}
              className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-40 transition-colors shadow-sm shadow-indigo-200 text-sm"
            >
              {loading ? '처리 중...' : '회원가입'}
            </button>

            <p className="text-center text-sm text-gray-500 pt-1">
              이미 계정이 있으신가요?{' '}
              <Link to="/login" className="text-indigo-600 font-bold hover:underline">
                로그인
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}