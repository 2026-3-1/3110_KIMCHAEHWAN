import { Link } from 'react-router-dom';

const LEVEL_LABEL = { beginner: '입문', intermediate: '중급', advanced: '고급' };
const LEVEL_COLOR = {
  beginner: 'bg-green-100 text-green-700',
  intermediate: 'bg-yellow-100 text-yellow-700',
  advanced: 'bg-red-100 text-red-700',
};

export default function CourseCard({ course }) {
  return (
    <Link
      to={`/courses/${course.id}`}
      className="block bg-white rounded-2xl border border-gray-200 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden group"
    >
      {/* 썸네일 */}
      <div className="aspect-video bg-gray-100 overflow-hidden">
        {course.thumbnailUrl ? (
          <img
            src={course.thumbnailUrl}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">📖</div>
        )}
      </div>

      <div className="p-4">
        {/* 뱃지 */}
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-xs text-indigo-600 font-medium">{course.category}</span>
          <span className="text-gray-300">·</span>
          <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${LEVEL_COLOR[course.level]}`}>
            {LEVEL_LABEL[course.level] ?? course.level}
          </span>
        </div>

        {/* 제목 */}
        <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-1 leading-snug group-hover:text-indigo-600 transition-colors">
          {course.title}
        </h3>

        {/* 강사 */}
        <p className="text-xs text-gray-400 mb-3">{course.instructorName}</p>

        {/* 하단: 별점 + 가격 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="text-yellow-400 text-xs">★</span>
            <span className="text-xs font-semibold text-gray-800">
              {course.averageRating?.toFixed(1) ?? '-'}
            </span>
            <span className="text-xs text-gray-400">
              ({course.enrollmentCount?.toLocaleString()})
            </span>
          </div>
          <span className={`text-sm font-bold ${course.price === 0 ? 'text-indigo-600' : 'text-gray-900'}`}>
            {course.price === 0 ? '무료' : `${course.price.toLocaleString()}원`}
          </span>
        </div>
      </div>
    </Link>
  );
}
