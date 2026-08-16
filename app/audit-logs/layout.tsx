import { AppShell } from "@/components/app-shell";

export default function AuditLogsLayout({
  children,
}: LayoutProps<"/audit-logs">) {
  return <AppShell>{children}</AppShell>;
}
