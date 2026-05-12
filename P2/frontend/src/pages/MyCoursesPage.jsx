import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getEnrollmentsByStudent, deleteEnrollment } from '../api/enrollments';
import { getCourse } from '../api/courses';
import { useAuth } from '../context/AuthContext';

const LEVEL_LABEL = { beginner: '입문', intermediate: '중급', advanced: '고급' };

export default function MyCoursesPage() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelConfirm, setCancelConfirm] = useState(null);
  const [cancelledMsg, setCancelledMsg] = useState('');

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
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const handleCancel = (enrollmentId) => {
    deleteEnrollment(enrollmentId)
      .then(() => {
        setEnrollments((prev) => prev.filter((e) => e.id !== enrollmentId));
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
      <div className="text-center py-24 text-gray-400">
        <p className="text-lg">불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">내 수강 목록</h1>
        <p className="text-gray-500 text-sm mt-1">총 {enrollments.length}개 강의를 수강 중입니다.</p>
      </div>

      {cancelledMsg && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl">
          ✓ {cancelledMsg}
        </div>
      )}

      {enrollments.length === 0 ? (
        <div className="text-center py-24 text-gray-400">
          <div className="text-6xl mb-4">📚</div>
          <p className="text-lg font-medium text-gray-600 mb-2">아직 수강 중인 강의가 없습니다.</p>
          <p className="text-sm mb-8">마음에 드는 강의를 찾아 수강 신청해보세요!</p>
          <Link
            to="/courses"
            className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
          >
            강의 둘러보기
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {enrollments.map((enrollment) => {
            const { course } = enrollment;
            if (!course) return null;
            return (
              <div
                key={enrollment.id}
                className="bg-white border border-gray-200 rounded-2xl p-5 flex gap-5 items-center hover:shadow-md transition-shadow"
              >
                {course.thumbnailUrl ? (
                  <img
                    src={course.thumbnailUrl}
                    alt={course.title}
                    className="w-28 h-20 object-cover rounded-xl shrink-0"
                  />
                ) : (
                  <div className="w-28 h-20 bg-gray-100 rounded-xl shrink-0 flex items-center justify-center text-2xl">
                    📖
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs bg-indigo-50 text-indigo-600 font-medium px-2 py-0.5 rounded-full">
                      {course.category}
                    </span>
                    <span className="text-xs text-gray-400">{LEVEL_LABEL[course.level]}</span>
                  </div>
                  <Link
                    to={`/courses/${course.id}`}
                    className="font-semibold text-gray-900 hover:text-indigo-600 transition-colors line-clamp-1 text-sm"
                  >
                    {course.title}
                  </Link>
                  <p className="text-xs text-gray-500 mt-0.5">{course.instructorName}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <span className="text-yellow-400">★</span>
                      <span>{course.averageRating?.toFixed(1)}</span>
                    </div>
                    <span className="text-xs text-gray-400">
                      수강 신청일: {new Date(enrollment.enrolledAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  <Link
                    to={`/courses/${course.id}/watch`}
                    className="text-center text-xs bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                  >
                    강의 시청
                  </Link>
                  <button
                    onClick={() => setCancelConfirm(enrollment.id)}
                    className="text-xs border border-red-200 text-red-400 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    수강 취소
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {cancelConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-80 shadow-2xl">
            <div className="text-3xl text-center mb-3">⚠️</div>
            <h3 className="font-bold text-gray-900 text-center mb-2">수강을 취소하시겠습니까?</h3>
            <p className="text-sm text-gray-500 text-center mb-6">취소 후에는 다시 신청할 수 있습니다.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setCancelConfirm(null)}
                className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50"
              >
                돌아가기
              </button>
              <button
                onClick={() => handleCancel(cancelConfirm)}
                className="flex-1 bg-red-500 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-red-600"
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
