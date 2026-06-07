import { useEffect, useState } from 'react';
import { closePeriod, createPeriod, deletePeriod, getAllPeriods, updatePeriod, type Period } from '../api/period.api';

function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function shortDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

type ModalMode = 'create' | 'edit';

interface FormState {
  start_date: string;
  end_date: string;
}

type FieldErrors = { start_date?: string; end_date?: string };

export function PeriodManagementPage() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const [modalMode, setModalMode] = useState<ModalMode | null>(null);
  const [editTarget, setEditTarget] = useState<Period | null>(null);
  const [form, setForm] = useState<FormState>({ start_date: '', end_date: '' });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  async function load() {
    try {
      const data = await getAllPeriods();
      setPeriods(data);
    } catch (err) {
      setPageError(err instanceof Error ? err.message : 'โหลดข้อมูลไม่ได้');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    const today = toLocalDateStr(new Date());
    setForm({ start_date: today, end_date: today });
    setFieldErrors({});
    setModalError(null);
    setEditTarget(null);
    setModalMode('create');
  }

  function openEdit(p: Period) {
    setForm({ start_date: p.start_date, end_date: p.end_date });
    setFieldErrors({});
    setModalError(null);
    setEditTarget(p);
    setModalMode('edit');
  }

  function closeModal() {
    setModalMode(null);
    setEditTarget(null);
  }

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
    setModalError(null);
    try {
      if (modalMode === 'create') {
        await createPeriod({ start_date: form.start_date, end_date: form.end_date });
      } else if (modalMode === 'edit' && editTarget) {
        await updatePeriod(editTarget.period_id, { start_date: form.start_date, end_date: form.end_date });
      }
      closeModal();
      await load();
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(p: Period) {
    if (!window.confirm(`ลบงวด ${shortDate(p.start_date)} – ${shortDate(p.end_date)} ใช่ไหม?\nข้อมูลการลงเวลาในงวดนี้ยังคงอยู่`)) return;
    setPageError(null);
    try {
      await deletePeriod(p.period_id);
      await load();
    } catch (err) {
      setPageError(err instanceof Error ? err.message : 'ลบไม่สำเร็จ');
    }
  }

  async function handleClose(p: Period) {
    if (!window.confirm(`ปิดงวด ${shortDate(p.start_date)} – ${shortDate(p.end_date)} ใช่ไหม?`)) return;
    setPageError(null);
    try {
      await closePeriod(p.period_id);
      await load();
    } catch (err) {
      setPageError(err instanceof Error ? err.message : 'ปิดงวดไม่สำเร็จ');
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-1 sm:px-0">
      <section className="overflow-hidden rounded-3xl shadow-lg shadow-zinc-200/80">
        <div className="relative bg-brandRed px-4 pb-9 pt-5 sm:px-6 sm:pb-10 sm:pt-6">
          <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10" />
          <div className="relative mt-2 flex items-start justify-between">
            <div>
              <h1 className="text-lg font-bold text-white sm:text-xl">จัดการงวด</h1>
              <p className="mt-0.5 text-xs text-white/80">สร้าง แก้ไข และลบงวดเงินเดือน</p>
            </div>
            <button
              type="button"
              onClick={openCreate}
              className="rounded-xl bg-white/20 px-3 py-2 text-xs font-bold text-white backdrop-blur-sm transition hover:bg-white/30"
            >
              + สร้างงวดใหม่
            </button>
          </div>
        </div>

        <div className="-mt-5 rounded-t-3xl bg-white px-3 pb-5 pt-5 sm:px-4 sm:pb-6 sm:pt-6">
          {loading && <p className="text-sm text-zinc-500">กำลังโหลด...</p>}
          {pageError && (
            <p className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{pageError}</p>
          )}

          {!loading && periods.length === 0 && (
            <p className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-500">ยังไม่มีงวด กด "สร้างงวดใหม่" เพื่อเริ่มต้น</p>
          )}

          <div className="space-y-2">
            {periods.map((p) => (
              <div
                key={p.period_id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-zinc-50/70 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-zinc-900">
                    {shortDate(p.start_date)} – {shortDate(p.end_date)}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    {p.is_active ? (
                      <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                        เปิดอยู่
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full border border-zinc-300 bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-600">
                        ปิดแล้ว
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(p)}
                    className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50"
                  >
                    แก้ไข
                  </button>
                  {p.is_active && (
                    <button
                      type="button"
                      onClick={() => handleClose(p)}
                      className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-800 transition hover:bg-amber-100"
                    >
                      ปิดงวด
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(p)}
                    className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                  >
                    ลบ
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-900/45 sm:items-center">
          <div className="w-full max-w-md overflow-hidden rounded-t-3xl bg-white px-5 pb-8 pt-5 shadow-2xl sm:rounded-3xl sm:px-6 sm:pb-6">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-base font-bold text-zinc-900">
                {modalMode === 'create' ? 'สร้างงวดใหม่' : 'แก้ไขงวด'}
              </p>
              <button type="button" onClick={closeModal} className="text-xs font-semibold text-zinc-500">
                ยกเลิก
              </button>
            </div>

            <div className="space-y-4">
              <DateField
                label="วันที่เริ่มต้น"
                name="start_date"
                value={form.start_date}
                onChange={handleChange}
                error={fieldErrors.start_date}
              />
              <DateField
                label="วันที่สิ้นสุด"
                name="end_date"
                value={form.end_date}
                min={form.start_date || undefined}
                onChange={handleChange}
                error={fieldErrors.end_date}
              />
            </div>

            {modalError && (
              <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {modalError}
              </p>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="mt-5 w-full rounded-2xl bg-brandRed py-4 text-sm font-bold text-white shadow-md shadow-brandRed/30 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'กำลังบันทึก...' : modalMode === 'create' ? 'สร้างงวด' : 'บันทึกการแก้ไข'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function DateField({
  label,
  name,
  value,
  min,
  onChange,
  error,
}: {
  label: string;
  name: string;
  value: string;
  min?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
}) {
  const base = 'block h-12 w-full min-w-0 max-w-full appearance-none rounded-xl border bg-zinc-50 px-4 py-3 text-sm outline-none transition';
  const cls = error
    ? `${base} border-red-400 bg-red-50 focus:border-red-400 focus:ring-2 focus:ring-red-100`
    : `${base} border-zinc-200 focus:border-brandRed focus:bg-white focus:ring-2 focus:ring-brandRed/10`;

  return (
    <div className="flex min-w-0 flex-col gap-1.5 overflow-hidden">
      <label className="text-sm font-medium text-zinc-700">
        {label} <span className="text-brandRed">*</span>
      </label>
      <input type="date" name={name} value={value} min={min} onChange={onChange} className={cls} />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
