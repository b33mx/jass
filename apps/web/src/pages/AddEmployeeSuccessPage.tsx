import { useNavigate } from 'react-router-dom';

export function AddEmployeeSuccessPage() {
  const navigate = useNavigate();

  return (
    <section className="flex flex-col items-center rounded-2xl border border-zinc-200 bg-white p-10 shadow-sm">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
        <svg
          className="h-10 w-10 text-green-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 className="mt-5 text-xl font-semibold text-zinc-900">บันทึกสำเร็จ</h1>
      <p className="mt-2 text-sm text-zinc-500">เพิ่มข้อมูลพนักงานเรียบร้อยแล้ว</p>

      <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
        <button
          onClick={() => navigate('/employees/new')}
          className="w-full rounded-xl bg-brandRed py-3 text-sm font-semibold text-white transition hover:opacity-90"
        >
          เพิ่มพนักงานใหม่
        </button>
        <button
          onClick={() => navigate('/')}
          className="w-full rounded-xl border border-zinc-200 py-3 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50"
        >
          กลับหน้าหลัก
        </button>
      </div>
    </section>
  );
}
