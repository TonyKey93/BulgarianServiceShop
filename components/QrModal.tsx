"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

interface QrModalProps {
  open: boolean;
  phone: string;
  onClose: () => void;
}

export default function QrModal({ open, phone, onClose }: QrModalProps) {
  const [qrUrl, setQrUrl] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (open && phone) {
      QRCode.toDataURL(`tel:${phone.replace(/\s+/g, "")}`, {
        width: 256,
        margin: 2,
        color: {
          dark: "#0f172a", // slate-900
          light: "#ffffff",
        },
      })
        .then((url) => {
          setQrUrl(url);
          setError("");
        })
        .catch((err) => {
          console.error("QR Code generation error:", err);
          setError("Грешка при генериране на QR кода.");
        });
    }
  }, [open, phone]);

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-title"
    >
      <div
        className="w-full max-w-sm rounded-2xl border-2 border-slate-300 bg-white p-6 shadow-2xl text-center flex flex-col items-center gap-5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="w-full flex items-center justify-between border-b pb-3">
          <h2 id="qr-title" className="text-xl font-bold text-slate-900">
            Обаждане чрез QR код
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-2xl font-bold p-1 leading-none cursor-pointer"
            aria-label="Затвори"
          >
            &times;
          </button>
        </div>

        <p className="text-slate-600">
          Сканирайте QR кода с телефона си, за да наберете номера директно:
        </p>

        {error ? (
          <p className="text-red-600 text-lg">{error}</p>
        ) : qrUrl ? (
          <div className="rounded-xl border border-slate-200 p-2 bg-slate-50 shadow-inner">
            <img
              src={qrUrl}
              alt={`QR code for calling ${phone}`}
              className="mx-auto h-56 w-56 object-contain"
            />
          </div>
        ) : (
          <div className="h-56 w-56 flex items-center justify-center text-slate-500">
            Генериране...
          </div>
        )}

        <div className="w-full pt-2">
          <p className="text-2xl font-bold text-blue-800 tracking-wider font-mono">
            {phone}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-xl bg-slate-800 hover:bg-slate-900 px-5 py-3 text-lg font-bold text-white transition active:scale-[0.98] cursor-pointer"
        >
          Затвори
        </button>
      </div>
    </div>
  );
}
