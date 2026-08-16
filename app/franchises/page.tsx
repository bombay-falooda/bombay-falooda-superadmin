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
  const [confirm, setConfirm] = useState<Franchise | null>(null);

  useEffect(() => {
    loadFranchises();
  }, []);

  async function loadFranchises() {
    apiRequest<Franchise[]>("/franchises").then(setFranchises).catch((err) => {
      setError(err instanceof Error ? err.message : "Could not load franchises");
    });
  }

  async function deactivateFranchise(franchise: Franchise) {
    try {
      await apiRequest(`/franchises/${franchise.id}/status`, {
        method: "PATCH",
        body: { isActive: false },
      });
      setConfirm(null);
      await loadFranchises();
    } catch (err) {
      setConfirm(null);
      setError(err instanceof Error ? err.message : "Could not deactivate franchise");
    }
  }

  return (
    <>
      <PageHeader
        title="Franchises"
        description="Manage franchise records and assigned outlet counts."
        action={{ href: "/franchises/new", label: "Create Franchise" }}
      />
      <DataTable columns={["Name", "Owner", "Contact", "Status", "Linked", "Actions"]}>
        {franchises.map((franchise) => (
          <tr key={franchise.id} className="hover:bg-white/60">
            <td className="px-5 py-4 font-medium text-slate-950">{franchise.name}</td>
            <td className="px-5 py-4 text-slate-500">{franchise.ownerName || "N/A"}</td>
            <td className="px-5 py-4 text-slate-500">{franchise.email || franchise.phone || "N/A"}</td>
            <td className="px-5 py-4"><StatusBadge value={franchise.isActive} /></td>
            <td className="px-5 py-4 text-slate-500">
              {franchise._count?.outlets ?? 0} outlets, {franchise._count?.users ?? 0} users
            </td>
            <td className="px-5 py-4">
              <div className="flex flex-wrap gap-2">
                <Link className="btn-secondary h-9 px-3 text-xs" href={`/franchises/${franchise.id}/edit`}>
                  Edit
                </Link>
                <button
                  className="h-9 rounded-[14px] border border-red-100 bg-red-50 px-3 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                  type="button"
                  disabled={!franchise.isActive}
                  onClick={() => setConfirm(franchise)}
                >
                  {franchise.isActive ? "Delete" : "Inactive"}
                </button>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>
      <ResultDialog open={!!error} title="Could not load franchises" message={error} tone="error" onPrimary={() => setError("")} />
      <ResultDialog
        open={!!confirm}
        title="Deactivate franchise?"
        message={`This will mark ${confirm?.name || "this franchise"} as inactive. Linked outlets and history will stay safe.`}
        tone="confirm"
        primaryLabel="Deactivate"
        secondaryLabel="Cancel"
        onPrimary={() => confirm ? deactivateFranchise(confirm) : undefined}
        onSecondary={() => setConfirm(null)}
      />
    </>
  );
}
