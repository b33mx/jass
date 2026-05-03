import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createTasks, getTasksForDate, replaceTasksForDate, triggerDailySummary, uploadTaskImages } from '../api/task.api';
import type { ExistingTaskImage } from '../api/task.api';

interface Employee {
  employee_id: number;
  name: string;
}

const MAX_IMAGES = 5;

interface TaskEntry {
  task: string;
  detail: string;
  startTime: string;
  endTime: string;
  employeeIds: number[];
  existingImages: ExistingTaskImage[];
  newImages: File[];
  taskError?: string;
}

interface LocationState {
  date: string;
  employees: Employee[];
  period: { start_date: string; end_date: string };
  remainingCount: number;
  fromOverview?: boolean;
}

function emptyEntry(): TaskEntry {
  return {
    task: '',
    detail: '',
    startTime: '08:00',
    endTime: '17:00',
    employeeIds: [],
    existingImages: [],
    newImages: [],
  };
}

function AutoResizeTextarea({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={1}
      className={`block w-full resize-none overflow-hidden rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-brandRed focus:ring-2 focus:ring-brandRed/10 ${className}`}
    />
  );
}

function formatThaiDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    weekday: 'long',
  });
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
}

function EmployeeMultiSelect({
  employees,
  selected,
  onChange,
}: {
  employees: Employee[];
  selected: number[];
  onChange: (ids: number[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  function toggle(id: number) {
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  }

  const label =
    selected.length === 0
      ? 'เลือกพนักงาน'
      : employees
          .filter((e) => selected.includes(e.employee_id))
          .map((e) => e.name)
          .join(', ');

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-11 w-full items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 text-left text-sm outline-none transition focus:border-brandRed focus:ring-2 focus:ring-brandRed/10"
      >
        <span className={`truncate ${selected.length === 0 ? 'text-zinc-400' : 'text-zinc-800'}`}>
          {label}
        </span>
        <svg
          className={`ml-2 h-4 w-4 shrink-0 text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg shadow-zinc-200/60">
          {employees.length === 0 ? (
            <p className="px-4 py-3 text-sm text-zinc-400">ไม่มีพนักงานที่ลงเวลา</p>
          ) : (
            employees.map((emp) => (
              <label
                key={emp.employee_id}
                className="flex cursor-pointer items-center gap-3 px-4 py-2.5 hover:bg-zinc-50"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(emp.employee_id)}
                  onChange={() => toggle(emp.employee_id)}
                  className="h-4 w-4 cursor-pointer accent-brandRed"
                />
                <span className="text-sm text-zinc-700">{emp.name}</span>
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export function CreateTasksPage() {
  const navigate = useNavigate();
  const { state } = useLocation() as { state: LocationState | null };

  const [entries, setEntries] = useState<TaskEntry[]>([emptyEntry()]);
  const [submitting, setSubmitting] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!state?.date) navigate('/attendance', { replace: true });
  }, [state, navigate]);

  useEffect(() => {
    if (!state?.date || !state.fromOverview) return;
    setLoadingTasks(true);
    getTasksForDate(state.date)
      .then((tasks) => {
        if (tasks.length === 0) return;
        setEntries(
          tasks.map((t) => ({
            task: t.task,
            detail: t.detail ?? '',
            startTime: t.start_time ?? '',
            endTime: t.end_time ?? '',
            employeeIds: t.employee_ids
              ? t.employee_ids.split(',').map(Number).filter(Boolean)
              : [],
            existingImages: t.images ?? [],
            newImages: [],
          }))
        );
      })
      .catch(() => { /* keep empty entry on error */ })
      .finally(() => setLoadingTasks(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!state?.date) return null;

  const { date, employees, period, remainingCount } = state;

  if (loadingTasks) {
    return (
      <div className="mx-auto max-w-md space-y-3 px-4">
        <div className="h-32 animate-pulse rounded-3xl bg-zinc-200" />
        <div className="h-24 animate-pulse rounded-2xl bg-zinc-100" />
        <div className="h-24 animate-pulse rounded-2xl bg-zinc-100" />
      </div>
    );
  }

  function updateEntry(index: number, patch: Partial<TaskEntry>) {
    setEntries((prev) => prev.map((e, i) => (i === index ? { ...e, ...patch } : e)));
  }

  function addEntry() {
    setEntries((prev) => [...prev, emptyEntry()]);
  }

  function removeEntry(index: number) {
    setEntries((prev) => prev.filter((_, i) => i !== index));
  }

  function validate(): boolean {
    let valid = true;
    setEntries((prev) =>
      prev.map((e) => {
        if (!e.task.trim()) {
          valid = false;
          return { ...e, taskError: 'กรุณาระบุชื่องาน' };
        }
        return { ...e, taskError: undefined };
      })
    );
    return valid;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSubmitting(true);
    setError(null);
    try {
      const uploadedImages = await Promise.all(
        entries.map((e) => (e.newImages.length > 0 ? uploadTaskImages(e.newImages, period.start_date) : Promise.resolve([])))
      );
      const payload = entries.map((e, i) => ({
        task_date: date,
        task: e.task.trim(),
        detail: e.detail.trim() || undefined,
        start_time: e.startTime || undefined,
        end_time: e.endTime || undefined,
        employee_ids: e.employeeIds.join(','),
        images: [
          ...e.existingImages.map(({ file_name, public_url, storage_path }) => ({ file_name, public_url, storage_path })),
          ...uploadedImages[i],
        ],
      }));
      if (state?.fromOverview) {
        await replaceTasksForDate(date, payload);
      } else {
        await createTasks(payload);
      }
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setSubmitting(false);
    }
  }

  /* ── Success view ── */
  if (saved) {
    const allDone = remainingCount === 0;
    return (
      <div className="mx-auto max-w-md">
        <div className="overflow-hidden rounded-3xl shadow-lg shadow-zinc-200/80">
          <div className="relative bg-brandRed px-6 pb-10 pt-6">
            <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10" />
            <div className="absolute -right-2 top-10 h-16 w-16 rounded-full bg-white/5" />
            <div className="relative flex items-center gap-4 mt-2">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">บันทึกสำเร็จ</h1>
                <p className="mt-0.5 text-sm text-white/60">{formatThaiDate(date)}</p>
              </div>
            </div>
          </div>

          <div className="-mt-5 rounded-t-3xl bg-white px-6 pb-6 pt-8 text-center">
            {allDone ? (
              <>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
                  <svg className="h-8 w-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-base font-bold text-zinc-800">ลงเวลางานครบทุกวันแล้ว!</p>
                <p className="mt-2 text-sm text-zinc-500 leading-relaxed">
                  งวดวันที่ {formatShortDate(period.start_date)} – {formatShortDate(period.end_date)}
                  <br />ลงเวลาและบันทึกงานครบทุกวันเรียบร้อย
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="mt-6 w-full rounded-2xl bg-brandRed py-4 text-sm font-bold tracking-wide text-white shadow-md shadow-brandRed/30 transition hover:opacity-90 active:scale-[0.98]"
                >
                  กลับหน้าหลัก
                </button>
              </>
            ) : (
              <>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
                  <svg className="h-8 w-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-base font-bold text-zinc-800">บันทึกงานสำเร็จ!</p>
                <p className="mt-2 text-sm text-zinc-500">
                  ยังเหลืออีก{' '}
                  <span className="font-semibold text-brandRed">{remainingCount} วัน</span>
                  {' '}ที่ยังไม่ได้ลงเวลา
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/attendance')}
                  className="mt-6 w-full rounded-2xl bg-brandRed py-4 text-sm font-bold tracking-wide text-white shadow-md shadow-brandRed/30 transition hover:opacity-90 active:scale-[0.98]"
                >
                  ลงเวลาวันถัดไป
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ── Form view ── */
  return (
    <div className="mx-auto max-w-md">
      <div className="overflow-hidden rounded-3xl shadow-lg shadow-zinc-200/80">

        {/* Header */}
        <div className="relative bg-brandRed px-6 pb-10 pt-6">
          <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10" />
          <div className="absolute -right-2 top-10 h-16 w-16 rounded-full bg-white/5" />
          <div className="relative flex items-center gap-4 mt-2">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">บันทึกงาน</h1>
              <p className="mt-0.5 text-sm text-white/60">{formatThaiDate(date)}</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="-mt-5 rounded-t-3xl bg-white px-4 pb-6 pt-6">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
            รายการงาน
          </p>

          <div className="flex flex-col gap-3">
            {entries.map((entry, i) => (
              <div key={i} className="rounded-2xl bg-zinc-50 px-4 py-4 ring-1 ring-zinc-100">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-500">งาน {i + 1}</span>
                  {entries.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeEntry(i)}
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-200 text-zinc-500 transition hover:bg-red-100 hover:text-red-500"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                <div className="flex flex-col gap-2.5">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-zinc-600">
                      ชื่องาน <span className="text-brandRed">*</span>
                    </label>
                    <input
                      type="text"
                      value={entry.task}
                      onChange={(e) => updateEntry(i, { task: e.target.value, taskError: undefined })}
                      placeholder="ระบุชื่องาน"
                      className={`block h-11 w-full rounded-xl border bg-white px-3 text-sm outline-none transition ${
                        entry.taskError
                          ? 'border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-100'
                          : 'border-zinc-200 focus:border-brandRed focus:ring-2 focus:ring-brandRed/10'
                      }`}
                    />
                    {entry.taskError && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-red-500">
                        <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {entry.taskError}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="min-w-0">
                      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-zinc-500">เวลาเริ่ม</label>
                      <input
                        type="time"
                        value={entry.startTime}
                        onChange={(e) => updateEntry(i, { startTime: e.target.value })}
                        className="block h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium outline-none transition focus:border-brandRed focus:ring-2 focus:ring-brandRed/10"
                      />
                    </div>
                    <div className="min-w-0">
                      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-zinc-500">เวลาสิ้นสุด</label>
                      <input
                        type="time"
                        value={entry.endTime}
                        onChange={(e) => updateEntry(i, { endTime: e.target.value })}
                        className="block h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium outline-none transition focus:border-brandRed focus:ring-2 focus:ring-brandRed/10"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-zinc-600">รายละเอียด</label>
                    <AutoResizeTextarea
                      value={entry.detail}
                      onChange={(val) => updateEntry(i, { detail: val })}
                      placeholder="รายละเอียดเพิ่มเติม (ไม่บังคับ)"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-zinc-600">พนักงาน</label>
                    <EmployeeMultiSelect
                      employees={employees}
                      selected={entry.employeeIds}
                      onChange={(ids) => updateEntry(i, { employeeIds: ids })}
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-zinc-600">
                      รูปภาพ{' '}
                      <span className="font-normal text-zinc-400">(สูงสุด {MAX_IMAGES} รูป)</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {entry.existingImages.map((img) => (
                        <div key={img.image_id} className="relative h-16 w-16 shrink-0">
                          <img
                            src={img.public_url}
                            alt={img.file_name}
                            className="h-full w-full rounded-xl object-cover ring-1 ring-zinc-200"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              updateEntry(i, {
                                existingImages: entry.existingImages.filter((x) => x.image_id !== img.image_id),
                              })
                            }
                            className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-700 text-white shadow"
                          >
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                      {entry.newImages.map((file, imgIdx) => (
                        <div key={`new-${imgIdx}`} className="relative h-16 w-16 shrink-0">
                          <img
                            src={URL.createObjectURL(file)}
                            alt=""
                            className="h-full w-full rounded-xl object-cover ring-1 ring-zinc-200"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              updateEntry(i, { newImages: entry.newImages.filter((_, j) => j !== imgIdx) })
                            }
                            className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-700 text-white shadow"
                          >
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                      {entry.existingImages.length + entry.newImages.length < MAX_IMAGES && (
                        <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-zinc-300 text-zinc-400 transition hover:border-brandRed hover:text-brandRed">
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                          </svg>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="sr-only"
                            onChange={(e) => {
                              const picked = Array.from(e.target.files ?? []);
                              const allowed = MAX_IMAGES - entry.existingImages.length - entry.newImages.length;
                              updateEntry(i, { newImages: [...entry.newImages, ...picked].slice(0, entry.newImages.length + allowed) });
                              e.target.value = '';
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addEntry}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-zinc-300 py-3 text-sm font-medium text-zinc-500 transition hover:border-brandRed hover:text-brandRed"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            เพิ่มงาน
          </button>

          {error && (
            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600 ring-1 ring-red-200">
              <svg className="h-5 w-5 shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="mt-4 w-full rounded-2xl bg-brandRed py-4 text-sm font-bold tracking-wide text-white shadow-md shadow-brandRed/30 transition hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'กำลังบันทึก...' : 'บันทึกงาน'}
          </button>

          <button
            type="button"
            onClick={() => {
              triggerDailySummary(date).catch((err) => {
                console.error('[tasks] triggerDailySummary failed:', err);
              });
              navigate('/attendance');
            }}
            className="mt-2.5 w-full rounded-2xl py-3 text-sm font-medium text-zinc-400 transition hover:text-zinc-600"
          >
            ข้ามขั้นตอนนี้
          </button>
        </div>
      </div>
    </div>
  );
}
