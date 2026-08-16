import { AppShell } from "@/components/app-shell";

export default function OutletManagementLayout({
  children,
}: LayoutProps<"/outlet-management">) {
  return <AppShell>{children}</AppShell>;
}
