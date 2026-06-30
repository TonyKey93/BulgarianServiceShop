"use client";

import { useEffect, useRef, useState } from "react";
import { StatusKey, getStatusConfig, REPAIR_STATUSES } from "@/lib/repairs";

interface StatusBadgeProps {
  status: StatusKey;
  onChange: (status: StatusKey) => void;
  disabled?: boolean;
}

export default function StatusBadge({ status, onChange, disabled }: StatusBadgeProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const config = getStatusConfig(status);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={`inline-flex min-w-[9rem] items-center justify-center gap-2 rounded-lg border-2 px-4 py-2 text-base font-semibold transition-colors disabled:opacity-60 ${config.badgeClass}`}
        title="Натиснете за смяна на статуса"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={`h-3 w-3 rounded-full ${config.dotClass}`} aria-hidden="true" />
        {config.label}
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Избор на статус"
          className="absolute left-0 top-full z-30 mt-2 min-w-[12rem] overflow-hidden rounded-xl border-2 border-slate-300 bg-white shadow-xl"
        >
          {REPAIR_STATUSES.map((item) => (
            <li key={item.key} role="option" aria-selected={item.key === status}>
              <button
                type="button"
                onClick={() => {
                  onChange(item.key);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left text-base font-medium transition-colors hover:bg-slate-100 ${
                  item.key === status ? "bg-blue-50" : ""
                }`}
              >
                <span className={`h-3 w-3 rounded-full ${item.dotClass}`} aria-hidden="true" />
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
