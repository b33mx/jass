import { useNavigate } from 'react-router-dom';

export function HomePage() {
  const navigate = useNavigate();

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-brandRed">JASS Payroll</h1>
      <p className="mt-2 text-sm text-zinc-600">เลือกเมนูการทำงานหลัก</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <button type="button" onClick={() => navigate('/attendance')} className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-left">
          <p className="text-sm font-bold text-zinc-800">ลงเวลา</p>
          <p className="text-xs text-zinc-500">บันทึกเวลาและงานรายวัน</p>
        </button>
        <button type="button" onClick={() => navigate('/payroll')} className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-left">
          <p className="text-sm font-bold text-zinc-800">เงินเดือน</p>
          <p className="text-xs text-zinc-500">คำนวณเงินเดือนและดูบัตรลงเวลา</p>
        </button>
      </div>
    </section>
  );
}
