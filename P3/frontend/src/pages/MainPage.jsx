import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CourseCard from '../components/CourseCard';
import { CATEGORIES } from '../data/mockData';
import { getCourses } from '../api/courses';
import { useAuth } from '../context/AuthContext';

function ArrowRight() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function SectionHeader({ title, subtitle, link, linkLabel = '전체보기' }) {
  return (
    <div className="flex items-end justify-between mb-7">
      <div>
        <h2 className="text-2xl font-extrabold text-gray-900 mb-1">{title}</h2>
        {subtitle && <p className="text-gray-500 text-sm">{subtitle}</p>}
      </div>
      {link && (
        <Link
          to={link}
          className="flex items-center gap-1 text-sm text-indigo-600 font-semibold hover:text-indigo-700 transition-colors group"
        >
          {linkLabel}
          <span className="group-hover:translate-x-0.5 transition-transform">
            <ArrowRight />
          </span>
        </Link>
      )}
    </div>
  );
}

export default function MainPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [newestCourses, setNewestCourses] = useState([]);
  const [popularCourses, setPopularCourses] = useState([]);

  useEffect(() => {
    getCourses({ sort: 'newest', size: 4 })
      .then((res) => setNewestCourses(res.data.data.courses))
      .catch(() => {});
    getCourses({ sort: 'popular', size: 4 })
      .then((res) => setPopularCourses(res.data.data.courses))
      .catch(() => {});
  }, []);

  return (
    <div>
      {/* 히어로 배너 */}
      <section className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 text-white py-24 px-4 overflow-hidden">
        {/* 장식용 원형 */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-violet-500/30 rounded-full -translate-y-1/2 pointer-events-none" />

        <div className="max-w-7xl mx-auto relative">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-indigo-100 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            IT 강의 플랫폼
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-5 leading-tight tracking-tight">
            누구나 쉽게 시작하는<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 to-violet-200">
              DevClass
            </span>
          </h1>
          <p className="text-indigo-100 text-lg mb-10 max-w-xl leading-relaxed">
            알고리즘부터 웹개발, AI/데이터, DevOps까지 —<br className="hidden md:block" />
            취업과 성장을 위한 IT 강의를 한 곳에서.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/courses"
              className="bg-white text-indigo-700 font-bold px-7 py-3.5 rounded-xl hover:bg-indigo-50 transition-colors shadow-lg shadow-indigo-900/20"
            >
              강의 둘러보기
            </Link>
            {user?.role === 'instructor' && (
              <Link
                to="/courses/new"
                className="border-2 border-white/30 text-white font-semibold px-7 py-3.5 rounded-xl hover:bg-white/10 transition-colors"
              >
                강의 등록하기
              </Link>
            )}
          </div>

          {/* 통계 */}
          <div className="flex flex-wrap gap-8 mt-14 pt-10 border-t border-white/10">
            {[
              { value: '1,000+', label: '등록 강의' },
              { value: '50,000+', label: '수강생' },
              { value: '4.8', label: '평균 별점' },
            ].map(({ value, label }) => (
              <div key={label}>
                <div className="text-3xl font-black text-white">{value}</div>
                <div className="text-indigo-200 text-sm mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 카테고리 */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <SectionHeader title="카테고리별 강의" subtitle="원하는 분야를 선택해 바로 탐색하세요" />
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => navigate(`/courses?category=${encodeURIComponent(cat.value)}`)}
              className="flex flex-col items-center gap-2.5 p-5 bg-white rounded-2xl border border-gray-100 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-100/50 hover:-translate-y-0.5 transition-all duration-200 group"
            >
              <span className="text-3xl group-hover:scale-110 transition-transform duration-200">{cat.icon}</span>
              <span className="text-xs font-semibold text-gray-700 text-center leading-tight">{cat.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* 신규 강의 */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <SectionHeader
            title="신규 강의"
            subtitle="새롭게 등록된 강의를 만나보세요"
            link="/courses?sort=newest"
          />
          {newestCourses.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {newestCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="aspect-video bg-gray-100 animate-pulse" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
                    <div className="h-4 bg-gray-100 rounded animate-pulse" />
                    <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 인기 강의 */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <SectionHeader
            title="인기 강의"
            subtitle="수강생이 가장 많이 선택한 강의"
            link="/courses?sort=popular"
          />
          {popularCourses.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {popularCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="aspect-video bg-gray-100 animate-pulse" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
                    <div className="h-4 bg-gray-100 rounded animate-pulse" />
                    <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA 배너 - 강사에게만 표시 */}
      {user?.role === 'instructor' && (
        <section className="relative bg-gradient-to-r from-indigo-600 to-violet-700 py-16 px-4 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-black/10 rounded-full translate-y-1/2" />
          </div>
          <div className="max-w-2xl mx-auto text-center relative">
            <div className="inline-block text-4xl mb-4">🎓</div>
            <h2 className="text-2xl md:text-3xl font-black text-white mb-3">강의를 등록해보세요!</h2>
            <p className="text-indigo-200 mb-8 text-base">
              지금 바로 강의를 등록하고 수강생들과 지식을 나눠보세요.
            </p>
            <Link
              to="/courses/new"
              className="inline-block bg-white text-indigo-700 font-bold px-10 py-4 rounded-xl hover:bg-indigo-50 transition-colors shadow-xl shadow-indigo-900/20 text-base"
            >
              강의 등록하기
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}