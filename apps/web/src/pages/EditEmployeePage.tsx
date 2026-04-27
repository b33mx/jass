import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getEmployeeById, updateEmployee } from '../api/employee.api';

type FieldErrors = { firstName?: string; lastName?: string; wage?: string };
type Toast = { type: 'success' | 'error'; message: string } | null;

export function EditEmployeePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [form, setForm] = useState({ firstName: '', lastName: '', wage: '' });
  const [originalName, setOriginalName] = useState('');
  const [loadingData, setLoadingData] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [toast, setToast] = useState<Toast>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const wage = parseFloat(form.wage) || 0;
  const otRate = wage > 0 ? (wage / 8) * 1.5 : null;

  useEffect(() => {
    if (!id) return;
    getEmployeeById(parseInt(id, 10))
      .then((emp) => {
        setForm({
          firstName: emp.first_name,
          lastName: emp.last_name,
          wage: String(emp.wage),
        });
        setOriginalName(`${emp.first_name} ${emp.last_name}`);
      })
      .catch((err) => setFetchError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด'))
      .finally(() => setLoadingData(false));
  }, [id]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name as keyof FieldErrors]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  function validate(): boolean {
    const errs: FieldErrors = {};
    if (!form.firstName.trim()) errs.firstName = 'กรุณากรอกชื่อจริง';
    if (!form.lastName.trim()) errs.lastName = 'กรุณากรอกนามสกุล';
    if (!form.wage || parseFloat(form.wage) <= 0) errs.wage = 'กรุณากรอกค่าแรงที่ถูกต้อง';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleConfirmClick() {
    if (!validate()) {
      setToast({ type: 'error', message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
      return;
    }
    setShowConfirm(true);
  }

  async function handleConfirmSubmit() {
    if (!id) return;
    setSubmitting(true);
    try {
      await updateEmployee(parseInt(id, 10), {
        firstName: form.firstName,
        lastName: form.lastName,
        wage: parseFloat(form.wage),
      });
      setShowConfirm(false);
      setToast({ type: 'success', message: 'แก้ไขข้อมูลสำเร็จ!' });
      setTimeout(() => navigate('/employees/edit'), 1200);
    } catch (err) {
      setShowConfirm(false);
      setToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่',
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingData) {
    return (
      <div className="mx-auto max-w-md">
        <div className="overflow-hidden rounded-3xl shadow-lg shadow-zinc-200/80">
          <div className="h-32 animate-pulse bg-zinc-200" />
          <div className="space-y-3 bg-white px-6 pb-6 pt-6">
            <div className="h-10 animate-pulse rounded-xl bg-zinc-100" />
            <div className="h-10 animate-pulse rounded-xl bg-zinc-100" />
            <div className="h-10 animate-pulse rounded-xl bg-zinc-100" />
          </div>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="mx-auto max-w-md rounded-2xl bg-red-50 p-6 text-center text-sm text-red-600 ring-1 ring-red-200">
        {fetchError}
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-md">
        <div className="overflow-hidden rounded-3xl shadow-lg shadow-zinc-200/80">

          {/* Header */}
          <div className="relative bg-brandRed px-6 pb-10 pt-6">
            <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10" />
            <div className="absolute -right-2 top-10 h-16 w-16 rounded-full bg-white/5" />

            <div className="relative flex items-center gap-4">
              <button
                onClick={() => navigate('/employees/edit')}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm transition hover:bg-white/30"
              >
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">แก้ไขพนักงาน</h1>
                <p className="mt-0.5 text-sm text-white/60">{originalName}</p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="-mt-5 rounded-t-3xl bg-white px-6 pb-6 pt-6">

            <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-zinc-400">ข้อมูลส่วนตัว</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="ชื่อจริง" required error={fieldErrors.firstName}>
                <input
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  placeholder="กรอกชื่อ"
                  className={inputCls(!!fieldErrors.firstName)}
                />
              </Field>
              <Field label="นามสกุล" required error={fieldErrors.lastName}>
                <input
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  placeholder="กรอกนามสกุล"
                  className={inputCls(!!fieldErrors.lastName)}
                />
              </Field>
            </div>

            <div className="my-5 border-t border-zinc-100" />

            <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-zinc-400">ค่าตอบแทน</p>
            <Field label="ค่าแรง" required hint="บาท / วัน" error={fieldErrors.wage}>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-zinc-400">฿</span>
                <input
                  name="wage"
                  type="number"
                  min="0"
                  step="1"
                  value={form.wage}
                  onChange={handleChange}
                  placeholder="0"
                  className={`${inputCls(!!fieldErrors.wage)} pl-8`}
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-zinc-400">/ วัน</span>
              </div>
            </Field>

            {/* OT card */}
            <div className="mt-4 flex items-center justify-between rounded-2xl bg-amber-50 px-5 py-4 ring-1 ring-amber-100">
              <div>
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-semibold text-amber-700">อัตรา OT</span>
                </div>
                <p className="mt-1 text-xs text-amber-500/80">คำนวณอัตโนมัติ · ค่าแรง ÷ 8 × 1.5</p>
              </div>
              <div className="text-right">
                {otRate !== null ? (
                  <>
                    <p className="text-2xl font-black tabular-nums text-brandRed">
                      {otRate.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-[11px] text-zinc-400">บาท / ชม.</p>
                  </>
                ) : (
                  <p className="text-xl font-black text-zinc-300">—</p>
                )}
              </div>
            </div>

            {/* Toast */}
            {toast && (
              <div
                className={`mt-5 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium ${
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

            <button
              type="button"
              onClick={handleConfirmClick}
              className="mt-4 w-full rounded-2xl bg-brandRed py-4 text-sm font-bold tracking-wide text-white shadow-md shadow-brandRed/30 transition hover:opacity-90 active:scale-[0.98]"
            >
              ยืนยันการแก้ไข
            </button>

          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !submitting && setShowConfirm(false)}
          />
          <div className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-xl">

            <div className="bg-brandRed px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-base font-bold text-white">ยืนยันการแก้ไข</h2>
              </div>
            </div>

            <div className="px-6 py-5">
              <p className="text-sm text-zinc-500">ต้องการแก้ไขข้อมูลพนักงานนี้ใช่ไหม?</p>

              <div className="mt-4 rounded-2xl bg-zinc-50 px-4 py-3 ring-1 ring-zinc-100">
                <p className="text-sm font-semibold text-zinc-800">
                  {form.firstName} {form.lastName}
                </p>
                <p className="mt-0.5 text-xs text-zinc-400">
                  ค่าแรงใหม่: {parseFloat(form.wage).toLocaleString('th-TH')} บาท / วัน
                </p>
              </div>

              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  disabled={submitting}
                  className="flex-1 rounded-2xl border border-zinc-200 py-3 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSubmit}
                  disabled={submitting}
                  className="flex-1 rounded-2xl bg-brandRed py-3 text-sm font-bold text-white shadow-md shadow-brandRed/30 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? 'กำลังบันทึก...' : 'ยืนยัน'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}

function Field({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <label className="text-sm font-medium text-zinc-700">
          {label}
          {required && <span className="ml-1 text-brandRed">*</span>}
        </label>
        {hint && <span className="text-[11px] text-zinc-400">{hint}</span>}
      </div>
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
  const base =
    'w-full rounded-xl border bg-zinc-50 px-4 py-3 text-sm outline-none transition placeholder:text-zinc-300';
  if (hasError) {
    return `${base} border-red-400 bg-red-50 focus:border-red-400 focus:ring-2 focus:ring-red-100`;
  }
  return `${base} border-zinc-200 focus:border-brandRed focus:bg-white focus:ring-2 focus:ring-brandRed/10`;
}
