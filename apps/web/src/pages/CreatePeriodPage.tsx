import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPeriod, getActivePeriod } from '../api/period.api';

type FieldErrors = { start_date?: string; end_date?: string };

export function CreatePeriodPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ start_date: '', end_date: '' });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    getActivePeriod()
      .then((period) => {
        if (period) navigate('/attendance', { replace: true });
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, [navigate]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name as keyof FieldErrors]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  function validate(): boolean {
    const errs: FieldErrors = {};
    if (!form.start_date) errs.start_date = 'กรุณาเลือกวันที่เริ่มต้น';
    if (!form.end_date) errs.end_date = 'กรุณาเลือกวันที่สิ้นสุด';
    if (form.start_date && form.end_date && form.end_date < form.start_date) {
      errs.end_date = 'วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่มต้น';
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSubmitting(true);
    setError(null);
    try {
      await createPeriod({ start_date: form.start_date, end_date: form.end_date });
      navigate('/attendance');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setSubmitting(false);
    }
  }

  if (checking) return null;

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
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">สร้างงวดใหม่</h1>
              <p className="mt-0.5 text-sm text-white/60">ยังไม่มีงวดที่เปิดอยู่</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="-mt-5 rounded-t-3xl bg-white px-6 pb-6 pt-6">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-zinc-400">ช่วงเวลา</p>

          <div className="min-w-0 flex flex-col gap-4">
            <Field label="วันที่เริ่มต้น" required error={fieldErrors.start_date}>
              <div className="relative">
                {!form.start_date && (
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-zinc-400">
                    เลือกวันที่เริ่มต้น
                  </span>
                )}
                <input
                  type="date"
                  name="start_date"
                  value={form.start_date}
                  onChange={handleChange}
                  className={inputCls(!!fieldErrors.start_date)}
                />
              </div>
            </Field>
            <Field label="วันที่สิ้นสุด" required error={fieldErrors.end_date}>
              <div className="relative">
                {!form.end_date && (
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-zinc-400">
                    เลือกวันที่สิ้นสุด
                  </span>
                )}
                <input
                  type="date"
                  name="end_date"
                  value={form.end_date}
                  min={form.start_date || undefined}
                  onChange={handleChange}
                  className={inputCls(!!fieldErrors.end_date)}
                />
              </div>
            </Field>
          </div>

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
            className="mt-5 w-full rounded-2xl bg-brandRed py-4 text-sm font-bold tracking-wide text-white shadow-md shadow-brandRed/30 transition hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'กำลังสร้าง...' : 'สร้างงวด'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 flex flex-col gap-1.5">
      <label className="text-sm font-medium text-zinc-700">
        {label}
        {required && <span className="ml-1 text-brandRed">*</span>}
      </label>
      {children}
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-500">
          <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

function inputCls(hasError: boolean) {
  const base = 'date-input block h-12 box-border min-w-0 w-full max-w-full rounded-xl border bg-zinc-50 px-4 py-3 text-sm outline-none transition';
  if (hasError) return `${base} border-red-400 bg-red-50 focus:border-red-400 focus:ring-2 focus:ring-red-100`;
  return `${base} border-zinc-200 focus:border-brandRed focus:bg-white focus:ring-2 focus:ring-brandRed/10`;
}
