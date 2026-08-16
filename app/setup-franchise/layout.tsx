import { AppShell } from "@/components/app-shell";

export default function SetupFranchiseLayout({
  children,
}: LayoutProps<"/setup-franchise">) {
  return <AppShell>{children}</AppShell>;
}
