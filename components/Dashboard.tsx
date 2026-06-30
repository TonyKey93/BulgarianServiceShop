"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import NewRepairModal from "@/components/NewRepairModal";
import EditRepairModal from "@/components/EditRepairModal";
import ConfigModal from "@/components/ConfigModal";
import QrModal from "@/components/QrModal";
import StatusBadge from "@/components/StatusBadge";
import {
  RepairRow,
  REPAIR_STATUSES,
  StatusKey,
  formatDate,
  formatPrice,
} from "@/lib/repairs";

export default function Dashboard() {
  const [repairs, setRepairs] = useState<RepairRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusKey | "ALL">("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [qrPhone, setQrPhone] = useState("");
  const [editingRepair, setEditingRepair] = useState<RepairRow | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const fetchRepairs = useCallback(async () => {
    setLoading(true);
    setError("");

    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());

    try {
      const response = await fetch(`/api/repairs?${params.toString()}`);
      if (!response.ok) throw new Error("Неуспешно зареждане на данните.");
      const data = (await response.json()) as RepairRow[];
      setRepairs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Грешка при зареждане.");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchRepairs();
    }, 250);

    return () => clearTimeout(timer);
  }, [fetchRepairs]);

  async function updateStatus(id: number, status: StatusKey) {
    setUpdatingId(id);
    try {
      const response = await fetch(`/api/repairs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) throw new Error("Неуспешна смяна на статуса.");

      const updated = (await response.json()) as RepairRow;
      setRepairs((prev) => prev.map((item) => (item.id === id ? updated : item)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Грешка при смяна на статуса.");
    } finally {
      setUpdatingId(null);
    }
  }

  const stats = useMemo(() => {
    const counts = REPAIR_STATUSES.reduce(
      (acc, status) => {
        acc[status.key] = repairs.filter((r) => r.status === status.key).length;
        return acc;
      },
      {} as Record<StatusKey, number>
    );
    return counts;
  }, [repairs]);

  const filteredRepairs = useMemo(() => {
    if (statusFilter === "ALL") return repairs;
    return repairs.filter((r) => r.status === statusFilter);
  }, [repairs, statusFilter]);

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b-4 border-blue-800 bg-white shadow-sm">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Сервиз за ремонт
              </h1>
              <p className="mt-1 text-xl text-slate-600">Дигитален бележник за ремонти</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setConfigOpen(true)}
                className="rounded-2xl border-2 border-slate-300 bg-white hover:bg-slate-50 px-6 py-5 text-xl font-bold text-slate-700 shadow-sm transition active:scale-[0.98] flex items-center gap-2 cursor-pointer font-sans"
                title="Настройки на архивиране и възстановяване"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="h-6 w-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.43l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 0 1 0-.255c.007-.378-.138-.75-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                  />
                </svg>
                Настройки
              </button>

              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="rounded-2xl bg-blue-700 px-8 py-5 text-xl font-bold text-white shadow-lg transition hover:bg-blue-800 active:scale-[0.98] cursor-pointer"
              >
                + Нов ремонт
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        <section className="mb-6 rounded-2xl border-2 border-slate-300 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <label className="block flex-1">
              <span className="mb-2 block text-lg font-semibold text-slate-800">
                Търсене по име или телефон
              </span>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="0888..., Иван..."
                className="w-full rounded-xl border-2 border-slate-300 px-4 py-3 text-lg"
              />
            </label>

            <div className="xl:min-w-[20rem]">
              <span className="mb-2 block text-lg font-semibold text-slate-800">Филтър по статус</span>
              <div className="flex flex-wrap gap-2">
                <FilterButton
                  active={statusFilter === "ALL"}
                  onClick={() => setStatusFilter("ALL")}
                  label="Всички"
                />
                {REPAIR_STATUSES.map((status) => (
                  <FilterButton
                    key={status.key}
                    active={statusFilter === status.key}
                    onClick={() => setStatusFilter(status.key)}
                    label={status.label}
                    count={stats[status.key]}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div className="mb-4 rounded-xl border-2 border-red-300 bg-red-50 px-4 py-3 text-lg text-red-800">
            {error}
          </div>
        )}

        <section className="overflow-hidden rounded-2xl border-2 border-slate-300 bg-white shadow-md">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left">
              <thead>
                <tr className="border-b-2 border-slate-300 bg-slate-200 text-slate-900">
                  <Th>№</Th>
                  <Th>Име на клиент</Th>
                  <Th>Телефон</Th>
                  <Th>Уред</Th>
                  <Th>Описание на проблема</Th>
                  <Th>Дата на приемане</Th>
                  <Th>Цена</Th>
                  <Th>Статус</Th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-xl text-slate-600">
                      Зареждане...
                    </td>
                  </tr>
                ) : filteredRepairs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <p className="text-2xl font-semibold text-slate-700">Няма записи</p>
                      <p className="mt-2 text-lg text-slate-500">
                        Натиснете „Нов ремонт“, за да добавите първия клиент.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredRepairs.map((repair, index) => (
                    <tr
                      key={repair.id}
                      className={`border-b border-slate-200 ${
                        index % 2 === 0 ? "bg-white" : "bg-slate-50"
                      } hover:bg-blue-50/60 hover:cursor-pointer transition-colors`}
                      onClick={() => setEditingRepair(repair)}
                      title="Кликнете за редактиране"
                    >
                      <Td className="font-semibold text-slate-700">{repair.id}</Td>
                      <Td className="font-semibold">{repair.clientName}</Td>
                      <Td onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => {
                            setQrPhone(repair.clientPhone);
                            setQrOpen(true);
                          }}
                          className="font-medium text-blue-800 underline-offset-2 hover:underline text-left cursor-pointer bg-transparent border-none p-0 inline-block font-sans"
                        >
                          {repair.clientPhone}
                        </button>
                      </Td>
                      <Td>{repair.device}</Td>
                      <Td className="max-w-xs whitespace-pre-wrap">{repair.defectNotes || "—"}</Td>
                      <Td>{formatDate(repair.dateReceived)}</Td>
                      <Td>{formatPrice(repair.price)}</Td>
                      <Td onClick={(e) => e.stopPropagation()}>
                        <StatusBadge
                          status={repair.status}
                          disabled={updatingId === repair.id}
                          onChange={(status) => void updateStatus(repair.id, status)}
                        />
                      </Td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!loading && filteredRepairs.length > 0 && (
            <div className="border-t-2 border-slate-200 bg-slate-100 px-4 py-3 text-lg text-slate-700">
              Общо записи: <strong>{filteredRepairs.length}</strong>
            </div>
          )}
        </section>
      </main>

      <NewRepairModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => void fetchRepairs()}
      />

      <EditRepairModal
        open={editingRepair !== null}
        repair={editingRepair}
        onClose={() => setEditingRepair(null)}
        onUpdated={() => void fetchRepairs()}
      />

      <ConfigModal
        open={configOpen}
        onClose={() => setConfigOpen(false)}
        onRestored={() => void fetchRepairs()}
      />

      <QrModal
        open={qrOpen}
        phone={qrPhone}
        onClose={() => {
          setQrOpen(false);
          setQrPhone("");
        }}
      />
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="whitespace-nowrap px-4 py-4 text-base font-bold uppercase tracking-wide">
      {children}
    </th>
  );
}

function Td({
  children,
  className = "",
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLTableCellElement>) => void;
}) {
  return (
    <td onClick={onClick} className={`px-4 py-4 text-lg ${className}`}>
      {children}
    </td>
  );
}

function FilterButton({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border-2 px-4 py-2 text-base font-semibold transition ${
        active
          ? "border-blue-700 bg-blue-700 text-white"
          : "border-slate-300 bg-white text-slate-800 hover:bg-slate-100"
      }`}
    >
      {label}
      {count !== undefined ? ` (${count})` : ""}
    </button>
  );
}
