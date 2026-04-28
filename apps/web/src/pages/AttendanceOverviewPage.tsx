import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMissingDates } from '../api/attendance.api';
import { getAllPeriods, type Period } from '../api/period.api';

function eachDayInRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const cur = new Date(start + 'T00:00:00');
  const last = new Date(end + 'T00:00:00');
  while (cur <= last) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

function formatThaiDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' });
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
}

type DateStatus = 'logged' | 'missing' | 'future';

function StatusBadge({ status }: { status: DateStatus }) {
  if (status === 'logged') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        ลงเวลาแล้ว
      </span>
    );
  }
  if (status === 'missing') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l2 2" />
          <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        ยังไม่ลงเวลา
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-semibold text-zinc-400">
      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <circle cx="12" cy="12" r="9" strokeLinecap="round" />
      </svg>
      ยังไม่ถึงวัน
    </span>
  );
}

export function AttendanceOverviewPage() {
  const navigate = useNavigate();
  const today = new Date().toISOString().slice(0, 10);

  const [loading, setLoading] = useState(true);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);
  const [missingDates, setMissingDates] = useState<Set<string>>(new Set());
  const [loadingDates, setLoadingDates] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAllPeriods()
      .then((ps) => {
        if (ps.length === 0) {
          setLoading(false);
          return;
        }
        setPeriods(ps);
        const active = ps.find((p) => p.is_active) ?? ps[0];
        setSelectedPeriodId(active.period_id);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedPeriodId) return;
    setLoadingDates(true);
    getMissingDates(selectedPeriodId)
      .then((dates) => setMissingDates(new Set(dates)))
      .catch((err) => setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด'))
      .finally(() => setLoadingDates(false));
  }, [selectedPeriodId]);

  const selectedPeriod = periods.find((p) => p.period_id === selectedPeriodId) ?? null;
  const allDates = selectedPeriod ? eachDayInRange(selectedPeriod.start_date, selectedPeriod.end_date) : [];

  function getStatus(date: string): DateStatus {
    if (date > today) return 'future';
    if (missingDates.has(date)) return 'missing';
    return 'logged';
  }

  function handleDateClick(date: string) {
    if (!selectedPeriod) return;
    navigate('/attendance/log', { state: { period: selectedPeriod, date } });
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-md space-y-3 px-4">
        <div className="h-32 animate-pulse rounded-3xl bg-zinc-200" />
        <div className="h-12 animate-pulse rounded-2xl bg-zinc-100" />
        <div className="h-12 animate-pulse rounded-2xl bg-zinc-100" />
      </div>
    );
  }

  const noPeriod = periods.length === 0;

  return (
    <div className="mx-auto max-w-md">
      <div className="overflow-hidden rounded-3xl shadow-lg shadow-zinc-200/80">

        {/* Header */}
        <div className="relative bg-brandRed px-6 pb-10 pt-6">
          <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10" />
          <div className="absolute -right-2 top-10 h-16 w-16 rounded-full bg-white/5" />
          <div className="relative flex items-center justify-between mt-2">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">ลงเวลางาน</h1>
                <p className="mt-0.5 text-sm text-white/60">
                  {selectedPeriod
                    ? `งวด ${formatShortDate(selectedPeriod.start_date)} – ${formatShortDate(selectedPeriod.end_date)}`
                    : 'ยังไม่มีงวด'}
                </p>
              </div>
            </div>
            {!noPeriod && (
              <button
                type="button"
                onClick={() => navigate('/periods/new')}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-sm transition hover:bg-white/30"
                title="สร้างงวดใหม่"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="-mt-5 rounded-t-3xl bg-white px-4 pb-6 pt-6">

          {/* No period state */}
          {noPeriod && (
            <div className="text-center py-4">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100">
                <svg className="h-8 w-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-zinc-700">ยังไม่มีงวดที่เปิดอยู่</p>
              <p className="mt-1 text-xs text-zinc-400">สร้างงวดใหม่เพื่อเริ่มลงเวลางาน</p>
              <button
                type="button"
                onClick={() => navigate('/periods/new')}
                className="mt-5 w-full rounded-2xl bg-brandRed py-4 text-sm font-bold tracking-wide text-white shadow-md shadow-brandRed/30 transition hover:opacity-90 active:scale-[0.98]"
              >
                สร้างงวดใหม่
              </button>
            </div>
          )}

          {/* Period selector */}
          {periods.length > 1 && (
            <div className="mb-4">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-zinc-400">เลือกงวด</p>
              <select
                value={selectedPeriodId ?? ''}
                onChange={(e) => setSelectedPeriodId(Number(e.target.value))}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none transition focus:border-brandRed focus:bg-white focus:ring-2 focus:ring-brandRed/10"
              >
                {periods.map((p) => (
                  <option key={p.period_id} value={p.period_id}>
                    {formatShortDate(p.start_date)} – {formatShortDate(p.end_date)}
                    {p.is_active ? ' (เปิดอยู่)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date list */}
          {selectedPeriod && (
            <>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
                วันทั้งหมดในงวด
              </p>

              {error && (
                <div className="mb-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-red-200">
                  {error}
                </div>
              )}

              {loadingDates ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-14 animate-pulse rounded-2xl bg-zinc-100" />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-zinc-100 overflow-hidden rounded-2xl ring-1 ring-zinc-100">
                  {allDates.map((date) => {
                    const status = getStatus(date);
                    const clickable = status !== 'future';
                    return (
                      <button
                        key={date}
                        type="button"
                        disabled={!clickable}
                        onClick={() => clickable && handleDateClick(date)}
                        className={`flex items-center justify-between px-4 py-3 text-left transition ${
                          clickable
                            ? 'bg-white hover:bg-zinc-50 active:bg-zinc-100'
                            : 'cursor-default bg-zinc-50/50'
                        } ${date === today ? 'ring-inset ring-1 ring-brandRed/20' : ''}`}
                      >
                        <div className="min-w-0">
                          <p className={`text-sm font-medium leading-tight ${clickable ? 'text-zinc-800' : 'text-zinc-400'}`}>
                            {formatThaiDate(date)}
                          </p>
                          {date === today && (
                            <p className="mt-0.5 text-[11px] font-semibold text-brandRed">วันนี้</p>
                          )}
                        </div>
                        <div className="ml-3 flex shrink-0 items-center gap-2">
                          <StatusBadge status={status} />
                          {clickable && (
                            <svg className="h-4 w-4 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
