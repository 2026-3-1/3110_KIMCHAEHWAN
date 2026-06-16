import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getCourse, deleteCourse } from '../api/courses';
import { getReviews, createReview, updateReview, deleteReview } from '../api/reviews';
import { createEnrollment, getEnrollmentsByStudent } from '../api/enrollments';
import { getCourseProgress } from '../api/progress';
import { useAuth } from '../context/AuthContext';

const LEVEL_LABEL = { beginner: '입문', intermediate: '중급', advanced: '고급' };

function StarDisplay({ value, size = 'sm' }) {
  return (
    <span className={`flex gap-0.5 ${size === 'lg' ? 'text-2xl' : 'text-sm'}`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={s <= value ? 'text-yellow-400' : 'text-gray-200'}>★</span>
      ))}
    </span>
  );
}

function StarInput({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <span className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(s)}
          className={`text-2xl transition-colors ${s <= (hovered || value) ? 'text-yellow-400' : 'text-gray-200'}`}
        >
          ★
        </button>
      ))}
    </span>
  );
}

function RatingBar({ star, count, total }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-gray-500 w-3">{star}</span>
      <span className="text-yellow-400 text-xs">★</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div className="bg-yellow-400 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-gray-400 text-xs w-8">{pct}%</span>
    </div>
  );
}

