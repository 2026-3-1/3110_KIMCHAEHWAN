import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCourses, deleteCourse } from '../api/courses';
import { useAuth } from '../context/AuthContext';

const LEVEL_LABEL = { beginner: '입문', intermediate: '중급', advanced: '고급' };
const LEVEL_COLOR = {
  beginner: 'bg-emerald-50 text-emerald-700',
  intermediate: 'bg-amber-50 text-amber-700',
  advanced: 'bg-rose-50 text-rose-700',
};
const CATEGORY_GRADIENT = {
  '알고리즘/자료구조': 'from-blue-400 to-indigo-500',
  '웹 개발': 'from-violet-400 to-purple-500',
  '앱 개발': 'from-pink-400 to-rose-500',
  '데이터베이스': 'from-cyan-400 to-teal-500',
  'AI/데이터': 'from-orange-400 to-amber-500',
  'DevOps': 'from-green-400 to-emerald-500',
};

function StatCard({ icon, label, value, sub, color = 'indigo' }) {
  const colorMap = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    violet: 'bg-violet-50 text-violet-600',
    amber: 'bg-amber-50 text-amber-600',
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <div className={`inline-flex items-center justify-center w-11 h-11 rounded-xl text-xl mb-4 ${colorMap[color]}`}>
        {icon}
      </div>
      <div className="text-3xl font-extrabold text-gray-900 mb-0.5">{value}</div>
      <div className="text-sm font-semibold text-gray-500">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}

