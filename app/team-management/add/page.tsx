"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { CountryCodePicker } from "@/components/country-code-picker";
import { ResultDialog } from "@/components/result-dialog";
import { apiRequest } from "@/lib/api";
import { INDIAN_STATES_AND_CITIES } from "@/lib/indian-states-cities";

type Franchise = {
  id: string;
  name: string;
  outlets?: Array<{ id: string; name: string; code: string }>;
};

type Outlet = {
  id: string;
  name: string;
  code: string;
  franchiseId?: string | null;
};

function AddTeamMemberContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialFranchiseId = searchParams.get("franchiseId") || "";
  const initialOutletId = searchParams.get("outletId") || "";

  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"STAFF" | "POS_USER" | "FRANCHISE_OWNER">("STAFF");

  // Location State
  const [stateName, setStateName] = useState("Gujarat");
  const [cityName, setCityName] = useState("Surat");

  // Association State
  const [selectedFranchiseId, setSelectedFranchiseId] = useState(initialFranchiseId);
  const [selectedOutletId, setSelectedOutletId] = useState(initialOutletId);

  // Salary Setup State (Superadmin Exclusive)
  const [salaryAmount, setSalaryAmount] = useState<string>("15000");
  const [salaryFrequency, setSalaryFrequency] = useState<string>("MONTHLY");
  const [salaryPayDay, setSalaryPayDay] = useState<string>("5");
  const [salaryPaymentMethod, setSalaryPaymentMethod] = useState<string>("BANK_TRANSFER");
  const [joiningDate, setJoiningDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoadingInitial(true);
    try {
      const [franchisesData, outletsData] = await Promise.all([
        apiRequest<Franchise[]>("/franchises"),
        apiRequest<Outlet[]>("/outlets"),
      ]);
      setFranchises(franchisesData || []);
      setOutlets(outletsData || []);

      if (initialFranchiseId) {
        setSelectedFranchiseId(initialFranchiseId);
      }
      if (initialOutletId) {
        setSelectedOutletId(initialOutletId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load dropdown options");
    } finally {
      setLoadingInitial(false);
    }
  }

  // Filtered outlets based on selected Franchise
  const filteredOutlets = useMemo(() => {
    if (!selectedFranchiseId) return outlets;
    return outlets.filter((o) => o.franchiseId === selectedFranchiseId);
  }, [outlets, selectedFranchiseId]);

  // State Options
  const stateOptions = useMemo(() => {
    return INDIAN_STATES_AND_CITIES.map((s) => ({ label: s.state, value: s.state }));
  }, []);

  // City Options based on selected State
  const cityOptions = useMemo(() => {
    const foundState = INDIAN_STATES_AND_CITIES.find((s) => s.state === stateName);
    return foundState
      ? foundState.cities.map((c) => ({ label: c, value: c }))
      : [{ label: cityName || "Custom", value: cityName }];
  }, [stateName, cityName]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter staff member full name.");
      return;
    }
    if (!email.trim() && !phone.trim()) {
      setError("Please provide at least an email address or phone number.");
      return;
    }
    if (!password.trim()) {
      setError("Please enter an initial login password.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await apiRequest<{ id: string }>("/users", {
        method: "POST",
        body: {
          name: name.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          countryCode,
          password: password.trim(),
          role,
          franchiseId: selectedFranchiseId || undefined,
          outletId: selectedOutletId || undefined,
          salaryAmount: salaryAmount ? Number(salaryAmount) : undefined,
          salaryFrequency,
          salaryPayDay: Number(salaryPayDay) || 5,
          salaryPaymentMethod,
          joiningDate: joiningDate || undefined,
        },
      });

      setSuccessMessage("Team member created successfully!");
      setTimeout(() => {
        router.push(`/team-management/${res.id}/edit`);
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create team member");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingInitial) {
    return (
      <div className="flex h-64 items-center justify-center text-sm font-semibold text-[#766b64]">
        Loading team onboarding form...
      </div>
    );
  }

  return (
    <>
      {/* Header Banner */}
      <div className="mb-6 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Link className="btn-secondary text-xs" href="/team-management">
              ← Back to Team Directory
            </Link>
            <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-[#7c3fe0] border border-purple-200">
              Superadmin Controls
            </span>
          </div>
          <h1 className="font-display mt-2 text-3xl font-semibold text-[#070b21]">
            Add New Team Member
          </h1>
          <p className="mt-1 text-sm text-[#766b64]">
            Onboard new outlet staff, POS billing users, or franchise managers with salary settings.
          </p>
        </div>
      </div>

      {/* Main Creation Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Basic & Contact Details */}
        <div className="rounded-[20px] border border-[#eadfd5] bg-white/72 p-6 shadow-[0_12px_34px_rgba(76,54,35,0.05)] backdrop-blur-xl space-y-4">
          <h2 className="font-display text-lg font-semibold text-[#070b21] flex items-center gap-2 border-b border-[#eadfd5] pb-3">
            <svg className="h-5 w-5 text-[#7c3fe0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Basic & Contact Details
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#3b302d]">
                Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Sahir Qureshi"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 w-full rounded-[14px] border border-[#eadfd5] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#070b21] focus:border-[#7c3fe0] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#3b302d]">
                Email Address
              </label>
              <input
                type="email"
                placeholder="e.g. sahir@bombayfalooda.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full rounded-[14px] border border-[#eadfd5] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#070b21] focus:border-[#7c3fe0] focus:outline-none"
              />
            </div>

            {/* Phone Number with Flag Country Code Picker */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#3b302d]">
                Phone Number
              </label>
              <div className="mt-1.5 flex items-center gap-2">
                <CountryCodePicker
                  value={countryCode}
                  onChange={(code) => setCountryCode(code)}
                />
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-[14px] border border-[#eadfd5] bg-white px-3.5 py-2.5 text-sm font-mono text-[#070b21] focus:border-[#7c3fe0] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#3b302d]">
                Initial Password *
              </label>
              <input
                type="password"
                required
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 w-full rounded-[14px] border border-[#eadfd5] bg-white px-3.5 py-2.5 text-sm text-[#070b21] focus:border-[#7c3fe0] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#3b302d]">
                Access Role *
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="mt-1.5 w-full rounded-[14px] border border-[#eadfd5] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#070b21] focus:border-[#7c3fe0] focus:outline-none"
              >
                <option value="STAFF">Outlet Staff (No Billing)</option>
                <option value="POS_USER">POS User (Billing Access)</option>
                <option value="FRANCHISE_OWNER">Franchise Owner / Manager</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Location & Franchise / Outlet Association */}
        <div className="rounded-[20px] border border-[#eadfd5] bg-white/72 p-6 shadow-[0_12px_34px_rgba(76,54,35,0.05)] backdrop-blur-xl space-y-4">
          <h2 className="font-display text-lg font-semibold text-[#070b21] flex items-center gap-2 border-b border-[#eadfd5] pb-3">
            <svg className="h-5 w-5 text-[#7c3fe0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Location & Outlet Assignment
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#3b302d]">
                Select Franchise
              </label>
              <select
                value={selectedFranchiseId}
                onChange={(e) => {
                  setSelectedFranchiseId(e.target.value);
                  setSelectedOutletId("");
                }}
                className="mt-1.5 w-full rounded-[14px] border border-[#eadfd5] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#070b21] focus:border-[#7c3fe0] focus:outline-none"
              >
                <option value="">-- Unassigned / All Franchises --</option>
                {franchises.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#3b302d]">
                Select Outlet
              </label>
              <select
                value={selectedOutletId}
                onChange={(e) => setSelectedOutletId(e.target.value)}
                className="mt-1.5 w-full rounded-[14px] border border-[#eadfd5] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#070b21] focus:border-[#7c3fe0] focus:outline-none"
              >
                <option value="">-- Unassigned / All Outlets --</option>
                {filteredOutlets.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name} ({o.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#3b302d]">
                State
              </label>
              <select
                value={stateName}
                onChange={(e) => setStateName(e.target.value)}
                className="mt-1.5 w-full rounded-[14px] border border-[#eadfd5] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#070b21] focus:border-[#7c3fe0] focus:outline-none"
              >
                {stateOptions.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#3b302d]">
                City
              </label>
              <select
                value={cityName}
                onChange={(e) => setCityName(e.target.value)}
                className="mt-1.5 w-full rounded-[14px] border border-[#eadfd5] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#070b21] focus:border-[#7c3fe0] focus:outline-none"
              >
                {cityOptions.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Salary Setup (Superadmin Control) */}
        <div className="rounded-[20px] border border-purple-200 bg-purple-50/40 p-6 shadow-[0_12px_34px_rgba(76,54,35,0.05)] backdrop-blur-xl space-y-4">
          <h2 className="font-display text-lg font-semibold text-[#070b21] flex items-center gap-2 border-b border-purple-200 pb-3">
            <svg className="h-5 w-5 text-[#7c3fe0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Salary & Recurring Pay Day Settings
          </h2>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#3b302d]">
                Monthly Salary Amount (INR)
              </label>
              <input
                type="number"
                step="100"
                placeholder="e.g. 18000"
                value={salaryAmount}
                onChange={(e) => setSalaryAmount(e.target.value)}
                className="mt-1.5 w-full rounded-[14px] border border-[#eadfd5] bg-white px-3.5 py-2.5 text-sm font-mono text-[#070b21] focus:border-[#7c3fe0] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#3b302d]">
                Payment Frequency
              </label>
              <select
                value={salaryFrequency}
                onChange={(e) => setSalaryFrequency(e.target.value)}
                className="mt-1.5 w-full rounded-[14px] border border-[#eadfd5] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#070b21] focus:border-[#7c3fe0] focus:outline-none"
              >
                <option value="MONTHLY">Monthly</option>
                <option value="WEEKLY">Weekly</option>
                <option value="DAILY">Daily</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#3b302d]">
                Monthly Pay Day (1 - 31)
              </label>
              <input
                type="number"
                min="1"
                max="31"
                placeholder="5"
                value={salaryPayDay}
                onChange={(e) => setSalaryPayDay(e.target.value)}
                className="mt-1.5 w-full rounded-[14px] border border-[#eadfd5] bg-white px-3.5 py-2.5 text-sm font-mono text-[#070b21] focus:border-[#7c3fe0] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#3b302d]">
                Payment Method
              </label>
              <select
                value={salaryPaymentMethod}
                onChange={(e) => setSalaryPaymentMethod(e.target.value)}
                className="mt-1.5 w-full rounded-[14px] border border-[#eadfd5] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#070b21] focus:border-[#7c3fe0] focus:outline-none"
              >
                <option value="BANK_TRANSFER">Bank Transfer (NEFT/IMPS)</option>
                <option value="UPI">UPI</option>
                <option value="CASH">Cash</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#3b302d]">
                Joining Date
              </label>
              <input
                type="date"
                value={joiningDate}
                onChange={(e) => setJoiningDate(e.target.value)}
                className="mt-1.5 w-full rounded-[14px] border border-[#eadfd5] bg-white px-3.5 py-2.5 text-sm text-[#070b21] focus:border-[#7c3fe0] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link className="btn-secondary" href="/team-management">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary text-sm px-6 py-3"
          >
            {submitting ? "Creating Staff Member..." : "Save & Create Team Member"}
          </button>
        </div>
      </form>

      <ResultDialog
        open={!!error}
        title="Error Creating Team Member"
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

export default function AddTeamMemberPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm">Loading onboarding workspace...</div>}>
      <AddTeamMemberContent />
    </Suspense>
  );
}
