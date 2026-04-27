import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function AddEmployeePage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    wage: '',
    ot: '',
  });
  // 

  const wage = parseFloat(form.wage) || 0;
  const ot = parseFloat(form.ot) || 0;
  const total = wage + ot;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    navigate('/employees/new/success');
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h1 className="mb-6 text-xl font-semibold text-brandRed">เพิ่มพนักงาน</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="ชื่อ" required>
            <input
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              required
              placeholder="ชื่อจริง"
              className={inputCls}
            />
          </Field>

          <Field label="นามสกุล" required>
            <input
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              required
              placeholder="นามสกุล"
              className={inputCls}
            />
          </Field>
        </div>

        <Field label="ค่าแรง (บาท/วัน)" required>
          <input
            name="wage"
            type="number"
            min="0"
            step="0.01"
            value={form.wage}
            onChange={handleChange}
            required
            placeholder="0.00"
            className={inputCls}
          />
        </Field>

        <Field label="OT (บาท)">
          <input
            name="ot"
            type="number"
            min="0"
            step="0.01"
            value={form.ot}
            onChange={handleChange}
            placeholder="0.00"
            className={inputCls}
          />
        </Field>

        <Field label="รวมทั้งสิ้น (คำนวณอัตโนมัติ)">
          <input
            value={total.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            readOnly
            disabled
            className={`${inputCls} cursor-not-allowed bg-zinc-100 text-zinc-500`}
          />
        </Field>

        <button
          type="submit"
          className="mt-2 w-full rounded-xl bg-brandRed py-3 text-sm font-semibold text-white transition hover:opacity-90 active:opacity-80"
        >
          บันทึกพนักงาน
        </button>
      </form>
    </section>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-zinc-700">
        {label}
        {required && <span className="ml-1 text-brandRed">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  'w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none ring-brandYellow transition focus:border-brandYellow focus:ring-2';
