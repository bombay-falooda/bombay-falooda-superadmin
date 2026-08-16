type StatusBadgeProps = {
  value?: string | boolean | null;
};

export function StatusBadge({ value }: StatusBadgeProps) {
  const text =
    typeof value === "boolean" ? (value ? "Active" : "Inactive") : value || "N/A";
  const normalized = text.toString().toUpperCase();
  const className =
    normalized === "ACTIVE" || normalized === "TRUE"
      ? "bg-green-50 text-green-700 ring-green-600/20"
      : normalized === "PENDING"
        ? "bg-amber-50 text-amber-700 ring-amber-600/20"
        : normalized === "REVOKED" || normalized === "SUSPENDED"
          ? "bg-red-50 text-red-700 ring-red-600/20"
        : "bg-white/70 text-slate-600 ring-slate-300/70";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${className}`}
    >
      {text}
    </span>
  );
}
