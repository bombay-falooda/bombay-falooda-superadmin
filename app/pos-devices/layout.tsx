import { AppShell } from "@/components/app-shell";

export default function PosDevicesLayout({
  children,
}: LayoutProps<"/pos-devices">) {
  return <AppShell>{children}</AppShell>;
}
