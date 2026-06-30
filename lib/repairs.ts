import { RepairStatus } from "@prisma/client";

export type StatusKey = RepairStatus;

export interface StatusConfig {
  key: StatusKey;
  label: string;
  badgeClass: string;
  dotClass: string;
}

export const REPAIR_STATUSES: StatusConfig[] = [
  {
    key: "PRIET",
    label: "Приет",
    badgeClass: "bg-slate-200 text-slate-800 border-slate-400 hover:bg-slate-300",
    dotClass: "bg-slate-500",
  },
  {
    key: "CHAKA_CHASTI",
    label: "Чака части",
    badgeClass: "bg-amber-100 text-amber-900 border-amber-400 hover:bg-amber-200",
    dotClass: "bg-amber-500",
  },
  {
    key: "GOTOV",
    label: "Готов",
    badgeClass: "bg-green-100 text-green-900 border-green-500 hover:bg-green-200",
    dotClass: "bg-green-600",
  },
  {
    key: "IZADEN",
    label: "Издаден",
    badgeClass: "bg-neutral-300 text-neutral-700 border-neutral-500 hover:bg-neutral-400",
    dotClass: "bg-neutral-600",
  },
];

export function getStatusConfig(status: StatusKey): StatusConfig {
  return REPAIR_STATUSES.find((s) => s.key === status) ?? REPAIR_STATUSES[0];
}

export function getNextStatus(current: StatusKey): StatusKey {
  const order: StatusKey[] = ["PRIET", "CHAKA_CHASTI", "GOTOV", "IZADEN"];
  const index = order.indexOf(current);
  return order[(index + 1) % order.length];
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

export function formatPrice(price: number | null | undefined): string {
  if (price == null) return "—";
  return `${price.toFixed(2)} €`;
}

export interface RepairRow {
  id: number;
  clientName: string;
  clientPhone: string;
  device: string;
  defectNotes: string;
  dateReceived: string;
  price: number | null;
  status: StatusKey;
}

export interface CreateRepairInput {
  clientName: string;
  clientPhone: string;
  device: string;
  defectNotes: string;
  dateReceived?: string;
  price?: number | null;
  status?: StatusKey;
}

export interface UpdateRepairInput {
  clientName?: string;
  clientPhone?: string;
  device?: string;
  defectNotes?: string;
  dateReceived?: string;
  price?: number | null;
  status?: StatusKey;
}
