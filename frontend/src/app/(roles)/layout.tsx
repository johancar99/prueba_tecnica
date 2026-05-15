import AppShell from "@/components/layout/AppShell";

export default function RolesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
