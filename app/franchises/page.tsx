"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { ResultDialog } from "@/components/result-dialog";
import { StatusBadge } from "@/components/status-badge";
import { apiRequest } from "@/lib/api";

type Franchise = {
  id: string;
  name: string;
  ownerName: string | null;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  _count?: { outlets: number; users: number };
};

export default function FranchisesPage() {
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [error, setError] = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    loadFranchises();
  }, []);

  async function loadFranchises() {
    apiRequest<Franchise[]>("/franchises").then(setFranchises).catch((err) => {
      setError(err instanceof Error ? err.message : "Could not load franchises");
    });
  }

  async function toggleStatus(franchise: Franchise) {
    const nextIsActive = !franchise.isActive;
    setTogglingId(franchise.id);
    try {
      await apiRequest(`/franchises/${franchise.id}/status`, {
        method: "PATCH",
        body: { isActive: nextIsActive },
      });
      await loadFranchises();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update franchise status");
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Franchises"
        description="Manage franchise records, status controls, and assigned outlet counts."
        action={{ href: "/setup-franchise", label: "Setup Franchise" }}
      />
      <DataTable columns={["Name", "Owner", "Contact", "Status", "Linked", "Actions"]}>
        {franchises.map((franchise) => (
          <tr key={franchise.id} className="hover:bg-white/60">
            <td className="px-5 py-4 font-semibold text-[#070b21]">
              <Link className="hover:text-[#7c3fe0] hover:underline" href={`/franchises/${franchise.id}`}>
                {franchise.name}
              </Link>
            </td>
            <td className="px-5 py-4 text-slate-600">{franchise.ownerName || "N/A"}</td>
            <td className="px-5 py-4 text-slate-600">{franchise.email || franchise.phone || "N/A"}</td>
            <td className="px-5 py-4"><StatusBadge value={franchise.isActive} /></td>
            <td className="px-5 py-4 text-slate-600">
              {franchise._count?.outlets ?? 0} outlets, {franchise._count?.users ?? 0} users
            </td>
            <td className="px-5 py-4">
              <div className="flex flex-wrap gap-2">
                <Link className="btn-primary h-9 px-3.5 text-xs" href={`/franchises/${franchise.id}`}>
                  View Details
                </Link>
                <button
                  className={`h-9 px-3.5 rounded-[14px] text-xs font-semibold border transition ${
                    franchise.isActive
                      ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                      : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  }`}
                  type="button"
                  disabled={togglingId === franchise.id}
                  onClick={() => toggleStatus(franchise)}
                >
                  {togglingId === franchise.id
                    ? "Updating..."
                    : franchise.isActive
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
