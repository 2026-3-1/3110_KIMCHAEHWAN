import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { initPayment, confirmPayment } from '../api/payments';

function loadTossScript() {
  return new Promise((resolve, reject) => {
    if (window.TossPayments) return resolve(window.TossPayments);
    const script = document.createElement('script');
    script.src = 'https://js.tosspayments.com/v2/standard';
    script.onload = () => resolve(window.TossPayments);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export function PaymentPage() {
  const { id: courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) { navigate('/login', { replace: true }); return; }

    let cancelled = false;
    async function start() {
      try {
        const res = await initPayment({ studentId: user.id, courseId: Number(courseId) });
        const data = res.data.data;

        // 무료 강의 - 서버에서 이미 수강 신청 완료
        if (!data) {
          navigate('/my-courses', { replace: true });
          return;
        }

        const TossPayments = await loadTossScript();
        if (cancelled) return;

        const toss = TossPayments(data.clientKey);
        const payment = toss.payment({ customerKey: `user-${user.id}` });

        await payment.requestPayment({
          method: 'CARD',
          amount: { currency: 'KRW', value: data.amount },
          orderId: data.orderId,
          orderName: data.orderName,
          successUrl: data.successUrl,
          failUrl: data.failUrl,
        });
      } catch (e) {
        if (!cancelled) {
          setError(e.response?.data?.message ?? '결제를 시작할 수 없습니다.');
          setStatus('error');
        }
      }
    }
    start();
    return () => { cancelled = true; };
  }, [courseId, user, navigate]);

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl shadow p-8 w-full max-w-sm text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">결제 오류</h2>
          <p className="text-sm text-gray-500 mb-6">{error}</p>
          <Link to={`/courses/${courseId}`} className="inline-block bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700">
            강의로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center text-gray-500">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm">결제 페이지로 이동 중...</p>
      </div>
    </div>
  );
}

export function PaymentSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    const paymentKey = searchParams.get('paymentKey');
    const orderId = searchParams.get('orderId');
    const amount = Number(searchParams.get('amount'));

    if (!paymentKey || !orderId || !amount) {
      setError('잘못된 결제 정보입니다.');
      setStatus('error');
      return;
    }

    confirmPayment({ paymentKey, orderId, amount })
      .then(() => setStatus('done'))
      .catch((e) => {
        setError(e.response?.data?.message ?? '결제 승인에 실패했습니다.');
        setStatus('error');
      });
  }, [searchParams]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm">결제 승인 처리 중...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl shadow p-8 w-full max-w-sm text-center">
          <div className="text-5xl mb-4">❌</div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">결제 승인 실패</h2>
          <p className="text-sm text-gray-500 mb-6">{error}</p>
          <Link to="/courses" className="inline-block bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700">
            강의 목록으로
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow p-8 w-full max-w-sm text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">결제 완료!</h2>
        <p className="text-sm text-gray-500 mb-6">수강 신청이 완료되었습니다.</p>
        <button
          onClick={() => navigate('/my-courses', { replace: true })}
          className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors"
        >
          내 강의로 이동
        </button>
      </div>
    </div>
  );
}

export function PaymentFailPage() {
  const [searchParams] = useSearchParams();
  const message = searchParams.get('message') ?? '결제가 취소되었습니다.';
  const orderId = searchParams.get('orderId');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow p-8 w-full max-w-sm text-center">
        <div className="text-5xl mb-4">❌</div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">결제 실패</h2>
        <p className="text-sm text-gray-500 mb-2">{message}</p>
        {orderId && <p className="text-xs text-gray-400 mb-6">주문번호: {orderId}</p>}
        <Link to="/courses" className="inline-block w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors">
          강의 목록으로
        </Link>
      </div>
    </div>
  );
}
