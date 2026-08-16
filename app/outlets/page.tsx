"use client";

import { useEffect, useState } from "react";

import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { ResultDialog } from "@/components/result-dialog";
import { StatusBadge } from "@/components/status-badge";
import { apiRequest } from "@/lib/api";

type Outlet = {
  id: string;
  name: string;
  code: string;
  address: string;
  status: string;
  menuSetupStatus?: string;
  franchise?: { name: string } | null;
  _count?: { posDevices: number; users: number };
};

export default function OutletsPage() {
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest<Outlet[]>("/outlets").then(setOutlets).catch((err) => {
      setError(err instanceof Error ? err.message : "Could not load outlets");
    });
  }, []);

  return (
    <>
      <PageHeader
        title="Outlets"
        description="Manage outlet locations, services and menu setup state."
        action={{ href: "/outlets/new", label: "Create Outlet" }}
      />
      <DataTable columns={["Outlet", "Franchise", "Status", "Menu", "Linked"]}>
        {outlets.map((outlet) => (
          <tr key={outlet.id} className="hover:bg-white/60">
            <td className="px-5 py-4">
              <div className="font-medium text-slate-950">{outlet.name}</div>
              <div className="text-xs text-slate-500">{outlet.code} · {outlet.address}</div>
            </td>
            <td className="px-5 py-4 text-slate-500">{outlet.franchise?.name || "Unassigned"}</td>
            <td className="px-5 py-4"><StatusBadge value={outlet.status} /></td>
            <td className="px-5 py-4"><StatusBadge value={outlet.menuSetupStatus} /></td>
            <td className="px-5 py-4 text-slate-500">{outlet._count?.posDevices ?? 0} POS, {outlet._count?.users ?? 0} users</td>
          </tr>
        ))}
      </DataTable>
      <ResultDialog open={!!error} title="Could not load outlets" message={error} tone="error" onPrimary={() => setError("")} />
    </>
  );
}
