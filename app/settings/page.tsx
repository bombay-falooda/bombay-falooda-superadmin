"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ResultDialog } from "@/components/result-dialog";
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

export default function SettingsPage() {
  const [setup, setSetup] = useState<SetupResponse | null>(null);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void loadMe();
  }, []);

  async function loadMe() {
    try {
      const response = await apiRequest<MeResponse>("/auth/me");
      setMe(response);
    } catch {
      setMe(null);
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

  async function enable(event: FormEvent) {
    event.preventDefault();

    if (!setup) {
      return;
    }

    setError("");
    setLoading(true);

    try {
      await apiRequest("/auth/2fa/enable", {
        method: "POST",
        body: { secret: setup.secret, code },
      });
      setMessage("Authenticator App 2FA enabled.");
      setSetup(null);
      setCode("");
      await loadMe();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not enable 2FA");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <PageHeader
        title="Settings"
        description="Superadmin security settings and Authenticator App two-factor setup."
      />

      <section className="bf-panel max-w-3xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7c3fe0]">
              Two-factor authentication
            </p>
            <h2 className="font-display mt-2 text-2xl font-semibold text-[#070b21]">
              Authenticator App
            </h2>
            <div className="mt-3 inline-flex rounded-full border border-[#eadfd5] bg-white px-3 py-1 text-xs font-bold text-[#766b64]">
              Status: {me?.twoFactorEnabled ? `Enabled${me.twoFactorMethod ? ` (${me.twoFactorMethod})` : ""}` : "Not enabled"}
            </div>
            <p className="mt-2 max-w-xl text-sm font-medium leading-6 text-[#766b64]">
              Scan a QR code in Google Authenticator, Microsoft Authenticator,
              Authy, or another TOTP app. After this, phone OTP login will ask
              for the authenticator code before opening Superadmin.
            </p>
          </div>
          <button className="btn-primary" disabled={loading} type="button" onClick={startSetup}>
            {loading ? "Loading..." : "Setup Authenticator"}
          </button>
        </div>

        {setup ? (
          <form className="mt-6 grid gap-5 rounded-[22px] border border-[#eadfd5] bg-white/80 p-5" onSubmit={enable}>
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
                <p className="text-sm font-bold text-[#070b21]">Manual secret</p>
                <p className="mt-2 break-all rounded-[14px] bg-[#fffaf4] p-3 text-sm font-semibold text-[#766b64]">
                  {setup.secret}
                </p>
                <p className="mt-3 text-xs font-semibold leading-5 text-[#766b64]">
                  After scanning, enter the current 6-digit code from your app.
                </p>
              </div>
            </div>
            <div>
              <label className="form-label" htmlFor="code">Authenticator code</label>
              <input id="code" className="form-input max-w-xs text-center text-lg tracking-[0.4em]" maxLength={6} value={code} onChange={(event) => setCode(event.target.value)} />
            </div>
            <div>
              <button className="btn-primary" disabled={loading} type="submit">
                Enable Authenticator
              </button>
            </div>
          </form>
        ) : null}
      </section>

      <ResultDialog open={!!message} title="Success" message={message} onPrimary={() => setMessage("")} />
      <ResultDialog open={!!error} title="Settings error" message={error} tone="error" onPrimary={() => setError("")} />
    </AppShell>
  );
}
