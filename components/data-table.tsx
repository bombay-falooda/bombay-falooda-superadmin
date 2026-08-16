import { ReactNode } from "react";

type DataTableProps = {
  columns: string[];
  children: ReactNode;
};

export function DataTable({ columns, children }: DataTableProps) {
  return (
    <div className="w-full overflow-x-auto rounded-[20px] border border-[#eadfd5] bg-white/76 shadow-[0_12px_34px_rgba(76,54,35,0.05)] backdrop-blur-xl">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead className="bg-[#fffaf3]/80 text-xs font-semibold uppercase tracking-wide text-[#8d827a]">
          <tr>
            {columns.map((column) => (
              <th key={column} className="border-b border-[#eadfd5] px-4 py-3.5 whitespace-nowrap">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  );
}
