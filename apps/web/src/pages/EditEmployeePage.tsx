import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  deleteEmployee,
  getEmployeeById,
  updateEmployee,
  getWageHistory,
  addWageHistory,
  type Employee,
  type WageHistory,
} from '../api/employee.api';

type FieldErrors = { firstName?: string; lastName?: string };
type Toast = { type: 'success' | 'error'; message: string } | null;
type WageModalErrors = { wage?: string; effectiveFrom?: string };

function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatThaiDate(dateStr: string): string {
  const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543}`;
}

export function EditEmployeePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [form, setForm] = useState({ firstName: '', lastName: '' });
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [originalName, setOriginalName] = useState('');
  const [loadingData, setLoadingData] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [toast, setToast] = useState<Toast>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [wageHistory, setWageHistory] = useState<WageHistory[]>([]);
  const [showWageModal, setShowWageModal] = useState(false);
  const [wageForm, setWageForm] = useState({ wage: '', effectiveFrom: toLocalDateStr(new Date()), note: '' });
  const [wageModalErrors, setWageModalErrors] = useState<WageModalErrors>({});
  const [savingWage, setSavingWage] = useState(false);

  const wagePreview = parseFloat(wageForm.wage) || 0;
  const wageOtPreview = wagePreview > 0 ? (wagePreview / 8) * 1.5 : null;

  useEffect(() => {
    if (!id) return;
    const empId = parseInt(id, 10);
    Promise.all([getEmployeeById(empId), getWageHistory(empId)])
      .then(([emp, history]) => {
        setEmployee(emp);
        setForm({ firstName: emp.first_name, lastName: emp.last_name });
        setOriginalName(`${emp.first_name} ${emp.last_name}`);
        setWageHistory(history);
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
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validateWageModal(): boolean {
    const errs: WageModalErrors = {};
    if (!wageForm.wage || parseFloat(wageForm.wage) <= 0) errs.wage = 'กรุณากรอกค่าแรงที่ถูกต้อง';
    if (!wageForm.effectiveFrom) errs.effectiveFrom = 'กรุณาเลือกวันที่มีผล';
    setWageModalErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSaveWage() {
    if (!id || !validateWageModal()) return;
    setSavingWage(true);
    try {
      const newRecord = await addWageHistory(parseInt(id, 10), {
        wage: parseFloat(wageForm.wage),
        effectiveFrom: wageForm.effectiveFrom,
        note: wageForm.note.trim() || undefined,
      });
      setWageHistory((prev) => [newRecord, ...prev].sort((a, b) => b.effective_from.localeCompare(a.effective_from)));
      // อัพเดต employee.wage ถ้า record ใหม่คือล่าสุด
      if (employee && newRecord.effective_from >= (wageHistory[0]?.effective_from ?? '')) {
        setEmployee((prev) => prev ? { ...prev, wage: newRecord.wage, ot_rate: newRecord.ot_rate } : prev);
      }
      setShowWageModal(false);
      setWageForm({ wage: '', effectiveFrom: toLocalDateStr(new Date()), note: '' });
      setToast({ type: 'success', message: 'บันทึกค่าแรงใหม่สำเร็จ!' });
    } catch (err) {
      setToast({ type: 'error', message: err instanceof Error ? err.message : 'เกิดข้อผิดพลาด' });
    } finally {
      setSavingWage(false);
    }
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

  async function handleDeleteSubmit() {
    if (!id) return;
    setDeleting(true);
    try {
      await deleteEmployee(parseInt(id, 10));
      setShowDeleteConfirm(false);
      setToast({ type: 'success', message: 'ลบพนักงานสำเร็จ!' });
      setTimeout(() => navigate('/employees/edit'), 1200);
    } catch (err) {
      setShowDeleteConfirm(false);
      setToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่',
      });
    } finally {
      setDeleting(false);
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

            <div className="relative">
              <div className="flex justify-end">
                <button
                  onClick={() => navigate('/employees/edit')}
                  aria-label="ย้อนกลับไปหน้ารายการพนักงาน"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-brandRed shadow-sm ring-1 ring-white/70 transition hover:-translate-y-0.5 hover:bg-rose-50 hover:shadow-md active:translate-y-0"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>ย้อนกลับ</span>
                </button>
              </div>

              <div className="mt-4 flex items-center gap-4">
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

            {/* ค่าแรงปัจจุบัน */}
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">ค่าตอบแทน</p>
              <button
                type="button"
                onClick={() => setShowWageModal(true)}
                className="flex items-center gap-1.5 rounded-xl bg-brandRed px-3 py-1.5 text-xs font-bold text-white shadow-sm shadow-brandRed/30 transition hover:opacity-90 active:scale-[0.98]"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                ปรับค่าแรง
              </button>
            </div>

            <div className="mt-3 flex items-center justify-between rounded-2xl bg-zinc-50 px-5 py-4 ring-1 ring-zinc-100">
              <div>
                <p className="text-xs text-zinc-400">ค่าแรงปัจจุบัน</p>
                <p className="mt-0.5 text-2xl font-black tabular-nums text-zinc-800">
                  {employee ? employee.wage.toLocaleString('th-TH', { minimumFractionDigits: 0 }) : '—'}
                </p>
                <p className="text-[11px] text-zinc-400">บาท / วัน</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-zinc-400">อัตรา OT</p>
                <p className="mt-0.5 text-xl font-black tabular-nums text-amber-600">
                  {employee ? employee.ot_rate.toLocaleString('th-TH', { minimumFractionDigits: 2 }) : '—'}
                </p>
                <p className="text-[11px] text-zinc-400">บาท / ชม.</p>
              </div>
            </div>

            {/* ประวัติค่าแรง */}
            {wageHistory.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-zinc-400">ประวัติค่าแรง</p>
                <div className="divide-y divide-zinc-100 overflow-hidden rounded-2xl ring-1 ring-zinc-100">
                  {wageHistory.map((h, i) => (
                    <div key={h.id} className={`flex items-center justify-between px-4 py-3 ${i === 0 ? 'bg-amber-50/60' : 'bg-white'}`}>
                      <div>
                        <p className="text-xs font-semibold text-zinc-700">{formatThaiDate(h.effective_from)}</p>
                        {h.note && <p className="mt-0.5 text-[11px] text-zinc-400">{h.note}</p>}
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold tabular-nums ${i === 0 ? 'text-brandRed' : 'text-zinc-600'}`}>
                          {h.wage.toLocaleString('th-TH', { minimumFractionDigits: 0 })} บาท/วัน
                        </p>
                        <p className="text-[11px] text-zinc-400">
                          OT {h.ot_rate.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท/ชม.
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="rounded-2xl border border-red-200 bg-red-50 py-4 text-sm font-bold tracking-wide text-red-600 transition hover:bg-red-100 active:scale-[0.98]"
              >
                ลบพนักงาน
              </button>
              <button
                type="button"
                onClick={handleConfirmClick}
                className="rounded-2xl bg-brandRed py-4 text-sm font-bold tracking-wide text-white shadow-md shadow-brandRed/30 transition hover:opacity-90 active:scale-[0.98]"
              >
                ยืนยันการแก้ไข
              </button>
            </div>

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
              <p className="text-sm text-zinc-500">ต้องการบันทึกการเปลี่ยนแปลงข้อมูลพนักงานนี้ใช่ไหม?</p>

              <div className="mt-4 rounded-2xl bg-zinc-50 px-4 py-3 ring-1 ring-zinc-100">
                <p className="text-sm font-semibold text-zinc-800">
                  {form.firstName} {form.lastName}
                </p>
                {employee && (
                  <p className="mt-0.5 text-xs text-zinc-400">ค่าแรง: {employee.wage.toLocaleString('th-TH')} บาท / วัน</p>
                )}
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

      {/* Wage Modal */}
      {showWageModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !savingWage && setShowWageModal(false)}
          />
          <div className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-xl" style={{ maxWidth: 'calc(100vw - 2rem)' }}>
            <div className="bg-brandRed px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">ปรับค่าแรง</h2>
                  <p className="text-xs text-white/60">{originalName}</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-5 space-y-4">
              <Field label="ค่าแรงใหม่" required hint="บาท / วัน" error={wageModalErrors.wage}>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-zinc-400">฿</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={wageForm.wage}
                    onChange={(e) => {
                      setWageForm((p) => ({ ...p, wage: e.target.value }));
                      if (wageModalErrors.wage) setWageModalErrors((p) => ({ ...p, wage: undefined }));
                    }}
                    placeholder="0"
                    className={`${inputCls(!!wageModalErrors.wage)} pl-8`}
                  />
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-zinc-400">/ วัน</span>
                </div>
              </Field>

              {wageOtPreview !== null && (
                <div className="flex items-center justify-between rounded-2xl bg-amber-50 px-4 py-3 ring-1 ring-amber-100">
                  <span className="text-xs font-semibold text-amber-700">OT (คำนวณอัตโนมัติ)</span>
                  <span className="text-sm font-black tabular-nums text-brandRed">
                    {wageOtPreview.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท/ชม.
                  </span>
                </div>
              )}

              <Field label="มีผลตั้งแต่วันที่" required error={wageModalErrors.effectiveFrom}>
                <div className="w-full overflow-hidden">
                  <input
                    type="date"
                    value={wageForm.effectiveFrom}
                    onChange={(e) => {
                      setWageForm((p) => ({ ...p, effectiveFrom: e.target.value }));
                      if (wageModalErrors.effectiveFrom) setWageModalErrors((p) => ({ ...p, effectiveFrom: undefined }));
                    }}
                    style={{ WebkitAppearance: 'none', width: '100%', boxSizing: 'border-box' }}
                    className={inputCls(!!wageModalErrors.effectiveFrom)}
                  />
                </div>
              </Field>

              <Field label="หมายเหตุ" hint="ไม่บังคับ">
                <input
                  type="text"
                  value={wageForm.note}
                  onChange={(e) => setWageForm((p) => ({ ...p, note: e.target.value }))}
                  placeholder="เช่น ย้ายหน้างาน, ปรับตามผลงาน"
                  className={inputCls(false)}
                />
              </Field>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowWageModal(false)}
                  disabled={savingWage}
                  className="flex-1 rounded-2xl border border-zinc-200 py-3 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleSaveWage}
                  disabled={savingWage}
                  className="flex-1 rounded-2xl bg-brandRed py-3 text-sm font-bold text-white shadow-md shadow-brandRed/30 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingWage ? 'กำลังบันทึก...' : 'บันทึกค่าแรง'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !deleting && setShowDeleteConfirm(false)}
          />
          <div className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-xl">

            <div className="bg-red-600 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-base font-bold text-white">ยืนยันการลบพนักงาน</h2>
              </div>
            </div>

            <div className="px-6 py-5">
              <p className="text-sm text-zinc-600">เมื่อลบแล้วจะไม่แสดงพนักงานในรายการแก้ไขอีก</p>

              <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 ring-1 ring-red-100">
                <p className="text-sm font-semibold text-zinc-800">
                  {form.firstName} {form.lastName}
                </p>
                {employee && (
                  <p className="mt-0.5 text-xs text-zinc-500">ค่าแรง: {employee.wage.toLocaleString('th-TH')} บาท / วัน</p>
                )}
              </div>

              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="flex-1 rounded-2xl border border-zinc-200 py-3 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleDeleteSubmit}
                  disabled={deleting}
                  className="flex-1 rounded-2xl bg-red-600 py-3 text-sm font-bold text-white shadow-md shadow-red-600/30 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deleting ? 'กำลังลบ...' : 'ยืนยันการลบ'}
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