export default function CourseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [course, setCourse] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [enrolled, setEnrolled] = useState(false);
  const [enrollAnimating, setEnrollAnimating] = useState(false);

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewContent, setReviewContent] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // 리뷰 수정 상태
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editRating, setEditRating] = useState(5);
  const [editContent, setEditContent] = useState('');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [canWriteReview, setCanWriteReview] = useState(false);
  const [progressPct, setProgressPct] = useState(0);

  const isStudent = user?.role === 'student';
  const isInstructor = user?.role === 'instructor';
  const isOwner = isInstructor && course && user?.id === course?.instructorId;

  useEffect(() => {
    setLoading(true);
    const fetches = [getCourse(id), getReviews(id)];
    if (isStudent) fetches.push(getEnrollmentsByStudent(user.id));

    Promise.all(fetches)
      .then(([courseRes, reviewsRes, enrollmentsRes]) => {
        setCourse(courseRes.data.data);
        setReviews(reviewsRes.data.data);
        if (isStudent && enrollmentsRes) {
          const alreadyEnrolled = enrollmentsRes.data.data.some(
            (e) => e.courseId === Number(id)
          );
          setEnrolled(alreadyEnrolled);
          if (alreadyEnrolled) {
            getCourseProgress(id, user.id)
              .then((res) => {
                const data = res.data.data;
                setProgressPct(Math.round(data.progressPercent));
                setCanWriteReview(data.canWriteReview);
              })
              .catch(() => {});
          }
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id, isStudent, user?.id]);

  if (loading) {
    return (
      <div className="text-center py-24 text-gray-400">
        <p className="text-lg">불러오는 중...</p>
      </div>
    );
  }

  if (notFound || !course) {
    return (
      <div className="text-center py-24 text-gray-400">
        <div className="text-5xl mb-4">😕</div>
        <p className="text-lg">강의를 찾을 수 없습니다.</p>
        <Link to="/courses" className="mt-4 inline-block text-indigo-600 hover:underline text-sm">목록으로 돌아가기</Link>
      </div>
    );
  }

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : course.averageRating?.toFixed(1) ?? '-';

  const ratingDist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  const myReview = isStudent ? reviews.find((r) => r.studentId === user.id) : null;

  const handleEnroll = () => {
    if (enrolled || enrollAnimating) return;
    if (course.price > 0) {
      navigate(`/payment/${course.id}`);
      return;
    }
    setEnrollAnimating(true);
    createEnrollment({ studentId: user.id, courseId: course.id })
      .then(() => { setEnrolled(true); setEnrollAnimating(false); })
      .catch(() => { setEnrollAnimating(false); alert('수강 신청에 실패했습니다.'); });
  };

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (!reviewContent.trim()) return;
    createReview(course.id, { studentId: user.id, rating: reviewRating, content: reviewContent.trim() })
      .then((res) => {
        setReviews((prev) => [res.data.data, ...prev]);
        setReviewContent('');
        setReviewRating(5);
        setReviewSubmitted(true);
        setTimeout(() => setReviewSubmitted(false), 3000);
      })
      .catch((err) => {
        const msg = err.response?.data?.message ?? '리뷰 등록에 실패했습니다.';
        alert(msg);
      });
  };

  const startEditReview = (review) => {
    setEditingReviewId(review.id);
    setEditRating(review.rating);
    setEditContent(review.content);
  };

  const handleEditSubmit = (e, reviewId) => {
    e.preventDefault();
    if (!editContent.trim()) return;
    updateReview(course.id, reviewId, { studentId: user.id, rating: editRating, content: editContent.trim() })
      .then((res) => {
        setReviews((prev) => prev.map((r) => r.id === reviewId ? res.data.data : r));
        setEditingReviewId(null);
      })
      .catch(() => alert('리뷰 수정에 실패했습니다.'));
  };

  const handleDeleteReview = (reviewId) => {
    if (!window.confirm('리뷰를 삭제하시겠습니까?')) return;
    deleteReview(course.id, reviewId, user.id)
      .then(() => {
        setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      })
      .catch(() => alert('리뷰 삭제에 실패했습니다.'));
  };

  const handleDelete = () => {
    deleteCourse(course.id, course.instructorId)
      .then(() => { setShowDeleteModal(false); navigate('/courses'); })
      .catch(() => { setShowDeleteModal(false); alert('강의 삭제에 실패했습니다.'); });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* 브레드크럼 */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link to="/" className="hover:text-indigo-600">홈</Link>
        <span>/</span>
        <Link to="/courses" className="hover:text-indigo-600">강의 목록</Link>
        <span>/</span>
        <span className="text-gray-700 truncate max-w-xs">{course.title}</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* 왼쪽 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full">
              {course.category}
            </span>
            <span className="bg-gray-100 text-gray-600 text-xs font-medium px-3 py-1 rounded-full">
              {LEVEL_LABEL[course.level] ?? course.level}
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 leading-snug">{course.title}</h1>
          <p className="text-gray-500 text-base mb-4">{course.summary}</p>

          <div className="flex flex-wrap items-center gap-4 text-sm mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xs">
                {course.instructorName[0]}
              </div>
              <span className="font-medium text-gray-800">{course.instructorName}</span>
            </div>
            <div className="flex items-center gap-1 text-yellow-500">
              <span className="font-bold text-gray-800">{avgRating}</span>
              <StarDisplay value={Math.round(Number(avgRating))} />
              <span className="text-gray-400">({reviews.length}개)</span>
            </div>
            <span className="text-gray-400">수강생 {course.enrollmentCount?.toLocaleString()}명</span>
          </div>

          {course.thumbnailUrl && (
            <div className="rounded-2xl overflow-hidden mb-8 shadow-sm">
              <img src={course.thumbnailUrl} alt={course.title} className="w-full object-cover max-h-96" />
            </div>
          )}

          {course.lectures?.length > 0 && (
            <div className="mb-10">
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                커리큘럼 <span className="text-sm font-normal text-gray-400 ml-1">{course.lectures.length}강</span>
              </h2>
              <div className="space-y-2">
                {course.lectures.map((lecture) => (
                  <div key={lecture.id} className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-xs font-bold shrink-0">
                      {lecture.orderIndex + 1}
                    </div>
                    <span className="text-sm text-gray-800">{lecture.title || `${lecture.orderIndex + 1}강`}</span>
                    {lecture.videoUrl && (
                      <span className="ml-auto text-xs text-gray-400">동영상</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mb-10">
            <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">강의 소개</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">{course.description}</p>
          </div>

          <div className="mb-10 p-5 bg-gray-50 rounded-2xl border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4">강사 소개</h2>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-indigo-200 rounded-full flex items-center justify-center text-indigo-700 font-bold text-xl shrink-0">
                {course.instructorName[0]}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{course.instructorName}</p>
                <p className="text-sm text-gray-500 mt-1">DevClass 인증 강사 · {course.category} 전문</p>
                <div className="flex gap-3 text-xs text-gray-400 mt-2">
                  <span>수강생 {course.enrollmentCount?.toLocaleString()}명</span>
                  <span>평점 {avgRating}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 리뷰 섹션 */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-6 pb-2 border-b border-gray-100">
              수강생 리뷰
            </h2>

            {reviews.length > 0 && (
              <div className="flex gap-8 mb-8 p-5 bg-yellow-50 rounded-2xl border border-yellow-100">
                <div className="text-center shrink-0">
                  <div className="text-5xl font-bold text-gray-900">{avgRating}</div>
                  <StarDisplay value={Math.round(Number(avgRating))} size="lg" />
                  <div className="text-xs text-gray-400 mt-2">{reviews.length}개 리뷰</div>
                </div>
                <div className="flex-1 space-y-2">
                  {ratingDist.map((d) => (
                    <RatingBar key={d.star} star={d.star} count={d.count} total={reviews.length} />
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4 mb-8">
              {reviews.map((review) => {
                const isMine = isStudent && review.studentId === user.id;
                const isEditing = editingReviewId === review.id;

                return (
                  <div key={review.id} className="p-4 bg-white border border-gray-100 rounded-xl hover:shadow-sm transition-shadow">
                    {isEditing ? (
                      <form onSubmit={(e) => handleEditSubmit(e, review.id)} className="space-y-3">
                        <div className="flex items-center gap-2 mb-1">
                          <StarInput value={editRating} onChange={setEditRating} />
                        </div>
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={3}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                        />
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={!editContent.trim()}
                            className="px-4 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 disabled:opacity-40"
                          >
                            저장
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingReviewId(null)}
                            className="px-4 py-1.5 border border-gray-300 text-gray-600 text-xs rounded-lg hover:bg-gray-50"
                          >
                            취소
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 text-xs font-medium">
                              {isMine ? user.name[0] : review.studentId % 100}
                            </div>
                            <span className="text-sm font-medium text-gray-800">
                              {isMine ? user.name : (review.studentName ?? '수강생')}
                            </span>
                            <StarDisplay value={review.rating} />
                            {isMine && (
                              <span className="text-xs bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-full">내 리뷰</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                            {isMine && (
                              <div className="flex gap-1">
                                <button
                                  onClick={() => startEditReview(review)}
                                  className="text-xs text-gray-400 hover:text-indigo-600 transition-colors"
                                >
                                  수정
                                </button>
                                <button
                                  onClick={() => handleDeleteReview(review.id)}
                                  className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                                >
                                  삭제
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">{review.content}</p>
                      </>
                    )}
                  </div>
                );
              })}
              {reviews.length === 0 && (
                <div className="text-center py-10 text-gray-400">
                  <p className="text-3xl mb-2">💬</p>
                  <p>아직 리뷰가 없습니다. 첫 번째 리뷰를 남겨보세요!</p>
                </div>
              )}
            </div>

            {/* 리뷰 작성 폼 - 수강 중이고, 리뷰 없고, 진행도 70% 이상 */}
            {isStudent && enrolled && !myReview && canWriteReview && (
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-4">리뷰 작성</h3>
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">별점</p>
                    <StarInput value={reviewRating} onChange={setReviewRating} />
                  </div>
                  <textarea
                    value={reviewContent}
                    onChange={(e) => setReviewContent(e.target.value)}
                    placeholder="이 강의에 대한 솔직한 후기를 남겨주세요..."
                    rows={3}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none bg-white"
                  />
                  {reviewSubmitted && (
                    <p className="text-green-600 text-sm">✓ 리뷰가 등록되었습니다!</p>
                  )}
                  <button
                    type="submit"
                    disabled={!reviewContent.trim()}
                    className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 transition-colors"
                  >
                    리뷰 등록
                  </button>
                </form>
              </div>
            )}
            {isStudent && enrolled && !myReview && !canWriteReview && (
              <div className="bg-orange-50 rounded-2xl p-5 border border-orange-100 text-center text-sm text-orange-700">
                전체 강의의 70% 이상 시청해야 리뷰를 작성할 수 있습니다.
                <div className="mt-2">
                  <div className="w-full h-2 bg-orange-200 rounded-full">
                    <div
                      className="h-2 bg-orange-400 rounded-full transition-all"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <p className="text-xs text-orange-500 mt-1">현재 진행도: {progressPct}%</p>
                </div>
              </div>
            )}
            {isStudent && !enrolled && (
              <div className="bg-indigo-50 rounded-2xl p-5 border border-indigo-100 text-center text-sm text-indigo-700">
                수강 신청 후 리뷰를 작성할 수 있습니다.
              </div>
            )}
          </div>
        </div>

        {/* 오른쪽: 수강 신청 카드 */}
        <div className="w-full lg:w-80 shrink-0">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 sticky top-24 shadow-lg">
            {course.thumbnailUrl && (
              <img
                src={course.thumbnailUrl}
                alt=""
                className="w-full aspect-video object-cover rounded-xl mb-4"
              />
            )}
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {course.price === 0 ? (
                <span className="text-indigo-600">무료</span>
              ) : (
                `${course.price?.toLocaleString()}원`
              )}
            </div>
            <p className="text-sm text-gray-400 mb-5">수강생 {course.enrollmentCount?.toLocaleString()}명 수강 중</p>

            {isStudent && (
              <>
                <button
                  onClick={handleEnroll}
                  disabled={enrolled || enrollAnimating}
                  className={`w-full py-3.5 rounded-xl font-bold text-base transition-all ${
                    enrolled
                      ? 'bg-green-500 text-white cursor-default'
                      : enrollAnimating
                      ? 'bg-indigo-400 text-white'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
                  }`}
                >
                  {enrolled ? '✓ 수강 신청 완료' : enrollAnimating ? '처리 중...' : '수강 신청하기'}
                </button>

                {enrolled && (
                  <>
                    <Link
                      to={`/courses/${course.id}/watch`}
                      className="block mt-3 w-full text-center bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-bold transition-colors"
                    >
                      강의 시청하기 →
                    </Link>
                    <Link
                      to={`/courses/${course.id}/qna`}
                      className="block mt-2 w-full text-center border border-indigo-300 text-indigo-600 py-2.5 rounded-xl font-semibold text-sm hover:bg-indigo-50 transition-colors"
                    >
                      Q&A 보기
                    </Link>
                  </>
                )}
              </>
            )}

            <div className="border-t border-gray-100 mt-5 pt-5 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">카테고리</span>
                <span className="font-medium text-gray-800">{course.category}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">난이도</span>
                <span className="font-medium text-gray-800">{LEVEL_LABEL[course.level]}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">강사</span>
                <span className="font-medium text-gray-800">{course.instructorName}</span>
              </div>
            </div>

            {isOwner && (
              <div className="border-t border-gray-100 mt-5 pt-5 space-y-2">
                <Link
                  to={`/courses/${course.id}/students`}
                  className="block w-full text-center bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
                >
                  수강생 현황 보기
                </Link>
                <Link
                  to={`/courses/${course.id}/qna`}
                  className="block w-full text-center border border-indigo-300 text-indigo-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-50 transition-colors"
                >
                  Q&A 보기
                </Link>
                <div className="flex gap-2">
                  <Link
                    to={`/courses/${course.id}/edit`}
                    className="flex-1 text-center border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                  >
                    강의 수정
                  </Link>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="flex-1 text-center border border-red-200 text-red-500 py-2 rounded-lg text-sm hover:bg-red-50 transition-colors"
                  >
                    강의 삭제
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 삭제 확인 모달 */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-80 shadow-2xl">
            <div className="text-3xl mb-3 text-center">🗑️</div>
            <h3 className="font-bold text-gray-900 text-center mb-2">강의를 삭제하시겠습니까?</h3>
            <p className="text-sm text-gray-500 text-center mb-6">이 작업은 되돌릴 수 없습니다.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 bg-red-500 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-red-600"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
