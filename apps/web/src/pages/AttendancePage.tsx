import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getAttendanceForDate, getMissingDates, saveAttendanceBatch } from '../api/attendance.api';
import { getAllEmployees } from '../api/employee.api';
import { getActivePeriod, type Period } from '../api/period.api';

function NoPeriodState() {
  const navigate = useNavigate();
  return (
    <div className="mx-auto max-w-md">
      <div className="overflow-hidden rounded-3xl shadow-lg shadow-zinc-200/80">
        <div className="relative bg-brandRed px-6 pb-10 pt-6">
          <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10" />
          <div className="absolute -right-2 top-10 h-16 w-16 rounded-full bg-white/5" />
          <div className="relative flex items-center gap-4 mt-2">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">ลงเวลางาน</h1>
              <p className="mt-0.5 text-sm text-white/70">ยังไม่มีงวดที่เปิดอยู่</p>
            </div>
          </div>
        </div>
        <div className="-mt-5 rounded-t-3xl bg-white px-6 pb-6 pt-8 text-center">
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
      </div>
    </div>
  );
}

interface Employee {
  employee_id: number;
  first_name: string;
  last_name: string;
}

interface AttendanceRow {
  employee_id: number;
  name: string;
  morning_check: boolean;
  afternoon_check: boolean;
  ot_hours: number;
  ot_minutes: number;
}

type Toast = { type: 'success' | 'error'; message: string } | null;

function formatThaiDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' });
}

function otToDecimal(hours: number, minutes: number): number {
  return parseFloat((hours + minutes / 60).toFixed(4));
}

function decimalToOt(ot: number): { hours: number; minutes: number } {
  const hours = Math.floor(ot);
  const minutes = Math.round((ot - hours) * 60);
  return { hours, minutes };
}

