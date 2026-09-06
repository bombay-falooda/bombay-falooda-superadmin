"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ResultDialog } from "@/components/result-dialog";
import { DataTable } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { apiRequest } from "@/lib/api";

type SetupResponse = {
  issuer: string;
  secret: string;
  otpauthUrl: string;
  qrCodeDataUrl: string;
};

type MeResponse = {
  twoFactorEnabled: boolean;
  twoFactorMethod?: string | null;
};

type UserRecord = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  status: string;
  createdAt: string;
};

export default function SettingsPage() {
  const [activeSubTab, setActiveSubTab] = useState<"security" | "users">("security");

  // Security state
  const [setup, setSetup] = useState<SetupResponse | null>(null);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [toggling2FA, setToggling2FA] = useState(false);

  // Users state
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null);

  useEffect(() => {
    void loadMe();
    if (activeSubTab === "users") {
      void loadUsers();
    }
  }, [activeSubTab]);

  async function loadMe() {
    try {
      const response = await apiRequest<MeResponse>("/auth/me");
      setMe(response);
    } catch {
      setMe(null);
    }
  }

  async function loadUsers() {
    setLoadingUsers(true);
    try {
      const data = await apiRequest<UserRecord[]>("/users");
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load users");
    } finally {
      setLoadingUsers(false);
    }
  }

  async function startSetup() {
    setError("");
    setLoading(true);

    try {
      const response = await apiRequest<SetupResponse>("/auth/2fa/setup", {
        method: "POST",
      });
      setSetup(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start setup");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle2FA() {
    if (me?.twoFactorEnabled) {
      // Disable 2FA
      setToggling2FA(true);
      setError("");
      try {
        await apiRequest("/auth/2fa/disable", { method: "POST" });
        setMessage("Two-Factor Authentication has been disabled.");
        setSetup(null);
        await loadMe();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not disable 2FA");
      } finally {
        setToggling2FA(false);
      }
    } else {
      // Open Setup
      if (!setup) {
        await startSetup();
      } else {
        setSetup(null);
      }
    }
  }

  async function enable2FA(event: FormEvent) {
    event.preventDefault();
    if (!setup) return;

    setError("");
    setLoading(true);

    try {
      await apiRequest("/auth/2fa/enable", {
        method: "POST",
        body: { secret: setup.secret, code },
      });
      setMessage("Authenticator App 2FA enabled successfully.");
      setSetup(null);
      setCode("");
      await loadMe();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not enable 2FA");
    } finally {
      setLoading(false);
    }
  }

  async function toggleUserStatus(user: UserRecord) {
    const nextStatus = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    setTogglingUserId(user.id);
    try {
      await apiRequest(`/users/${user.id}/status`, {
        method: "PATCH",
        body: { status: nextStatus },
      });
      setMessage(`User ${user.name} is now ${nextStatus.toLowerCase()}.`);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update user status");
    } finally {
      setTogglingUserId(null);
    }
  }

  return (
    <AppShell>
      <PageHeader
        title="Platform Settings"
        description="Manage security preferences, 2FA authentication, and user access permissions."
      />

      {/* Sub Options Menu (Tabs) */}
      <div className="mb-6 flex border-b border-[#eadfd5] gap-6">
        <button
          type="button"
          className={`pb-3 text-sm font-bold transition-all flex items-center gap-2 relative ${
            activeSubTab === "security"
              ? "text-[#7c3fe0] border-b-2 border-[#7c3fe0]"
              : "text-[#766b64] hover:text-[#070b21]"
          }`}
          onClick={() => setActiveSubTab("security")}
        >
          <svg className="h-4 w-4 text-[#7c3fe0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
          <span>Security & 2FA</span>
        </button>
        <button
          type="button"
          className={`pb-3 text-sm font-bold transition-all flex items-center gap-2 relative ${
            activeSubTab === "users"
              ? "text-[#7c3fe0] border-b-2 border-[#7c3fe0]"
              : "text-[#766b64] hover:text-[#070b21]"
          }`}
          onClick={() => setActiveSubTab("users")}
        >
          <svg className="h-4 w-4 text-[#7c3fe0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
          <span>User Management</span>
        </button>
      </div>

      {/* SUB TAB 1: SECURITY & 2FA */}
      {activeSubTab === "security" && (
        <section className="rounded-[24px] border border-[#eadfd5] bg-white/72 p-6 shadow-[0_12px_34px_rgba(76,54,35,0.05)] backdrop-blur-xl max-w-3xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7c3fe0]">
                Account Protection
              </p>
              <h2 className="font-display mt-1 text-2xl font-semibold text-[#070b21]">
                Two-Factor Authentication (2FA)
              </h2>
              <p className="mt-2 text-sm font-medium leading-6 text-[#766b64]">
                Enhance your superadmin login security using Google Authenticator, Authy, or TOTP apps.
              </p>
            </div>

            {/* Premium 2FA Toggle Switch Button */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-[#3b302d]">
                {me?.twoFactorEnabled ? "2FA Enabled" : "2FA Disabled"}
              </span>
              <button
                type="button"
                disabled={toggling2FA}
                onClick={handleToggle2FA}
                className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  me?.twoFactorEnabled ? "bg-[#10b981]" : "bg-slate-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    me?.twoFactorEnabled ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#eadfd5] bg-white px-3.5 py-1.5 text-xs font-bold text-[#3b302d]">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                me?.twoFactorEnabled ? "bg-emerald-500" : "bg-amber-500"
              }`}
            />
            <span>
              Status: {me?.twoFactorEnabled ? `ACTIVE (${me.twoFactorMethod || "AUTH_APP"})` : "DISABLED"}
            </span>
          </div>

          {!me?.twoFactorEnabled && (
            <div className="mt-6">
              <button
                className="btn-primary text-xs"
                disabled={loading}
                type="button"
                onClick={startSetup}
              >
                {loading ? "Generating QR..." : "Setup Authenticator App"}
              </button>
            </div>
          )}

          {setup ? (
            <form
              className="mt-6 grid gap-5 rounded-[22px] border border-[#eadfd5] bg-white/90 p-5 shadow-xs"
              onSubmit={enable2FA}
            >
              <div className="flex flex-wrap items-center gap-5">
                <Image
                  src={setup.qrCodeDataUrl}
                  alt="Authenticator QR code"
                  width={180}
                  height={180}
                  unoptimized
                  className="rounded-[18px] border border-[#eadfd5] bg-white p-2"
                />
                <div className="max-w-md">
                  <p className="text-sm font-bold text-[#070b21]">Manual Secret Key</p>
                  <p className="mt-2 break-all rounded-[14px] bg-[#fffaf4] p-3 text-sm font-semibold text-[#766b64] font-mono">
                    {setup.secret}
                  </p>
                  <p className="mt-3 text-xs font-semibold leading-5 text-[#766b64]">
                    Scan QR code in your Authenticator app, then enter the generated 6-digit passcode below.
                  </p>
                </div>
              </div>
              <div>
                <label className="form-label" htmlFor="code">
                  6-Digit Authenticator Code
                </label>
                <input
                  id="code"
                  className="form-input max-w-xs text-center text-lg tracking-[0.4em] font-mono"
                  maxLength={6}
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="000000"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button className="btn-primary text-xs" disabled={loading} type="submit">
                  {loading ? "Verifying..." : "Confirm & Enable 2FA"}
                </button>
                <button
                  className="btn-secondary text-xs"
                  type="button"
                  onClick={() => setSetup(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : null}
        </section>
      )}

      {/* SUB TAB 2: USERS MANAGEMENT */}
      {activeSubTab === "users" && (
        <section className="rounded-[24px] border border-[#eadfd5] bg-white/72 p-6 shadow-[0_12px_34px_rgba(76,54,35,0.05)] backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-semibold text-[#070b21]">
                System Users ({users.length})
              </h2>
              <p className="mt-1 text-sm text-[#766b64]">
                Overview of system users, admin permissions, and account status control.
              </p>
            </div>
            <button
              className="btn-secondary text-xs"
              type="button"
              onClick={loadUsers}
              disabled={loadingUsers}
            >
              {loadingUsers ? "Refreshing..." : "Refresh List"}
            </button>
          </div>

          <DataTable columns={["User", "Contact", "Role", "Status", "Joined", "Actions"]}>
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-white/60">
                <td className="px-5 py-4 font-semibold text-[#070b21]">{u.name}</td>
                <td className="px-5 py-4 text-xs text-slate-600">
                  <div>{u.email || "No email"}</div>
                  <div className="text-slate-400">{u.phone || "No phone"}</div>
                </td>
                <td className="px-5 py-4">
                  <span className="rounded-md bg-purple-50 px-2.5 py-1 text-xs font-semibold text-[#7c3fe0] border border-purple-200">
                    {u.role}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <StatusBadge value={u.status === "ACTIVE"} />
                </td>
                <td className="px-5 py-4 text-xs text-slate-500">
                  {new Date(u.createdAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="px-5 py-4">
                  <button
                    type="button"
                    disabled={togglingUserId === u.id}
                    onClick={() => toggleUserStatus(u)}
                    className={`h-8 px-3 rounded-[12px] text-xs font-semibold border transition ${
                      u.status === "ACTIVE"
                        ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                        : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    }`}
                  >
                    {togglingUserId === u.id
                      ? "Updating..."
                      : u.status === "ACTIVE"
                      ? "Disable User"
                      : "Enable User"}
                  </button>
                </td>
              </tr>
            ))}
          </DataTable>
        </section>
      )}

      <ResultDialog
        open={!!message}
        title="Success"
        message={message}
        onPrimary={() => setMessage("")}
      />
      <ResultDialog
        open={!!error}
        title="Error"
        message={error}
        tone="error"
        onPrimary={() => setError("")}
      />
    </AppShell>
  );
}
