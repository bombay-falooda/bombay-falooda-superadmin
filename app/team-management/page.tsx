"use client";

import { useEffect, useMemo, useState } from "react";

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
  const [selectedFranchiseId, setSelectedFranchiseId] = useState("ALL");
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      apiRequest<Franchise[]>("/franchises"),
      apiRequest<Outlet[]>("/outlets"),
      apiRequest<User[]>("/users"),
    ])
      .then(([franchiseList, outletList, userList]) => {
        setFranchises(franchiseList);
        setOutlets(outletList);
        setUsers(userList);
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
        title="Team Management"
        description="View franchise, outlet and team member structure in one place."
      >
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
      </PageHeader>

      <section className="mb-5 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur-xl">
          <div className="text-sm font-semibold text-slate-500">Franchises</div>
          <div className="mt-2 text-3xl font-semibold text-slate-950">{filteredFranchises.length}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur-xl">
          <div className="text-sm font-semibold text-slate-500">Outlets</div>
          <div className="mt-2 text-3xl font-semibold text-slate-950">{totalOutlets}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur-xl">
          <div className="text-sm font-semibold text-slate-500">Team Members</div>
          <div className="mt-2 text-3xl font-semibold text-slate-950">{totalTeamMembers}</div>
        </div>
      </section>

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
                          <StatusBadge value={outlet.status} />
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
    <DataTable columns={["Photo", "Name", "Email", "Phone", "Role", "Status"]}>
      {users.map((user) => (
        <tr key={user.id} className="hover:bg-white/60">
          <td className="px-5 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#eaf8fe] to-blue-100 text-sm font-semibold text-[#176f9e] ring-1 ring-slate-200">
              {initials(user.name)}
            </div>
          </td>
          <td className="px-5 py-4 font-medium text-slate-950">{user.name}</td>
          <td className="px-5 py-4 text-slate-500">{user.email || "N/A"}</td>
          <td className="px-5 py-4 text-slate-500">{user.phone || "N/A"}</td>
          <td className="px-5 py-4 text-slate-500">{user.role}</td>
          <td className="px-5 py-4">
            <StatusBadge value={user.status} />
          </td>
        </tr>
      ))}
    </DataTable>
  );
}
