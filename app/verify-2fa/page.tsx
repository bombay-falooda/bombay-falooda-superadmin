"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { apiRequest } from "@/lib/api";
import { saveAuthSession } from "@/lib/auth";
import { ResultDialog } from "@/components/result-dialog";

type VerifyResponse = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    role: string;
  };
};

export default function Verify2FaPage() {
  const router = useRouter();
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setDevOtp(sessionStorage.getItem("bf_dev_otp"));
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const twoFactorToken = sessionStorage.getItem("bf_two_factor_token");

    if (!twoFactorToken) {
      setError("2FA session expired. Please login again.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await apiRequest<VerifyResponse>("/auth/verify-2fa", {
        method: "POST",
        auth: false,
        body: { twoFactorToken, otp },
      });

      if (response.user.role !== "SUPERADMIN") {
        setError("Only Superadmin accounts can access this portal.");
        return;
      }

      saveAuthSession(response);
      sessionStorage.removeItem("bf_two_factor_token");
      sessionStorage.removeItem("bf_dev_otp");
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "OTP verification failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white/80 p-8 shadow-xl backdrop-blur-2xl">
        <div className="mb-6 flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
          <Image
            src="/bombay-falooda-logo.jpeg"
            alt="Bombay Falooda"
            width={80}
            height={80}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="mb-8">
          <div className="text-sm font-semibold text-[#1f91c4]">Authenticator check</div>
          <h1 className="mt-2 text-2xl font-semibold text-slate-950">
            Enter verification code
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Enter the 6 digit code from Google Authenticator, Microsoft
            Authenticator, Authy or your saved authenticator app.
          </p>
        </div>
        {devOtp ? (
          <div className="mb-5 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Development OTP: <span className="font-semibold">{devOtp}</span>
          </div>
        ) : null}
        <form className="space-y-5" onSubmit={submit}>
          <div>
            <label className="form-label" htmlFor="otp">
              Authenticator code
            </label>
            <input
              id="otp"
              className="form-input text-center text-lg tracking-[0.4em]"
              maxLength={6}
              value={otp}
              onChange={(event) => setOtp(event.target.value)}
            />
          </div>
          <button className="btn-primary w-full" disabled={loading} type="submit">
            {loading ? "Verifying..." : "Verify and enter"}
          </button>
        </form>
      </div>
      <ResultDialog
        open={!!error}
        title="Verification failed"
        message={error}
        tone="error"
        onPrimary={() => setError("")}
      />
    </main>
  );
}
