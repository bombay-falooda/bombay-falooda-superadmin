import { AppShell } from "@/components/app-shell";

export default function TeamManagementLayout({
  children,
}: LayoutProps<"/team-management">) {
  return <AppShell>{children}</AppShell>;
}
