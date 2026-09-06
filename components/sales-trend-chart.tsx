"use client";

import { useMemo, useState } from "react";

export type TrendPoint = {
  label: string;
  sales: number;
  salesLabel?: string;
  bills: number;
};

export function SalesTrendChart({
  data = [],
  height = 280,
  accentColor = "#7c3fe0",
  secondaryColor = "#a855f7",
}: {
  data: TrendPoint[];
  height?: number;
  accentColor?: string;
  secondaryColor?: string;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [chartMode, setChartMode] = useState<"area" | "bar">("area");

  // Ensure non-empty data for smooth rendering
  const trendData = useMemo(() => {
    if (data && data.length > 0) return data;
    // Mock smooth curve data if database has no sales yet
    return [
      { label: "10 AM", sales: 0, bills: 0 },
      { label: "12 PM", sales: 0, bills: 0 },
      { label: "02 PM", sales: 0, bills: 0 },
      { label: "04 PM", sales: 0, bills: 0 },
      { label: "06 PM", sales: 0, bills: 0 },
      { label: "08 PM", sales: 0, bills: 0 },
      { label: "10 PM", sales: 0, bills: 0 },
    ];
  }, [data]);

  const maxSales = useMemo(() => {
    const max = Math.max(...trendData.map((d) => d.sales), 0);
    return max === 0 ? 1000 : Math.ceil(max * 1.15);
  }, [trendData]);

  const peakPoint = useMemo(() => {
    return trendData.reduce((prev, current) => (current.sales > prev.sales ? current : prev), trendData[0]);
  }, [trendData]);

  const totalSales = useMemo(() => {
    return trendData.reduce((sum, d) => sum + d.sales, 0);
  }, [trendData]);

  const width = 800;
  const paddingLeft = 55;
  const paddingRight = 25;
  const paddingTop = 25;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Calculate coordinates for points
  const points = useMemo(() => {
    const totalPoints = trendData.length;
    return trendData.map((d, i) => {
      const x =
        totalPoints === 1
          ? paddingLeft + chartWidth / 2
          : paddingLeft + (i * chartWidth) / (totalPoints - 1);
      const y = paddingTop + chartHeight - (d.sales / maxSales) * chartHeight;
      return { ...d, x, y, index: i };
    });
  }, [trendData, chartWidth, chartHeight, maxSales]);

  // Smooth Bezier Curve Path generator
  const linePath = useMemo(() => {
    if (points.length === 0) return "";
    if (points.length === 1) return `M ${points[0].x},${points[0].y}`;

    let d = `M ${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const controlX = (current.x + next.x) / 2;
      d += ` C ${controlX},${current.y} ${controlX},${next.y} ${next.x},${next.y}`;
    }
    return d;
  }, [points]);

  // Closed Area Path for smooth gradient under the curve
  const areaPath = useMemo(() => {
    if (!linePath || points.length === 0) return "";
    const lastPoint = points[points.length - 1];
    const firstPoint = points[0];
    const bottomY = paddingTop + chartHeight;
    return `${linePath} L ${lastPoint.x},${bottomY} L ${firstPoint.x},${bottomY} Z`;
  }, [linePath, points, paddingTop, chartHeight]);

  // Y-Axis Ticks
  const yTicks = useMemo(() => {
    const count = 4;
    const ticks = [];
    for (let i = 0; i <= count; i++) {
      const value = Math.round((maxSales / count) * i);
      const y = paddingTop + chartHeight - (i * chartHeight) / count;
      ticks.push({ value, y });
    }
    return ticks;
  }, [maxSales, chartHeight, paddingTop]);

  const activeHoverPoint = hoveredIndex !== null ? points[hoveredIndex] : null;

  return (
    <div className="relative w-full rounded-[24px] border border-[#eadfd5] bg-gradient-to-b from-white/90 to-[#faf6f0]/70 p-5 shadow-[0_12px_36px_rgba(76,54,35,0.06)] backdrop-blur-xl">
      {/* Header Stat & Toggle Toolbar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#eadfd5]/60 pb-3">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8d827a]">Total Period Sales</span>
            <div className="font-display text-xl font-bold text-[#070b21]">
              INR {totalSales.toLocaleString("en-IN")}
            </div>
          </div>

          <div className="h-7 w-[1px] bg-[#eadfd5]" />

          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8d827a]">Peak Sales Point</span>
            <div className="font-mono text-sm font-bold text-[#7c3fe0]">
              INR {peakPoint.sales.toLocaleString("en-IN")}{" "}
              <span className="text-xs font-normal text-[#766b64]">({peakPoint.label})</span>
            </div>
          </div>
        </div>

        {/* View mode toggle (Area Line / Bar Chart) */}
        <div className="flex items-center rounded-xl bg-[#eadfd5]/50 p-1 border border-[#eadfd5]">
          <button
            type="button"
            onClick={() => setChartMode("area")}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
              chartMode === "area"
                ? "bg-white text-[#7c3fe0] shadow-xs"
                : "text-[#766b64] hover:text-[#070b21]"
            }`}
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18" />
            </svg>
            <span>Spline Area</span>
          </button>

          <button
            type="button"
            onClick={() => setChartMode("bar")}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
              chartMode === "bar"
                ? "bg-white text-[#7c3fe0] shadow-xs"
                : "text-[#766b64] hover:text-[#070b21]"
            }`}
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>Bar Chart</span>
          </button>
        </div>
      </div>

      {/* SVG Interactive Chart Canvas */}
      <div className="relative h-[250px] w-full">
        <svg
          className="h-full w-full overflow-visible"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
        >
          <defs>
            {/* Smooth Gradient Fill */}
            <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accentColor} stopOpacity="0.35" />
              <stop offset="50%" stopColor={secondaryColor} stopOpacity="0.12" />
              <stop offset="100%" stopColor={accentColor} stopOpacity="0.0" />
            </linearGradient>

            {/* Bar Gradient */}
            <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accentColor} stopOpacity="0.9" />
              <stop offset="100%" stopColor={secondaryColor} stopOpacity="0.6" />
            </linearGradient>

            {/* Glowing Drop Shadow filter for line */}
            <filter id="glowLine" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor={accentColor} floodOpacity="0.4" />
            </filter>
          </defs>

          {/* Grid Horizontal Lines & Y-Axis Labels */}
          {yTicks.map((tick, idx) => (
            <g key={idx}>
              <line
                x1={paddingLeft}
                y1={tick.y}
                x2={width - paddingRight}
                y2={tick.y}
                stroke="#eadfd5"
                strokeDasharray="4 6"
                strokeWidth={1}
              />
              <text
                x={paddingLeft - 8}
                y={tick.y + 4}
                textAnchor="end"
                fontSize="11"
                className="fill-[#8d827a] font-mono font-medium"
              >
                ₹{tick.value >= 1000 ? `${(tick.value / 1000).toFixed(1)}k` : tick.value}
              </text>
            </g>
          ))}

          {/* AREA / LINE MODE */}
          {chartMode === "area" && (
            <>
              {/* Gradient Area under smooth Bezier curve */}
              <path d={areaPath} fill="url(#salesGrad)" />

              {/* Main Smooth Bezier Line with Glow */}
              <path
                d={linePath}
                fill="none"
                stroke={accentColor}
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#glowLine)"
              />

              {/* Data Points on Line */}
              {points.map((pt) => {
                const isHovered = hoveredIndex === pt.index;
                return (
                  <g
                    key={pt.index}
                    className="cursor-pointer transition-all duration-200"
                    onMouseEnter={() => setHoveredIndex(pt.index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    {/* Glowing outer ring when hovered */}
                    {isHovered && (
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="11"
                        fill={accentColor}
                        fillOpacity="0.25"
                        className="animate-ping"
                      />
                    )}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? "7" : "4.5"}
                      fill="#ffffff"
                      stroke={accentColor}
                      strokeWidth={isHovered ? "3.5" : "2.5"}
                    />
                  </g>
                );
              })}
            </>
          )}

          {/* BAR MODE */}
          {chartMode === "bar" && (
            <g>
              {points.map((pt) => {
                const isHovered = hoveredIndex === pt.index;
                const barWidth = Math.min(36, chartWidth / points.length - 8);
                const barX = pt.x - barWidth / 2;
                const barY = pt.y;
                const barHeight = paddingTop + chartHeight - pt.y;

                return (
                  <g
                    key={pt.index}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(pt.index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    <rect
                      x={barX}
                      y={barY}
                      width={barWidth}
                      height={Math.max(barHeight, 4)}
                      rx="6"
                      fill={isHovered ? accentColor : "url(#barGrad)"}
                      className="transition-all duration-200 hover:opacity-90"
                    />
                  </g>
                );
              })}
            </g>
          )}

          {/* X-Axis Timeline Labels */}
          {points.map((pt) => (
            <text
              key={`x-label-${pt.index}`}
              x={pt.x}
              y={height - 10}
              textAnchor="middle"
              fontSize="11"
              className={`transition-all font-semibold ${
                hoveredIndex === pt.index ? "fill-[#7c3fe0] font-bold text-xs" : "fill-[#766b64]"
              }`}
            >
              {pt.label}
            </text>
          ))}

          {/* Vertical Guide Line on Hover */}
          {activeHoverPoint && (
            <line
              x1={activeHoverPoint.x}
              y1={paddingTop}
              x2={activeHoverPoint.x}
              y2={paddingTop + chartHeight}
              stroke={accentColor}
              strokeDasharray="3 3"
              strokeWidth={1.5}
            />
          )}
        </svg>

        {/* Floating Tooltip Card */}
        {activeHoverPoint && (
          <div
            className="pointer-events-none absolute z-30 transform -translate-x-1/2 -translate-y-full rounded-2xl border border-[#eadfd5] bg-white p-3 shadow-xl backdrop-blur-md transition-all duration-150"
            style={{
              left: `${(activeHoverPoint.x / width) * 100}%`,
              top: `${(activeHoverPoint.y / height) * 100 - 12}%`,
            }}
          >
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#766b64]">
              {activeHoverPoint.label}
            </div>
            <div className="font-display mt-0.5 text-base font-bold text-[#070b21]">
              INR {activeHoverPoint.sales.toLocaleString("en-IN")}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-[#7c3fe0] font-semibold">
              <span className="h-2 w-2 rounded-full bg-[#7c3fe0]" />
              <span>{activeHoverPoint.bills} finalized bills</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
