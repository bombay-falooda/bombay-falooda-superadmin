import { AppShell } from "@/components/app-shell";

export default function FranchisesLayout({
  children,
}: LayoutProps<"/franchises">) {
  return <AppShell>{children}</AppShell>;
}
