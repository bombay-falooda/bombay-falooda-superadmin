"use client";

import { Fragment, use, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { DataTable } from "@/components/data-table";
import { FormSection } from "@/components/form-section";
import { ResultDialog } from "@/components/result-dialog";
import { StatusBadge } from "@/components/status-badge";
import { apiRequest } from "@/lib/api";
import { INDIAN_STATES_AND_CITIES } from "@/lib/indian-states-cities";

// --- SVG Icons (No Emojis) ---
function FileTextIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function StoreIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h18v4H3V3zm0 4l1.5 11.5A2 2 0 006.48 20h11.04a2 2 0 001.98-1.5L21 7M9 20v-6h6v6" />
    </svg>
  );
}

function MonitorIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function DocumentIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );
}

function BarChartIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function EditIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}

function UsersIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function ClockIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function DownloadIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}

type TeamMember = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  status: string;
};

type Outlet = {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string | null;
  state: string | null;
  pincode: string | null;
  phone: string | null;
  email: string | null;
  dineIn: boolean;
  takeaway: boolean;
  delivery: boolean;
  onlineOrderingEnabled: boolean;
  status: string;
  createdAt: string;
  users?: TeamMember[];
};

type PosDevice = {
  id: string;
  outletId: string;
  outletName: string;
  outletCode: string;
  name: string;
  deviceCode: string | null;
  accessKey: string;
  type: string;
  status: string;
  lastLoginAt?: string | null;
  updatedAt?: string | null;
};

type LiveOrder = {
  id: string;
  outletName: string;
  source: string;
  type: string;
  status: string;
  totalFormatted: string;
  customerName: string | null;
  createdAt: string;
};

type PosBifurcation = {
  posDeviceId: string;
  posName: string;
  outletName: string;
  sales: number;
  salesFormatted: string;
  bills: number;
};

type OutletBifurcation = {
  outletId: string;
  outletName: string;
  outletCode: string;
  sales: number;
  salesFormatted: string;
  bills: number;
};

type FranchiseDetail = {
  id: string;
  name: string;
  ownerName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  agreementStartDate: string | null;
  agreementEndDate: string | null;
  gstNumber: string | null;
  securityDeposit: string | null;
  royaltyPercent: string | null;
  notes: string | null;
  canManageMenu: boolean;
  canManageOutletStaff: boolean;
  canViewReports: boolean;
  canRouteOrders: boolean;
  canRequestExtraPos: boolean;
  isActive: boolean;
  createdAt: string;
  outlets: Outlet[];
  posDevices: PosDevice[];
  performance: {
    totalOrders: number;
    totalBills: number;
    totalRevenue: number;
    totalRevenueFormatted: string;
    avgOrderValue: number;
    avgOrderValueFormatted: string;
    activeOutlets: number;
    totalPosDevices: number;
    liveOrders: LiveOrder[];
    posBifurcation: PosBifurcation[];
    outletBifurcation: OutletBifurcation[];
  };
};

const tabs = [
  { id: "details", label: "Basic Details", icon: FileTextIcon },
  { id: "outlets", label: "Outlets", icon: StoreIcon },
  { id: "pos", label: "POS Terminals", icon: MonitorIcon },
  { id: "documents", label: "Documents", icon: DocumentIcon },
  { id: "performance", label: "Performance Dashboard", icon: BarChartIcon },
];

const timeRanges = [
  { label: "Last 4 Hours", value: "4h" },
  { label: "Last 8 Hours", value: "8h" },
  { label: "Today", value: "1d" },
  { label: "Yesterday", value: "yesterday" },
  { label: "Last 7 Days", value: "1w" },
  { label: "Last 30 Days", value: "1m" },
  { label: "All Time", value: "all" },
];

const DEMO_FRANCHISE_MENU = [
  {
    id: "fm1",
    name: "Royal Bombay Falooda",
    description: "Rabdi, rose syrup, basil seeds, & cashew dry fruit mix.",
    imageUrl: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=600&q=80",
    price: 180,
    categoryName: "Signature Faloodas",
    addonGroups: [
      {
        name: "Extra Toppings",
        isRequired: false,
        addons: [
          { name: "Extra Rabdi", price: 30 },
          { name: "Dry Fruit Mix", price: 40 },
          { name: "Vanilla Ice Cream Scoop", price: 35 },
        ],
      },
    ],
  },
  {
    id: "fm2",
    name: "Mango Kesar Special Falooda",
    description: "Alphonso mango pulp, saffron rabdi & almonds.",
    imageUrl: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80",
    price: 220,
    categoryName: "Specialty Faloodas",
    addonGroups: [
      {
        name: "Ice Cream Scoop Selection",
        isRequired: true,
        addons: [
          { name: "Mango Scoop", price: 40 },
          { name: "Kesar Pista Scoop", price: 45 },
        ],
      },
    ],
  },
];

