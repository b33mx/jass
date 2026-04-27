import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllEmployees, type Employee } from '../api/employee.api';

export function EditEmployeeSelectPage() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAllEmployees()
      .then(setEmployees)
      .catch((err) => setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-md">
      <div className="overflow-hidden rounded-3xl shadow-lg shadow-zinc-200/80">

        {/* Header */}
        <div className="relative bg-brandRed px-6 pb-10 pt-6">
          <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10" />
          <div className="absolute -right-2 top-10 h-16 w-16 rounded-full bg-white/5" />

          <div className="relative flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">แก้ไขพนักงาน</h1>
              <p className="mt-0.5 text-sm text-white/60">เลือกพนักงานที่ต้องการแก้ไข</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="-mt-5 rounded-t-3xl bg-white px-6 pb-6 pt-6">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
            พนักงานทั้งหมด
          </p>

          {loading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-2xl bg-zinc-100" />
              ))}
            </div>
          )}

          {error && (
            <div className="flex items-center gap-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-red-200">
              <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {!loading && !error && employees.length === 0 && (
            <div className="flex flex-col items-center py-10 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100">
                <svg className="h-8 w-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="mt-3 text-sm font-medium text-zinc-500">ยังไม่มีพนักงานในระบบ</p>
            </div>
          )}

          {!loading && !error && employees.length > 0 && (
            <div className="space-y-2">
              {employees.map((emp) => (
                <button
                  key={emp.id}
                  onClick={() => navigate(`/employees/${emp.id}/edit`)}
                  className="flex w-full items-center justify-between rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-3.5 text-left transition hover:border-brandRed/30 hover:bg-red-50 active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm shadow-zinc-200/80 ring-1 ring-zinc-100">
                      <svg className="h-4.5 w-4.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-800">
                        {emp.first_name} {emp.last_name}
                      </p>
                      <p className="text-xs text-zinc-400">
                        ค่าแรง {emp.wage.toLocaleString('th-TH')} บาท / วัน
                      </p>
                    </div>
                  </div>
                  <svg className="h-4 w-4 shrink-0 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
