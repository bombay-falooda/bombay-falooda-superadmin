"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

import { apiRequest } from "@/lib/api";

type RangeKey = "1h" | "4h" | "1d" | "1w" | "1m";
type OrderSource = "ALL" | "WEBSITE" | "POS" | "ZOMATO" | "SWIGGY" | "EZCATER" | "OTHER";
type OrderType = "ALL" | "DINE_IN" | "TAKEAWAY" | "DELIVERY";

type SalesRow = { id: string; name: string; sales: number; salesLabel: string; bills: number };
type BreakdownRow = { key: string; sales: number; salesLabel: string; bills: number };

type DashboardData = {
  options: {
    franchises: Array<{ id: string; name: string }>;
    outlets: Array<{ id: string; name: string; code: string; franchiseId: string | null }>;
  };
  summary: {
    grossSalesLabel: string;
    finalizedBills: number;
    orders: number;
    averageOrderLabel: string;
    activeOutlets: number;
    posOnline: string;
    pendingApprovals: number;
    auditEvents: number;
    systemAlerts: number;
  };
  trend: Array<{ label: string; sales: number; salesLabel: string; bills: number }>;
  franchiseSales: SalesRow[];
  outletSales: SalesRow[];
  sourceBreakdown: BreakdownRow[];
  typeBreakdown: BreakdownRow[];
};

const ranges: Array<{ key: RangeKey; label: string }> = [
  { key: "1h", label: "Last hour" },
  { key: "4h", label: "4 hours" },
  { key: "1d", label: "Last day" },
  { key: "1w", label: "Last week" },
  { key: "1m", label: "Last month" },
];

const sources: Array<{ key: OrderSource; label: string }> = [
  { key: "ALL", label: "All channels" },
  { key: "WEBSITE", label: "Website" },
  { key: "POS", label: "POS" },
  { key: "ZOMATO", label: "Zomato" },
  { key: "SWIGGY", label: "Swiggy" },
  { key: "EZCATER", label: "Easy Cater" },
  { key: "OTHER", label: "Other" },
];

const orderTypes: Array<{ key: OrderType; label: string }> = [
  { key: "ALL", label: "All order types" },
  { key: "DINE_IN", label: "Dine-in" },
  { key: "TAKEAWAY", label: "Takeaway" },
  { key: "DELIVERY", label: "Delivery" },
];

const emptyData: DashboardData = {
  options: { franchises: [], outlets: [] },
  summary: {
    grossSalesLabel: "INR 0",
    finalizedBills: 0,
    orders: 0,
    averageOrderLabel: "INR 0",
    activeOutlets: 0,
    posOnline: "0/0",
    pendingApprovals: 0,
    auditEvents: 0,
    systemAlerts: 0,
  },
  trend: [],
  franchiseSales: [],
  outletSales: [],
  sourceBreakdown: [],
  typeBreakdown: [],
};

