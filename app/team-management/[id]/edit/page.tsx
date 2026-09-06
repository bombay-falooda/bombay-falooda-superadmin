"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ResultDialog } from "@/components/result-dialog";
import { StatusBadge } from "@/components/status-badge";
import { apiRequest } from "@/lib/api";

type Franchise = {
  id: string;
  name: string;
};

type Outlet = {
  id: string;
  name: string;
  code: string;
};

type StaffUser = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  status: string;
  franchiseId: string | null;
  outletId: string | null;
  salaryAmount: number | string | null;
  salaryFrequency: string | null;
  salaryPayDay: number | null;
  salaryPaymentMethod: string | null;
  joiningDate: string | null;
  franchise?: Franchise | null;
  outlet?: Outlet | null;
};

type AttendanceRecord = {
  id: string;
  userId: string;
  date: string;
  status: string; // ABSENT, HALF_DAY, LEAVE, PRESENT
  note?: string | null;
  markedBy?: string | null;
};

type PayrollDetailsResponse = {
  user: StaffUser;
  payrollCycle: {
    cycleStart: string;
    cycleEnd: string;
    payDay: number;
    totalCycleDays: number;
    salaryAmount: number;
    dailyRate: number;
    totalAbsentDays: number;
    deductionAmount: number;
    netPayableSalary: number;
  };
  attendances: AttendanceRecord[];
};

