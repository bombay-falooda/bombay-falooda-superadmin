"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { ResultDialog } from "@/components/result-dialog";
import { StatusBadge } from "@/components/status-badge";
import { apiRequest } from "@/lib/api";

type PosDeviceDetail = {
  id: string;
  outletId: string;
  name: string;
  type: "PERMANENT" | "TEMPORARY";
  status: string;
  accessKey: string;
  deviceCode?: string | null;
  eventName?: string | null;
  eventLocation?: string | null;
  handlerName?: string | null;
  handlerPhone?: string | null;
  validFrom?: string | null;
  validUntil?: string | null;
  lastLoginAt?: string | null;
  lastLoginDeviceCode?: string | null;
  createdAt: string;
  updatedAt: string;
  outlet?: {
    id: string;
    name: string;
    code: string;
    address: string;
    city?: string | null;
    state?: string | null;
    status: string;
    franchiseId?: string | null;
    franchise?: { id: string; name: string } | null;
  } | null;
};

export default function UnifiedPosDevicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [activeTab, setActiveTab] = useState<"overview" | "activity" | "event">("overview");
  const [data, setData] = useState<PosDeviceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    loadPosDevice();
  }, [id]);

  async function loadPosDevice() {
    setLoading(true);
    try {
      const res = await apiRequest<PosDeviceDetail>(`/pos-devices/${id}`);
      setData(res);
      if (res.type === "TEMPORARY") {
        setActiveTab("event");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load POS device details");
    } finally {
      setLoading(false);
    }
  }

  async function toggleStatus() {
    if (!data) return;
    const nextStatus = data.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await apiRequest(`/pos-devices/${id}/status`, {
        method: "PATCH",
        body: { status: nextStatus },
      });
      setSuccessMessage(`POS Terminal has been marked as ${nextStatus.toLowerCase()}.`);
      await loadPosDevice();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update POS status");
    }
  }

  function formatDate(isoStr?: string | null) {
    if (!isoStr) return "Never / No activity recorded";
    try {
      const d = new Date(isoStr);
      return d.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoStr;
    }
  }

  const backUrl = useMemo(() => {
    if (data?.outlet?.franchiseId) {
      return `/franchises/${data.outlet.franchiseId}`;
    }
    return "/pos-devices";
  }, [data]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm font-semibold text-[#766b64]">
        Loading unified POS device details...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-[20px] border border-red-200 bg-red-50 p-6 text-center text-red-800">
        <h2 className="text-lg font-semibold">POS Terminal not found</h2>
        <Link className="btn-secondary mt-4 inline-block" href="/pos-devices">
          Back to POS Devices
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Header Banner */}
      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Link className="btn-secondary text-xs" href={backUrl}>
              ← Back
            </Link>
            <StatusBadge value={data.status === "ACTIVE"} />
            <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-[#7c3fe0] border border-purple-200">
              {data.type} POS
            </span>
          </div>
          <h1 className="font-display mt-2 text-3xl font-semibold text-[#070b21]">
            {data.name} <span className="font-mono text-xl text-[#7c3fe0]">({data.deviceCode || "NO-CODE"})</span>
          </h1>
          <p className="mt-1 text-sm text-[#766b64]">
            Outlet: <strong>{data.outlet?.name || "Unassigned"}</strong> | Access Key: <span className="font-mono">{data.accessKey}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            className="btn-primary text-xs flex items-center gap-1.5"
            href={`/pos-devices/${data.id}/edit`}
          >
            <span>Edit POS Terminal</span>
          </Link>
          <button
            type="button"
            onClick={toggleStatus}
            className={`h-9 px-3.5 rounded-[14px] text-xs font-semibold border transition ${
              data.status === "ACTIVE"
                ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            {data.status === "ACTIVE" ? "Disable Terminal" : "Enable Terminal"}
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="mb-6 flex border-b border-[#eadfd5] gap-6">
        <button
          type="button"
          className={`pb-3 text-sm font-bold transition-all flex items-center gap-2 relative ${
            activeTab === "overview"
              ? "text-[#7c3fe0] border-b-2 border-[#7c3fe0]"
              : "text-[#766b64] hover:text-[#070b21]"
          }`}
          onClick={() => setActiveTab("overview")}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
          <span>Terminal Overview</span>
        </button>
        <button
          type="button"
          className={`pb-3 text-sm font-bold transition-all flex items-center gap-2 relative ${
            activeTab === "activity"
              ? "text-[#7c3fe0] border-b-2 border-[#7c3fe0]"
              : "text-[#766b64] hover:text-[#070b21]"
          }`}
          onClick={() => setActiveTab("activity")}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>Activity & Logoff Logs</span>
        </button>
        {data.type === "TEMPORARY" && (
          <button
            type="button"
            className={`pb-3 text-sm font-bold transition-all flex items-center gap-2 relative ${
              activeTab === "event"
                ? "text-[#7c3fe0] border-b-2 border-[#7c3fe0]"
                : "text-[#766b64] hover:text-[#070b21]"
            }`}
            onClick={() => setActiveTab("event")}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>Temporary Event Details</span>
          </button>
        )}
      </div>

      {/* TAB 1: TERMINAL OVERVIEW */}
      {activeTab === "overview" && (
        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-[20px] border border-[#eadfd5] bg-white/72 p-6 shadow-xs backdrop-blur-xl">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[#8d827a]">
              POS Device Specifications
            </h3>
            <div className="mt-4 space-y-3.5 text-sm">
              <div className="flex justify-between border-b border-[#eadfd5]/60 pb-2">
                <span className="text-[#766b64]">Device Name</span>
                <span className="font-semibold text-[#070b21]">{data.name}</span>
              </div>
              <div className="flex justify-between border-b border-[#eadfd5]/60 pb-2">
                <span className="text-[#766b64]">Device Code</span>
                <span className="font-mono font-semibold text-[#7c3fe0]">{data.deviceCode || "N/A"}</span>
              </div>
              <div className="flex justify-between border-b border-[#eadfd5]/60 pb-2">
                <span className="text-[#766b64]">Access Register Key</span>
                <span className="font-mono text-xs font-semibold text-slate-700">{data.accessKey}</span>
              </div>
              <div className="flex justify-between border-b border-[#eadfd5]/60 pb-2">
                <span className="text-[#766b64]">Terminal Type</span>
                <span className="font-bold text-[#070b21]">{data.type}</span>
              </div>
              <div className="flex justify-between border-b border-[#eadfd5]/60 pb-2">
                <span className="text-[#766b64]">Working Status</span>
                <StatusBadge value={data.status === "ACTIVE"} />
              </div>
              <div className="flex justify-between">
                <span className="text-[#766b64]">Registered On</span>
                <span className="text-xs text-slate-600">{formatDate(data.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-[20px] border border-[#eadfd5] bg-white/72 p-6 shadow-xs backdrop-blur-xl">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[#8d827a]">
              Connected Outlet & Franchise
            </h3>
            <div className="mt-4 space-y-3.5 text-sm">
              <div className="flex justify-between border-b border-[#eadfd5]/60 pb-2">
                <span className="text-[#766b64]">Outlet Name</span>
                <span className="font-semibold text-[#070b21]">{data.outlet?.name || "Not connected"}</span>
              </div>
              <div className="flex justify-between border-b border-[#eadfd5]/60 pb-2">
                <span className="text-[#766b64]">Outlet Code</span>
                <span className="font-mono text-[#070b21]">{data.outlet?.code || "N/A"}</span>
              </div>
              <div className="flex justify-between border-b border-[#eadfd5]/60 pb-2">
                <span className="text-[#766b64]">Franchise</span>
                <span className="font-semibold text-[#7c3fe0]">
                  {data.outlet?.franchise?.name || "Standalone"}
                </span>
              </div>
              <div className="flex justify-between border-b border-[#eadfd5]/60 pb-2">
                <span className="text-[#766b64]">Outlet Address</span>
                <span className="font-medium text-[#070b21] text-right">{data.outlet?.address || "N/A"}</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* TAB 2: ACTIVITY & LOGOFF LOGS */}
      {activeTab === "activity" && (
        <section className="rounded-[20px] border border-[#eadfd5] bg-white/72 p-6 shadow-[0_12px_34px_rgba(76,54,35,0.05)] backdrop-blur-xl max-w-2xl">
          <h3 className="font-display text-xl font-semibold text-[#070b21]">
            Terminal Activity History
          </h3>
          <p className="mt-1 text-sm text-[#766b64]">
            Recent login timestamps, device sessions, and logoff activity.
          </p>

          <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-[#eadfd5] bg-white p-4">
              <div className="text-xs font-semibold uppercase text-[#8d827a]">
                Last Login / Logoff Activity
              </div>
              <div className="mt-2 text-base font-semibold text-[#070b21]">
                {formatDate(data.lastLoginAt || data.updatedAt)}
              </div>
              <div className="mt-1 text-xs text-[#766b64]">
                Logged in device code: <span className="font-mono">{data.lastLoginDeviceCode || data.deviceCode || "POS-CLIENT-APP"}</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* TAB 3: TEMPORARY EVENT DETAILS */}
      {activeTab === "event" && data.type === "TEMPORARY" && (
        <section className="rounded-[20px] border border-[#eadfd5] bg-white/72 p-6 shadow-[0_12px_34px_rgba(76,54,35,0.05)] backdrop-blur-xl max-w-2xl">
          <h3 className="font-display text-xl font-semibold text-[#070b21]">
            Temporary Event Setup
          </h3>
          <p className="mt-1 text-sm text-[#766b64]">
            Event details, responsible handler contact, and valid operational timeframe.
          </p>

          <div className="mt-6 space-y-3.5 text-sm">
            <div className="flex justify-between border-b border-[#eadfd5]/60 pb-2">
              <span className="text-[#766b64]">Event Name</span>
              <span className="font-semibold text-[#070b21]">{data.eventName || "N/A"}</span>
            </div>
            <div className="flex justify-between border-b border-[#eadfd5]/60 pb-2">
              <span className="text-[#766b64]">Event Location</span>
              <span className="font-semibold text-[#070b21]">{data.eventLocation || "N/A"}</span>
            </div>
            <div className="flex justify-between border-b border-[#eadfd5]/60 pb-2">
              <span className="text-[#766b64]">Handler Name</span>
              <span className="font-semibold text-[#070b21]">{data.handlerName || "N/A"}</span>
            </div>
            <div className="flex justify-between border-b border-[#eadfd5]/60 pb-2">
              <span className="text-[#766b64]">Handler Phone</span>
              <span className="font-semibold text-[#7c3fe0]">{data.handlerPhone || "N/A"}</span>
            </div>
            <div className="flex justify-between border-b border-[#eadfd5]/60 pb-2">
              <span className="text-[#766b64]">Valid From</span>
              <span className="font-medium text-[#070b21]">{formatDate(data.validFrom)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#766b64]">Valid Until</span>
              <span className="font-medium text-[#070b21]">{formatDate(data.validUntil)}</span>
            </div>
          </div>
        </section>
      )}

      <ResultDialog
        open={!!error}
        title="Error"
        message={error}
        tone="error"
        onPrimary={() => setError("")}
      />
      <ResultDialog
        open={!!successMessage}
        title="Success"
        message={successMessage}
        tone="success"
        onPrimary={() => setSuccessMessage("")}
      />
    </>
  );
}