export default function DashboardPage() {
  const [range, setRange] = useState<RangeKey>("1d");
  const [franchiseId, setFranchiseId] = useState("ALL");
  const [outletId, setOutletId] = useState("ALL");
  const [source, setSource] = useState<OrderSource>("ALL");
  const [type, setType] = useState<OrderType>("ALL");
  const [data, setData] = useState<DashboardData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams({ range });
    if (franchiseId !== "ALL") params.set("franchiseId", franchiseId);
    if (outletId !== "ALL") params.set("outletId", outletId);
    if (source !== "ALL") params.set("source", source);
    if (type !== "ALL") params.set("type", type);

    setLoading(true);
    apiRequest<DashboardData>(`/reports/superadmin-dashboard?${params.toString()}`)
      .then((response) => {
        setData(response);
        setError("");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load dashboard"))
      .finally(() => setLoading(false));
  }, [range, franchiseId, outletId, source, type]);

  useEffect(() => {
    if (outletId !== "ALL" && !data.options.outlets.some((outlet) => outlet.id === outletId)) {
      setOutletId("ALL");
    }
  }, [data.options.outlets, outletId]);

  const points = useMemo(() => {
    const rows = data.trend.length ? data.trend : [{ sales: 0 }];
    const max = Math.max(...rows.map((row) => row.sales), 1);
    return rows
      .map((row, index) => {
        const x = 34 + index * (700 / Math.max(rows.length - 1, 1));
        const y = 248 - (row.sales / max) * 210;
        return `${x},${y}`;
      })
      .join(" ");
  }, [data.trend]);

  const kpis = [
    { label: "Gross Sales", value: data.summary.grossSalesLabel, helper: "Filtered finalized bills", tint: "purple" },
    { label: "Orders", value: String(data.summary.orders), helper: "Digital orders in range", tint: "gold" },
    { label: "Avg Order Value", value: data.summary.averageOrderLabel, helper: "Final bill average", tint: "purple" },
    { label: "Active Outlets", value: String(data.summary.activeOutlets), helper: "Selected filter area", tint: "gold" },
  ] as const;

  return (
    <>
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold leading-tight text-[#070b21]">
            Superadmin Dashboard
          </h1>
          <p className="mt-1.5 text-sm text-[#766b64]">
            Franchise, outlet, channel and order-type wise business analytics.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {ranges.map((item) => (
            <button
              key={item.key}
              className={`h-9 rounded-xl border px-3 text-xs font-medium transition ${
                range === item.key
                  ? "border-[#9b6df0] bg-white/75 text-[#6f39d8] shadow-[0_12px_28px_rgba(124,63,224,0.12)]"
                  : "border-[#eadfd5] bg-white/58 text-[#8a7667] hover:bg-white"
              }`}
              type="button"
              onClick={() => setRange(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <section className="mb-4 grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <FilterSelect label="Franchise" value={franchiseId} onChange={setFranchiseId}>
          <option value="ALL">All franchises</option>
          {data.options.franchises.map((franchise) => (
            <option key={franchise.id} value={franchise.id}>{franchise.name}</option>
          ))}
        </FilterSelect>
        <FilterSelect label="Outlet" value={outletId} onChange={setOutletId}>
          <option value="ALL">All outlets</option>
          {data.options.outlets.map((outlet) => (
            <option key={outlet.id} value={outlet.id}>{outlet.name} ({outlet.code})</option>
          ))}
        </FilterSelect>
        <FilterSelect label="Channel" value={source} onChange={(value) => setSource(value as OrderSource)}>
          {sources.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
        </FilterSelect>
        <FilterSelect label="Order Type" value={type} onChange={(value) => setType(value as OrderType)}>
          {orderTypes.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
        </FilterSelect>
      </section>

      {error ? (
        <div className="mb-4 rounded-[18px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((item) => (
          <div key={item.label} className="rounded-[20px] border border-[#eadfd5] bg-white/72 p-4 shadow-[0_12px_34px_rgba(76,54,35,0.05)] backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <MiniIcon tint={item.tint} />
              <div>
                <div className="text-sm font-medium text-[#3b302d]">{item.label}</div>
                <div className="font-display mt-2 text-3xl font-semibold leading-none text-[#070b21]">
                  {loading ? "..." : item.value}
                </div>
              </div>
            </div>
            <div className="mt-4 text-xs text-[#766b64]">{item.helper}</div>
          </div>
        ))}
      </section>

      <section className="mt-5 grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="rounded-[20px] border border-[#eadfd5] bg-white/72 p-4 shadow-[0_12px_34px_rgba(76,54,35,0.05)] backdrop-blur-xl">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <MiniIcon tint="purple" />
              <div>
                <h2 className="font-display text-xl font-semibold text-[#070b21]">Sales Trend</h2>
                <p className="mt-1 text-sm text-[#766b64]">Gross sales over the selected range</p>
              </div>
            </div>
            <div className="rounded-xl border border-[#eadfd5] bg-white/65 px-3 py-2 text-xs font-semibold text-[#7c3fe0]">
              {data.summary.finalizedBills} bills
            </div>
          </div>

          <div className="mt-5 h-[240px] rounded-[16px] bg-white/36 p-3">
            <svg className="h-full w-full" viewBox="0 0 760 300" preserveAspectRatio="none">
              {[50, 100, 150, 200, 250].map((y) => (
                <line key={y} x1="30" x2="735" y1={y} y2={y} stroke="#eadfd5" strokeDasharray="4 6" />
              ))}
              <defs>
                <linearGradient id="salesArea" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#7c3fe0" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#7c3fe0" stopOpacity="0" />
                </linearGradient>
              </defs>
              <polygon points={`34,270 ${points} 734,270`} fill="url(#salesArea)" />
              <polyline points={points} fill="none" stroke="#7c3fe0" strokeWidth="3" />
              {points.split(" ").filter(Boolean).map((point, index) => {
                const [x, y] = point.split(",");
                return <circle key={`${point}-${index}`} cx={x} cy={y} r="5" fill="#fff" stroke="#7c3fe0" strokeWidth="3" />;
              })}
            </svg>
          </div>
        </div>

        <div className="rounded-[20px] border border-[#eadfd5] bg-white/72 p-4 shadow-[0_12px_34px_rgba(76,54,35,0.05)] backdrop-blur-xl">
          <h2 className="font-display text-xl font-semibold text-[#070b21]">Business Overview</h2>
          <div className="mt-4 space-y-2.5">
            <OverviewRow label="POS Online" helper="Live and connected" value={data.summary.posOnline} />
            <OverviewRow label="Pending POS" helper="Awaiting approval" value={String(data.summary.pendingApprovals)} />
            <OverviewRow label="Audit Events" helper="Selected range" value={String(data.summary.auditEvents)} />
            <OverviewRow label="System Alerts" helper="No critical issues" value={String(data.summary.systemAlerts)} />
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-4 xl:grid-cols-2">
        <RankPanel title="Franchise Wise Sales" rows={data.franchiseSales} />
        <RankPanel title="Outlet Wise Sales" rows={data.outletSales} />
      </section>

      <section className="mt-5 grid gap-4 xl:grid-cols-2">
        <BreakdownPanel title="Channel Breakdown" rows={data.sourceBreakdown} />
        <BreakdownPanel title="Order Type Breakdown" rows={data.typeBreakdown} />
      </section>
    </>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <label className="rounded-[16px] border border-[#eadfd5] bg-white/70 p-3 shadow-[0_10px_24px_rgba(76,54,35,0.04)] backdrop-blur-xl">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#9a8170]">{label}</span>
      <select className="w-full bg-transparent text-sm font-semibold text-[#070b21] outline-none" value={value} onChange={(event) => onChange(event.target.value)}>
        {children}
      </select>
    </label>
  );
}

function MiniIcon({ tint }: { tint: "purple" | "gold" | "red" }) {
  const colors = {
    purple: "bg-[#f0e4ff] text-[#7c3fe0]",
    gold: "bg-[#f7ecdc] text-[#a97835]",
    red: "bg-[#ffe7e6] text-[#f05267]",
  };

  return (
    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${colors[tint]}`}>
      <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M4 19V5" />
        <path d="M4 19h16" />
        <path d="m7 15 4-4 3 3 5-7" />
      </svg>
    </div>
  );
}

function OverviewRow({ label, helper, value }: { label: string; helper: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-[14px] border border-[#eadfd5] bg-white/62 px-3 py-2.5">
      <MiniIcon tint="purple" />
      <div className="min-w-0 flex-1">
        <div className="font-medium text-[#070b21]">{label}</div>
        <div className="text-sm text-[#8d827a]">{helper}</div>
      </div>
      <div className="font-display text-2xl font-semibold text-[#070b21]">{value}</div>
    </div>
  );
}

function RankPanel({ title, rows }: { title: string; rows: SalesRow[] }) {
  const max = Math.max(...rows.map((row) => row.sales), 1);

  return (
    <div className="rounded-[20px] border border-[#eadfd5] bg-white/72 p-4 shadow-[0_12px_34px_rgba(76,54,35,0.05)] backdrop-blur-xl">
      <h2 className="font-display text-xl font-semibold text-[#070b21]">{title}</h2>
      <div className="mt-4 space-y-3">
        {rows.length ? rows.map((row) => (
          <div key={row.id}>
            <div className="flex justify-between gap-4 text-sm">
              <span className="font-semibold text-[#3b302d]">{row.name}</span>
              <span className="font-semibold text-[#070b21]">{row.salesLabel}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#f3ece6]">
              <div className="h-full rounded-full bg-[#7c3fe0]" style={{ width: `${Math.max(6, (row.sales / max) * 100)}%` }} />
            </div>
            <div className="mt-1 text-xs text-[#8d827a]">{row.bills} bills</div>
          </div>
        )) : <p className="text-sm font-semibold text-[#8d827a]">No finalized bills for this filter yet.</p>}
      </div>
    </div>
  );
}

function BreakdownPanel({ title, rows }: { title: string; rows: BreakdownRow[] }) {
  const total = Math.max(rows.reduce((sum, row) => sum + row.sales, 0), 1);

  return (
    <div className="rounded-[20px] border border-[#eadfd5] bg-white/72 p-4 shadow-[0_12px_34px_rgba(76,54,35,0.05)] backdrop-blur-xl">
      <h2 className="font-display text-xl font-semibold text-[#070b21]">{title}</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {rows.length ? rows.map((row) => (
          <div key={row.key} className="rounded-[16px] border border-[#eadfd5] bg-white/65 p-3">
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9a8170]">{labelize(row.key)}</div>
            <div className="mt-2 font-display text-2xl font-semibold text-[#070b21]">{row.salesLabel}</div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#f3ece6]">
              <div className="h-full rounded-full bg-[#a97835]" style={{ width: `${Math.max(6, (row.sales / total) * 100)}%` }} />
            </div>
            <div className="mt-2 text-xs text-[#8d827a]">{row.bills} bills</div>
          </div>
        )) : <p className="text-sm font-semibold text-[#8d827a]">No channel data for this filter yet.</p>}
      </div>
    </div>
  );
}

function labelize(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}
