import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

interface Period {
  period_id: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

function shortDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function SelectPeriodPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('t') ?? '';
  const [periods, setPeriods] = useState<Period[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('ลิงก์ไม่ถูกต้อง');
      setLoading(false);
      return;
    }
    fetch(`/api/reports/active-periods?t=${encodeURIComponent(token)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setPeriods(Array.isArray(data) ? data : []);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'โหลดข้อมูลไม่ได้'))
      .finally(() => setLoading(false));
  }, [token]);

  function openReport(periodId: number) {
    window.open(
      `/api/reports/work-period?t=${encodeURIComponent(token)}&period_id=${periodId}`,
      '_blank',
      'noopener,noreferrer',
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <section className="overflow-hidden rounded-3xl shadow-lg shadow-zinc-200/80">
        <div className="relative bg-brandRed px-4 pb-9 pt-5 sm:px-6">
          <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10" />
          <div className="relative mt-2">
            <h1 className="text-lg font-bold text-white">เลือกงวด</h1>
            <p className="mt-0.5 text-xs text-white/80">
              วันที่ปัจจุบันไม่ตรงกับงวดที่มีอยู่ กรุณาเลือกงวดที่ต้องการ
            </p>
          </div>
        </div>

        <div className="-mt-5 rounded-t-3xl bg-white px-3 pb-5 pt-5 sm:px-4">
          {loading && <p className="text-sm text-zinc-500">กำลังโหลด...</p>}

          {error && (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
          )}

          {!loading && !error && periods.length === 0 && (
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 text-center">
              <p className="text-sm font-semibold text-zinc-700">ไม่มีงวดที่เปิดอยู่</p>
              <p className="mt-1 text-xs text-zinc-500">กรุณาติดต่อผู้ดูแลระบบเพื่อเปิดงวดใหม่</p>
            </div>
          )}

          {periods.length > 0 && (
            <div className="space-y-2">
              {periods.map((p) => (
                <button
                  key={p.period_id}
                  type="button"
                  onClick={() => openReport(p.period_id)}
                  className="flex w-full items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50/70 px-4 py-3 text-left transition hover:bg-zinc-100 active:scale-[0.98]"
                >
                  <div>
                    <p className="text-sm font-bold text-zinc-900">
                      {shortDate(p.start_date)} – {shortDate(p.end_date)}
                    </p>
                    <span className="mt-1 inline-flex items-center rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                      เปิดอยู่
                    </span>
                  </div>
                  <svg
                    className="h-4 w-4 shrink-0 text-zinc-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
