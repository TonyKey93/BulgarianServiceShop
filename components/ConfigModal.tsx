"use client";

import { useEffect, useState, useCallback } from "react";

interface BackupFile {
  filename: string;
  size: number;
  createdAt: string;
}

interface ConfigModalProps {
  open: boolean;
  onClose: () => void;
  onRestored: () => void;
}

export default function ConfigModal({ open, onClose, onRestored }: ConfigModalProps) {
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [confirmRestoreFile, setConfirmRestoreFile] = useState<string | null>(null);

  const fetchBackups = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/backup");
      if (!res.ok) throw new Error("Неуспешно зареждане на резервните копия.");
      const data = await res.json() as BackupFile[];
      setBackups(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Грешка при зареждане.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      void fetchBackups();
      setError("");
      setSuccess("");
      setConfirmRestoreFile(null);
    }
  }, [open, fetchBackups]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (confirmRestoreFile) {
          setConfirmRestoreFile(null);
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
  }, [open, confirmRestoreFile, onClose]);

  if (!open) return null;

  async function handleCreateBackup() {
    setActionLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/backup", { method: "POST" });
      if (!res.ok) throw new Error("Грешка при създаване на резервно копие.");
      setSuccess("Резервното копие е създадено успешно.");
      void fetchBackups();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Грешка при създаване.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRestore(filename: string) {
    setActionLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename }),
      });
      if (!res.ok) throw new Error("Грешка при възстановяване на базата данни.");
      setSuccess("Базата данни е възстановена успешно!");
      setConfirmRestoreFile(null);
      onRestored();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Грешка при възстановяване.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete(filename: string) {
    if (!confirm(`Сигурни ли сте, че искате да изтриете резервно копие ${filename}?`)) {
      return;
    }
    setActionLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/restore?filename=${filename}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Грешка при изтриване на файла.");
      setSuccess("Резервното копие е изтрито.");
      void fetchBackups();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Грешка при изтриване.");
    } finally {
      setActionLoading(false);
    }
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function formatDateTime(isoString: string) {
    return new Date(isoString).toLocaleString("bg-BG", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="config-title"
    >
      <div
        className="w-full max-w-3xl rounded-2xl border-2 border-slate-300 bg-white p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between border-b pb-4">
          <h2 id="config-title" className="text-3xl font-bold text-slate-900">
            Настройки на системата
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-3xl font-bold leading-none p-1 cursor-pointer"
            aria-label="Затвори"
          >
            &times;
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border-2 border-red-300 bg-red-50 px-4 py-3 text-lg text-red-800">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-xl border-2 border-green-300 bg-green-50 px-4 py-3 text-lg text-green-800">
            {success}
          </div>
        )}

        {confirmRestoreFile ? (
          <div className="space-y-6 py-6 text-center border-2 border-amber-300 bg-amber-50 rounded-2xl p-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600">
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
              <h3 className="text-2xl font-bold text-slate-900">Потвърдете възстановяването</h3>
              <p className="text-lg text-slate-700">
                Възстановяването на базата данни от файл <strong>{confirmRestoreFile}</strong> ще
                презапише всички текущи ремонти и данни в бележника!
              </p>
              <p className="text-base font-semibold text-red-700">
                Препоръчително е първо да направите резервно копие на текущото състояние.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => setConfirmRestoreFile(null)}
                className="rounded-xl border-2 border-slate-300 bg-white px-6 py-3 text-lg font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Отказ
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => void handleRestore(confirmRestoreFile)}
                className="rounded-xl bg-amber-600 px-8 py-3 text-lg font-bold text-white hover:bg-amber-700 disabled:opacity-60 cursor-pointer"
              >
                {actionLoading ? "Възстановяване..." : "Да, презапиши и възстанови"}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold text-slate-800">Резервни копия на базата данни</h3>
                <p className="text-slate-500 mt-1">
                  Архивирайте или възстановете състоянието на вашия дигитален бележник
                </p>
              </div>
              <button
                type="button"
                disabled={actionLoading || loading}
                onClick={() => void handleCreateBackup()}
                className="rounded-xl bg-blue-700 hover:bg-blue-800 px-5 py-3 text-lg font-bold text-white transition active:scale-[0.98] disabled:opacity-60 cursor-pointer"
              >
                {actionLoading ? "Създаване..." : "Създай архив"}
              </button>
            </div>

            <div className="rounded-xl border border-slate-300 overflow-hidden shadow-inner">
              <div className="max-h-[300px] overflow-y-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left text-base">
                  <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
                    <tr>
                      <th className="px-4 py-3">Дата на създаване</th>
                      <th className="px-4 py-3">Име на файл</th>
                      <th className="px-4 py-3">Размер</th>
                      <th className="px-4 py-3 text-right">Действие</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {loading ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                          Зареждане на резервни копия...
                        </td>
                      </tr>
                    ) : backups.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                          Няма намерени резервни копия. Натиснете „Създай архив“, за да направите
                          първия.
                        </td>
                      </tr>
                    ) : (
                      backups.map((b) => (
                        <tr key={b.filename} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-900">
                            {formatDateTime(b.createdAt)}
                          </td>
                          <td className="px-4 py-3 text-slate-600 font-mono text-sm">
                            {b.filename}
                          </td>
                          <td className="px-4 py-3 text-slate-600">{formatSize(b.size)}</td>
                          <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                            <button
                              type="button"
                              disabled={actionLoading}
                              onClick={() => setConfirmRestoreFile(b.filename)}
                              className="rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 px-3 py-2 font-semibold text-sm transition cursor-pointer"
                            >
                              Възстанови
                            </button>
                            <button
                              type="button"
                              disabled={actionLoading}
                              onClick={() => void handleDelete(b.filename)}
                              className="rounded-lg bg-red-100 hover:bg-red-200 text-red-900 px-3 py-2 font-semibold text-sm transition cursor-pointer"
                            >
                              Изтрий
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex justify-end pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border-2 border-slate-300 px-6 py-2.5 text-lg font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Затвори
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
