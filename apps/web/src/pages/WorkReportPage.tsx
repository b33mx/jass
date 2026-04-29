import { useMemo, useState } from 'react';

function formatThaiDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    weekday: 'long',
  });
}

export function WorkReportPage() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [date, setDate] = useState(today);

  const downloadUrl = `/api/reports/work?date=${date}`;

  return (
    <div className="mx-auto max-w-md">
      <div className="overflow-hidden rounded-3xl shadow-lg shadow-zinc-200/80">
        <div className="relative bg-brandRed px-6 pb-10 pt-6">
          <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10" />
          <div className="absolute -right-2 top-10 h-16 w-16 rounded-full bg-white/5" />
          <div className="relative mt-2 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-8m0 8l-3-3m3 3l3-3M4 16.5A2.5 2.5 0 006.5 19h11a2.5 2.5 0 002.5-2.5" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">รายงานการทำงาน</h1>
              <p className="mt-0.5 text-sm text-white/70">ดาวน์โหลดไฟล์ PDF วันที่ในงวดที่ต้องการ</p>
            </div>
          </div>
        </div>

        <div className="-mt-5 space-y-4 rounded-t-3xl bg-white px-4 pb-6 pt-6">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-zinc-400">เลือกวันที่อ้างอิงงวด</p>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-800 outline-none transition focus:border-brandRed focus:bg-white focus:ring-2 focus:ring-brandRed/10"
            />
            <p className="mt-2 text-xs text-zinc-500">{formatThaiDate(date)}</p>
          </div>

          <a
            href={downloadUrl}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-brandRed px-4 py-3 text-sm font-bold text-white shadow-md shadow-brandRed/30 transition hover:opacity-90 active:scale-[0.98]"
          >
            ดาวน์โหลดรายงาน PDF
          </a>
        </div>
      </div>
    </div>
  );
}
