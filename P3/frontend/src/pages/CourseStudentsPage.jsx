import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getCourse } from '../api/courses';
import { getCourseStudents } from '../api/courses';
import { useAuth } from '../context/AuthContext';

export default function CourseStudentsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [course, setCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'instructor') {
      navigate('/courses', { replace: true });
      return;
    }

    Promise.all([getCourse(id), getCourseStudents(id, user.id)])
      .then(([courseRes, studentsRes]) => {
        setCourse(courseRes.data.data);
        setStudents(studentsRes.data.data);
      })
      .catch((err) => {
        const msg = err.response?.data?.message ?? '데이터를 불러올 수 없습니다.';
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [id, user, navigate]);

  if (loading) {
    return (
      <div className="text-center py-24 text-gray-400">
        <p className="text-lg">불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-24">
        <p className="text-red-500 mb-4">{error}</p>
        <Link to="/courses" className="text-indigo-600 hover:underline text-sm">강의 목록으로</Link>
      </div>
    );
  }

  const avgProgress = students.length > 0
    ? (students.reduce((s, st) => s + st.progressPercent, 0) / students.length).toFixed(1)
    : 0;
  const reviewEligible = students.filter((st) => st.canWriteReview).length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* 브레드크럼 */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link to="/courses" className="hover:text-indigo-600">강의 목록</Link>
        <span>/</span>
        <Link to={`/courses/${id}`} className="hover:text-indigo-600 truncate max-w-xs">
          {course?.title}
        </Link>
        <span>/</span>
        <span className="text-gray-700">수강생 현황</span>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">수강생 현황</h1>
        <p className="text-gray-500 text-sm">{course?.title}</p>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 text-center shadow-sm">
          <div className="text-3xl font-bold text-indigo-600 mb-1">{students.length}</div>
          <div className="text-sm text-gray-500">총 수강생</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5 text-center shadow-sm">
          <div className="text-3xl font-bold text-indigo-600 mb-1">{avgProgress}%</div>
          <div className="text-sm text-gray-500">평균 진도율</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5 text-center shadow-sm">
          <div className="text-3xl font-bold text-green-600 mb-1">{reviewEligible}</div>
          <div className="text-sm text-gray-500">리뷰 작성 가능</div>
        </div>
      </div>

      {/* 수강생 목록 */}
      {students.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-4">👥</div>
          <p className="text-lg font-medium text-gray-600 mb-1">아직 수강생이 없습니다.</p>
          <p className="text-sm">강의를 홍보해 첫 번째 수강생을 모집해보세요!</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <span>수강생</span>
            <span>진도율</span>
            <span className="text-right">수강 신청일</span>
            <span className="text-right">상태</span>
          </div>

          <div className="divide-y divide-gray-100">
            {students.map((student, idx) => (
              <div
                key={student.studentId}
                className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                {/* 아바타 + 이름/이메일 */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
                    {student.studentName[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{student.studentName}</p>
                    <p className="text-xs text-gray-400 truncate">{student.studentEmail}</p>
                  </div>
                </div>

                {/* 진도율 바 */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        student.progressPercent >= 70
                          ? 'bg-green-500'
                          : student.progressPercent >= 30
                          ? 'bg-indigo-500'
                          : 'bg-gray-300'
                      }`}
                      style={{ width: `${Math.min(student.progressPercent, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-700 w-12 text-right shrink-0">
                    {student.progressPercent.toFixed(1)}%
                  </span>
                </div>

                {/* 수강 신청일 */}
                <p className="text-xs text-gray-400 text-right whitespace-nowrap">
                  {new Date(student.enrolledAt).toLocaleDateString('ko-KR', {
                    year: 'numeric', month: 'short', day: 'numeric',
                  })}
                </p>

                {/* 상태 배지 */}
                <div className="flex justify-end">
                  {student.canWriteReview ? (
                    <span className="text-xs bg-green-100 text-green-700 font-semibold px-2.5 py-1 rounded-full whitespace-nowrap">
                      리뷰 가능
                    </span>
                  ) : student.progressPercent > 0 ? (
                    <span className="text-xs bg-indigo-50 text-indigo-600 font-medium px-2.5 py-1 rounded-full whitespace-nowrap">
                      수강 중
                    </span>
                  ) : (
                    <span className="text-xs bg-gray-100 text-gray-500 font-medium px-2.5 py-1 rounded-full whitespace-nowrap">
                      미시청
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 하단 버튼 */}
      <div className="mt-6">
        <Link
          to={`/courses/${id}`}
          className="text-sm text-gray-500 hover:text-indigo-600 transition-colors"
        >
          ← 강의 상세로 돌아가기
        </Link>
      </div>
    </div>
  );
}
