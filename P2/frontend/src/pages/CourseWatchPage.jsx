import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getCourse } from '../api/courses';
import { getReviews } from '../api/reviews';
import { getEnrollmentsByStudent } from '../api/enrollments';
import { updateLectureProgress, getCourseProgress } from '../api/progress';
import { useAuth } from '../context/AuthContext';

const LEVEL_LABEL = { beginner: '입문', intermediate: '중급', advanced: '고급' };
const MAX_COUNTED_SPEED = 2.0; // 2배속 초과 시 진행도 미반영
const MAX_TIME_DIFF = 2.0;     // 이 초 이상 점프 시 스킵으로 간주

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
  const { user } = useAuth();

  const [course, setCourse] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [activeTab, setActiveTab] = useState('description');
  const [progressMap, setProgressMap] = useState({}); // lectureId -> { watched, duration }

  const videoRef = useRef(null);
  const lastTimeRef = useRef(0);
  const accumulatedRef = useRef(0); // 현재 강의 이번 세션 시청 시간
  const sendingRef = useRef(false);

  const lectures = course?.lectures ?? [];
  const currentLecture = lectures[selectedIdx] ?? null;

  const sendProgress = useCallback(async (lecture, extra = 0) => {
    if (!lecture || sendingRef.current) return;
    const totalWatched = accumulatedRef.current + extra;
    if (totalWatched === 0) return;
    sendingRef.current = true;
    const duration = videoRef.current?.duration ?? 0;
    try {
      await updateLectureProgress(lecture.id, {
        studentId: user.id,
        watchedSeconds: Math.round(totalWatched),
        durationSeconds: Math.round(isFinite(duration) ? duration : 0),
      });
      setProgressMap((prev) => {
        const existing = prev[lecture.id]?.watched ?? 0;
        return {
          ...prev,
          [lecture.id]: {
            watched: Math.max(existing, Math.round(totalWatched)),
            duration: Math.round(isFinite(duration) ? duration : 0),
          },
        };
      });
    } finally {
      sendingRef.current = false;
    }
  }, [user.id]);

  useEffect(() => {
    Promise.all([
      getCourse(id),
      getReviews(id),
      getEnrollmentsByStudent(user.id),
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

        getCourseProgress(id, user.id)
          .then((res) => {
            const map = {};
            res.data.data.lectures.forEach((l) => {
              map[l.lectureId] = { watched: l.watchedSeconds, duration: l.durationSeconds };
            });
            setProgressMap(map);
          })
          .catch(() => {});
      })
      .catch(() => navigate('/courses', { replace: true }))
      .finally(() => setLoading(false));
  }, [id, navigate, user]);

  // 강의 변경 시 이전 강의 진행도 저장 후 초기화
  const switchLecture = useCallback((newIdx) => {
    if (currentLecture) {
      sendProgress(currentLecture);
    }
    accumulatedRef.current = 0;
    lastTimeRef.current = 0;
    setSelectedIdx(newIdx);
  }, [currentLecture, sendProgress]);

  // 30초마다 자동 저장
  useEffect(() => {
    const interval = setInterval(() => {
      if (currentLecture && accumulatedRef.current > 0) {
        sendProgress(currentLecture);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [currentLecture, sendProgress]);

  // 페이지 떠날 때 저장
  useEffect(() => {
    const handleUnload = () => {
      if (currentLecture && accumulatedRef.current > 0) {
        const duration = videoRef.current?.duration ?? 0;
        fetch(`/api/progress/lectures/${currentLecture.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId: user.id,
            watchedSeconds: Math.round(accumulatedRef.current),
            durationSeconds: Math.round(isFinite(duration) ? duration : 0),
          }),
          keepalive: true,
        });
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [currentLecture, user.id]);

  // 비디오 이벤트 핸들러
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    const current = video.currentTime;
    const diff = current - lastTimeRef.current;
    if (diff > 0 && diff <= MAX_TIME_DIFF && video.playbackRate <= MAX_COUNTED_SPEED) {
      accumulatedRef.current += diff;
    }
    lastTimeRef.current = current;
  };

  const handleSeeked = () => {
    if (videoRef.current) lastTimeRef.current = videoRef.current.currentTime;
  };

  const handlePause = () => sendProgress(currentLecture);
  const handleEnded = () => sendProgress(currentLecture);

  const getProgressPct = (lectureId, videoDuration) => {
    const p = progressMap[lectureId];
    if (!p) return 0;
    const dur = p.duration > 0 ? p.duration : (isFinite(videoDuration) ? videoDuration : 0);
    if (dur === 0) return 0;
    return Math.min(Math.round((p.watched / dur) * 100), 100);
  };

  const totalDuration = Object.values(progressMap).reduce((s, p) => s + p.duration, 0);
  const totalWatched = Object.values(progressMap).reduce((s, p) => s + p.watched, 0);
  const overallPct = totalDuration > 0 ? Math.min(Math.round((totalWatched / totalDuration) * 100), 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-gray-400">
        <p>불러오는 중...</p>
      </div>
    );
  }

  if (!course) return null;

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : course.averageRating?.toFixed(1) ?? '-';

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4 shrink-0 shadow-sm">
        <Link
          to={`/courses/${course.id}`}
          className="text-gray-500 hover:text-indigo-600 transition-colors text-sm flex items-center gap-1.5"
        >
          ← 강의 정보
        </Link>
        <div className="w-px h-4 bg-gray-300" />
        <h1 className="text-gray-900 font-semibold text-sm truncate flex-1">{course.title}</h1>
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-xs text-gray-500">전체 진행도</div>
          <div className="w-24 h-1.5 bg-gray-200 rounded-full">
            <div
              className="h-1.5 bg-indigo-500 rounded-full transition-all"
              style={{ width: `${overallPct}%` }}
            />
          </div>
          <span className="text-xs font-medium text-indigo-600">{overallPct}%</span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 flex flex-col bg-gray-50 min-w-0">
          {currentLecture?.videoUrl ? (
            <div className="w-full aspect-video bg-black">
              <video
                ref={videoRef}
                key={currentLecture.id}
                src={currentLecture.videoUrl}
                controls
                autoPlay
                className="w-full h-full"
                onTimeUpdate={handleTimeUpdate}
                onSeeked={handleSeeked}
                onPause={handlePause}
                onEnded={handleEnded}
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

          <div className="px-6 py-3 bg-white border-b border-gray-100">
            <p className="text-xs text-gray-400 mb-0.5">{selectedIdx + 1}강</p>
            <h2 className="text-base font-semibold text-gray-900">
              {currentLecture?.title || '제목 없음'}
            </h2>
            {overallPct < 70 && (
              <p className="text-xs text-orange-500 mt-1">
                전체 강의의 70% 이상 시청해야 리뷰를 작성할 수 있습니다. (현재 {overallPct}%)
              </p>
            )}
          </div>

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

        {/* 사이드바: 강의 목록 */}
        <aside className="w-72 shrink-0 bg-white border-l border-gray-200 flex flex-col overflow-y-auto">
          <div className="p-4 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">커리큘럼</p>
            <p className="text-gray-900 font-bold text-sm leading-snug">{course.title}</p>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full">
                <div
                  className="h-1.5 bg-indigo-500 rounded-full transition-all"
                  style={{ width: `${overallPct}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-indigo-600 shrink-0">{overallPct}%</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {lectures.length === 0 ? (
              <div className="p-4 text-center text-gray-400 text-sm">등록된 강의가 없습니다.</div>
            ) : (
              lectures.map((lecture, idx) => {
                const pct = getProgressPct(lecture.id);
                const isActive = idx === selectedIdx;
                return (
                  <button
                    key={lecture.id}
                    onClick={() => switchLecture(idx)}
                    className={`w-full text-left px-4 py-3.5 border-b border-gray-100 transition-colors ${
                      isActive ? 'bg-indigo-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                        pct >= 100
                          ? 'bg-green-500 text-white'
                          : isActive
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {pct >= 100 ? '✓' : idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${isActive ? 'text-indigo-700' : 'text-gray-800'}`}>
                          {lecture.title || `${idx + 1}강`}
                        </p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <div className="flex-1 h-1 bg-gray-200 rounded-full">
                            <div
                              className="h-1 bg-indigo-400 rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-400 shrink-0">{pct}%</span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="p-4 border-t border-gray-100">
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