export default function InstructorDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'instructor') {
      navigate('/courses', { replace: true });
      return;
    }
    setLoading(true);
    getCourses({ instructorId: user.id, size: 100 })
      .then((res) => setCourses(res.data.data.courses))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const handleDelete = () => {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    deleteCourse(deleteTarget.id, user.id)
      .then(() => {
        setCourses((prev) => prev.filter((c) => c.id !== deleteTarget.id));
        setDeleteTarget(null);
        setDeletingId(null);
        setSuccessMsg('강의가 삭제되었습니다.');
        setTimeout(() => setSuccessMsg(''), 3000);
      })
      .catch((err) => {
        setDeleteTarget(null);
        setDeletingId(null);
        const msg = err.response?.data?.message ?? '강의 삭제에 실패했습니다.';
        alert(msg);
      });
  };

  // 전체 통계 계산
  const totalStudents = courses.reduce((sum, c) => sum + (c.enrollmentCount ?? 0), 0);
  const totalRevenue = courses.reduce((sum, c) => sum + (c.price ?? 0) * (c.enrollmentCount ?? 0), 0);
  const ratedCourses = courses.filter((c) => c.averageRating > 0);
  const avgRating = ratedCourses.length > 0
    ? (ratedCourses.reduce((sum, c) => sum + c.averageRating, 0) / ratedCourses.length).toFixed(1)
    : '-';

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="h-8 bg-gray-100 rounded-xl animate-pulse w-56 mb-2" />
        <div className="h-4 bg-gray-100 rounded animate-pulse w-36 mb-10" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="w-11 h-11 bg-gray-100 rounded-xl animate-pulse mb-4" />
              <div className="h-8 bg-gray-100 rounded animate-pulse mb-1" />
              <div className="h-4 bg-gray-100 rounded animate-pulse w-2/3" />
            </div>
          ))}
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 flex gap-4">
              <div className="w-32 h-20 bg-gray-100 rounded-xl animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-100 rounded animate-pulse w-2/3" />
                <div className="h-3 bg-gray-100 rounded animate-pulse w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      {/* 헤더 */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center font-bold text-sm">
              {user?.name?.[0]}
            </div>
            <span className="text-sm text-gray-500 font-medium">{user?.name} 강사님</span>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">강사 대시보드</h1>
        </div>
        <Link
          to="/courses/new"
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
        >
          + 새 강의 등록
        </Link>
      </div>

      {successMsg && (
        <div className="mb-6 flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3 rounded-xl">
          <span>✓</span> {successMsg}
        </div>
      )}

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatCard icon="📚" label="총 강의 수" value={courses.length} color="indigo" />
        <StatCard icon="👥" label="총 수강생" value={totalStudents.toLocaleString()} color="emerald" />
        <StatCard
          icon="⭐"
          label="평균 평점"
          value={avgRating}
          sub={`${ratedCourses.length}개 강의 기준`}
          color="amber"
        />
        <StatCard
          icon="💰"
          label="누적 수익"
          value={totalRevenue > 0 ? `${totalRevenue.toLocaleString()}원` : '-'}
          sub="무료 강의 제외"
          color="violet"
        />
      </div>

      {/* 강의 목록 */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-gray-900">내 강의 목록</h2>
        <span className="text-sm text-gray-400">총 <span className="font-bold text-gray-700">{courses.length}</span>개</span>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-2xl border border-gray-100">
          <div className="text-6xl mb-4">🎓</div>
          <p className="text-lg font-bold text-gray-800 mb-2">아직 등록한 강의가 없습니다.</p>
          <p className="text-sm text-gray-400 mb-8">첫 강의를 등록하고 수강생과 지식을 나눠보세요!</p>
          <Link
            to="/courses/new"
            className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors"
          >
            강의 등록하기
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {courses.map((course) => {
            const gradient = CATEGORY_GRADIENT[course.category] ?? 'from-indigo-400 to-violet-500';
            return (
              <div
                key={course.id}
                className="bg-white border border-gray-100 rounded-2xl p-5 flex gap-5 items-center hover:shadow-md hover:border-gray-200 transition-all duration-200 group"
              >
                {/* 썸네일 */}
                {course.thumbnailUrl ? (
                  <img
                    src={course.thumbnailUrl}
                    alt={course.title}
                    className="w-32 h-20 object-cover rounded-xl shrink-0"
                  />
                ) : (
                  <div className={`w-32 h-20 bg-gradient-to-br ${gradient} rounded-xl shrink-0 flex items-center justify-center text-2xl`}>
                    📖
                  </div>
                )}

                {/* 정보 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs bg-indigo-50 text-indigo-600 font-semibold px-2 py-0.5 rounded-md">
                      {course.category}
                    </span>
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded-md ${LEVEL_COLOR[course.level] ?? 'bg-gray-50 text-gray-500'}`}>
                      {LEVEL_LABEL[course.level] ?? course.level}
                    </span>
                  </div>
                  <Link
                    to={`/courses/${course.id}`}
                    className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1 text-sm block"
                  >
                    {course.title}
                  </Link>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <span className="text-indigo-400">👥</span>
                      <span className="font-semibold text-gray-700">{course.enrollmentCount ?? 0}</span>명
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <span className="text-yellow-400">★</span>
                      <span className="font-semibold text-gray-700">{course.averageRating?.toFixed(1) ?? '-'}</span>
                    </div>
                    <div className="text-xs font-bold text-gray-800">
                      {course.price === 0 ? (
                        <span className="text-indigo-600">무료</span>
                      ) : (
                        `${course.price?.toLocaleString()}원`
                      )}
                    </div>
                  </div>
                </div>

                {/* 액션 버튼 */}
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    to={`/courses/${course.id}/students`}
                    className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-3.5 py-2 rounded-lg hover:bg-indigo-100 transition-colors whitespace-nowrap"
                  >
                    수강생 현황
                  </Link>
                  <Link
                    to={`/courses/${course.id}/edit`}
                    className="text-xs border border-gray-200 text-gray-600 font-medium px-3.5 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    수정
                  </Link>
                  <button
                    onClick={() => setDeleteTarget(course)}
                    disabled={deletingId === course.id}
                    className="text-xs border border-red-100 text-red-400 font-medium px-3.5 py-2 rounded-lg hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors disabled:opacity-40"
                  >
                    삭제
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-7 w-80 shadow-2xl">
            <div className="text-4xl text-center mb-4">🗑️</div>
            <h3 className="font-extrabold text-gray-900 text-center text-lg mb-1">강의를 삭제할까요?</h3>
            <p className="text-sm text-gray-500 text-center mb-1 line-clamp-2 px-2">{deleteTarget.title}</p>
            <p className="text-xs text-red-500 text-center mb-7">이 작업은 되돌릴 수 없습니다.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                disabled={!!deletingId}
                className="flex-1 bg-red-500 text-white py-3 rounded-xl text-sm font-bold hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {deletingId ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
