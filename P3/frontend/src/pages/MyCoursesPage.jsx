import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getEnrollmentsByStudent, deleteEnrollment } from '../api/enrollments';
import { getCourse } from '../api/courses';
import { getCourseProgress } from '../api/progress';
import { checkRefund, requestRefund } from '../api/refund';
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

function CourseThumbnail({ course }) {
  const gradient = CATEGORY_GRADIENT[course.category] ?? 'from-indigo-400 to-violet-500';
  if (course.thumbnailUrl) {
    return (
      <img
        src={course.thumbnailUrl}
        alt={course.title}
        className="w-28 h-20 object-cover rounded-xl shrink-0"
      />
    );
  }
  return (
    <div className={`w-28 h-20 bg-gradient-to-br ${gradient} rounded-xl shrink-0 flex items-center justify-center text-2xl`}>
      📖
    </div>
  );
}

export default function MyCoursesPage() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [progressMap, setProgressMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [refundMap, setRefundMap] = useState({});      // courseId -> {eligible, progressPercent, threshold}
  const [refundConfirm, setRefundConfirm] = useState(null); // enrollment object
  const [cancelConfirm, setCancelConfirm] = useState(null);
  const [cancelledMsg, setCancelledMsg] = useState('');
  const [refunding, setRefunding] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getEnrollmentsByStudent(user.id)
      .then(async (res) => {
        const list = res.data.data;
        const withCourses = await Promise.all(
          list.map((e) =>
            getCourse(e.courseId)
              .then((cr) => ({ ...e, course: cr.data.data }))
              .catch(() => ({ ...e, course: null }))
          )
        );
        setEnrollments(withCourses);

        const progressResults = await Promise.all(
          list.map((e) =>
            getCourseProgress(e.courseId, user.id)
              .then((pr) => ({ courseId: e.courseId, pct: Math.round(pr.data.data.progressPercent) }))
              .catch(() => ({ courseId: e.courseId, pct: 0 }))
          )
        );
        const map = {};
        progressResults.forEach(({ courseId, pct }) => { map[courseId] = pct; });
        setProgressMap(map);

        // 유료 강의만 환불 가능 여부 확인
        const refundResults = await Promise.all(
          withCourses
            .filter((e) => e.course?.price > 0)
            .map((e) =>
              checkRefund(user.id, e.course.id)
                .then((r) => ({ courseId: e.course.id, ...r.data.data }))
                .catch(() => ({ courseId: e.course.id, eligible: false }))
            )
        );
        const rmap = {};
        refundResults.forEach(({ courseId, ...rest }) => { rmap[courseId] = rest; });
        setRefundMap(rmap);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const handleRefund = (enrollment) => {
    if (refunding) return;
    setRefunding(true);
    requestRefund(user.id, enrollment.course.id)
      .then(() => {
        setEnrollments((prev) => prev.filter((e) => e.id !== enrollment.id));
        setRefundConfirm(null);
        setCancelledMsg('환불이 완료되었습니다.');
        setTimeout(() => setCancelledMsg(''), 4000);
      })
      .catch((err) => {
        setRefundConfirm(null);
        alert(err.response?.data?.message ?? '환불에 실패했습니다.');
      })
      .finally(() => setRefunding(false));
  };

  const handleCancel = (enrollmentId) => {
    const target = enrollments.find((e) => e.id === enrollmentId);
    deleteEnrollment(enrollmentId)
      .then(() => {
        setEnrollments((prev) => prev.filter((e) => e.id !== enrollmentId));
        if (target?.course?.id) {
          setProgressMap((prev) => {
            const next = { ...prev };
            delete next[target.course.id];
            return next;
          });
        }
        setCancelConfirm(null);
        setCancelledMsg('수강이 취소되었습니다.');
        setTimeout(() => setCancelledMsg(''), 3000);
      })
      .catch(() => {
        setCancelConfirm(null);
        alert('수강 취소에 실패했습니다.');
      });
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-8">
          <div className="h-8 bg-gray-100 rounded-xl animate-pulse w-48 mb-2" />
          <div className="h-4 bg-gray-100 rounded animate-pulse w-32" />
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 flex gap-5">
              <div className="w-28 h-20 bg-gray-100 rounded-xl animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-100 rounded animate-pulse w-1/3" />
                <div className="h-4 bg-gray-100 rounded animate-pulse w-2/3" />
                <div className="h-3 bg-gray-100 rounded animate-pulse w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">내 수강 목록</h1>
          <p className="text-gray-500 text-sm mt-1">
            총 <span className="text-gray-800 font-bold">{enrollments.length}</span>개 강의를 수강 중입니다.
          </p>
        </div>
        <Link
          to="/courses"
          className="text-sm text-indigo-600 font-semibold hover:text-indigo-700 transition-colors"
        >
          강의 더 찾기 →
        </Link>
      </div>

      {cancelledMsg && (
        <div className="mb-4 flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3 rounded-xl">
          <span className="text-emerald-500">✓</span>
          {cancelledMsg}
        </div>
      )}

      {enrollments.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-2xl border border-gray-100">
          <div className="text-6xl mb-4">📚</div>
          <p className="text-lg font-bold text-gray-800 mb-2">아직 수강 중인 강의가 없습니다.</p>
          <p className="text-sm text-gray-400 mb-8">마음에 드는 강의를 찾아 수강 신청해보세요!</p>
          <Link
            to="/courses"
            className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
          >
            강의 둘러보기
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {enrollments.map((enrollment) => {
            const { course } = enrollment;
            if (!course) return null;
            return (
              <div
                key={enrollment.id}
                className="bg-white border border-gray-100 rounded-2xl p-5 flex gap-5 items-center hover:shadow-md hover:border-gray-200 transition-all duration-200 group"
              >
                <CourseThumbnail course={course} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs bg-indigo-50 text-indigo-600 font-semibold px-2 py-0.5 rounded-md">
                      {course.category}
                    </span>
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded-md ${LEVEL_COLOR[course.level] ?? 'bg-gray-50 text-gray-500'}`}>
                      {LEVEL_LABEL[course.level]}
                    </span>
                  </div>
                  <Link
                    to={`/courses/${course.id}`}
                    className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1 text-sm block mb-0.5"
                  >
                    {course.title}
                  </Link>
                  <p className="text-xs text-gray-400 font-medium">{course.instructorName}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <span className="text-yellow-400">★</span>
                      <span className="font-semibold">{course.averageRating?.toFixed(1) ?? '-'}</span>
                    </div>
                    <span className="text-xs text-gray-300">·</span>
                    <span className="text-xs text-gray-400">
                      {new Date(enrollment.enrolledAt).toLocaleDateString('ko-KR')} 수강 신청
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full">
                      <div
                        className={`h-1.5 rounded-full transition-all ${
                          (progressMap[course.id] ?? 0) >= 70 ? 'bg-green-500' : 'bg-indigo-400'
                        }`}
                        style={{ width: `${progressMap[course.id] ?? 0}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-gray-500 shrink-0 w-8 text-right">
                      {progressMap[course.id] ?? 0}%
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  <Link
                    to={`/courses/${course.id}/watch`}
                    className="text-center text-xs bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-semibold shadow-sm shadow-indigo-200"
                  >
                    강의 시청
                  </Link>
                  {course.price > 0 && refundMap[course.id] && (
                    <button
                      onClick={() => refundMap[course.id].eligible
                        ? setRefundConfirm(enrollment)
                        : alert(refundMap[course.id].message)}
                      className={`text-xs px-5 py-2 rounded-lg transition-all border font-semibold ${
                        refundMap[course.id].eligible
                          ? 'border-orange-300 text-orange-500 hover:bg-orange-50'
                          : 'border-gray-100 text-gray-300 cursor-not-allowed'
                      }`}
                    >
                      환불
                    </button>
                  )}
                  {course.price === 0 && (
                    <button
                      onClick={() => setCancelConfirm(enrollment.id)}
                      className="text-xs border border-gray-200 text-gray-400 px-5 py-2 rounded-lg hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-all"
                    >
                      수강 취소
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 환불 확인 모달 */}
      {refundConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-7 w-80 shadow-2xl">
            <div className="text-4xl text-center mb-4">💰</div>
            <h3 className="font-extrabold text-gray-900 text-center text-lg mb-2">환불을 요청할까요?</h3>
            <p className="text-sm text-gray-500 text-center mb-1">
              <span className="font-semibold text-gray-800">{refundConfirm.course?.title}</span>
            </p>
            <p className="text-sm text-orange-600 text-center mb-2">
              현재 진행률: {Math.round(refundMap[refundConfirm.course?.id]?.progressPercent ?? 0)}%
            </p>
            <p className="text-xs text-gray-400 text-center mb-7">
              환불 후 수강 기록이 삭제되며 재수강 시 다시 결제해야 합니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setRefundConfirm(null)}
                className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => handleRefund(refundConfirm)}
                disabled={refunding}
                className="flex-1 bg-orange-500 text-white py-3 rounded-xl text-sm font-bold hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                {refunding ? '처리 중...' : '환불 요청'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 취소 확인 모달 */}
      {cancelConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-7 w-80 shadow-2xl">
            <div className="text-4xl text-center mb-4">⚠️</div>
            <h3 className="font-extrabold text-gray-900 text-center text-lg mb-2">수강을 취소할까요?</h3>
            <p className="text-sm text-gray-500 text-center mb-7">취소 후에도 다시 신청할 수 있습니다.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setCancelConfirm(null)}
                className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                돌아가기
              </button>
              <button
                onClick={() => handleCancel(cancelConfirm)}
                className="flex-1 bg-red-500 text-white py-3 rounded-xl text-sm font-bold hover:bg-red-600 transition-colors"
              >
                취소하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}