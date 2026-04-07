import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getCourse } from '../api/courses';
import { getReviews } from '../api/reviews';
import { getEnrollmentsByStudent } from '../api/enrollments';

const LEVEL_LABEL = { beginner: '입문', intermediate: '중급', advanced: '고급' };
const STUDENT_ID = 1;

function toEmbedUrl(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v');
      return v ? `https://www.youtube.com/embed/${v}?autoplay=1` : null;
    }
    if (u.hostname === 'youtu.be') {
      return `https://www.youtube.com/embed${u.pathname}?autoplay=1`;
    }
  } catch {
    return null;
  }
  return url;
}

function StarDisplay({ value }) {
  return (
    <span className="flex gap-0.5 text-sm">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={s <= value ? 'text-yellow-400' : 'text-gray-300'}>★</span>
      ))}
    </span>
  );
}

export default function CourseWatchPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('description');

  useEffect(() => {
    Promise.all([
      getCourse(id),
      getReviews(id),
      getEnrollmentsByStudent(STUDENT_ID),
    ])
      .then(([courseRes, reviewsRes, enrollmentsRes]) => {
        const courseData = courseRes.data.data;
        const enrolled = enrollmentsRes.data.data.some((e) => e.courseId === Number(id));
        if (!enrolled) {
          navigate(`/courses/${id}`, { replace: true });
          return;
        }
        setCourse(courseData);
        setReviews(reviewsRes.data.data);
      })
      .catch(() => navigate('/courses', { replace: true }))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-gray-400">
        <p>불러오는 중...</p>
      </div>
    );
  }

  if (!course) return null;

  const embedUrl = toEmbedUrl(course.videoUrl);
  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : course.averageRating?.toFixed(1) ?? '-';

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* 상단 헤더 */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4 shrink-0 shadow-sm">
        <Link
          to={`/courses/${course.id}`}
          className="text-gray-500 hover:text-indigo-600 transition-colors text-sm flex items-center gap-1.5"
        >
          ← 강의 정보
        </Link>
        <div className="w-px h-4 bg-gray-300" />
        <h1 className="text-gray-900 font-semibold text-sm truncate flex-1">{course.title}</h1>
        <span className="text-xs bg-indigo-100 text-indigo-700 font-medium px-2.5 py-1 rounded-full shrink-0">
          {LEVEL_LABEL[course.level] ?? course.level}
        </span>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* 영상 영역 */}
        <main className="flex-1 flex flex-col bg-gray-50 min-w-0">
          {embedUrl ? (
            <div className="w-full aspect-video bg-black">
              <iframe
                src={embedUrl}
                title={course.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="w-full aspect-video flex items-center justify-center bg-gray-100 text-gray-400">
              <div className="text-center">
                <div className="text-5xl mb-3">🎬</div>
                <p className="text-sm">등록된 영상이 없습니다.</p>
              </div>
            </div>
          )}

          {/* 영상 아래: 탭 */}
          <div className="flex-1 bg-white overflow-y-auto border-t border-gray-200">
            <div className="border-b border-gray-200 flex gap-1 px-6">
              {[
                { key: 'description', label: '강의 소개' },
                { key: 'reviews', label: `리뷰 (${reviews.length})` },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-6 max-w-3xl">
              {activeTab === 'description' && (
                <div>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold shrink-0">
                      {course.instructorName[0]}
                    </div>
                    <div>
                      <p className="text-gray-900 font-medium text-sm">{course.instructorName}</p>
                      <p className="text-gray-400 text-xs">{course.category} 전문</p>
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                    {course.description || course.summary}
                  </p>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div>
                  {reviews.length > 0 && (
                    <div className="flex items-center gap-3 mb-6">
                      <span className="text-4xl font-bold text-gray-900">{avgRating}</span>
                      <div>
                        <StarDisplay value={Math.round(Number(avgRating))} />
                        <p className="text-gray-400 text-xs mt-1">{reviews.length}개 리뷰</p>
                      </div>
                    </div>
                  )}
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 text-xs">
                              {review.studentId % 100}
                            </div>
                            <span className="text-gray-800 text-sm font-medium">수강생</span>
                            <StarDisplay value={review.rating} />
                          </div>
                          <span className="text-xs text-gray-400">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed">{review.content}</p>
                      </div>
                    ))}
                    {reviews.length === 0 && (
                      <div className="text-center py-10 text-gray-400">
                        <p className="text-3xl mb-2">💬</p>
                        <p className="text-sm">아직 리뷰가 없습니다.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* 오른쪽 사이드바 */}
        <aside className="w-80 shrink-0 bg-white border-l border-gray-200 flex flex-col overflow-y-auto">
          <div className="p-5 border-b border-gray-100">
            <p className="text-indigo-600 text-xs font-semibold uppercase tracking-widest mb-2">수강 중인 강의</p>
            <h2 className="text-gray-900 font-bold text-base leading-snug">{course.title}</h2>
            <p className="text-gray-500 text-sm mt-1">{course.summary}</p>
          </div>

          <div className="p-5 border-b border-gray-100 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">강사</span>
              <span className="text-gray-800 font-medium">{course.instructorName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">카테고리</span>
              <span className="text-gray-800">{course.category}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">난이도</span>
              <span className="text-gray-800">{LEVEL_LABEL[course.level]}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">평점</span>
              <span className="text-yellow-500 font-medium">★ {avgRating}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">수강생</span>
              <span className="text-gray-800">{course.enrollmentCount?.toLocaleString()}명</span>
            </div>
          </div>

          <div className="p-5 mt-auto">
            <Link
              to={`/courses/${course.id}`}
              className="block w-full text-center border border-gray-300 text-gray-600 hover:border-indigo-400 hover:text-indigo-600 py-2.5 rounded-xl text-sm transition-colors"
            >
              강의 상세 페이지로
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
