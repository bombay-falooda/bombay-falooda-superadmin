import { ReactNode } from "react";

export function FormSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[20px] border border-[#eadfd5] bg-white/76 p-4 shadow-[0_12px_34px_rgba(76,54,35,0.05)] backdrop-blur-xl">
      <h2 className="font-display mb-3 text-lg font-semibold text-[#070b21]">{title}</h2>
      <div className="grid gap-5 md:grid-cols-2">{children}</div>
    </section>
  );
}
