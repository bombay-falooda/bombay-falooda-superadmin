"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { apiRequest, type LoginResponse, type PhoneOtpResponse } from "@/lib/api";
import { saveAuthSession } from "@/lib/auth";
import { ResultDialog } from "@/components/result-dialog";
import { CountryCodePicker } from "@/components/country-code-picker";

export default function LoginPage() {
  const router = useRouter();
  const [countryDialCode, setCountryDialCode] = useState("+91");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loginOtpToken, setLoginOtpToken] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [step, setStep] = useState<"PHONE" | "OTP">("PHONE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const GOOGLE_CLIENT_ID =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    "594662082129-hoq7tdd4hpjl50kn12sjnl5bqvg27e26.apps.googleusercontent.com";

  useEffect(() => {
    sessionStorage.removeItem("bf_two_factor_token");
    sessionStorage.removeItem("bf_dev_otp");

    // Dynamically load Google Identity Services
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if ((window as any).google?.accounts?.id) {
        (window as any).google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCredentialResponse,
        });
      }
    };
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  async function handleGoogleCredentialResponse(googleResponse: { credential?: string }) {
    setError("");
    setLoading(true);

    try {
      const response = await apiRequest<LoginResponse>("/auth/google", {
        method: "POST",
        auth: false,
        body: {
          credential: googleResponse.credential,
          portal: "superadmin",
        },
      });

      if ("status" in response && response.status === "2FA_REQUIRED") {
        sessionStorage.setItem("bf_two_factor_token", response.twoFactorToken);
        if (response.devOtp) {
          sessionStorage.setItem("bf_dev_otp", response.devOtp);
        }
        router.push("/verify-2fa");
        return;
      }

      if ("accessToken" in response) {
        if (response.user.role !== "SUPERADMIN") {
          setError("Only Superadmin accounts can access this portal.");
          return;
        }

        saveAuthSession(response);
        router.push("/dashboard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google authentication failed");
    } finally {
      setLoading(false);
    }
  }

  function continueWithGoogle() {
    if ((window as any).google?.accounts?.id) {
      (window as any).google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          void handleGoogleCredentialResponse({ credential: "" });
        }
      });
    } else {
      void handleGoogleCredentialResponse({ credential: "" });
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (step === "PHONE") {
        const fullPhone = `${countryDialCode}${phone.trim().replace(/^0+/, "")}`;
        const response = await apiRequest<PhoneOtpResponse>("/auth/request-login-otp", {
          method: "POST",
          auth: false,
          body: { phone: fullPhone },
        });

        if ("status" in response && response.status === "2FA_REQUIRED") {
          sessionStorage.setItem("bf_two_factor_token", response.twoFactorToken);
          if (response.devOtp) {
            sessionStorage.setItem("bf_dev_otp", response.devOtp);
          }
          router.push("/verify-2fa");
          return;
        }

        setLoginOtpToken(response.loginOtpToken);
        setDevOtp(response.devOtp || "");
        setStep("OTP");
        return;
      }

      const response = await apiRequest<LoginResponse>("/auth/verify-login-otp", {
        method: "POST",
        auth: false,
        body: { loginOtpToken, otp },
      });

      if ("status" in response && response.status === "2FA_REQUIRED") {
        sessionStorage.setItem("bf_two_factor_token", response.twoFactorToken);
        if (response.devOtp) {
          sessionStorage.setItem("bf_dev_otp", response.devOtp);
        }
        router.push("/verify-2fa");
        return;
      }

      if ("accessToken" in response) {
        if (response.user.role !== "SUPERADMIN") {
          setError("Only Superadmin accounts can access this portal.");
          return;
        }

        saveAuthSession(response);
        router.push("/dashboard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_18%,rgba(124,63,224,0.14),transparent_25%),radial-gradient(circle_at_82%_16%,rgba(199,151,86,0.16),transparent_28%),linear-gradient(135deg,#fffdfb_0%,#f8f4ff_48%,#fff8ed_100%)]" />
      <div className="pointer-events-none absolute left-[7%] top-[12%] h-44 w-44 rounded-full bg-white/45 blur-3xl" />
      <div className="relative grid w-full max-w-6xl overflow-hidden rounded-[34px] border border-white/70 bg-white/58 p-2 shadow-[0_26px_90px_rgba(72,52,110,0.14)] backdrop-blur-2xl lg:grid-cols-[1.08fr_0.92fr]">
        <section className="relative hidden min-h-[640px] overflow-hidden rounded-[28px] border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.72),rgba(247,242,255,0.78))] p-8 text-[#070b21] lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_18%,rgba(124,63,224,0.18),transparent_30%),radial-gradient(circle_at_80%_70%,rgba(31,145,196,0.14),transparent_32%)]" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-[22px] bg-white shadow-[0_14px_35px_rgba(73,48,107,0.14)] ring-1 ring-white">
                <Image src="/bombay-falooda-logo.jpeg" alt="Bombay Falooda" width={86} height={86} className="h-full w-full object-cover" />
              </div>
              <div>
                <div className="font-display text-3xl font-semibold">Bombay Falooda</div>
                <div className="mt-1 text-sm font-semibold text-[#7c746f]">Super Admin Control Suite</div>
              </div>
            </div>
            <div className="rounded-full border border-white/80 bg-white/70 px-4 py-2 text-xs font-bold text-[#5f2fbd] shadow-sm">
              2FA ready
            </div>
          </div>

          <div className="relative z-10 mt-16 max-w-xl">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#7c3fe0]">Platform command</p>
            <h2 className="font-display mt-4 text-4xl font-semibold leading-[1.05]">
              One secure room for every franchise, outlet and POS decision.
            </h2>
            <p className="mt-5 max-w-lg text-sm font-medium leading-7 text-[#766b64]">
              Approve owners, review outlets, manage POS access, check audit events and keep the Bombay Falooda network cleanly controlled.
            </p>
          </div>

          <div className="absolute bottom-8 left-8 right-8 rounded-[28px] border border-white/75 bg-white/66 p-5 shadow-[0_18px_45px_rgba(73,48,107,0.1)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-bold">Governance snapshot</div>
                <div className="mt-1 text-xs font-semibold text-[#7c746f]">Franchise approvals, POS permissions and audit logs are protected behind admin login.</div>
              </div>
              <div className="h-12 w-28 rounded-full bg-[linear-gradient(135deg,#7c3fe0,#9b6df0)] shadow-[0_16px_34px_rgba(124,63,224,0.22)]" />
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-white/80 bg-white/82 p-7 shadow-inner backdrop-blur-xl sm:p-9 lg:p-12">
          <div className="mb-8">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-[22px] bg-white shadow-sm lg:hidden">
              <Image src="/bombay-falooda-logo.jpeg" alt="Bombay Falooda" width={72} height={72} className="h-full w-full object-cover" />
            </div>
            <div className="mt-6 text-sm font-bold uppercase tracking-[0.16em] text-[#7c3fe0] lg:mt-0">Executive access</div>
            <h1 className="font-display mt-3 text-2xl md:text-4xl font-semibold text-[#070b21]">
              Superadmin Login
            </h1>
            <p className="mt-3 text-sm font-medium leading-6 text-[#766b64]">
              Enter your registered phone number. We verify phone OTP first,
              then ask for Authenticator App code if it is enabled.
            </p>
          </div>
          <form className="space-y-5" onSubmit={submit}>
            {step === "PHONE" ? (
              <div>
                <label className="form-label" htmlFor="phone">Registered phone number</label>
                <div className="flex items-center gap-2.5">
                  <CountryCodePicker
                    value={countryDialCode}
                    onChange={setCountryDialCode}
                  />
                  <input
                    id="phone"
                    type="tel"
                    className="h-[48px] min-w-0 flex-1 rounded-[16px] border border-[#eadfd5] bg-white/90 px-4 text-sm font-semibold text-[#070b21] outline-none focus:border-[#7c3fe0] focus:ring-4 focus:ring-[#7c3fe0]/12 transition-all placeholder:text-gray-400 placeholder:font-normal shadow-sm"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="99999 99999"
                    required
                  />
                </div>
              </div>
            ) : (
              <>
                {devOtp ? (
                  <div className="rounded-[14px] border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    Development phone OTP: <span className="font-semibold">{devOtp}</span>
                  </div>
                ) : null}
                <div>
                  <label className="form-label" htmlFor="otp">Phone OTP</label>
                  <input id="otp" className="form-input text-center text-lg tracking-[0.4em]" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value)} />
                </div>
              </>
            )}
            <button className="btn-primary h-12 w-full rounded-[16px]" disabled={loading} type="submit">
              {loading ? "Please wait..." : step === "PHONE" ? "Send phone OTP" : "Verify OTP"}
            </button>
          </form>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#eadfd5]" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9b8d85]">or continue with</span>
            <div className="h-px flex-1 bg-[#eadfd5]" />
          </div>

          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={continueWithGoogle}
            disabled={loading}
            className="flex h-12 w-full items-center justify-center gap-3 rounded-[16px] border border-[#eadfd5] bg-white px-4 text-sm font-bold text-[#1e293b] shadow-xs hover:bg-slate-50 hover:border-[#cbd5e1] active:scale-[0.99] transition-all disabled:opacity-50"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>
          <div className="mt-8 rounded-[22px] border border-[#eadfd5] bg-[#fffaf4]/80 p-4 text-xs font-semibold leading-5 text-[#766b64]">
            Protected with phone OTP, Authenticator App 2FA and audit-backed admin activity.
          </div>
        </section>
      </div>
      <ResultDialog
        open={!!error}
        title="Login failed"
        message={error}
        tone="error"
        onPrimary={() => setError("")}
      />
    </main>
  );
}
