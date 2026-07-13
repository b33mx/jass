import { useEffect, useMemo, useState } from 'react';
import { calculatePayroll, closePeriod, getAllPeriods, type Period } from '../api/period.api';
import { createReportLink } from '../api/report.api';

function shortDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function PayrollPage() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [closedTotals, setClosedTotals] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null);
  const [closing, setClosing] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [prefetchedUrl, setPrefetchedUrl] = useState<string | null>(null);

  async function fetchPeriods() {
    const data = await getAllPeriods();
    setPeriods(data);
    return data;
  }

  useEffect(() => {
    fetchPeriods()
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const sortedPeriods = useMemo(
    () => [...periods].sort((a, b) => b.start_date.localeCompare(a.start_date)),
    [periods],
  );

  useEffect(() => {
    const closed = sortedPeriods.filter((p) => !p.is_active);
    if (closed.length === 0) {
      setClosedTotals({});
      return;
    }
    Promise.all(
      closed.map(async (period) => {
        const payroll = await calculatePayroll(period.period_id);
        return [period.period_id, payroll.total] as const;
      }),
    )
      .then((entries) => setClosedTotals(Object.fromEntries(entries)))
      .catch(() => {
        // best-effort only
      });
  }, [sortedPeriods]);

  useEffect(() => {
    if (!selectedPeriod) { setPrefetchedUrl(null); return; }
    setPrefetchedUrl(null);
    createReportLink({ kind: 'payroll-packet', period_id: selectedPeriod.period_id })
      .then(setPrefetchedUrl)
      .catch(() => {});
  }, [selectedPeriod]);

  async function onClosePeriod() {
    if (!selectedPeriod || !selectedPeriod.is_active) return;
    if (!window.confirm('ยืนยันปิดงวดนี้?')) return;
    setClosing(true);
    setError(null);
    try {
      const payroll = await calculatePayroll(selectedPeriod.period_id);
      await closePeriod(selectedPeriod.period_id);
      setClosedTotals((prev) => ({ ...prev, [selectedPeriod.period_id]: payroll.total }));
      const updated = await fetchPeriods();
      const refreshed = updated.find((p) => p.period_id === selectedPeriod.period_id) ?? null;
      if (refreshed) setSelectedPeriod(refreshed);
      setSelectedPeriod(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
      } finally {
      setClosing(false);
    }
  }

  async function onCopyReportLink(period: Period) {
    const reportUrl = prefetchedUrl ?? await createReportLink({ kind: 'payroll-packet', period_id: period.period_id }).catch(() => null);
    if (!reportUrl) { setCopySuccess(true); window.setTimeout(() => setCopySuccess(false), 1800); return; }
    const text = `สวัสดีค่า 😊\nรายงานเงินเดือนงวดวันที่ ${shortDate(period.start_date)} - ${shortDate(period.end_date)} พร้อมแล้วนะคะ ✨\nกดดูรายงานได้ที่ลิงก์นี้เลยค่ะ 🔗\n${reportUrl}`;
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopySuccess(true);
    window.setTimeout(() => setCopySuccess(false), 1800);
  }

  async function onOpenReport(period: Period) {
    try {
      setError(null);
      const reportUrl = prefetchedUrl ?? await createReportLink({ kind: 'payroll-packet', period_id: period.period_id });
      window.open(reportUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ไม่สามารถเปิดรายงานได้');
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4 px-1 sm:px-0">
      <section className="overflow-hidden rounded-3xl shadow-lg shadow-zinc-200/80">
        <div className="relative bg-brandRed px-4 pb-9 pt-5 sm:px-6 sm:pb-10 sm:pt-6">
          <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10" />
          <div className="relative mt-2">
            <h1 className="text-lg font-bold text-white sm:text-xl">คำนวณเงินเดือน</h1>
            <p className="mt-0.5 max-w-2xl text-xs text-white/80 sm:text-sm">งวดใหม่อยู่บนเสมอ แตะงวดที่ยังไม่ปิดเพื่อดูรายงานหรือปิดงวด</p>
          </div>
        </div>
        <div className="-mt-5 rounded-t-3xl bg-white px-3 pb-5 pt-5 sm:px-4 sm:pb-6 sm:pt-6">
          {loading && <p className="text-sm text-zinc-500">กำลังโหลดงวด...</p>}
          {error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

          {!loading && (
            <div className="grid gap-3 md:grid-cols-2">
              {sortedPeriods.length === 0 && (
                <p className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-500">ยังไม่มีข้อมูลงวด</p>
              )}
              {sortedPeriods.map((period) => (
                <button
                  key={period.period_id}
                  type="button"
                  onClick={() => setSelectedPeriod(period)}
                  className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <p className="text-sm font-bold leading-5 text-zinc-900">งวด {shortDate(period.start_date)} - {shortDate(period.end_date)}</p>
                  {period.is_active ? (
                    <span className="mt-2 inline-flex items-center rounded-full border border-amber-300 bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
                      ยังไม่ปิดงวด
                    </span>
                  ) : (
                    <span className="mt-2 inline-flex items-center rounded-full border border-emerald-300 bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-800">
                      ปิดงวดแล้ว
                    </span>
                  )}
                  {!period.is_active && (
                    <>
                      <p className="mt-3 text-xs text-zinc-500">เงินเดือนที่จ่ายไป</p>
                      <p className="text-sm font-bold text-zinc-900">
                        {closedTotals[period.period_id] !== undefined
                          ? `${closedTotals[period.period_id].toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท`
                          : 'กำลังคำนวณ...'}
                      </p>
                    </>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {selectedPeriod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/45 p-3">
          <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-base font-bold text-zinc-900">งวด {shortDate(selectedPeriod.start_date)} - {shortDate(selectedPeriod.end_date)}</p>
                <p className="text-xs text-zinc-500">เลือกการทำงานของงวดนี้</p>
              </div>
              <button type="button" onClick={() => { setSelectedPeriod(null); setCopySuccess(false); }} className="text-xs font-semibold text-zinc-500">ปิด</button>
            </div>

            <div className="mt-3 space-y-2">
              <button
                type="button"
                onClick={() => onOpenReport(selectedPeriod)}
                className="w-full rounded-xl border border-brandRed/30 bg-white px-3 py-3 text-left transition hover:bg-rose-50"
              >
                <p className="text-sm font-bold text-brandRed">ดูรายงานเงินเดือน</p>
                <p className="mt-1 text-xs text-brandRed/80">เปิดแท็บใหม่เสมอ</p>
              </button>

              <button
                type="button"
                onClick={() => onCopyReportLink(selectedPeriod)}
                className="w-full rounded-xl border border-brandRed/30 bg-white px-3 py-3 text-left transition hover:bg-rose-50"
              >
                <p className="text-sm font-bold text-brandRed">คัดลอกลิงก์รายงาน</p>
                <p className="mt-1 text-xs text-brandRed/80">คัดลอกข้อความพร้อมลิงก์สำหรับส่งต่อ</p>
              </button>
              {copySuccess && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                  <svg className="h-4 w-4 shrink-0 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs font-semibold text-emerald-700">คัดลอกเรียบร้อย</span>
                </div>
              )}

              <button
                type="button"
                onClick={onClosePeriod}
                disabled={closing || !selectedPeriod.is_active}
                className="w-full rounded-xl border border-brandRed/20 bg-brandRed px-3 py-3 text-left text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                <p className="text-sm font-bold">{closing ? 'กำลังปิดงวด...' : 'ปิดงวด'}</p>
                <p className="mt-1 text-xs text-white/80">เปลี่ยนสถานะเป็นปิดงวดแล้ว</p>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
