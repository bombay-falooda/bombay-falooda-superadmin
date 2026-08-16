"use client";

type ResultDialogProps = {
  open: boolean;
  title: string;
  message: string;
  tone?: "success" | "error" | "confirm";
  primaryLabel?: string;
  secondaryLabel?: string;
  onPrimary?: () => void;
  onSecondary?: () => void;
};

export function ResultDialog({
  open,
  title,
  message,
  tone = "success",
  primaryLabel = "OK",
  secondaryLabel,
  onPrimary,
  onSecondary,
}: ResultDialogProps) {
  if (!open) {
    return null;
  }

  const toneClass =
    tone === "error"
      ? "bg-red-50 text-red-700"
      : tone === "confirm"
        ? "bg-amber-50 text-amber-700"
        : "bg-green-50 text-green-700";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 backdrop-blur-md">
      <div className="w-full max-w-md rounded-xl border border-white/80 bg-white/95 p-7 shadow-xl backdrop-blur-2xl">
        <div
          className={`mb-4 flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold ${toneClass}`}
        >
          {tone === "error" ? "!" : tone === "confirm" ? "?" : "OK"}
        </div>
        <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          {secondaryLabel ? (
            <button className="btn-secondary" type="button" onClick={onSecondary}>
              {secondaryLabel}
            </button>
          ) : null}
          <button className="btn-primary" type="button" onClick={onPrimary}>
            {primaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
