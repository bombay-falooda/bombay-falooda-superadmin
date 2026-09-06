"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { ResultDialog } from "@/components/result-dialog";
import { StatusBadge } from "@/components/status-badge";
import { apiRequest } from "@/lib/api";

type Franchise = {
  id: string;
  name: string;
  ownerName: string | null;
  email: string | null;
  phone: string | null;
};

type Outlet = {
  id: string;
  franchiseId: string | null;
  name: string;
  code: string;
  address: string;
  status: string;
};

type User = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  status: string;
  franchiseId: string | null;
  outletId: string | null;
  salaryAmount?: number | string | null;
  salaryPayDay?: number | null;
};

type SalaryReminder = {
  id: string;
  name: string;
  role: string;
  salaryAmount: number | string | null;
  salaryPayDay: number | null;
  dueStatus: string;
  daysLeft: number;
  outlet?: { name: string; code: string } | null;
  franchise?: { name: string } | null;
};

type PayrollSummary = {
  totalStaffWithSalary: number;
  totalMonthlyPayroll: number;
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "BF";
}

export default function TeamManagementPage() {
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [reminders, setReminders] = useState<SalaryReminder[]>([]);
  const [payrollSummary, setPayrollSummary] = useState<PayrollSummary | null>(null);
  const [selectedFranchiseId, setSelectedFranchiseId] = useState("ALL");
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      apiRequest<Franchise[]>("/franchises"),
      apiRequest<Outlet[]>("/outlets"),
      apiRequest<User[]>("/users"),
      apiRequest<SalaryReminder[]>("/users/salary-reminders"),
      apiRequest<PayrollSummary>("/users/payroll-summary"),
    ])
      .then(([franchiseList, outletList, userList, reminderList, summary]) => {
        setFranchises(franchiseList);
        setOutlets(outletList);
        setUsers(userList);
        setReminders(reminderList);
        setPayrollSummary(summary);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Could not load team data");
      });
  }, []);

  const filteredFranchises = useMemo(() => {
    if (selectedFranchiseId === "ALL") {
      return franchises;
    }

    return franchises.filter((franchise) => franchise.id === selectedFranchiseId);
  }, [franchises, selectedFranchiseId]);

  const totalOutlets = outlets.filter((outlet) =>
    selectedFranchiseId === "ALL" ? true : outlet.franchiseId === selectedFranchiseId,
  ).length;

  const totalTeamMembers = users.filter((user) => {
    if (selectedFranchiseId === "ALL") {
      return user.role !== "SUPERADMIN";
    }

    const outletIds = outlets
      .filter((outlet) => outlet.franchiseId === selectedFranchiseId)
      .map((outlet) => outlet.id);

    return user.franchiseId === selectedFranchiseId || outletIds.includes(user.outletId || "");
  }).length;

  return (
    <>
      <PageHeader
        title="Team Management & Payroll"
        description="View franchise, outlet and team member structure with salary tracking and pay date reminders."
      >
        <div className="flex items-center gap-3">
          <select
            className="form-input min-w-64"
            value={selectedFranchiseId}
            onChange={(event) => setSelectedFranchiseId(event.target.value)}
          >
            <option value="ALL">All franchises</option>
            {franchises.map((franchise) => (
              <option key={franchise.id} value={franchise.id}>
                {franchise.name}
                {franchise.ownerName ? ` - ${franchise.ownerName}` : ""}
              </option>
            ))}
          </select>
          <Link className="btn-primary text-xs flex items-center gap-1.5 whitespace-nowrap" href="/team-management/add">
            <span>+ Add Team Member</span>
          </Link>
        </div>
      </PageHeader>

      {/* SALARY DUE REMINDERS BANNER (SUPERADMIN ONLY) */}
      {reminders.length > 0 && (
        <div className="mb-5 rounded-[20px] border border-amber-300 bg-amber-50/90 p-4 shadow-sm backdrop-blur-xl">
          <div className="flex items-center gap-2.5 mb-2">
            <svg className="h-5 w-5 text-amber-700 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="font-display text-sm font-bold text-amber-900">
              Salary Due Reminders ({reminders.length} staff member{reminders.length > 1 ? "s" : ""} due in 1–2 days)
            </h3>
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {reminders.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-xl bg-white p-3 border border-amber-200 shadow-xs">
                <div>
                  <span className="font-bold text-[#070b21] block text-xs">{r.name}</span>
                  <span className="text-[11px] text-[#766b64] block">
                    {r.outlet?.name || r.franchise?.name || "Staff"} • Pay Day: {r.salaryPayDay}th
                  </span>
                  <span className="font-mono text-xs font-bold text-[#7c3fe0] block mt-0.5">
                    INR {Number(r.salaryAmount || 0).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="text-right">
                  <span className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-bold ${
                    r.daysLeft === 0 ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"
                  }`}>
                    {r.dueStatus}
                  </span>
                  <Link
                    href={`/team-management/${r.id}/edit`}
                    className="mt-1.5 block text-[11px] font-bold text-[#7c3fe0] hover:underline"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI METRICS BAR */}
      <section className="mb-5 grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur-xl">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Franchises</div>
          <div className="mt-2 text-3xl font-semibold text-slate-950">{filteredFranchises.length}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur-xl">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Outlets</div>
          <div className="mt-2 text-3xl font-semibold text-slate-950">{totalOutlets}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur-xl">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Team Members</div>
          <div className="mt-2 text-3xl font-semibold text-slate-950">{totalTeamMembers}</div>
        </div>
        <div className="rounded-xl border border-purple-200 bg-purple-50/80 p-5 shadow-sm backdrop-blur-xl">
          <div className="text-xs font-bold uppercase tracking-wider text-[#7c3fe0]">Monthly Payroll Expense</div>
          <div className="mt-2 font-display text-2xl font-bold text-[#070b21]">
            INR {payrollSummary?.totalMonthlyPayroll?.toLocaleString("en-IN") || "0"}
          </div>
        </div>
      </section>

      {/* FRANCHISE & OUTLET STAFF STRUCTURE */}
      <div className="space-y-5">
        {filteredFranchises.map((franchise) => {
          const franchiseOutlets = outlets.filter((outlet) => outlet.franchiseId === franchise.id);
          const franchiseUsers = users.filter((user) => user.franchiseId === franchise.id);

          return (
            <section
              key={franchise.id}
              className="rounded-xl border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur-xl"
            >
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">{franchise.name}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Owner: {franchise.ownerName || "Not added"} | {franchise.email || franchise.phone || "No contact"}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600">
                  {franchiseOutlets.length} outlets
                </div>
              </div>

              {franchiseUsers.length ? (
                <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4">
                  <div className="mb-3 text-sm font-semibold text-slate-950">Franchise Team</div>
                  <TeamRows users={franchiseUsers} />
                </div>
              ) : null}

              <div className="space-y-4">
                {franchiseOutlets.map((outlet) => {
                  const outletUsers = users.filter((user) => user.outletId === outlet.id);

                  return (
                    <div key={outlet.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                      <div className="flex flex-col gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="font-semibold text-slate-950">
                            {outlet.name} ({outlet.code})
                          </div>
                          <div className="mt-1 text-xs text-slate-500">{outlet.address}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <StatusBadge value={outlet.status === "ACTIVE"} />
                          <span className="text-sm font-semibold text-slate-500">
                            {outletUsers.length} members
                          </span>
                        </div>
                      </div>
                      {outletUsers.length ? (
                        <TeamRows users={outletUsers} />
                      ) : (
                        <div className="px-4 py-5 text-sm text-slate-500">
                          No team members assigned to this outlet yet.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <ResultDialog
        open={!!error}
        title="Could not load team management"
        message={error}
        tone="error"
        onPrimary={() => setError("")}
      />
    </>
  );
}

function TeamRows({ users }: { users: User[] }) {
  return (
    <DataTable columns={["Photo", "Name", "Contact", "Role", "Monthly Salary", "Pay Day", "Status", "Actions"]}>
      {users.map((user) => (
        <tr key={user.id} className="hover:bg-white/60">
          <td className="px-5 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-purple-200 text-sm font-semibold text-[#7c3fe0] ring-1 ring-purple-200">
              {initials(user.name)}
            </div>
          </td>
          <td className="px-5 py-4 font-semibold text-slate-950">{user.name}</td>
          <td className="px-5 py-4 text-xs text-slate-600">
            <div>{user.email || "No email"}</div>
            <div>{user.phone || "No phone"}</div>
          </td>
          <td className="px-5 py-4 text-slate-600">
            <span className="rounded-md bg-purple-50 px-2 py-0.5 text-xs font-bold text-[#7c3fe0] border border-purple-200">
              {user.role}
            </span>
          </td>
          <td className="px-5 py-4 font-mono font-bold text-[#070b21]">
            {user.salaryAmount ? `INR ${Number(user.salaryAmount).toLocaleString("en-IN")}` : "Not Set"}
          </td>
          <td className="px-5 py-4 text-xs font-semibold text-slate-600">
            {user.salaryPayDay ? `${user.salaryPayDay}th of month` : "1st of month"}
          </td>
          <td className="px-5 py-4">
            <StatusBadge value={user.status === "ACTIVE"} />
          </td>
          <td className="px-5 py-4 text-right">
            <Link
              href={`/team-management/${user.id}/edit`}
              className="btn-secondary h-8 px-3 text-xs inline-flex items-center gap-1 text-[#7c3fe0] border-purple-200 hover:bg-purple-50"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Edit Details</span>
            </Link>
          </td>
        </tr>
      ))}
    </DataTable>
  );
}
