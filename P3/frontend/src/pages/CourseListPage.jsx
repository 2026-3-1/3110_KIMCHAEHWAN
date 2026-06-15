import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import CourseCard from '../components/CourseCard';
import { getCourses } from '../api/courses';
import { getEnrollmentsByStudent } from '../api/enrollments';
import { useAuth } from '../context/AuthContext';

const ALL_CATEGORIES = ['전체', '알고리즘/자료구조', '웹 개발', '앱 개발', '데이터베이스', 'AI/데이터', 'DevOps'];
const LEVELS = [
  { label: '전체', value: '' },
  { label: '입문', value: 'beginner' },
  { label: '중급', value: 'intermediate' },
  { label: '고급', value: 'advanced' },
];
const SORTS = [
  { label: '최신순', value: 'newest' },
  { label: '인기순', value: 'popular' },
  { label: '평점순', value: 'rating' },
  { label: '가격낮은순', value: 'price_asc' },
  { label: '가격높은순', value: 'price_desc' },
];
const SIZE = 8;

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="aspect-video bg-gray-100 animate-pulse" />
      <div className="p-4 space-y-2.5">
        <div className="h-3 bg-gray-100 rounded-lg animate-pulse w-1/2" />
        <div className="h-4 bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-4 bg-gray-100 rounded-lg animate-pulse w-3/4" />
        <div className="flex justify-between pt-2">
          <div className="h-3 bg-gray-100 rounded animate-pulse w-16" />
          <div className="h-3 bg-gray-100 rounded animate-pulse w-12" />
        </div>
      </div>
    </div>
  );
}

export default function CourseListPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get('category') ?? '';
  const level = searchParams.get('level') ?? '';
  const sort = searchParams.get('sort') ?? 'newest';
  const keyword = searchParams.get('keyword') ?? '';
  const page = parseInt(searchParams.get('page') ?? '0');

  const [courses, setCourses] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [enrolledIds, setEnrolledIds] = useState(new Set());

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    next.delete('page');
    setSearchParams(next);
  };
  const setPage = (p) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(p));
    setSearchParams(next);
  };

  useEffect(() => {
    if (user?.role !== 'student') return;
    getEnrollmentsByStudent(user.id)
      .then((res) => {
        const ids = new Set(res.data.data.map((e) => e.courseId));
        setEnrolledIds(ids);
      })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    setLoading(true);
    getCourses({ keyword: keyword || undefined, category: category || undefined, level: level || undefined, sort, page, size: SIZE })
      .then((res) => {
        setCourses(res.data.data.courses);
        setTotalCount(res.data.data.totalCount);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [keyword, category, level, sort, page]);

  const totalPages = Math.ceil(totalCount / SIZE);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* 검색 결과 배너 */}
      {keyword && (
        <div className="mb-6 p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center gap-3">
          <span className="text-indigo-500 text-xl">🔍</span>
          <p className="text-gray-700 text-sm">
            <span className="font-bold text-indigo-700">"{keyword}"</span> 검색 결과{' '}
            <span className="font-semibold text-gray-800">{totalCount}개</span>
          </p>
          <button
            onClick={() => setParam('keyword', '')}
            className="ml-auto text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕ 초기화
          </button>
        </div>
      )}

      {/* 필터 영역 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 shadow-sm">
        {/* 카테고리 필터 */}
        <div className="flex flex-wrap gap-2 mb-3">
          {ALL_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setParam('category', cat === '전체' ? '' : cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${
                (cat === '전체' && !category) || cat === category
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200'
                  : 'bg-gray-50 text-gray-600 border-transparent hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 난이도 + 정렬 */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {LEVELS.map((l) => (
              <button
                key={l.value}
                onClick={() => setParam('level', l.value)}
                className={`px-3 py-1 rounded-lg text-sm font-medium border transition-all ${
                  level === l.value
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-transparent text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-700'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400 font-medium">총 <span className="text-gray-700 font-bold">{totalCount}</span>개</span>
            <select
              value={sort}
              onChange={(e) => setParam('sort', e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 강의 그리드 */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {[...Array(SIZE)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : courses.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              isEnrolled={enrolledIds.has(course.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-24">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-xl font-bold text-gray-700 mb-2">검색 결과가 없습니다</p>
          <p className="text-sm text-gray-400 mb-6">다른 키워드나 필터를 사용해보세요.</p>
          <button
            onClick={() => setSearchParams(new URLSearchParams())}
            className="inline-block bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            전체 강의 보기
          </button>
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-12">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 0}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 disabled:opacity-30 hover:bg-gray-50 transition-colors font-medium"
          >
            ← 이전
          </button>
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className={`w-9 h-9 rounded-xl text-sm font-semibold transition-all ${
                i === page
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                  : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setPage(page + 1)}
            disabled={page >= totalPages - 1}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 disabled:opacity-30 hover:bg-gray-50 transition-colors font-medium"
          >
            다음 →
          </button>
        </div>
      )}
    </div>
  );
}