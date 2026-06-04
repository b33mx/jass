import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { closePeriod, getAllPeriods, type Period } from '../api/period.api';
import { createReportLink, type ReportKind } from '../api/report.api';

function shortDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function PayrollPeriodPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const periodId = Number(id);
  const [period, setPeriod] = useState<Period | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showViewer, setShowViewer] = useState(false);
  const [showReportPicker, setShowReportPicker] = useState(false);
  const [viewerTitle, setViewerTitle] = useState('รายงาน');
  const [viewerUrl, setViewerUrl] = useState('');
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (!Number.isInteger(periodId) || periodId <= 0) {
      setError('รหัสงวดไม่ถูกต้อง');
      setLoading(false);
      return;
    }
    getAllPeriods()
      .then((data) => {
        const target = data.find((p) => p.period_id === periodId) ?? null;
        if (!target) setError('ไม่พบงวดที่เลือก');
        setPeriod(target);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [periodId]);

  const title = useMemo(() => {
    if (!period) return '-';
    return `${shortDate(period.start_date)} - ${shortDate(period.end_date)}`;
  }, [period]);

  function openViewer(titleText: string, src: string) {
    setViewerTitle(titleText);
    setViewerUrl(src);
    setShowViewer(true);
  }

  async function openSignedViewer(titleText: string, kind: ReportKind, hash: string) {
    if (!period) return;
    setShowReportPicker(false);
    try {
      setError(null);
      const reportUrl = await createReportLink({ kind, period_id: period.period_id });
      openViewer(titleText, `${reportUrl}${hash}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ไม่สามารถเปิดรายงานได้');
    }
  }

  async function onClosePeriod() {
    if (!period) return;
    if (!window.confirm('ยืนยันปิดงวดนี้? เมื่อปิดแล้วจะย้ายไปสถานะปิดงวดแล้ว')) return;
    setClosing(true);
    try {
      await closePeriod(period.period_id);
      navigate('/payroll', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
      setClosing(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4 px-1 sm:px-0">
      <section className="overflow-hidden rounded-3xl shadow-lg shadow-zinc-200/80">
        <div className="relative bg-brandRed px-4 pb-9 pt-5 sm:px-6 sm:pb-10 sm:pt-6">
          <div className="relative mt-2">
            <button type="button" onClick={() => navigate('/payroll')} className="text-xs font-semibold text-white/80">
              ← กลับไปเลือกงวด
            </button>
            <h1 className="mt-2 text-lg font-bold text-white sm:text-xl">งวด {title}</h1>
            <p className="mt-0.5 text-xs text-white/80 sm:text-sm">เลือกการทำงานของงวดนี้</p>
          </div>
        </div>
        <div className="-mt-5 rounded-t-3xl bg-white px-3 pb-5 pt-5 sm:px-4 sm:pb-6 sm:pt-6">
          {loading && <p className="text-sm text-zinc-500">กำลังโหลด...</p>}
          {error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
          {period && (
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-2 sm:p-3">
              <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">เครื่องมืองวดนี้</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setShowReportPicker(true)}
                  className="rounded-xl border border-zinc-300 bg-white px-3 py-3 text-left transition hover:-translate-y-0.5 hover:bg-zinc-50"
                >
                  <p className="text-sm font-bold text-zinc-800">ดูรายงาน</p>
                  <p className="mt-1 text-xs text-zinc-500">เปิดรายงานรวมและรายงานย่อยของงวดนี้</p>
                </button>
                <button
                  type="button"
                  onClick={onClosePeriod}
                  disabled={!period.is_active || closing}
                  className="rounded-xl border border-brandRed/20 bg-brandRed px-3 py-3 text-left transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <p className="text-sm font-bold text-white">{period.is_active ? 'ปิดงวด' : 'ปิดงวดแล้ว'}</p>
                  <p className="mt-1 text-xs text-white/80">{period.is_active ? 'เปลี่ยนสถานะเป็นปิดงวดแล้ว' : 'งวดนี้ถูกปิดไปแล้ว'}</p>
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {showReportPicker && period && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/45 p-3">
          <div className="w-full max-w-lg rounded-2xl bg-white p-4 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-base font-bold text-zinc-900">เลือกรายงานงวด</p>
                <p className="text-xs text-zinc-500">งวด {title}</p>
              </div>
              <button type="button" onClick={() => setShowReportPicker(false)} className="text-xs font-semibold text-zinc-500">ปิด</button>
            </div>
            <div className="mt-3 space-y-2">
              <button
                type="button"
                onClick={() => openSignedViewer('รายงานรวมงวดเงินเดือน', 'payroll-packet', '#page=1&zoom=page-fit')}
                className="w-full rounded-xl border border-rose-200 bg-rose-50 px-3 py-3 text-left"
              >
                <p className="text-sm font-bold text-zinc-900">รายงานรวมทั้งชุด (แนะนำ)</p>
                <p className="mt-1 text-xs text-zinc-600">มีใบปะหน้า, บัตรลงเวลารายคน, รายงานลงเวลารายงวด, งานที่ทำ+ไฟล์แนบ</p>
              </button>
              <button
                type="button"
                onClick={() => openSignedViewer('บัตรลงเวลารายคน', 'timecard', '#page=1&zoom=90')}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-left"
              >
                <p className="text-sm font-bold text-zinc-900">เฉพาะบัตรลงเวลา</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {showViewer && period && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/45 p-2 md:p-4">
          <div className="h-[94vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
              <h2 className="text-sm font-semibold text-zinc-800">{viewerTitle} (PDF Viewer)</h2>
              <div className="flex items-center gap-3">
                <a
                  href={viewerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-zinc-600 underline underline-offset-2"
                >
                  เปิดแท็บใหม่
                </a>
                <button type="button" onClick={() => setShowViewer(false)} className="text-xs font-semibold text-zinc-500">
                  ปิด
                </button>
              </div>
            </div>
            <div className="border-b border-zinc-100 px-4 py-2 text-[11px] text-zinc-500 sm:hidden">
              ถ้าหน้าดูยาวเกินจอมือถือ แนะนำกด "เปิดแท็บใหม่" เพื่อซูมและเลื่อนเอกสารได้สะดวกกว่า
            </div>
            <iframe
              title="timecard-viewer"
              src={viewerUrl}
              className="h-[calc(94vh-49px)] w-full"
            />
          </div>
        </div>
      )}
    </div>
  );
}
