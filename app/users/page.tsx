"use client";

import { useEffect, useState } from "react";

import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { ResultDialog } from "@/components/result-dialog";
import { StatusBadge } from "@/components/status-badge";
import { apiRequest } from "@/lib/api";

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

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest<User[]>("/users").then(setUsers).catch((err) => {
      setError(err instanceof Error ? err.message : "Could not load users");
    });
  }, []);

  return (
    <>
      <PageHeader
        title="Users"
        description="Create and assign Superadmin, franchise owner, POS and staff users."
        action={{ href: "/users/new", label: "Create User" }}
      />
      <DataTable columns={["Name", "Contact", "Role", "Status", "Assignment"]}>
        {users.map((user) => (
          <tr key={user.id} className="hover:bg-white/60">
            <td className="px-5 py-4 font-medium text-slate-950">{user.name}</td>
            <td className="px-5 py-4 text-slate-500">
              {user.email || user.phone || "N/A"}
            </td>
            <td className="px-5 py-4 text-slate-500">{user.role}</td>
            <td className="px-5 py-4">
              <StatusBadge value={user.status} />
            </td>
            <td className="px-5 py-4 text-slate-500">
              {user.franchiseId ? "Franchise" : user.outletId ? "Outlet" : "None"}
            </td>
          </tr>
        ))}
      </DataTable>
      <ResultDialog
        open={!!error}
        title="Could not load users"
        message={error}
        tone="error"
        onPrimary={() => setError("")}
      />
    </>
  );
}
