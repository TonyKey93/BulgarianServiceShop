"use client";

import { FormEvent, useEffect, useState } from "react";
import { CreateRepairInput } from "@/lib/repairs";

interface NewRepairModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const emptyForm: CreateRepairInput = {
  clientName: "",
  clientPhone: "",
  device: "",
  defectNotes: "",
  dateReceived: new Date().toISOString().slice(0, 10),
  price: null,
};

export default function NewRepairModal({ open, onClose, onCreated }: NewRepairModalProps) {
  const [form, setForm] = useState<CreateRepairInput>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setForm({
        ...emptyForm,
        dateReceived: new Date().toISOString().slice(0, 10),
      });
      setError("");
    }
  }, [open]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    if (open) {
      document.addEventListener("keydown", onKeyDown);
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", onKeyDown);
        document.body.style.overflow = "";
      };
    }
  }, [open, onClose]);

  if (!open) return null;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    const phone = form.clientPhone.trim();
    if (!/^0\d{9}$/.test(phone)) {
      setError("Телефонният номер трябва да се състои от точно 10 цифри и да започва с 0.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/repairs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price: form.price === null || form.price === undefined || form.price === ("" as unknown as number)
            ? null
            : Number(form.price),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Грешка при запис.");
      }

      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Грешка при запис.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-repair-title"
    >
      <div
        className="w-full max-w-2xl rounded-2xl border-2 border-slate-300 bg-white p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="new-repair-title" className="mb-6 text-3xl font-bold text-slate-900">
          Нов ремонт
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-lg font-semibold text-slate-800">
                Име на клиент *
              </span>
              <input
                required
                autoFocus
                value={form.clientName}
                onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                className="w-full rounded-xl border-2 border-slate-300 px-4 py-3 text-lg"
                placeholder="Иван Иванов"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-lg font-semibold text-slate-800">Телефон *</span>
              <input
                required
                type="tel"
                pattern="0[0-9]{9}"
                title="Телефонният номер трябва да започва с 0 и да има точно 10 цифри"
                value={form.clientPhone}
                onChange={(e) => setForm({ ...form, clientPhone: e.target.value })}
                className="w-full rounded-xl border-2 border-slate-300 px-4 py-3 text-lg"
                placeholder="0888123456"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-2 block text-lg font-semibold text-slate-800">Уред *</span>
            <input
              required
              value={form.device}
              onChange={(e) => setForm({ ...form, device: e.target.value })}
              className="w-full rounded-xl border-2 border-slate-300 px-4 py-3 text-lg"
              placeholder="Samsung TV 55&quot;"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-lg font-semibold text-slate-800">
              Описание на проблема
            </span>
            <textarea
              rows={4}
              value={form.defectNotes}
              onChange={(e) => setForm({ ...form, defectNotes: e.target.value })}
              className="w-full rounded-xl border-2 border-slate-300 px-4 py-3 text-lg"
              placeholder="Не включва, няма картина..."
            />
          </label>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-lg font-semibold text-slate-800">
                Дата на приемане
              </span>
              <input
                type="date"
                value={form.dateReceived?.slice(0, 10) ?? ""}
                onChange={(e) => setForm({ ...form, dateReceived: e.target.value })}
                className="w-full rounded-xl border-2 border-slate-300 px-4 py-3 text-lg"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-lg font-semibold text-slate-800">
                Цена за ремонт (€)
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    price: e.target.value === "" ? null : Number(e.target.value),
                  })
                }
                className="w-full rounded-xl border-2 border-slate-300 px-4 py-3 text-lg"
                placeholder="По-късно"
              />
            </label>
          </div>

          {error && (
            <p className="rounded-xl border-2 border-red-300 bg-red-50 px-4 py-3 text-lg text-red-800">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border-2 border-slate-400 px-6 py-3 text-lg font-semibold text-slate-700 hover:bg-slate-100"
            >
              Отказ
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-blue-700 px-8 py-3 text-lg font-bold text-white hover:bg-blue-800 disabled:opacity-60"
            >
              {saving ? "Записване..." : "Запиши ремонта"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
