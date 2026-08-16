"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { DataTable } from "@/components/data-table";
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
};

type Outlet = {
  id: string;
  franchiseId: string | null;
  name: string;
  code: string;
  address: string;
  phone: string | null;
  email: string | null;
  status: string;
  dineIn: boolean;
  takeaway: boolean;
  delivery: boolean;
  onlineOrderingEnabled: boolean;
  serviceRadiusKm: string | null;
  openingTime: string | null;
  closingTime: string | null;
  franchise?: {
    id: string;
    name: string;
    isActive: boolean;
  } | null;
  _count?: {
    posDevices: number;
    users: number;
  };
};

function OutletMetric({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-[20px] border border-[#eadfd5] bg-white/72 p-4 shadow-[0_12px_34px_rgba(76,54,35,0.05)] backdrop-blur-xl">
      <div className="text-xs font-semibold uppercase tracking-wide text-[#8d827a]">
        {label}
      </div>
      <div className="font-display mt-2 text-3xl font-semibold leading-none text-[#070b21]">
        {value}
      </div>
      <div className="mt-3 text-xs text-[#766b64]">{helper}</div>
    </div>
  );
}

export default function OutletManagementPage() {
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [franchiseId, setFranchiseId] = useState("");
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState<Outlet | null>(null);
  const [dialog, setDialog] = useState({
    open: false,
    title: "",
    message: "",
    error: false,
  });

  useEffect(() => {
    loadPageData()
      .catch((err) => {
        setDialog({
          open: true,
          title: "Could not load outlet management",
          message: err instanceof Error ? err.message : "Request failed",
          error: true,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  async function loadPageData() {
    const [franchiseRows, outletRows] = await Promise.all([
      apiRequest<Franchise[]>("/franchises"),
      apiRequest<Outlet[]>("/outlets"),
    ]);

    setFranchises(franchiseRows);
    setOutlets(outletRows);
  }

  async function refreshOutlets() {
    await apiRequest<Outlet[]>("/outlets")
      .then(setOutlets)
      .catch((err) => {
        setDialog({
          open: true,
          title: "Could not refresh outlets",
          message: err instanceof Error ? err.message : "Request failed",
          error: true,
        });
      });
  }

  async function deactivateOutlet(outlet: Outlet) {
    try {
      await apiRequest(`/outlets/${outlet.id}/status`, {
        method: "PATCH",
        body: { status: "INACTIVE" },
      });
      setConfirm(null);
      await refreshOutlets();
    } catch (err) {
      setConfirm(null);
      setDialog({
        open: true,
        title: "Could not deactivate outlet",
        message: err instanceof Error ? err.message : "Request failed",
        error: true,
      });
    }
  }

  const selectedFranchise = useMemo(
    () => franchises.find((franchise) => franchise.id === franchiseId),
    [franchiseId, franchises],
  );

  const visibleOutlets = useMemo(() => {
    if (!franchiseId) {
      return outlets;
    }

    return outlets.filter((outlet) => outlet.franchiseId === franchiseId);
  }, [franchiseId, outlets]);

  const activeOutlets = useMemo(
    () => outlets.filter((outlet) => outlet.status === "ACTIVE").length,
    [outlets],
  );

  const linkedPosCount = useMemo(
    () =>
      outlets.reduce(
        (total, outlet) => total + (outlet._count?.posDevices ?? 0),
        0,
      ),
    [outlets],
  );

  return (
    <>
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold leading-tight text-[#070b21]">
            Outlet Management
          </h1>
          <p className="mt-1.5 text-sm text-[#766b64]">
            Select a franchise or owner, then add and monitor outlet locations.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-secondary" type="button" onClick={refreshOutlets}>
            Refresh
          </button>
          <Link className="btn-primary" href="/outlet-management/new">
            Add Outlet
          </Link>
        </div>
      </div>

      <section className="mb-5 grid gap-4 md:grid-cols-3">
        <OutletMetric
          label="Total Outlets"
          value={String(outlets.length)}
          helper="All outlets connected with DB"
        />
        <OutletMetric
          label="Active Outlets"
          value={String(activeOutlets)}
          helper="Currently available for operations"
        />
        <OutletMetric
          label="Linked POS"
          value={String(linkedPosCount)}
          helper="Devices assigned across outlets"
        />
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-semibold text-[#141124]">
              Outlets Directory
            </h2>
            <p className="mt-1 text-sm text-[#7d7169]">
              {franchiseId
                ? "Showing outlets for the selected franchise."
                : "Showing all outlets connected with the backend."}
            </p>
          </div>
          <div className="grid min-w-[260px] gap-2">
            <span className="form-label">Filter by Franchise / Owner</span>
            <select
              className="form-input"
              value={franchiseId}
              onChange={(event) => setFranchiseId(event.target.value)}
            >
              <option value="">All franchises</option>
              {franchises.map((franchise) => (
                <option key={franchise.id} value={franchise.id}>
                  {franchise.name}
                  {franchise.ownerName ? ` - ${franchise.ownerName}` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedFranchise ? (
          <div className="mb-4 rounded-[18px] border border-[#eadfd5] bg-white/62 p-4 shadow-[0_10px_24px_rgba(76,54,35,0.04)]">
            <div className="font-display text-xl font-semibold text-[#070b21]">
              {selectedFranchise.name}
            </div>
            <div className="mt-1 text-sm text-[#766b64]">
              {selectedFranchise.ownerName || selectedFranchise.email || selectedFranchise.phone || "Owner details not added"}
            </div>
          </div>
        ) : null}

        <DataTable columns={["Outlet", "Franchise", "Services", "Timing", "Status", "Linked", "Actions"]}>
          {loading ? (
            <tr>
              <td className="px-5 py-6 text-sm text-[#766b64]" colSpan={7}>
                Loading outlets from database...
              </td>
            </tr>
          ) : visibleOutlets.length ? (
            visibleOutlets.map((outlet) => (
              <tr key={outlet.id} className="hover:bg-white/60">
                <td className="px-5 py-4">
                  <div className="font-medium text-[#070b21]">{outlet.name}</div>
                  <div className="text-xs text-[#766b64]">
                    {outlet.code} | {outlet.address}
                  </div>
                  <div className="mt-1 text-xs text-[#8d827a]">
                    {outlet.phone || "No phone"} {outlet.email ? `| ${outlet.email}` : ""}
                  </div>
                </td>
                <td className="px-5 py-4 text-[#766b64]">
                  {outlet.franchise?.name || "Unassigned"}
                </td>
                <td className="px-5 py-4 text-xs text-[#766b64]">
                  {[
                    outlet.dineIn ? "Dine in" : null,
                    outlet.takeaway ? "Takeaway" : null,
                    outlet.delivery ? "Delivery" : null,
                    outlet.onlineOrderingEnabled ? "Online" : null,
                  ]
                    .filter(Boolean)
                    .join(", ") || "No services"}
                </td>
                <td className="px-5 py-4 text-[#766b64]">
                  {outlet.openingTime || "--"} to {outlet.closingTime || "--"}
                </td>
                <td className="px-5 py-4">
                  <StatusBadge value={outlet.status} />
                </td>
                <td className="px-5 py-4 text-[#766b64]">
                  {outlet._count?.posDevices ?? 0} POS, {outlet._count?.users ?? 0} team
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap gap-2">
                    <Link className="btn-secondary h-9 px-3 text-xs" href={`/outlet-management/${outlet.id}/edit`}>
                      Edit
                    </Link>
                    <button
                      className="h-9 rounded-[14px] border border-red-100 bg-red-50 px-3 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                      type="button"
                      disabled={outlet.status === "INACTIVE"}
                      onClick={() => setConfirm(outlet)}
                    >
                      {outlet.status === "INACTIVE" ? "Inactive" : "Delete"}
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td className="px-5 py-6 text-sm text-[#766b64]" colSpan={7}>
                No outlets found for this selection.
              </td>
            </tr>
          )}
        </DataTable>
      </section>

      <ResultDialog
        open={dialog.open}
        title={dialog.title}
        message={dialog.message}
        tone={dialog.error ? "error" : "success"}
        primaryLabel={dialog.error ? "Try Again" : "OK"}
        onPrimary={() => setDialog((current) => ({ ...current, open: false }))}
      />
      <ResultDialog
        open={!!confirm}
        title="Deactivate outlet?"
        message={`This will mark ${confirm?.name || "this outlet"} as inactive. POS links and history will stay in the database.`}
        tone="confirm"
        primaryLabel="Deactivate"
        secondaryLabel="Cancel"
        onPrimary={() => confirm ? deactivateOutlet(confirm) : undefined}
        onSecondary={() => setConfirm(null)}
      />
    </>
  );
}
