"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

import { clearAuthSession, getStoredUser, type AuthUser } from "@/lib/auth";

type IconName =
  | "dashboard"
  | "setup"
  | "team"
  | "users"
  | "franchise"
  | "outlet"
  | "pos"
  | "audit"
  | "settings"
  | "logout";

const navItems: Array<{ href: string; label: string; icon: IconName }> = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/setup-franchise", label: "Setup Franchise", icon: "setup" },
  { href: "/outlet-management", label: "Outlet Management", icon: "outlet" },
  { href: "/team-management", label: "Team Management", icon: "team" },
  { href: "/users", label: "Users", icon: "users" },
  { href: "/franchises", label: "Franchises", icon: "franchise" },
  { href: "/pos-devices", label: "POS Devices", icon: "pos" },
  { href: "/audit-logs", label: "Audit Logs", icon: "audit" },
  { href: "/settings", label: "Settings", icon: "settings" },
];

const iconPaths: Record<IconName, string[]> = {
  dashboard: ["M4 4h7v7H4z", "M13 4h7v5h-7z", "M13 11h7v9h-7z", "M4 13h7v7H4z"],
  setup: ["M12 3v18", "M3 12h18", "M5 5h4v4H5z", "M15 5h4v4h-4z"],
  team: [
    "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2",
    "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
    "M23 21v-2a4 4 0 0 0-3-3.87",
  ],
  users: [
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",
    "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  ],
  franchise: ["M3 21h18", "M5 21V7l7-4 7 4v14", "M9 21v-6h6v6"],
  outlet: [
    "M12 21s7-4.35 7-11a7 7 0 1 0-14 0c0 6.65 7 11 7 11z",
    "M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  ],
  pos: [
    "M6 3h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z",
    "M8 7h8",
    "M8 11h8",
  ],
  audit: ["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z", "M14 2v6h6"],
  settings: [
    "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z",
    "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 .6 1.65 1.65 0 0 0-.4 1.07V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 8.6 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-.6-1 1.65 1.65 0 0 0-1.07-.4H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 8.6a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-.6A1.65 1.65 0 0 0 10.4 3V3a2 2 0 1 1 4 0v.09A1.65 1.65 0 0 0 15.4 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.38.2.78.31 1.2.32H21a2 2 0 1 1 0 4h-.09A1.65 1.65 0 0 0 19.4 15z",
  ],
  logout: ["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", "M16 17l5-5-5-5", "M21 12H9"],
};

function NavIcon({ name }: { name: IconName }) {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      {iconPaths[name].map((path) => (
        <path d={path} key={path} />
      ))}
    </svg>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const storedUser = getStoredUser();
    setUser(storedUser);

    if (!storedUser) {
      router.replace("/login");
    }
  }, [router]);

  function logout() {
    clearAuthSession();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen">
      {/* Mobile Nav Overlay Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#070b21]/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Slide-Out Menu Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-[#eadfd5] bg-white/95 p-5 shadow-2xl backdrop-blur-xl transition-transform duration-300 ease-in-out lg:hidden ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between pb-5 border-b border-[#eadfd5]/60">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-[14px] border border-[#eadfd5] bg-[#f4e8fb] shadow-sm">
              <Image
                src="/bombay-logo.png"
                alt="Bombay Falooda"
                width={40}
                height={40}
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <div className="font-display text-base font-semibold leading-tight text-[#070b21]">
                Bombay Falooda
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#7c3fe0]">
                Super Admin
              </div>
            </div>
          </div>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-[#070b21]"
            onClick={() => setMobileMenuOpen(false)}
          >
            ✕
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto py-4">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
                  active
                    ? "bg-[#7c3fe0] text-white shadow-md shadow-[#7c3fe0]/20"
                    : "text-[#5f554f] hover:bg-gray-100 hover:text-[#7c3fe0]"
                }`}
              >
                <NavIcon name={item.icon} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="pt-4 border-t border-[#eadfd5]/60">
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-100"
          >
            <NavIcon name="logout" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-20 border-r border-[#eadfd5]/80 bg-white/42 backdrop-blur-xl lg:flex lg:flex-col lg:items-center">
        <div className="flex h-20 items-center justify-center">
          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-[16px] border border-[#eadfd5] bg-[#f4e8fb] shadow-[0_10px_25px_rgba(98,55,138,0.14)]">
            <Image
              src="/bombay-logo.png"
              alt="Bombay Falooda"
              width={72}
              height={72}
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        <nav className="flex flex-1 flex-col items-center gap-2 py-3">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={`group/nav relative flex h-10 w-10 items-center justify-center rounded-xl transition ${
                  active
                    ? "bg-white text-[#7c3fe0] shadow-[0_12px_30px_rgba(76,54,35,0.08)]"
                    : "text-[#6d6660] hover:bg-white/70 hover:text-[#7c3fe0]"
                }`}
              >
                <NavIcon name={item.icon} />
                <span className="pointer-events-none absolute left-[54px] top-1/2 z-50 -translate-y-1/2 whitespace-nowrap rounded-xl border border-[#eadfd5] bg-white/92 px-3 py-2 text-xs font-semibold text-[#070b21] opacity-0 shadow-[0_12px_28px_rgba(76,54,35,0.12)] backdrop-blur-xl transition duration-150 group-hover/nav:translate-x-1 group-hover/nav:opacity-100">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <button
          className="group/nav relative mb-5 flex h-10 w-10 items-center justify-center rounded-xl text-[#6d6660] transition hover:bg-rose-50 hover:text-rose-600"
          title="Logout"
          type="button"
          onClick={logout}
        >
          <NavIcon name="logout" />
          <span className="pointer-events-none absolute left-[54px] top-1/2 z-50 -translate-y-1/2 whitespace-nowrap rounded-xl border border-rose-200 bg-white/95 px-3 py-2 text-xs font-bold text-rose-600 opacity-0 shadow-[0_12px_28px_rgba(225,29,72,0.15)] backdrop-blur-xl transition duration-150 group-hover/nav:translate-x-1 group-hover/nav:opacity-100">
            Logout
          </span>
        </button>
      </aside>

      <div className="lg:pl-20">
        <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between border-b border-[#eadfd5]/60 bg-white/70 px-4 py-3 backdrop-blur-md sm:px-6 lg:grid lg:grid-cols-[220px_1fr_240px] lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#eadfd5] bg-white text-[#070b21] shadow-sm lg:hidden"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open mobile menu"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <div className="font-display text-lg font-semibold leading-none text-[#070b21] sm:text-xl">
                Bombay Falooda
              </div>
              <div className="mt-1 text-xs font-medium text-[#a6783d]">Super Admin</div>
            </div>
          </div>

          <div className="hidden justify-center lg:flex">
            <div className="flex h-10 w-full max-w-[460px] items-center gap-3 rounded-[16px] border border-[#eadfd5] bg-white/58 px-4 shadow-[0_10px_30px_rgba(76,54,35,0.04)]">
              <span className="text-[#9a6d51]">
                <NavIcon name="audit" />
              </span>
              <span className="text-sm text-[#9c928b]">Search anything...</span>
              <span className="ml-auto rounded-lg border border-[#eadfd5] bg-white/70 px-2 py-1 text-xs text-[#9c928b]">
                Ctrl K
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 sm:gap-4">
            <div className="hidden text-right sm:block">
              <div className="font-display text-sm font-semibold text-[#070b21] sm:text-base">
                {user?.name || "Super Admin"}
              </div>
              <div className="max-w-[140px] truncate text-xs text-[#766b64] sm:max-w-none">{user?.email || "admin@bombayfalooda.com"}</div>
            </div>
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#f4e8fb] to-[#fff2df] text-xs font-semibold text-[#7c3fe0] ring-1 ring-[#eadfd5]">
              SA
            </div>
          </div>
        </header>

        <main className="mx-auto w-full px-4 pb-7 pt-4 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
