"use client";

import Link from "next/link";
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
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    loadOutlets();
  }, []);

  async function loadOutlets() {
    try {
      const data = await apiRequest<Outlet[]>("/outlets");
      setOutlets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load outlets");
    }
  }

  async function toggleStatus(outlet: Outlet) {
    const nextStatus = outlet.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    setTogglingId(outlet.id);
    try {
      await apiRequest(`/outlets/${outlet.id}`, {
        method: "PATCH",
        body: { status: nextStatus },
      });
      await loadOutlets();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change outlet status");
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Outlets"
        description="Manage outlet locations, status controls, services and menu setup state."
        action={{ href: "/outlets/new", label: "Create Outlet" }}
      />
      <DataTable columns={["Outlet", "Franchise", "Status", "Menu", "Linked", "Actions"]}>
        {outlets.map((outlet) => (
          <tr key={outlet.id} className="hover:bg-white/60">
            <td className="px-5 py-4">
              <Link className="font-semibold text-[#070b21] hover:text-[#7c3fe0] hover:underline" href={`/outlets/${outlet.id}`}>
                {outlet.name}
              </Link>
              <div className="text-xs text-slate-500">{outlet.code} · {outlet.address}</div>
            </td>
            <td className="px-5 py-4 text-slate-500">{outlet.franchise?.name || "Unassigned"}</td>
            <td className="px-5 py-4"><StatusBadge value={outlet.status === "ACTIVE"} /></td>
            <td className="px-5 py-4"><StatusBadge value={outlet.menuSetupStatus} /></td>
            <td className="px-5 py-4 text-slate-500">{outlet._count?.posDevices ?? 0} POS, {outlet._count?.users ?? 0} users</td>
            <td className="px-5 py-4">
              <div className="flex flex-wrap gap-2">
                <Link className="btn-primary h-9 px-3 text-xs" href={`/outlets/${outlet.id}`}>
                  View Details
                </Link>
                <Link className="btn-secondary h-9 px-3 text-xs" href={`/outlets/${outlet.id}/edit`}>
                  Edit
                </Link>
                <button
                  type="button"
                  disabled={togglingId === outlet.id}
                  onClick={() => toggleStatus(outlet)}
                  className={`h-9 px-3 rounded-[12px] text-xs font-semibold border transition ${
                    outlet.status === "ACTIVE"
                      ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                      : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  }`}
                >
                  {togglingId === outlet.id
                    ? "Updating..."
                    : outlet.status === "ACTIVE"
                    ? "Disable"
                    : "Enable"}
                </button>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>
      <ResultDialog open={!!error} title="Error" message={error} tone="error" onPrimary={() => setError("")} />
    </>
  );
}
