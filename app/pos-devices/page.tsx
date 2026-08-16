"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { ResultDialog } from "@/components/result-dialog";
import { StatusBadge } from "@/components/status-badge";
import { apiRequest } from "@/lib/api";

type PosDevice = {
  id: string;
  name: string;
  type: string;
  status: string;
  accessKey: string;
  deviceCode: string | null;
  eventName: string | null;
  eventLocation: string | null;
  handlerName: string | null;
  handlerPhone: string | null;
  validFrom: string | null;
  validUntil: string | null;
  outlet?: {
    name: string;
    code: string;
    address: string;
    status: string;
    franchise?: { name: string } | null;
  } | null;
};

const filters = ["ALL", "ACTIVE", "INACTIVE", "PENDING", "EXPIRED", "REVOKED"] as const;

export default function PosDevicesPage() {
  const [devices, setDevices] = useState<PosDevice[]>([]);
  const [filter, setFilter] = useState<(typeof filters)[number]>("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState<PosDevice | null>(null);

  useEffect(() => {
    loadDevices();
  }, []);

  async function loadDevices() {
    setLoading(true);

    try {
      const rows = await apiRequest<PosDevice[]>("/pos-devices");
      setDevices(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load POS devices");
    } finally {
      setLoading(false);
    }
  }

  const filteredDevices = useMemo(() => {
    if (filter === "ALL") {
      return devices;
    }

    return devices.filter((device) => device.status === filter);
  }, [devices, filter]);

  async function revokeDevice(device: PosDevice) {
    try {
      await apiRequest(`/pos-devices/${device.id}/status`, {
        method: "PATCH",
        body: { status: "REVOKED" },
      });
      setConfirm(null);
      await loadDevices();
    } catch (err) {
      setConfirm(null);
      setError(err instanceof Error ? err.message : "Could not revoke POS device");
    }
  }

  return (
    <>
      <PageHeader
        title="POS Devices"
        description="View active, inactive, pending and temporary POS devices by outlet."
        action={{ href: "/pos-devices/new", label: "Add POS Device" }}
      >
        <div className="flex flex-wrap gap-2">
          {filters.map((item) => (
            <button
              key={item}
              className={`h-9 rounded-lg border px-3 text-xs font-semibold transition ${
                filter === item
                  ? "border-slate-950 bg-slate-950 text-white"
                  : "border-slate-200 bg-white/80 text-slate-600 hover:bg-white hover:text-slate-950"
              }`}
              type="button"
              onClick={() => setFilter(item)}
            >
              {item}
            </button>
          ))}
          <button
            className="h-9 rounded-lg border border-[#eadfd5] bg-white/80 px-3 text-xs font-semibold text-[#6f6259] transition hover:bg-white hover:text-[#141124]"
            type="button"
            onClick={loadDevices}
          >
            Refresh
          </button>
        </div>
      </PageHeader>

      <DataTable columns={["POS Device", "Outlet & Location", "Franchise", "Type", "Status", "Access", "Actions"]}>
        {loading ? (
          <tr>
            <td className="px-5 py-6 text-sm text-slate-500" colSpan={7}>
              Loading POS devices from database...
            </td>
          </tr>
        ) : filteredDevices.length ? (
          filteredDevices.map((device) => (
            <tr key={device.id} className="hover:bg-white/60">
              <td className="px-5 py-4">
                <div className="font-medium text-slate-950">{device.name}</div>
                <div className="text-xs text-slate-500">
                  {device.deviceCode || device.eventName || "Regular counter"}
                </div>
              </td>
              <td className="px-5 py-4">
                <div className="font-medium text-slate-700">
                  {device.outlet ? `${device.outlet.name} (${device.outlet.code})` : "Not connected"}
                </div>
                <div className="mt-1 text-xs leading-5 text-slate-500">
                  {device.type === "TEMPORARY"
                    ? device.eventLocation || device.outlet?.address || "Location not added"
                    : device.outlet?.address || "Location not added"}
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  Outlet status: {device.outlet?.status || "N/A"}
                </div>
              </td>
              <td className="px-5 py-4 text-slate-500">
                {device.outlet?.franchise?.name || "N/A"}
              </td>
              <td className="px-5 py-4 text-slate-500">
                <div>{device.type}</div>
                {device.type === "TEMPORARY" ? (
                  <div className="mt-1 text-xs text-slate-400">
                    {device.validFrom || "No start"} to {device.validUntil || "No end"}
                  </div>
                ) : null}
              </td>
              <td className="px-5 py-4">
                <StatusBadge value={device.status} />
              </td>
              <td className="px-5 py-4">
                <div className="font-mono text-xs text-slate-500">{device.accessKey}</div>
                {device.handlerName || device.handlerPhone ? (
                  <div className="mt-1 text-xs text-slate-400">
                    {device.handlerName || "Handler"} {device.handlerPhone || ""}
                  </div>
                ) : null}
              </td>
              <td className="px-5 py-4">
                <div className="flex flex-wrap gap-2">
                  <Link className="btn-secondary h-9 px-3 text-xs" href={`/pos-devices/${device.id}/edit`}>
                    Edit
                  </Link>
                  <button
                    className="h-9 rounded-[14px] border border-red-100 bg-red-50 px-3 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                    type="button"
                    disabled={device.status === "REVOKED"}
                    onClick={() => setConfirm(device)}
                  >
                    {device.status === "REVOKED" ? "Revoked" : "Delete"}
                  </button>
                </div>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td className="px-5 py-6 text-sm text-slate-500" colSpan={7}>
              No POS devices found for this filter.
            </td>
          </tr>
        )}
      </DataTable>

      <ResultDialog
        open={!!error}
        title="Could not load POS devices"
        message={error}
        tone="error"
        onPrimary={() => setError("")}
      />
      <ResultDialog
        open={!!confirm}
        title="Revoke POS device?"
        message={`This will revoke ${confirm?.name || "this POS device"} so its access key can no longer be used.`}
        tone="confirm"
        primaryLabel="Revoke"
        secondaryLabel="Cancel"
        onPrimary={() => confirm ? revokeDevice(confirm) : undefined}
        onSecondary={() => setConfirm(null)}
      />
    </>
  );
}