export function AttendancePage() {
  const navigate = useNavigate();
  const { state } = useLocation() as {
    state: { period?: Period; date?: string } | null;
  };

  const [loading, setLoading] = useState(true);
  const [noPeriod, setNoPeriod] = useState(false);
  const [period, setPeriod] = useState<Period | null>(null);
  const [missingDates, setMissingDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [loadingRows, setLoadingRows] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<Toast>(null);

  useEffect(() => {
    const prefillPeriod = state?.period ?? null;
    const prefillDate = state?.date ?? null;
    const today = new Date().toISOString().slice(0, 10);

    const loadPeriod = prefillPeriod
      ? Promise.resolve(prefillPeriod)
      : getActivePeriod();

    loadPeriod
      .then(async (p) => {
        if (!p) { setNoPeriod(true); return; }
        setPeriod(p);

        const missingData = await getMissingDates(p.period_id);
        setMissingDates(missingData.filter((d) => d <= today));

        if (prefillDate) {
          setSelectedDate(prefillDate);
          setLoadingRows(true);
          try {
            const [employees, existing] = await Promise.all([
              getAllEmployees() as Promise<Employee[]>,
              getAttendanceForDate(p.period_id, prefillDate),
            ]);
            const existingMap = new Map(existing.map((a) => [a.employee_id, a]));
            setRows(employees.map((emp) => {
              const att = existingMap.get(emp.employee_id);
              const { hours, minutes } = att ? decimalToOt(att.ot) : { hours: 0, minutes: 0 };
              return {
                employee_id: emp.employee_id,
                name: `${emp.first_name} ${emp.last_name}`,
                morning_check: att?.morning_check ?? false,
                afternoon_check: att?.afternoon_check ?? false,
                ot_hours: hours,
                ot_minutes: minutes,
              };
            }));
          } finally {
            setLoadingRows(false);
          }
        }
      })
      .catch((err) => {
        setToast({ type: 'error', message: err instanceof Error ? err.message : 'เกิดข้อผิดพลาด' });
      })
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const handleDateChange = useCallback(async (date: string) => {
    setSelectedDate(date);
    if (!date || !period) return;

    setLoadingRows(true);
    try {
      const [employees, existing] = await Promise.all([
        getAllEmployees() as Promise<Employee[]>,
        getAttendanceForDate(period.period_id, date),
      ]);

      const existingMap = new Map(existing.map((a) => [a.employee_id, a]));

      setRows(
        employees.map((emp) => {
          const att = existingMap.get(emp.employee_id);
          const { hours, minutes } = att ? decimalToOt(att.ot) : { hours: 0, minutes: 0 };
          return {
            employee_id: emp.employee_id,
            name: `${emp.first_name} ${emp.last_name}`,
            morning_check: att?.morning_check ?? false,
            afternoon_check: att?.afternoon_check ?? false,
            ot_hours: hours,
            ot_minutes: minutes,
          };
        })
      );
    } catch (err) {
      setToast({ type: 'error', message: err instanceof Error ? err.message : 'เกิดข้อผิดพลาด' });
    } finally {
      setLoadingRows(false);
    }
  }, [period]);

  useEffect(() => {
    if (!period || selectedDate !== '' || missingDates.length === 0) return;
    const today = new Date().toISOString().slice(0, 10);
    if (missingDates.includes(today)) handleDateChange(today);
  }, [period, missingDates, selectedDate, handleDateChange]);

  function toggleCheck(index: number, field: 'morning_check' | 'afternoon_check') {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: !r[field] } : r)));
  }

  function handleOtChange(index: number, field: 'ot_hours' | 'ot_minutes', value: string) {
    const num = Math.max(0, parseInt(value) || 0);
    const clamped = field === 'ot_minutes' ? Math.min(59, num) : num;
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: clamped } : r)));
  }

  async function handleSubmit() {
    if (!period || !selectedDate || rows.length === 0) return;
    setSubmitting(true);
    try {
      await saveAttendanceBatch({
        period_id: period.period_id,
        attendance_date: selectedDate,
        records: rows.map((r) => ({
          employee_id: r.employee_id,
          morning_check: r.morning_check,
          afternoon_check: r.afternoon_check,
          ot: otToDecimal(r.ot_hours, r.ot_minutes),
        })),
      });
      const checkedIn = rows
        .filter((r) => r.morning_check || r.afternoon_check)
        .map((r) => ({ employee_id: r.employee_id, name: r.name }));
      const remaining = missingDates.filter((d) => d !== selectedDate);
      navigate('/tasks/new', {
        state: {
          date: selectedDate,
          employees: checkedIn,
          period: { start_date: period.start_date, end_date: period.end_date },
          remainingCount: remaining.length,
          fromOverview: !!state?.date,
        },
      });
    } catch (err) {
      setToast({ type: 'error', message: err instanceof Error ? err.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่' });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-3 px-4">
        <div className="h-32 animate-pulse rounded-3xl bg-zinc-200" />
        <div className="h-12 animate-pulse rounded-2xl bg-zinc-100" />
      </div>
    );
  }

  if (noPeriod) return <NoPeriodState />;

  if (!period) return null;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="overflow-hidden rounded-3xl shadow-lg shadow-zinc-200/80">

        {/* Header */}
        <div className="relative bg-brandRed px-6 pb-10 pt-6">
          <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10" />
          <div className="absolute -right-2 top-10 h-16 w-16 rounded-full bg-white/5" />
          <div className="relative flex items-center gap-4 mt-2">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">ลงเวลางาน</h1>
              <p className="mt-0.5 text-sm text-white/70">
                งวด {formatThaiDate(period.start_date)} – {formatThaiDate(period.end_date)}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="-mt-5 rounded-t-3xl bg-white px-4 pb-6 pt-6">

          {/* Section 1: Date selector */}
          {state?.date ? (
            /* มาจาก overview — แสดงวันที่เป็น label คงที่ */
            <div className="flex items-center gap-3 rounded-2xl bg-zinc-50 px-4 py-3 ring-1 ring-zinc-100">
              <svg className="h-4 w-4 shrink-0 text-brandRed" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm font-medium text-zinc-700">{formatThaiDate(state.date)}</span>
            </div>
          ) : (
            <>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
                วันที่ยังไม่ได้ลงเวลา
              </p>
              {missingDates.length === 0 ? (
                <div className="rounded-2xl bg-emerald-50 px-4 py-4 text-sm text-emerald-700 ring-1 ring-emerald-100">
                  ลงเวลาครบทุกวันในงวดนี้แล้ว
                </div>
              ) : (
                <select
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none transition focus:border-brandRed focus:bg-white focus:ring-2 focus:ring-brandRed/10"
                >
                  <option value="">-- เลือกวันที่ --</option>
                  {missingDates.map((d) => (
                    <option key={d} value={d}>
                      {formatThaiDate(d)}
                    </option>
                  ))}
                </select>
              )}
            </>
          )}

          {/* Section 2: Attendance Table */}
          {selectedDate && (
            <div className="mt-5">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
                บันทึกเวลา · {formatThaiDate(selectedDate)}
              </p>

              {loadingRows ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-12 animate-pulse rounded-xl bg-zinc-100" />
                  ))}
                </div>
              ) : rows.length === 0 ? (
                <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700 ring-1 ring-amber-100">
                  ไม่พบพนักงานในระบบ
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl ring-1 ring-zinc-100">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-zinc-50 text-left">
                        <th className="px-4 py-3 font-semibold text-zinc-600">ชื่อ-นามสกุล</th>
                        <th className="px-3 py-3 text-center font-semibold text-zinc-600">เช้า</th>
                        <th className="px-3 py-3 text-center font-semibold text-zinc-600">บ่าย</th>
                        <th className="px-3 py-3 text-center font-semibold text-zinc-600">OT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {rows.map((row, i) => (
                        <tr key={row.employee_id} className="bg-white">
                          <td className="px-4 py-3 font-medium text-zinc-800">{row.name}</td>
                          <td className="px-3 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={row.morning_check}
                              onChange={() => toggleCheck(i, 'morning_check')}
                              className="h-5 w-5 cursor-pointer accent-brandRed"
                            />
                          </td>
                          <td className="px-3 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={row.afternoon_check}
                              onChange={() => toggleCheck(i, 'afternoon_check')}
                              className="h-5 w-5 cursor-pointer accent-brandRed"
                            />
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-1 justify-center">
                              <input
                                type="number"
                                min={0}
                                value={row.ot_hours}
                                onChange={(e) => handleOtChange(i, 'ot_hours', e.target.value)}
                                className="w-12 rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1.5 text-center text-sm outline-none focus:border-brandRed focus:ring-1 focus:ring-brandRed/20"
                              />
                              <span className="text-xs text-zinc-400">ชม.</span>
                              <input
                                type="number"
                                min={0}
                                max={59}
                                value={row.ot_minutes}
                                onChange={(e) => handleOtChange(i, 'ot_minutes', e.target.value)}
                                className="w-12 rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1.5 text-center text-sm outline-none focus:border-brandRed focus:ring-1 focus:ring-brandRed/20"
                              />
                              <span className="text-xs text-zinc-400">น.</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {rows.length > 0 && (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="mt-4 w-full rounded-2xl bg-brandRed py-4 text-sm font-bold tracking-wide text-white shadow-md shadow-brandRed/30 transition hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? 'กำลังบันทึก...' : 'บันทึกการลงเวลา'}
                </button>
              )}
            </div>
          )}

          {/* Toast */}
          {toast && (
            <div
              className={`mt-4 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium ${
                toast.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                  : 'bg-red-50 text-red-600 ring-1 ring-red-200'
              }`}
            >
              {toast.type === 'success' ? (
                <svg className="h-5 w-5 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="h-5 w-5 shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {toast.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