export default function UnifiedFranchisePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [activeTab, setActiveTab] = useState("details");
  const [selectedRange, setSelectedRange] = useState("1m");
  const [data, setData] = useState<FranchiseDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit Mode state for Basic Details
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [savingDetails, setSavingDetails] = useState(false);

  // Edit Outlet Modal state
  const [editingOutlet, setEditingOutlet] = useState<Outlet | null>(null);
  const [savingOutlet, setSavingOutlet] = useState(false);

  // Edit POS Modal state
  const [editingPos, setEditingPos] = useState<PosDevice | null>(null);
  const [savingPos, setSavingPos] = useState(false);

  // Inline Sub-table expansion state (no modals)
  const [expandedOutletSection, setExpandedOutletSection] = useState<{
    outletId: string;
    type: "team" | "menu";
  } | null>(null);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [form, setForm] = useState({
    name: "",
    ownerName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "Gujarat",
    pincode: "",
    agreementStartDate: "",
    agreementEndDate: "",
    gstNumber: "",
    securityDeposit: "",
    royaltyPercent: "",
    notes: "",
    canManageMenu: true,
    canManageOutletStaff: true,
    canViewReports: true,
    canRouteOrders: true,
    canRequestExtraPos: true,
  });

  useEffect(() => {
    loadFranchise(selectedRange);
  }, [id, selectedRange]);

  async function loadFranchise(range = selectedRange) {
    setLoading(true);
    try {
      const res = await apiRequest<FranchiseDetail>(`/franchises/${id}?range=${range}`);
      setData(res);
      setForm({
        name: res.name || "",
        ownerName: res.ownerName || "",
        email: res.email || "",
        phone: res.phone || "",
        address: res.address || "",
        city: res.city || "",
        state: res.state || "Gujarat",
        pincode: res.pincode || "",
        agreementStartDate: res.agreementStartDate || "",
        agreementEndDate: res.agreementEndDate || "",
        gstNumber: res.gstNumber || "",
        securityDeposit: res.securityDeposit || "",
        royaltyPercent: res.royaltyPercent || "",
        notes: res.notes || "",
        canManageMenu: res.canManageMenu ?? true,
        canManageOutletStaff: res.canManageOutletStaff ?? true,
        canViewReports: res.canViewReports ?? true,
        canRouteOrders: res.canRouteOrders ?? true,
        canRequestExtraPos: res.canRequestExtraPos ?? true,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load franchise detail");
    } finally {
      setLoading(false);
    }
  }

  const stateOptions = useMemo(() => {
    return INDIAN_STATES_AND_CITIES.map((s) => ({ label: s.state, value: s.state }));
  }, []);

  const cityOptions = useMemo(() => {
    const foundState = INDIAN_STATES_AND_CITIES.find((s) => s.state === form.state);
    return foundState
      ? foundState.cities.map((c) => ({ label: c, value: c }))
      : [{ label: form.city || "Custom", value: form.city }];
  }, [form.state, form.city]);

  async function handleSaveDetails(e: React.FormEvent) {
    e.preventDefault();
    setSavingDetails(true);
    setError("");

    try {
      const updated = await apiRequest<FranchiseDetail>(`/franchises/${id}`, {
        method: "PATCH",
        body: form,
      });
      setData((prev) => (prev ? { ...prev, ...updated } : prev));
      setIsEditingDetails(false);
      setSuccessMessage("Franchise details updated successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update franchise details");
    } finally {
      setSavingDetails(false);
    }
  }

  async function handleSaveOutlet(e: React.FormEvent) {
    e.preventDefault();
    if (!editingOutlet) return;
    setSavingOutlet(true);
    setError("");

    try {
      await apiRequest(`/outlets/${editingOutlet.id}`, {
        method: "PATCH",
        body: {
          name: editingOutlet.name,
          code: editingOutlet.code,
          phone: editingOutlet.phone,
          email: editingOutlet.email,
          address: editingOutlet.address,
          city: editingOutlet.city,
          state: editingOutlet.state,
          pincode: editingOutlet.pincode,
          dineIn: editingOutlet.dineIn,
          takeaway: editingOutlet.takeaway,
          delivery: editingOutlet.delivery,
          onlineOrderingEnabled: editingOutlet.onlineOrderingEnabled,
        },
      });

      await loadFranchise();
      setEditingOutlet(null);
      setSuccessMessage("Outlet updated successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update outlet");
    } finally {
      setSavingOutlet(false);
    }
  }

  async function handleSavePos(e: React.FormEvent) {
    e.preventDefault();
    if (!editingPos) return;
    setSavingPos(true);
    setError("");

    try {
      await apiRequest(`/pos-devices/${editingPos.id}`, {
        method: "PATCH",
        body: {
          name: editingPos.name,
          deviceCode: editingPos.deviceCode,
          type: editingPos.type,
        },
      });

      await loadFranchise();
      setEditingPos(null);
      setSuccessMessage("POS terminal updated successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update POS terminal");
    } finally {
      setSavingPos(false);
    }
  }

  async function toggleFranchiseStatus() {
    if (!data) return;
    const nextActive = !data.isActive;
    try {
      await apiRequest(`/franchises/${id}/status`, {
        method: "PATCH",
        body: { isActive: nextActive },
      });
      setSuccessMessage(`Franchise has been ${nextActive ? "enabled" : "disabled"} successfully.`);
      await loadFranchise();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change franchise status");
    }
  }

  async function toggleOutletStatus(outlet: Outlet) {
    const nextStatus = outlet.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await apiRequest(`/outlets/${outlet.id}`, {
        method: "PATCH",
        body: { status: nextStatus },
      });
      setSuccessMessage(`Outlet ${outlet.name} is now ${nextStatus.toLowerCase()}.`);
      await loadFranchise();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update outlet status");
    }
  }

  async function togglePosStatus(pos: PosDevice) {
    const nextStatus = pos.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await apiRequest(`/pos-devices/${pos.id}`, {
        method: "PATCH",
        body: { status: nextStatus },
      });
      setSuccessMessage(`POS Terminal ${pos.name} is now ${nextStatus.toLowerCase()}.`);
      await loadFranchise();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update POS terminal status");
    }
  }

  function formatDate(isoStr?: string | null) {
    if (!isoStr) return "Never / No activity";
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

  function downloadDocument() {
    if (!data) return;
    const lines = [
      `BOMBAY FALOODA - FRANCHISE CONTRACT & HANDOVER DOCUMENT`,
      `======================================================`,
      `Franchise Name: ${data.name}`,
      `Franchise Owner: ${data.ownerName || "Not specified"}`,
      `Contact Email: ${data.email || "Not specified"}`,
      `Contact Phone: ${data.phone || "Not specified"}`,
      `Address: ${data.address || ""}, ${data.city || ""}, ${data.state || ""} ${data.pincode || ""}`,
      `GST Number: ${data.gstNumber || "N/A"}`,
      `Agreement Period: ${data.agreementStartDate || "N/A"} to ${data.agreementEndDate || "N/A"}`,
      `Royalty %: ${data.royaltyPercent || "N/A"}%`,
      `Security Deposit: Rs ${data.securityDeposit || "0"}`,
      ``,
      `LINKED OUTLETS (${data.outlets.length}):`,
      ...data.outlets.map(
        (o, idx) => `${idx + 1}. ${o.name} (${o.code}) - ${o.address || "No address"}`
      ),
      ``,
      `REGISTERED POS DEVICES (${data.posDevices.length}):`,
      ...data.posDevices.map(
        (p, idx) => `${idx + 1}. ${p.name} [${p.deviceCode || "NO-CODE"}] (${p.outletName}) - Key: ${p.accessKey}`
      ),
      ``,
      `Generated on: ${new Date().toLocaleString("en-IN")}`,
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${data.name.replace(/[^a-z0-9]/gi, "_")}_Contract_Document.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (loading && !data) {
    return (
      <div className="flex h-64 items-center justify-center text-sm font-semibold text-[#766b64]">
        Loading franchise view...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-[20px] border border-red-200 bg-red-50 p-6 text-center text-red-800">
        <h2 className="text-lg font-semibold">Franchise not found</h2>
        <Link className="btn-secondary mt-4 inline-block" href="/franchises">
          Back to Franchises List
        </Link>
      </div>
    );
  }

  const selectedRangeLabel = timeRanges.find((r) => r.value === selectedRange)?.label || selectedRange;

  return (
    <>
      {/* Header Banner */}
      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Link className="btn-secondary text-xs" href="/franchises">
              ← Back to List
            </Link>
            <StatusBadge value={data.isActive} />
          </div>
          <h1 className="font-display mt-2 text-3xl font-semibold text-[#070b21]">
            {data.name}
          </h1>
          <p className="mt-1 text-sm text-[#766b64]">
            Owner: <strong>{data.ownerName || "N/A"}</strong> | Email: {data.email || "N/A"} | Phone: {data.phone || "N/A"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleFranchiseStatus}
            className={`h-9 px-3.5 rounded-[14px] text-xs font-semibold border transition ${
              data.isActive
                ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            {data.isActive ? "Disable Franchise" : "Enable Franchise"}
          </button>
          <button className="btn-secondary text-xs flex items-center gap-1.5" type="button" onClick={downloadDocument}>
            <DownloadIcon className="h-4 w-4" />
            <span>Download Contract</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation (Using Proper Icons) */}
      <div className="mb-6 overflow-x-auto rounded-[20px] border border-[#eadfd5] bg-white/72 p-2 backdrop-blur-xl">
        <div className="flex gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`flex items-center gap-2 rounded-[14px] px-4 py-3 text-sm font-semibold transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border border-[#9b6df0] bg-[#f6eafa] text-[#6f39d8] shadow-[0_8px_20px_rgba(124,63,224,0.12)]"
                    : "border border-transparent text-[#766b64] hover:bg-white hover:text-[#070b21]"
                }`}
                type="button"
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon className={`h-4 w-4 ${activeTab === tab.id ? "text-[#6f39d8]" : "text-[#766b64]"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: BASIC DETAILS */}
      {activeTab === "details" && (
        <section className="space-y-6">
          <div className="flex items-center justify-between rounded-[20px] border border-[#eadfd5] bg-white/72 p-5 shadow-xs backdrop-blur-xl">
            <div>
              <h2 className="font-display text-xl font-semibold text-[#070b21]">
                Basic Franchise Details
              </h2>
              <p className="mt-1 text-sm text-[#766b64]">
                {isEditingDetails
                  ? "Editing basic information and system permissions."
                  : "View basic franchise details, contact info and permissions."}
              </p>
            </div>
            {!isEditingDetails ? (
              <button
                className="btn-primary text-xs flex items-center gap-1.5"
                type="button"
                onClick={() => setIsEditingDetails(true)}
              >
                <EditIcon className="h-4 w-4" />
                <span>Edit Details</span>
              </button>
            ) : (
              <button
                className="btn-secondary text-xs"
                type="button"
                onClick={() => setIsEditingDetails(false)}
              >
                Cancel Editing
              </button>
            )}
          </div>

          {!isEditingDetails ? (
            /* Read-Only Details View */
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-[20px] border border-[#eadfd5] bg-white/72 p-6 shadow-xs backdrop-blur-xl">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-[#8d827a]">
                  Franchise & Owner Contact
                </h3>
                <div className="mt-4 space-y-3.5 text-sm">
                  <div className="flex justify-between border-b border-[#eadfd5]/60 pb-2">
                    <span className="text-[#766b64]">Franchise Name</span>
                    <span className="font-semibold text-[#070b21]">{data.name}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#eadfd5]/60 pb-2">
                    <span className="text-[#766b64]">Owner Name</span>
                    <span className="font-semibold text-[#070b21]">{data.ownerName || "N/A"}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#eadfd5]/60 pb-2">
                    <span className="text-[#766b64]">Email</span>
                    <span className="font-semibold text-[#070b21]">{data.email || "N/A"}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#eadfd5]/60 pb-2">
                    <span className="text-[#766b64]">Phone</span>
                    <span className="font-semibold text-[#070b21]">{data.phone || "N/A"}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#eadfd5]/60 pb-2">
                    <span className="text-[#766b64]">Address</span>
                    <span className="font-semibold text-[#070b21]">{data.address || "N/A"}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#eadfd5]/60 pb-2">
                    <span className="text-[#766b64]">State & City</span>
                    <span className="font-semibold text-[#070b21]">{data.city || "N/A"}, {data.state || "N/A"} ({data.pincode || ""})</span>
                  </div>
                </div>
              </div>

              <div className="rounded-[20px] border border-[#eadfd5] bg-white/72 p-6 shadow-xs backdrop-blur-xl">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-[#8d827a]">
                  Agreement & Platform Controls
                </h3>
                <div className="mt-4 space-y-3.5 text-sm">
                  <div className="flex justify-between border-b border-[#eadfd5]/60 pb-2">
                    <span className="text-[#766b64]">Agreement Period</span>
                    <span className="font-semibold text-[#070b21]">{data.agreementStartDate || "N/A"} to {data.agreementEndDate || "N/A"}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#eadfd5]/60 pb-2">
                    <span className="text-[#766b64]">GST Number</span>
                    <span className="font-semibold text-[#070b21]">{data.gstNumber || "N/A"}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#eadfd5]/60 pb-2">
                    <span className="text-[#766b64]">Security Deposit</span>
                    <span className="font-semibold text-[#070b21]">Rs {data.securityDeposit || "0"}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#eadfd5]/60 pb-2">
                    <span className="text-[#766b64]">Royalty Percent</span>
                    <span className="font-semibold text-[#070b21]">{data.royaltyPercent || "0"}%</span>
                  </div>
                  <div className="flex justify-between border-b border-[#eadfd5]/60 pb-2">
                    <span className="text-[#766b64]">Permissions Active</span>
                    <span className="text-xs font-semibold text-[#7c3fe0]">
                      {[
                        data.canManageMenu && "Menu",
                        data.canManageOutletStaff && "Staff",
                        data.canViewReports && "Reports",
                        data.canRouteOrders && "Orders",
                        data.canRequestExtraPos && "POS Req",
                      ].filter(Boolean).join(", ") || "None"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Form Mode when Edit Details is clicked */
            <form onSubmit={handleSaveDetails}>
              <FormSection title="Edit Franchise Details">
                <div>
                  <label className="form-label flex items-center gap-1">
                    <span>Franchise Name</span>
                    <span className="text-sm font-bold text-red-500">*</span>
                  </label>
                  <input
                    className="form-input"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="form-label flex items-center gap-1">
                    <span>Contact Person / Owner Name</span>
                    <span className="text-sm font-bold text-red-500">*</span>
                  </label>
                  <input
                    className="form-input"
                    value={form.ownerName}
                    onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="form-label flex items-center gap-1">
                    <span>Email Address</span>
                    <span className="text-sm font-bold text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    className="form-input"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="form-label flex items-center gap-1">
                    <span>Phone Number</span>
                    <span className="text-sm font-bold text-red-500">*</span>
                  </label>
                  <input
                    className="form-input"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="form-label flex items-center gap-1">
                    <span>Address</span>
                    <span className="text-sm font-bold text-red-500">*</span>
                  </label>
                  <input
                    className="form-input"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="form-label flex items-center gap-1">
                    <span>State</span>
                    <span className="text-sm font-bold text-red-500">*</span>
                  </label>
                  <select
                    className="form-input cursor-pointer bg-white"
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    required
                  >
                    {stateOptions.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label flex items-center gap-1">
                    <span>City</span>
                    <span className="text-sm font-bold text-red-500">*</span>
                  </label>
                  <select
                    className="form-input cursor-pointer bg-white"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    required
                  >
                    {cityOptions.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label flex items-center gap-1">
                    <span>Pincode</span>
                    <span className="text-sm font-bold text-red-500">*</span>
                  </label>
                  <input
                    className="form-input"
                    value={form.pincode}
                    onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Agreement Start Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={form.agreementStartDate}
                    onChange={(e) => setForm({ ...form, agreementStartDate: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label">Agreement End Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={form.agreementEndDate}
                    onChange={(e) => setForm({ ...form, agreementEndDate: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label">GST Number</label>
                  <input
                    className="form-input"
                    value={form.gstNumber}
                    onChange={(e) => setForm({ ...form, gstNumber: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label">Security Deposit (Rs)</label>
                  <input
                    className="form-input"
                    value={form.securityDeposit}
                    onChange={(e) => setForm({ ...form, securityDeposit: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label">Royalty Percent (%)</label>
                  <input
                    className="form-input"
                    value={form.royaltyPercent}
                    onChange={(e) => setForm({ ...form, royaltyPercent: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label">Notes</label>
                  <input
                    className="form-input"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  />
                </div>

                <div className="md:col-span-2">
                  <h3 className="font-display mt-3 text-lg font-semibold text-[#070b21]">
                    Platform Permissions
                  </h3>
                </div>

                <label className="flex items-center justify-between rounded-[14px] border border-[#eadfd5] bg-white/68 px-4 py-3 shadow-xs">
                  <span className="text-sm font-medium text-[#3b302d]">Can manage menu</span>
                  <input
                    type="checkbox"
                    checked={form.canManageMenu}
                    onChange={(e) => setForm({ ...form, canManageMenu: e.target.checked })}
                  />
                </label>

                <label className="flex items-center justify-between rounded-[14px] border border-[#eadfd5] bg-white/68 px-4 py-3 shadow-xs">
                  <span className="text-sm font-medium text-[#3b302d]">Can manage outlet staff</span>
                  <input
                    type="checkbox"
                    checked={form.canManageOutletStaff}
                    onChange={(e) => setForm({ ...form, canManageOutletStaff: e.target.checked })}
                  />
                </label>

                <label className="flex items-center justify-between rounded-[14px] border border-[#eadfd5] bg-white/68 px-4 py-3 shadow-xs">
                  <span className="text-sm font-medium text-[#3b302d]">Can view reports</span>
                  <input
                    type="checkbox"
                    checked={form.canViewReports}
                    onChange={(e) => setForm({ ...form, canViewReports: e.target.checked })}
                  />
                </label>

                <label className="flex items-center justify-between rounded-[14px] border border-[#eadfd5] bg-white/68 px-4 py-3 shadow-xs">
                  <span className="text-sm font-medium text-[#3b302d]">Can route orders</span>
                  <input
                    type="checkbox"
                    checked={form.canRouteOrders}
                    onChange={(e) => setForm({ ...form, canRouteOrders: e.target.checked })}
                  />
                </label>

                <label className="flex items-center justify-between rounded-[14px] border border-[#eadfd5] bg-white/68 px-4 py-3 shadow-xs">
                  <span className="text-sm font-medium text-[#3b302d]">Can request extra POS</span>
                  <input
                    type="checkbox"
                    checked={form.canRequestExtraPos}
                    onChange={(e) => setForm({ ...form, canRequestExtraPos: e.target.checked })}
                  />
                </label>

                <div className="md:col-span-2 mt-4 flex justify-end gap-3">
                  <button className="btn-secondary" type="button" onClick={() => setIsEditingDetails(false)}>
                    Cancel
                  </button>
                  <button className="btn-primary" type="submit" disabled={savingDetails}>
                    {savingDetails ? "Saving..." : "Save Franchise Changes"}
                  </button>
                </div>
              </FormSection>
            </form>
          )}
        </section>
      )}

      {/* TAB 2: OUTLETS & TEAM MEMBERS */}
      {activeTab === "outlets" && (
        <section className="rounded-[20px] border border-[#eadfd5] bg-white/72 p-5 shadow-[0_12px_34px_rgba(76,54,35,0.05)] backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display flex items-center gap-2 text-xl font-semibold text-[#070b21]">
                <StoreIcon className="h-5 w-5 text-[#7c3fe0]" />
                <span>Franchise Outlets ({data.outlets.length})</span>
              </h2>
              <p className="mt-1 text-sm text-[#766b64]">
                Outlets operated under {data.name} with team members and edit controls.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link className="btn-secondary text-xs flex items-center gap-1.5" href={`/team-management/add?franchiseId=${data.id}`}>
                <UsersIcon className="h-4 w-4 text-[#7c3fe0]" />
                <span>+ Add Team Member</span>
              </Link>
              <Link className="btn-primary text-xs flex items-center gap-1.5" href="/outlets/new">
                <span>+ Add Outlet</span>
              </Link>
            </div>
          </div>

          <DataTable columns={["Outlet Name", "Code", "Contact / Phone", "Address", "Team Members", "Services", "Actions"]}>
            {data.outlets.map((outlet) => (
              <Fragment key={outlet.id}>
                <tr className="hover:bg-white/60">
                  <td className="px-5 py-4 font-semibold text-[#070b21]">
                    <Link className="hover:text-[#7c3fe0] hover:underline flex items-center gap-1.5" href={`/outlets/${outlet.id}`}>
                      <span>{outlet.name}</span>
                      <span className="text-[10px] text-[#7c3fe0] font-normal">↗</span>
                    </Link>
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-[#5f554f]">{outlet.code}</td>
                  <td className="px-5 py-4 text-xs text-slate-600">
                    {outlet.phone || "No phone"} <br />
                    <span className="text-slate-400">{outlet.email || "No email"}</span>
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-600">{outlet.address || "N/A"}</td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-1.5">
                      <button
                        className={`btn-secondary h-7 px-2 text-[11px] flex items-center gap-1 transition ${
                          expandedOutletSection?.outletId === outlet.id && expandedOutletSection?.type === "team"
                            ? "!bg-[#7c3fe0] !text-white !border-[#7c3fe0]"
                            : ""
                        }`}
                        type="button"
                        onClick={() =>
                          setExpandedOutletSection(
                            expandedOutletSection?.outletId === outlet.id && expandedOutletSection?.type === "team"
                              ? null
                              : { outletId: outlet.id, type: "team" }
                          )
                        }
                      >
                        <UsersIcon className={`h-3 w-3 ${expandedOutletSection?.outletId === outlet.id && expandedOutletSection?.type === "team" ? "text-white" : "text-[#7c3fe0]"}`} />
                        <span>{outlet.users?.length || 0} Staff</span>
                        <span className="text-[10px] ml-0.5">{expandedOutletSection?.outletId === outlet.id && expandedOutletSection?.type === "team" ? "▲" : "▼"}</span>
                      </button>
                      <button
                        className={`btn-secondary h-7 px-2 text-[11px] flex items-center gap-1 transition ${
                          expandedOutletSection?.outletId === outlet.id && expandedOutletSection?.type === "menu"
                            ? "!bg-[#7c3fe0] !text-white !border-[#7c3fe0]"
                            : "text-[#7c3fe0]"
                        }`}
                        type="button"
                        onClick={() =>
                          setExpandedOutletSection(
                            expandedOutletSection?.outletId === outlet.id && expandedOutletSection?.type === "menu"
                              ? null
                              : { outletId: outlet.id, type: "menu" }
                          )
                        }
                      >
                        <svg className={`h-3.5 w-3.5 ${expandedOutletSection?.outletId === outlet.id && expandedOutletSection?.type === "menu" ? "text-white" : "text-[#7c3fe0]"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <span>View Menu</span>
                        <span className="text-[10px] ml-0.5">{expandedOutletSection?.outletId === outlet.id && expandedOutletSection?.type === "menu" ? "▲" : "▼"}</span>
                      </button>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-600">
                    <div className="flex flex-wrap gap-1">
                      {outlet.dineIn && <span className="rounded bg-amber-50 px-2 py-0.5 text-amber-800 border border-amber-200">Dine-in</span>}
                      {outlet.takeaway && <span className="rounded bg-blue-50 px-2 py-0.5 text-blue-800 border border-blue-200">Takeaway</span>}
                      {outlet.delivery && <span className="rounded bg-emerald-50 px-2 py-0.5 text-emerald-800 border border-emerald-200">Delivery</span>}
                      {outlet.onlineOrderingEnabled && <span className="rounded bg-purple-50 px-2 py-0.5 text-purple-800 border border-purple-200">Online</span>}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        className="btn-secondary h-9 px-3 text-xs flex items-center gap-1 text-[#7c3fe0]"
                        href={`/outlets/${outlet.id}/edit`}
                      >
                        <EditIcon className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </Link>
                      <button
                        type="button"
                        onClick={() => toggleOutletStatus(outlet)}
                        className={`h-9 px-3 rounded-[12px] text-xs font-semibold border transition ${
                          outlet.status === "ACTIVE"
                            ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                            : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        }`}
                      >
                        {outlet.status === "ACTIVE" ? "Disable" : "Enable"}
                      </button>
                    </div>
                  </td>
                </tr>
                {expandedOutletSection?.outletId === outlet.id && (
                  <tr key={`${outlet.id}-expanded`} className="bg-gradient-to-r from-purple-50/60 via-white to-purple-50/40 border-b border-purple-200/80">
                  <td colSpan={7} className="p-4 sm:p-5">
                    {expandedOutletSection.type === "team" ? (
                      <div className="rounded-xl border border-purple-200 bg-white p-4 shadow-sm space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-100 pb-3">
                          <div className="flex items-center gap-2">
                            <UsersIcon className="h-4 w-4 text-[#7c3fe0]" />
                            <h4 className="font-display text-sm font-bold text-[#070b21]">
                              Team Members — {outlet.name} ({outlet.users?.length || 0})
                            </h4>
                          </div>
                          <div className="flex items-center gap-2">
                            <Link
                              className="btn-primary h-8 px-3 text-xs flex items-center gap-1"
                              href={`/team-management/add?franchiseId=${data.id}&outletId=${outlet.id}`}
                            >
                              <span>+ Add Team Member</span>
                            </Link>
                            <button
                              className="btn-secondary h-8 px-2.5 text-xs text-slate-500 hover:text-slate-700"
                              type="button"
                              onClick={() => setExpandedOutletSection(null)}
                            >
                              ✕ Close
                            </button>
                          </div>
                        </div>

                        {outlet.users && outlet.users.length > 0 ? (
                          <div className="overflow-x-auto rounded-lg border border-[#eadfd5]">
                            <table className="w-full text-left text-xs text-[#070b21]">
                              <thead className="bg-[#faf6f0] font-semibold text-[#766b64] border-b border-[#eadfd5]">
                                <tr>
                                  <th className="px-3.5 py-2.5">Staff Name</th>
                                  <th className="px-3.5 py-2.5">Role</th>
                                  <th className="px-3.5 py-2.5">Contact Email</th>
                                  <th className="px-3.5 py-2.5">Phone</th>
                                  <th className="px-3.5 py-2.5">Status</th>
                                  <th className="px-3.5 py-2.5 text-right">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#eadfd5]">
                                {outlet.users.map((u) => (
                                  <tr key={u.id} className="hover:bg-purple-50/30">
                                    <td className="px-3.5 py-2.5 font-bold text-[#070b21]">{u.name}</td>
                                    <td className="px-3.5 py-2.5">
                                      <span className="rounded bg-purple-50 px-2 py-0.5 font-semibold text-[11px] text-[#7c3fe0] border border-purple-200">
                                        {u.role}
                                      </span>
                                    </td>
                                    <td className="px-3.5 py-2.5 text-slate-600">{u.email || "No email"}</td>
                                    <td className="px-3.5 py-2.5 text-slate-600">{u.phone || "No phone"}</td>
                                    <td className="px-3.5 py-2.5">
                                      <StatusBadge value={u.status === "ACTIVE"} />
                                    </td>
                                    <td className="px-3.5 py-2.5 text-right">
                                      <Link
                                        className="text-[#7c3fe0] hover:underline font-semibold"
                                        href={`/team-management/${u.id}/edit`}
                                      >
                                        Edit Details →
                                      </Link>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="rounded-lg border border-dashed border-[#eadfd5] bg-[#faf6f0] p-4 text-center text-xs text-[#766b64]">
                            No team members assigned to {outlet.name} yet.{" "}
                            <Link
                              className="font-semibold text-[#7c3fe0] hover:underline ml-1"
                              href={`/team-management/add?franchiseId=${data.id}&outletId=${outlet.id}`}
                            >
                              Click here to add team member
                            </Link>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* MENU SUB TABLE */
                      <div className="rounded-xl border border-purple-200 bg-white p-4 shadow-sm space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-100 pb-3">
                          <div className="flex items-center gap-2">
                            <svg className="h-4 w-4 text-[#7c3fe0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            <h4 className="font-display text-sm font-bold text-[#070b21]">
                              Outlet Menu & Pricing — {outlet.name}
                            </h4>
                          </div>
                          <div className="flex items-center gap-2">
                            <Link
                              className="btn-primary h-8 px-3 text-xs flex items-center gap-1"
                              href={`/outlets/${outlet.id}`}
                            >
                              <span>Full Menu & Pricing Details ↗</span>
                            </Link>
                            <button
                              className="btn-secondary h-8 px-2.5 text-xs text-slate-500 hover:text-slate-700"
                              type="button"
                              onClick={() => setExpandedOutletSection(null)}
                            >
                              ✕ Close
                            </button>
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {((outlet as any).outletMenuItems && (outlet as any).outletMenuItems.length > 0
                            ? (outlet as any).outletMenuItems.map((omi: any) => ({
                                id: omi.item?.id || omi.id,
                                name: omi.item?.name || "Falooda Item",
                                description: omi.item?.description,
                                imageUrl: omi.item?.imageUrl,
                                price: omi.price,
                                categoryName: omi.item?.category?.name || "Specialty",
                                addonGroups: omi.item?.addonGroups,
                              }))
                            : DEMO_FRANCHISE_MENU
                          ).map((item: any) => (
                            <div key={item.id} className="flex flex-col justify-between rounded-xl border border-[#eadfd5] bg-[#faf6f0] p-3.5 text-xs">
                              <div>
                                <div className="flex gap-2.5">
                                  <img
                                    src={item.imageUrl || "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=600&q=80"}
                                    alt={item.name}
                                    className="h-14 w-14 rounded-lg object-cover shrink-0"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-1">
                                      <span className="font-bold text-[#070b21] truncate">{item.name}</span>
                                      <span className="font-bold text-[#7c3fe0] bg-white px-1.5 py-0.5 rounded border border-purple-200 shrink-0">
                                        INR {item.price}
                                      </span>
                                    </div>
                                    <p className="mt-0.5 text-[11px] text-slate-500 line-clamp-2">{item.description || item.categoryName}</p>
                                  </div>
                                </div>

                                {item.addonGroups && item.addonGroups.length > 0 ? (
                                  <div className="mt-2.5 border-t border-[#eadfd5] pt-1.5">
                                    <span className="text-[10px] font-bold uppercase text-[#8d827a]">Add-ons</span>
                                    {item.addonGroups.map((g: any, idx: number) => (
                                      <div key={idx} className="text-[11px] text-slate-600 truncate">
                                        <span className="font-semibold text-[#3b302d]">{g.name}:</span>{" "}
                                        {g.addons?.map((a: any) => `${a.name} (+INR ${a.price})`).join(", ")}
                                      </div>
                                    ))}
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
          </DataTable>
        </section>
      )}

      {/* TAB 3: POS TERMINALS WITH LAST LOGOFF */}
      {activeTab === "pos" && (
        <section className="rounded-[20px] border border-[#eadfd5] bg-white/72 p-5 shadow-[0_12px_34px_rgba(76,54,35,0.05)] backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display flex items-center gap-2 text-xl font-semibold text-[#070b21]">
                <MonitorIcon className="h-5 w-5 text-[#7c3fe0]" />
                <span>POS Terminals ({data.posDevices.length})</span>
              </h2>
              <p className="mt-1 text-sm text-[#766b64]">
                Registered permanent & temporary POS devices with last activity / logoff timestamps.
              </p>
            </div>
          </div>

          <DataTable columns={["Outlet", "Device Name", "Device Code", "Access Key", "Last Activity / Logoff", "Status", "Actions"]}>
            {data.posDevices.map((pos) => (
              <tr key={pos.id} className="hover:bg-white/60">
                <td className="px-5 py-4 font-semibold text-[#070b21]">{pos.outletName}</td>
                <td className="px-5 py-4 text-slate-800">{pos.name}</td>
                <td className="px-5 py-4 font-mono text-xs font-semibold text-[#7c3fe0]">{pos.deviceCode || "N/A"}</td>
                <td className="px-5 py-4 font-mono text-xs text-slate-600">{pos.accessKey}</td>
                <td className="px-5 py-4 text-xs text-slate-600 flex items-center gap-1.5">
                  <ClockIcon className="h-3.5 w-3.5 text-[#8d827a]" />
                  <span>{formatDate(pos.lastLoginAt || pos.updatedAt)}</span>
                </td>
                <td className="px-5 py-4">
                  <StatusBadge value={pos.status === "ACTIVE"} />
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap gap-2">
                    <Link
                      className="btn-secondary h-9 px-3 text-xs flex items-center gap-1 text-[#7c3fe0]"
                      href={`/pos-devices/${pos.id}/edit`}
                    >
                      <EditIcon className="h-3.5 w-3.5" />
                      <span>Edit</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => togglePosStatus(pos)}
                      className={`h-9 px-3 rounded-[12px] text-xs font-semibold border transition ${
                        pos.status === "ACTIVE"
                          ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                          : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      }`}
                    >
                      {pos.status === "ACTIVE" ? "Disable" : "Enable"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>
        </section>
      )}

      {/* TAB 4: DOCUMENTS */}
      {activeTab === "documents" && (
        <section className="rounded-[20px] border border-[#eadfd5] bg-white/72 p-6 shadow-[0_12px_34px_rgba(76,54,35,0.05)] backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display flex items-center gap-2 text-xl font-semibold text-[#070b21]">
                <DocumentIcon className="h-5 w-5 text-[#7c3fe0]" />
                <span>Contract & Handover Documents</span>
              </h2>
              <p className="mt-1 text-sm text-[#766b64]">
                Franchise onboarding agreement, owner credentials and POS key registers.
              </p>
            </div>
            <button className="btn-primary text-xs flex items-center gap-1.5" type="button" onClick={downloadDocument}>
              <DownloadIcon className="h-4 w-4" />
              <span>Download Contract (.txt)</span>
            </button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-[18px] border border-[#eadfd5] bg-white/80 p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-[#8d827a]">
                Franchise Agreement Details
              </h3>
              <div className="mt-3 space-y-2 text-sm text-[#3b302d]">
                <div><strong>Franchise Name:</strong> {data.name}</div>
                <div><strong>GST Number:</strong> {data.gstNumber || "N/A"}</div>
                <div><strong>Agreement Period:</strong> {data.agreementStartDate || "N/A"} to {data.agreementEndDate || "N/A"}</div>
                <div><strong>Security Deposit:</strong> Rs {data.securityDeposit || "0"}</div>
                <div><strong>Royalty Percent:</strong> {data.royaltyPercent || "0"}%</div>
              </div>
            </div>

            <div className="rounded-[18px] border border-[#eadfd5] bg-white/80 p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-[#8d827a]">
                Owner Credentials Overview
              </h3>
              <div className="mt-3 space-y-2 text-sm text-[#3b302d]">
                <div><strong>Owner Name:</strong> {data.ownerName || "N/A"}</div>
                <div><strong>Login Email:</strong> {data.email || "N/A"}</div>
                <div><strong>Registered Phone:</strong> {data.phone || "N/A"}</div>
                <div><strong>Outlets Managed:</strong> {data.outlets.length}</div>
                <div><strong>POS Devices Billed:</strong> {data.posDevices.length}</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* TAB 5: PERFORMANCE DASHBOARD WITH TIME RANGE SELECTOR & BIFURCATIONS */}
      {activeTab === "performance" && (
        <section className="space-y-6">
          {/* Time Range Filter Bar */}
          <div className="flex flex-col gap-3 rounded-[20px] border border-[#eadfd5] bg-white/72 p-4 shadow-xs backdrop-blur-xl md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <BarChartIcon className="h-5 w-5 text-[#7c3fe0]" />
              <h2 className="font-display text-lg font-semibold text-[#070b21]">
                Performance Window: <span className="text-[#7c3fe0]">{selectedRangeLabel}</span>
              </h2>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {timeRanges.map((r) => (
                <button
                  key={r.value}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    selectedRange === r.value
                      ? "bg-[#7c3fe0] text-white shadow-xs"
                      : "border border-[#eadfd5] bg-white/80 text-[#766b64] hover:bg-white hover:text-[#070b21]"
                  }`}
                  type="button"
                  onClick={() => setSelectedRange(r.value)}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Key KPI Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-[20px] border border-[#eadfd5] bg-white/72 p-5 shadow-xs backdrop-blur-xl">
              <div className="text-xs font-semibold uppercase tracking-wide text-[#8d827a]">
                Total Revenue ({selectedRangeLabel})
              </div>
              <div className="font-display mt-2 text-3xl font-semibold text-[#070b21]">
                {data.performance.totalRevenueFormatted}
              </div>
              <div className="mt-2 text-xs text-[#766b64]">
                Finalized sales across {data.performance.activeOutlets} active outlets
              </div>
            </div>

            <div className="rounded-[20px] border border-[#eadfd5] bg-white/72 p-5 shadow-xs backdrop-blur-xl">
              <div className="text-xs font-semibold uppercase tracking-wide text-[#8d827a]">Total Orders</div>
              <div className="font-display mt-2 text-3xl font-semibold text-[#070b21]">{data.performance.totalOrders}</div>
              <div className="mt-2 text-xs text-[#766b64]">{data.performance.totalBills} finalized bills</div>
            </div>

            <div className="rounded-[20px] border border-[#eadfd5] bg-white/72 p-5 shadow-xs backdrop-blur-xl">
              <div className="text-xs font-semibold uppercase tracking-wide text-[#8d827a]">Average Order Value</div>
              <div className="font-display mt-2 text-3xl font-semibold text-[#7c3fe0]">{data.performance.avgOrderValueFormatted}</div>
              <div className="mt-2 text-xs text-[#766b64]">Average ticket size per order</div>
            </div>

            <div className="rounded-[20px] border border-[#eadfd5] bg-white/72 p-5 shadow-xs backdrop-blur-xl">
              <div className="text-xs font-semibold uppercase tracking-wide text-[#8d827a]">Active POS Devices</div>
              <div className="font-display mt-2 text-3xl font-semibold text-[#070b21]">{data.performance.totalPosDevices}</div>
              <div className="mt-2 text-xs text-[#766b64]">Registered POS terminals</div>
            </div>
          </div>

          {/* Sales Bifurcations: POS-Wise & Outlet-Wise */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* POS-Wise Sales Bifurcation */}
            <div className="rounded-[20px] border border-[#eadfd5] bg-white/72 p-5 shadow-xs backdrop-blur-xl">
              <h3 className="font-display flex items-center gap-2 text-lg font-semibold text-[#070b21]">
                <MonitorIcon className="h-5 w-5 text-[#7c3fe0]" />
                <span>POS-Wise Sales Bifurcation ({selectedRangeLabel})</span>
              </h3>
              <p className="mt-1 text-xs text-[#766b64]">
                Revenue and bill count broken down per POS terminal.
              </p>

              <div className="mt-4 space-y-3">
                {data.performance.posBifurcation && data.performance.posBifurcation.length > 0 ? (
                  data.performance.posBifurcation.map((pos) => (
                    <div key={pos.posDeviceId} className="rounded-[14px] border border-[#eadfd5] bg-white/80 p-3.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-sm text-[#070b21]">{pos.posName}</span>
                          <span className="ml-2 text-xs text-[#766b64]">({pos.outletName})</span>
                        </div>
                        <span className="font-bold text-sm text-[#7c3fe0]">{pos.salesFormatted}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-[#766b64]">
                        <span>Bills Finalized: {pos.bills}</span>
                        <span>Avg Ticket: INR {pos.bills ? Math.round(pos.sales / pos.bills) : 0}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-[#766b64]">No POS sales recorded for this period</div>
                )}
              </div>
            </div>

            {/* Outlet-Wise Sales Bifurcation */}
            <div className="rounded-[20px] border border-[#eadfd5] bg-white/72 p-5 shadow-xs backdrop-blur-xl">
              <h3 className="font-display flex items-center gap-2 text-lg font-semibold text-[#070b21]">
                <StoreIcon className="h-5 w-5 text-[#7c3fe0]" />
                <span>Outlet-Wise Sales Bifurcation ({selectedRangeLabel})</span>
              </h3>
              <p className="mt-1 text-xs text-[#766b64]">
                Revenue and bill count broken down per outlet location.
              </p>

              <div className="mt-4 space-y-3">
                {data.performance.outletBifurcation && data.performance.outletBifurcation.length > 0 ? (
                  data.performance.outletBifurcation.map((outlet) => (
                    <div key={outlet.outletId} className="rounded-[14px] border border-[#eadfd5] bg-white/80 p-3.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-sm text-[#070b21]">{outlet.outletName}</span>
                          <span className="ml-2 font-mono text-xs text-[#766b64]">({outlet.outletCode})</span>
                        </div>
                        <span className="font-bold text-sm text-[#070b21]">{outlet.salesFormatted}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-[#766b64]">
                        <span>Bills Finalized: {outlet.bills}</span>
                        <span>Share: {data.performance.totalRevenue ? Math.round((outlet.sales / data.performance.totalRevenue) * 100) : 0}%</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-[#766b64]">No outlet sales recorded for this period</div>
                )}
              </div>
            </div>
          </div>

          {/* Live Orders Section */}
          <div className="rounded-[20px] border border-[#eadfd5] bg-white/72 p-5 shadow-xs backdrop-blur-xl">
            <h3 className="font-display text-lg font-semibold text-[#070b21]">
              Recent Live Orders ({data.performance.liveOrders?.length || 0})
            </h3>
            <p className="mt-1 text-xs text-[#766b64]">
              Recent active orders across franchise outlets for {selectedRangeLabel}.
            </p>

            <div className="mt-4">
              <DataTable columns={["Outlet", "Customer", "Source / Type", "Total Amount", "Status", "Date & Time"]}>
                {(data.performance.liveOrders || []).map((order) => (
                  <tr key={order.id} className="hover:bg-white/60">
                    <td className="px-5 py-4 font-semibold text-[#070b21]">{order.outletName}</td>
                    <td className="px-5 py-4 text-xs text-slate-600">{order.customerName || "Walk-in Guest"}</td>
                    <td className="px-5 py-4 text-xs text-slate-600">
                      <span className="font-semibold text-[#7c3fe0]">{order.source}</span> • {order.type}
                    </td>
                    <td className="px-5 py-4 font-bold text-[#070b21]">{order.totalFormatted}</td>
                    <td className="px-5 py-4 text-xs font-semibold text-[#0f766e]">{order.status}</td>
                    <td className="px-5 py-4 text-xs text-slate-500">{formatDate(order.createdAt)}</td>
                  </tr>
                ))}
              </DataTable>
            </div>
          </div>
        </section>
      )}

      {/* EDIT OUTLET MODAL */}
      {editingOutlet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-[24px] border border-white/80 bg-white p-6 shadow-2xl">
            <h3 className="font-display text-xl font-semibold text-[#070b21]">
              Edit Outlet ({editingOutlet.name})
            </h3>

            <form className="mt-4 space-y-4" onSubmit={handleSaveOutlet}>
              <div>
                <label className="form-label">Outlet Name</label>
                <input
                  className="form-input"
                  value={editingOutlet.name}
                  onChange={(e) => setEditingOutlet({ ...editingOutlet, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="form-label">Outlet Code</label>
                <input
                  className="form-input font-mono"
                  value={editingOutlet.code}
                  onChange={(e) => setEditingOutlet({ ...editingOutlet, code: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="form-label">Phone</label>
                  <input
                    className="form-input"
                    value={editingOutlet.phone || ""}
                    onChange={(e) => setEditingOutlet({ ...editingOutlet, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Email</label>
                  <input
                    className="form-input"
                    value={editingOutlet.email || ""}
                    onChange={(e) => setEditingOutlet({ ...editingOutlet, email: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Address</label>
                <input
                  className="form-input"
                  value={editingOutlet.address || ""}
                  onChange={(e) => setEditingOutlet({ ...editingOutlet, address: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="form-label">City</label>
                  <input
                    className="form-input"
                    value={editingOutlet.city || ""}
                    onChange={(e) => setEditingOutlet({ ...editingOutlet, city: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">State</label>
                  <input
                    className="form-input"
                    value={editingOutlet.state || ""}
                    onChange={(e) => setEditingOutlet({ ...editingOutlet, state: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Pincode</label>
                  <input
                    className="form-input"
                    value={editingOutlet.pincode || ""}
                    onChange={(e) => setEditingOutlet({ ...editingOutlet, pincode: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="flex items-center justify-between rounded-xl border border-[#eadfd5] p-3 text-xs font-semibold">
                  <span>Dine-in</span>
                  <input
                    type="checkbox"
                    checked={editingOutlet.dineIn}
                    onChange={(e) => setEditingOutlet({ ...editingOutlet, dineIn: e.target.checked })}
                  />
                </label>

                <label className="flex items-center justify-between rounded-xl border border-[#eadfd5] p-3 text-xs font-semibold">
                  <span>Takeaway</span>
                  <input
                    type="checkbox"
                    checked={editingOutlet.takeaway}
                    onChange={(e) => setEditingOutlet({ ...editingOutlet, takeaway: e.target.checked })}
                  />
                </label>

                <label className="flex items-center justify-between rounded-xl border border-[#eadfd5] p-3 text-xs font-semibold">
                  <span>Delivery</span>
                  <input
                    type="checkbox"
                    checked={editingOutlet.delivery}
                    onChange={(e) => setEditingOutlet({ ...editingOutlet, delivery: e.target.checked })}
                  />
                </label>

                <label className="flex items-center justify-between rounded-xl border border-[#eadfd5] p-3 text-xs font-semibold">
                  <span>Online Ordering</span>
                  <input
                    type="checkbox"
                    checked={editingOutlet.onlineOrderingEnabled}
                    onChange={(e) =>
                      setEditingOutlet({ ...editingOutlet, onlineOrderingEnabled: e.target.checked })
                    }
                  />
                </label>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button className="btn-secondary" type="button" onClick={() => setEditingOutlet(null)}>
                  Cancel
                </button>
                <button className="btn-primary" type="submit" disabled={savingOutlet}>
                  {savingOutlet ? "Saving..." : "Save Outlet Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT POS MODAL */}
      {editingPos && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[24px] border border-white/80 bg-white p-6 shadow-2xl">
            <h3 className="font-display text-xl font-semibold text-[#070b21]">
              Edit POS Terminal ({editingPos.name})
            </h3>

            <form className="mt-4 space-y-4" onSubmit={handleSavePos}>
              <div>
                <label className="form-label">Device Name</label>
                <input
                  className="form-input"
                  value={editingPos.name}
                  onChange={(e) => setEditingPos({ ...editingPos, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="form-label">Device Code</label>
                <input
                  className="form-input font-mono"
                  value={editingPos.deviceCode || ""}
                  onChange={(e) => setEditingPos({ ...editingPos, deviceCode: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label">Device Type</label>
                <select
                  className="form-input cursor-pointer bg-white"
                  value={editingPos.type}
                  onChange={(e) => setEditingPos({ ...editingPos, type: e.target.value })}
                >
                  <option value="PERMANENT">PERMANENT</option>
                  <option value="TEMPORARY">TEMPORARY</option>
                </select>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button className="btn-secondary" type="button" onClick={() => setEditingPos(null)}>
                  Cancel
                </button>
                <button className="btn-primary" type="submit" disabled={savingPos}>
                  {savingPos ? "Saving..." : "Save POS Terminal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESULT DIALOGS */}
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
