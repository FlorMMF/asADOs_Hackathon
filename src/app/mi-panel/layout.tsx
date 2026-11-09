import { requireUser } from "@/lib/session";

export default async function MiPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();
  return <>{children}</>;
}
