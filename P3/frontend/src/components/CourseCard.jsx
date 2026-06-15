import { Link } from 'react-router-dom';

const LEVEL_LABEL = { beginner: '입문', intermediate: '중급', advanced: '고급' };
const LEVEL_COLOR = {
  beginner: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  intermediate: 'bg-amber-50 text-amber-700 border border-amber-200',
  advanced: 'bg-rose-50 text-rose-700 border border-rose-200',
};

const CATEGORY_GRADIENT = {
  '알고리즘/자료구조': 'from-blue-400 to-indigo-500',
  '웹 개발': 'from-violet-400 to-purple-500',
  '앱 개발': 'from-pink-400 to-rose-500',
  '데이터베이스': 'from-cyan-400 to-teal-500',
  'AI/데이터': 'from-orange-400 to-amber-500',
  'DevOps': 'from-green-400 to-emerald-500',
};

const CATEGORY_ICON = {
  '알고리즘/자료구조': '🧩',
  '웹 개발': '🌐',
  '앱 개발': '📱',
  '데이터베이스': '🗄️',
  'AI/데이터': '🤖',
  'DevOps': '⚙️',
};

export default function CourseCard({ course, isEnrolled = false }) {
  const gradient = CATEGORY_GRADIENT[course.category] ?? 'from-indigo-400 to-violet-500';
  const icon = CATEGORY_ICON[course.category] ?? '📖';

  return (
    <Link
      to={`/courses/${course.id}`}
      className="block bg-white rounded-2xl border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 overflow-hidden group relative"
    >
      {isEnrolled && (
        <div className="absolute top-2.5 right-2.5 z-10 bg-emerald-500 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full shadow-sm">
          수강 중
        </div>
      )}

      {/* 썸네일 */}
      <div className="aspect-video overflow-hidden">
        {course.thumbnailUrl ? (
          <img
            src={course.thumbnailUrl}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
            <span className="text-4xl">{icon}</span>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-xs text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded-md">
            {course.category}
          </span>
          <span className={`text-xs font-medium px-1.5 py-0.5 rounded-md ${LEVEL_COLOR[course.level] ?? 'bg-gray-50 text-gray-600'}`}>
            {LEVEL_LABEL[course.level] ?? course.level}
          </span>
        </div>

        <h3 className="font-bold text-gray-900 text-sm line-clamp-2 mb-1.5 leading-snug group-hover:text-indigo-600 transition-colors">
          {course.title}
        </h3>

        <p className="text-xs text-gray-400 mb-3 font-medium">{course.instructorName}</p>

        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
          <div className="flex items-center gap-1">
            <span className="text-yellow-400 text-sm">★</span>
            <span className="text-xs font-bold text-gray-800">
              {course.averageRating?.toFixed(1) ?? '-'}
            </span>
            <span className="text-xs text-gray-400">
              ({course.enrollmentCount?.toLocaleString()})
            </span>
          </div>
          <span className={`text-sm font-extrabold ${course.price === 0 ? 'text-indigo-600' : 'text-gray-900'}`}>
            {course.price === 0 ? '무료' : `${course.price.toLocaleString()}원`}
          </span>
        </div>
      </div>
    </Link>
  );
}