export default function EditTeamMemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [savingSalary, setSavingSalary] = useState(false);
  const [markingAttendance, setMarkingAttendance] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [payrollData, setPayrollData] = useState<PayrollDetailsResponse | null>(null);

  // Salary form state
  const [salaryAmount, setSalaryAmount] = useState<string>("");
  const [salaryFrequency, setSalaryFrequency] = useState<string>("MONTHLY");
  const [salaryPayDay, setSalaryPayDay] = useState<string>("5");
  const [salaryPaymentMethod, setSalaryPaymentMethod] = useState<string>("BANK_TRANSFER");
  const [joiningDate, setJoiningDate] = useState<string>("");

  // Mark absence form state
  const [absentDate, setAbsentDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [absenceStatus, setAbsenceStatus] = useState<string>("ABSENT");
  const [absenceNote, setAbsenceNote] = useState<string>("");

  useEffect(() => {
    loadPayrollData();
  }, [id]);

  async function loadPayrollData() {
    setLoading(true);
    try {
      const res = await apiRequest<PayrollDetailsResponse>(`/users/${id}/payroll`);
      setPayrollData(res);
      const u = res.user;
      setSalaryAmount(u.salaryAmount ? String(u.salaryAmount) : "");
      setSalaryFrequency(u.salaryFrequency || "MONTHLY");
      setSalaryPayDay(u.salaryPayDay ? String(u.salaryPayDay) : "5");
      setSalaryPaymentMethod(u.salaryPaymentMethod || "BANK_TRANSFER");
      setJoiningDate(u.joiningDate ? new Date(u.joiningDate).toISOString().split("T")[0] : "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load staff payroll details");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveSalary(e: React.FormEvent) {
    e.preventDefault();
    setSavingSalary(true);
    try {
      await apiRequest(`/users/${id}/salary`, {
        method: "PATCH",
        body: {
          salaryAmount: salaryAmount ? Number(salaryAmount) : undefined,
          salaryFrequency,
          salaryPayDay: Number(salaryPayDay) || 1,
          salaryPaymentMethod,
          joiningDate: joiningDate || undefined,
        },
      });
      setSuccessMessage("Salary details updated successfully!");
      await loadPayrollData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update salary details");
    } finally {
      setSavingSalary(false);
    }
  }

  async function handleMarkAttendance(e: React.FormEvent) {
    e.preventDefault();
    if (!absentDate) {
      setError("Please select a date to mark attendance.");
      return;
    }

    setMarkingAttendance(true);
    try {
      await apiRequest(`/users/${id}/attendance`, {
        method: "POST",
        body: {
          date: absentDate,
          status: absenceStatus,
          note: absenceNote.trim() || undefined,
        },
      });
      setSuccessMessage(`Attendance marked as ${absenceStatus} for ${absentDate}`);
      setAbsenceNote("");
      await loadPayrollData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not mark attendance");
    } finally {
      setMarkingAttendance(false);
    }
  }

  async function handleRemoveAttendance(dateStr: string) {
    try {
      await apiRequest(`/users/${id}/attendance/${dateStr}`, {
        method: "DELETE",
      });
      setSuccessMessage(`Attendance record for ${dateStr} removed.`);
      await loadPayrollData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove attendance record");
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm font-semibold text-[#766b64]">
        Loading team member details & payroll calculation...
      </div>
    );
  }

  if (!payrollData) {
    return (
      <div className="rounded-[20px] border border-red-200 bg-red-50 p-6 text-center text-red-800">
        <h2 className="text-lg font-semibold">Team member not found</h2>
        <Link className="btn-secondary mt-4 inline-block" href="/team-management">
          Back to Team Management
        </Link>
      </div>
    );
  }

  const { user, payrollCycle, attendances } = payrollData;

  return (
    <>
      {/* Header Banner */}
      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Link className="btn-secondary text-xs" href="/team-management">
              ← Back to Team Management
            </Link>
            <StatusBadge value={user.status === "ACTIVE"} />
            <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-[#7c3fe0] border border-purple-200">
              {user.role}
            </span>
          </div>
          <h1 className="font-display mt-2 text-3xl font-semibold text-[#070b21]">
            {user.name}
          </h1>
          <p className="mt-1 text-sm text-[#766b64]">
            Email: <strong>{user.email || "N/A"}</strong> | Phone: <strong>{user.phone || "N/A"}</strong> | Outlet:{" "}
            <strong>{user.outlet?.name || user.franchise?.name || "Unassigned"}</strong>
          </p>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Salary & Payment Configuration (Superadmin) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-[20px] border border-[#eadfd5] bg-white/72 p-6 shadow-[0_12px_34px_rgba(76,54,35,0.05)] backdrop-blur-xl">
            <h2 className="font-display text-lg font-semibold text-[#070b21] flex items-center gap-2">
              <svg className="h-5 w-5 text-[#7c3fe0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Salary & Pay Date Settings
            </h2>
            <p className="mt-1 text-xs text-[#766b64]">
              Superadmin control for monthly salary amount, payment frequency, and recurring pay dates.
            </p>

            <form onSubmit={handleSaveSalary} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#3b302d]">
                  Monthly Salary Amount (INR) *
                </label>
                <input
                  type="number"
                  step="100"
                  required
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
                  className="mt-1.5 w-full rounded-[14px] border border-[#eadfd5] bg-white px-3.5 py-2.5 text-sm text-[#070b21] focus:border-[#7c3fe0] focus:outline-none"
                >
                  <option value="MONTHLY">Monthly</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="DAILY">Daily</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#3b302d]">
                  Monthly Pay Day (1 to 31) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  required
                  placeholder="5"
                  value={salaryPayDay}
                  onChange={(e) => setSalaryPayDay(e.target.value)}
                  className="mt-1.5 w-full rounded-[14px] border border-[#eadfd5] bg-white px-3.5 py-2.5 text-sm font-mono text-[#070b21] focus:border-[#7c3fe0] focus:outline-none"
                />
                <span className="text-[11px] text-[#766b64] mt-1 block">
                  Salary will be due on the {salaryPayDay || 1}th of every month.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#3b302d]">
                  Payment Method
                </label>
                <select
                  value={salaryPaymentMethod}
                  onChange={(e) => setSalaryPaymentMethod(e.target.value)}
                  className="mt-1.5 w-full rounded-[14px] border border-[#eadfd5] bg-white px-3.5 py-2.5 text-sm text-[#070b21] focus:border-[#7c3fe0] focus:outline-none"
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

              <button
                type="submit"
                disabled={savingSalary}
                className="btn-primary w-full text-xs mt-2"
              >
                {savingSalary ? "Saving..." : "Save Salary Details"}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Attendance / Absence Marking & Real-Time Payroll Calculation */}
        <div className="lg:col-span-2 space-y-6">
          {/* PRORATED PAYROLL CALCULATION SUMMARY CARD */}
          <div className="rounded-[24px] border border-[#7c3fe0]/40 bg-gradient-to-br from-white to-purple-50/50 p-6 shadow-md backdrop-blur-xl">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-purple-200/60 pb-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#7c3fe0]">
                  Pay Cycle Calculation
                </span>
                <h3 className="font-display text-xl font-bold text-[#070b21]">
                  Cycle: {payrollCycle.cycleStart} → {payrollCycle.cycleEnd}
                </h3>
              </div>
              <div className="rounded-full bg-purple-100 px-3.5 py-1 text-xs font-bold text-[#7c3fe0] border border-purple-200">
                Pay Day: {payrollCycle.payDay}th of month
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-center">
              <div className="rounded-xl bg-white p-3 border border-[#eadfd5] shadow-xs">
                <span className="text-[11px] font-semibold text-[#8d827a] block">Base Monthly Salary</span>
                <span className="font-display text-lg font-bold text-[#070b21]">
                  INR {payrollCycle.salaryAmount.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="rounded-xl bg-white p-3 border border-[#eadfd5] shadow-xs">
                <span className="text-[11px] font-semibold text-[#8d827a] block">Total Cycle Days</span>
                <span className="font-display text-lg font-bold text-[#070b21]">
                  {payrollCycle.totalCycleDays} days
                </span>
                <span className="text-[10px] text-[#766b64] block">₹{payrollCycle.dailyRate}/day</span>
              </div>

              <div className="rounded-xl bg-red-50 p-3 border border-red-200 shadow-xs">
                <span className="text-[11px] font-bold text-red-800 block">Absent Days / Deductions</span>
                <span className="font-display text-lg font-bold text-red-700">
                  {payrollCycle.totalAbsentDays} days
                </span>
                <span className="text-[10px] font-bold text-red-600 block">
                  -INR {payrollCycle.deductionAmount.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="rounded-xl bg-emerald-500 text-white p-3 shadow-sm">
                <span className="text-[11px] font-bold uppercase tracking-wider opacity-90 block">Net Payable Salary</span>
                <span className="font-display text-2xl font-bold block mt-0.5">
                  INR {payrollCycle.netPayableSalary.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>

          {/* ABSENCE & ATTENDANCE MARKING PANEL */}
          <div className="rounded-[20px] border border-[#eadfd5] bg-white/72 p-6 shadow-[0_12px_34px_rgba(76,54,35,0.05)] backdrop-blur-xl space-y-4">
            <div>
              <h3 className="font-display text-lg font-semibold text-[#070b21]">
                Mark Member Absent / Attendance Log
              </h3>
              <p className="mt-1 text-xs text-[#766b64]">
                Superadmin or Franchise Owner can select specific dates to mark staff absences. Deductions automatically update in real-time.
              </p>
            </div>

            {/* Attendance Input Form */}
            <form onSubmit={handleMarkAttendance} className="flex flex-wrap items-end gap-3 rounded-xl bg-[#fffaf4] p-3.5 border border-[#eadfd5]">
              <div className="flex-1 min-w-[160px]">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#3b302d]">
                  Select Date *
                </label>
                <input
                  type="date"
                  required
                  value={absentDate}
                  onChange={(e) => setAbsentDate(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#eadfd5] bg-white px-3 py-2 text-xs text-[#070b21] focus:border-[#7c3fe0] focus:outline-none"
                />
              </div>

              <div className="w-[140px]">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#3b302d]">
                  Status
                </label>
                <select
                  value={absenceStatus}
                  onChange={(e) => setAbsenceStatus(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#eadfd5] bg-white px-3 py-2 text-xs text-[#070b21] focus:border-[#7c3fe0] focus:outline-none"
                >
                  <option value="ABSENT">Full Day Absent</option>
                  <option value="HALF_DAY">Half Day Absent</option>
                  <option value="LEAVE">Paid Leave</option>
                  <option value="PRESENT">Present</option>
                </select>
              </div>

              <div className="flex-1 min-w-[180px]">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#3b302d]">
                  Reason / Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sick leave, Personal emergency"
                  value={absenceNote}
                  onChange={(e) => setAbsenceNote(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#eadfd5] bg-white px-3 py-2 text-xs text-[#070b21] focus:border-[#7c3fe0] focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={handleMarkAttendance}
                disabled={markingAttendance}
                className="btn-primary text-xs h-9 px-4 shrink-0"
              >
                {markingAttendance ? "Marking..." : "+ Record Attendance"}
              </button>
            </form>

            {/* Attendance Records History Table */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#8d827a] mb-2">
                Recorded Attendance Log for Current Pay Cycle ({attendances.length})
              </h4>

              {attendances.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#eadfd5] bg-[#faf6f0] p-6 text-center text-xs text-[#8d827a] italic">
                  No absences or attendance records logged for this pay cycle. Member has 100% attendance!
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-[#eadfd5] bg-white shadow-xs">
                  <table className="w-full text-left text-xs text-[#070b21]">
                    <thead className="bg-[#faf6f0] font-semibold text-[#766b64] border-b border-[#eadfd5]">
                      <tr>
                        <th className="px-4 py-2.5">Date</th>
                        <th className="px-4 py-2.5">Status</th>
                        <th className="px-4 py-2.5">Deduction Impact</th>
                        <th className="px-4 py-2.5">Note</th>
                        <th className="px-4 py-2.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eadfd5]">
                      {attendances.map((att) => {
                        const dateFormatted = new Date(att.date).toLocaleDateString("en-IN", {
                          weekday: "short",
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        });

                        return (
                          <tr key={att.id} className="hover:bg-slate-50/70">
                            <td className="px-4 py-3 font-semibold text-[#070b21]">
                              {dateFormatted}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`rounded-md px-2 py-0.5 font-bold text-[11px] border ${
                                  att.status === "ABSENT"
                                    ? "bg-red-50 text-red-800 border-red-200"
                                    : att.status === "HALF_DAY"
                                    ? "bg-amber-50 text-amber-800 border-amber-200"
                                    : "bg-emerald-50 text-emerald-800 border-emerald-200"
                                }`}
                              >
                                {att.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-mono font-bold text-red-600">
                              {att.status === "ABSENT"
                                ? `-₹${payrollCycle.dailyRate}`
                                : att.status === "HALF_DAY"
                                ? `-₹${Math.round(payrollCycle.dailyRate * 0.5)}`
                                : "₹0"}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {att.note || "No note recorded"}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveAttendance(att.date.split("T")[0])}
                                className="text-red-600 hover:underline font-semibold"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

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
