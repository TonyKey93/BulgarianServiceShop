"use client";

import { FormEvent, useEffect, useState } from "react";
import { RepairRow, REPAIR_STATUSES, UpdateRepairInput, StatusKey } from "@/lib/repairs";

interface EditRepairModalProps {
  open: boolean;
  repair: RepairRow | null;
  onClose: () => void;
  onUpdated: () => void;
}

export default function EditRepairModal({ open, repair, onClose, onUpdated }: EditRepairModalProps) {
  const [form, setForm] = useState<UpdateRepairInput>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && repair) {
      setForm({
        clientName: repair.clientName,
        clientPhone: repair.clientPhone,
        device: repair.device,
        defectNotes: repair.defectNotes || "",
        dateReceived: repair.dateReceived ? repair.dateReceived.slice(0, 10) : "",
        price: repair.price,
        status: repair.status,
      });
      setError("");
      setShowDeleteConfirm(false);
    }
  }, [open, repair]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (showDeleteConfirm) {
          setShowDeleteConfirm(false);
        } else {
          onClose();
        }
      }
    }

    if (open) {
      document.addEventListener("keydown", onKeyDown);
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", onKeyDown);
        document.body.style.overflow = "";
      };
    }
  }, [open, showDeleteConfirm, onClose]);

  if (!open || !repair) return null;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!repair) return;
    setError("");

    const phone = (form.clientPhone || "").trim();
    if (!/^0\d{9}$/.test(phone)) {
      setError("Телефонният номер трябва да се състои от точно 10 цифри и да започва с 0.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/repairs/${repair.id}`, {
        method: "PATCH",
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

      onUpdated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Грешка при запис.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!repair) return;
    setDeleting(true);
    setError("");

    try {
      const response = await fetch(`/api/repairs/${repair.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Грешка при изтриване.");
      }

      onUpdated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Грешка при изтриване.");
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-repair-title"
    >
      <div
        className="w-full max-w-2xl rounded-2xl border-2 border-slate-300 bg-white p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 id="edit-repair-title" className="text-3xl font-bold text-slate-900">
            Редактиране на ремонт #{repair.id}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-2xl font-bold p-1 leading-none text-[32px] cursor-pointer"
            aria-label="Затвори"
          >
            &times;
          </button>
        </div>

        {showDeleteConfirm ? (
          <div className="space-y-6 py-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="h-10 w-10"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-slate-950">Сигурни ли сте?</h3>
              <p className="text-lg text-slate-600">
                Искате ли да изтриете ремонта на клиент <strong>{repair.clientName}</strong>?
                Това действие е окончателно и данните не могат да бъдат възстановени.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-xl border-2 border-slate-300 px-6 py-3 text-lg font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Отказ
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="rounded-xl bg-red-600 px-8 py-3 text-lg font-bold text-white hover:bg-red-700 disabled:opacity-60 cursor-pointer"
              >
                {deleting ? "Изтриване..." : "Да, изтрий"}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-lg font-semibold text-slate-800">
                  Име на клиент *
                </span>
                <input
                  required
                  value={form.clientName || ""}
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
                  value={form.clientPhone || ""}
                  onChange={(e) => setForm({ ...form, clientPhone: e.target.value })}
                  className="w-full rounded-xl border-2 border-slate-300 px-4 py-3 text-lg"
                  placeholder="0888123456"
                />
              </label>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-lg font-semibold text-slate-800">Уред *</span>
                <input
                  required
                  value={form.device || ""}
                  onChange={(e) => setForm({ ...form, device: e.target.value })}
                  className="w-full rounded-xl border-2 border-slate-300 px-4 py-3 text-lg"
                  placeholder="Samsung TV 55&quot;"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-lg font-semibold text-slate-800">Статус *</span>
                <select
                  value={form.status || ""}
                  onChange={(e) => setForm({ ...form, status: e.target.value as StatusKey })}
                  className="w-full rounded-xl border-2 border-slate-300 px-4 py-3 text-lg bg-white"
                >
                  {REPAIR_STATUSES.map((status) => (
                    <option key={status.key} value={status.key}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-lg font-semibold text-slate-800">
                Описание на проблема
              </span>
              <textarea
                rows={3}
                value={form.defectNotes || ""}
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

            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="rounded-xl border-2 border-red-400 px-6 py-3 text-lg font-semibold text-red-600 hover:bg-red-50 active:scale-[0.98] transition cursor-pointer"
              >
                Изтрий ремонта
              </button>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border-2 border-slate-400 px-6 py-3 text-lg font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Отказ
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-blue-700 px-8 py-3 text-lg font-bold text-white hover:bg-blue-800 disabled:opacity-60 active:scale-[0.98] transition cursor-pointer"
                >
                  {saving ? "Записване..." : "Запази промените"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
