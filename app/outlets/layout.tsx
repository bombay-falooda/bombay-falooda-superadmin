import { AppShell } from "@/components/app-shell";

export default function OutletsLayout({ children }: LayoutProps<"/outlets">) {
  return <AppShell>{children}</AppShell>;
}
