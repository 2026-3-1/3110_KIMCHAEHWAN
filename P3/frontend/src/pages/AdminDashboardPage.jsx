import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminDashboard, getAdminUsers, deleteAdminUser, getRefundPolicy, updateRefundPolicy } from '../api/admin';

function useAdminAuth() {
  const navigate = useNavigate();
  const token = localStorage.getItem('admin_token');
  useEffect(() => {
    if (!token) navigate('/admin/login', { replace: true });
  }, [token, navigate]);
  return token;
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  useAdminAuth();

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [threshold, setThreshold] = useState(30);
  const [thresholdInput, setThresholdInput] = useState(30);
  const [thresholdSaved, setThresholdSaved] = useState(false);

  useEffect(() => {
    Promise.all([getAdminDashboard(), getAdminUsers(), getRefundPolicy()])
      .then(([dashRes, usersRes, refundRes]) => {
        setStats(dashRes.data.data);
        setUsers(usersRes.data.data);
        const t = refundRes.data.data.threshold;
        setThreshold(t);
        setThresholdInput(t);
      })
      .catch(() => navigate('/admin/login', { replace: true }))
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleSaveThreshold = async () => {
    try {
      await updateRefundPolicy(Number(thresholdInput));
      setThreshold(Number(thresholdInput));
      setThresholdSaved(true);
      setTimeout(() => setThresholdSaved(false), 2000);
    } catch {
      alert('저장에 실패했습니다.');
    }
  };

  const handleDelete = async (userId, name) => {
    if (!window.confirm(`'${name}' 회원을 삭제하시겠습니까?`)) return;
    try {
      await deleteAdminUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      alert(err.response?.data?.message ?? '삭제에 실패했습니다.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    navigate('/admin/login', { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-red-800 border-t-red-500 rounded-full animate-spin" />
      </div>
    );
  }

  const ROLE_LABEL = { student: '수강생', instructor: '강사', admin: '관리자' };
  const ROLE_COLOR = { student: 'bg-blue-900 text-blue-300', instructor: 'bg-green-900 text-green-300', admin: 'bg-red-900 text-red-300' };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* 헤더 */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <span className="font-bold text-lg">DevClass 관리자</span>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          로그아웃
        </button>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* 통계 카드 */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
            {[
              { label: '전체 회원', value: stats.totalUsers, color: 'text-white' },
              { label: '수강생', value: stats.students, color: 'text-blue-400' },
              { label: '강사', value: stats.instructors, color: 'text-green-400' },
              { label: '강의 수', value: stats.totalCourses, color: 'text-yellow-400' },
              { label: '수강 신청', value: stats.totalEnrollments, color: 'text-purple-400' },
            ].map((s) => (
              <div key={s.label} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <p className="text-gray-400 text-xs mb-1">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value?.toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}

        {/* 환불 정책 설정 */}
        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 mb-6">
          <h2 className="font-bold text-lg mb-1">환불 정책</h2>
          <p className="text-gray-400 text-sm mb-4">강의 진행률이 기준 미만일 때만 환불 가능합니다.</p>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <input
                type="range"
                min="0"
                max="100"
                value={thresholdInput}
                onChange={(e) => setThresholdInput(e.target.value)}
                className="w-full accent-orange-500"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0%</span>
                <span className="text-orange-400 font-bold">{thresholdInput}% 미만이면 환불 가능</span>
                <span>100%</span>
              </div>
            </div>
            <button
              onClick={handleSaveThreshold}
              className="px-5 py-2.5 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-colors shrink-0"
            >
              {thresholdSaved ? '✓ 저장됨' : '저장'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            현재 적용 중: <span className="text-orange-400 font-semibold">{threshold}%</span> 미만
          </p>
        </div>

        {/* 회원 목록 */}
        <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700">
            <h2 className="font-bold text-lg">회원 목록</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left px-6 py-3 text-gray-400 font-medium">ID</th>
                  <th className="text-left px-6 py-3 text-gray-400 font-medium">이름</th>
                  <th className="text-left px-6 py-3 text-gray-400 font-medium">이메일</th>
                  <th className="text-left px-6 py-3 text-gray-400 font-medium">역할</th>
                  <th className="text-left px-6 py-3 text-gray-400 font-medium">가입일</th>
                  <th className="text-left px-6 py-3 text-gray-400 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                    <td className="px-6 py-3 text-gray-500">#{user.id}</td>
                    <td className="px-6 py-3 font-medium">{user.name}</td>
                    <td className="px-6 py-3 text-gray-300">{user.email}</td>
                    <td className="px-6 py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${ROLE_COLOR[user.role] ?? 'bg-gray-700 text-gray-300'}`}>
                        {ROLE_LABEL[user.role] ?? user.role}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-400">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-3">
                      {user.role !== 'admin' && (
                        <button
                          onClick={() => handleDelete(user.id, user.name)}
                          className="text-xs text-red-400 hover:text-red-300 transition-colors"
                        >
                          삭제
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="text-center py-12 text-gray-500">회원이 없습니다.</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
