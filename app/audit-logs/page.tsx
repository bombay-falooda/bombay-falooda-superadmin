"use client";

import { useEffect, useState } from "react";

import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { ResultDialog } from "@/components/result-dialog";
import { apiRequest } from "@/lib/api";

type AuditLog = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  createdAt: string;
  actor?: { name: string; email: string | null; role: string } | null;
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest<AuditLog[]>("/audit-logs").then(setLogs).catch((err) => {
      setError(err instanceof Error ? err.message : "Could not load audit logs");
    });
  }, []);

  return (
    <>
      <PageHeader title="Audit Logs" description="Review sensitive Superadmin activity." />
      <DataTable columns={["Action", "Entity", "Actor", "Date"]}>
        {logs.map((log) => (
          <tr key={log.id} className="hover:bg-white/60">
            <td className="px-5 py-4 font-medium text-slate-950">{log.action}</td>
            <td className="px-5 py-4 text-slate-500">{log.entityType} {log.entityId ? `· ${log.entityId.slice(0, 8)}` : ""}</td>
            <td className="px-5 py-4 text-slate-500">{log.actor?.name || "System"}</td>
            <td className="px-5 py-4 text-slate-500">{new Date(log.createdAt).toLocaleString()}</td>
          </tr>
        ))}
      </DataTable>
      <ResultDialog open={!!error} title="Could not load audit logs" message={error} tone="error" onPrimary={() => setError("")} />
    </>
  );
}
