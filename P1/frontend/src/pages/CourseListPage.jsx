import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import CourseCard from '../components/CourseCard';
import { getCourses } from '../api/courses';

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
];
const SIZE = 8;

export default function CourseListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get('category') ?? '';
  const level = searchParams.get('level') ?? '';
  const sort = searchParams.get('sort') ?? 'newest';
  const keyword = searchParams.get('keyword') ?? '';
  const page = parseInt(searchParams.get('page') ?? '0');

  const [courses, setCourses] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

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
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* 검색 결과 표시 */}
      {keyword && (
        <div className="mb-5 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
          <p className="text-gray-700 text-sm">
            <span className="font-semibold text-indigo-700">"{keyword}"</span> 검색 결과{' '}
            <span className="text-gray-500">({totalCount}개)</span>
          </p>
        </div>
      )}

      {/* 카테고리 필터 */}
      <div className="flex flex-wrap gap-2 mb-5">
        {ALL_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setParam('category', cat === '전체' ? '' : cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
              (cat === '전체' && !category) || cat === category
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400 hover:text-indigo-600'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 난이도 + 정렬 */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex gap-2">
          {LEVELS.map((l) => (
            <button
              key={l.value}
              onClick={() => setParam('level', l.value)}
              className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                level === l.value
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-gray-500'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">총 {totalCount}개</span>
          <select
            value={sort}
            onChange={(e) => setParam('sort', e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 강의 그리드 */}
      {loading ? (
        <div className="text-center py-24 text-gray-400">
          <p className="text-lg">불러오는 중...</p>
        </div>
      ) : courses.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 text-gray-400">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-lg font-medium mb-2">검색 결과가 없습니다</p>
          <p className="text-sm">다른 키워드나 필터를 사용해보세요.</p>
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-12">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 0}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            ← 이전
          </button>
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                i === page
                  ? 'bg-indigo-600 text-white'
                  : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setPage(page + 1)}
            disabled={page >= totalPages - 1}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            다음 →
          </button>
        </div>
      )}
    </div>
  );
}
