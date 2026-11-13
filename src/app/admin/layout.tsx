import { PortalShell } from "@/components/layout/PortalShell";
export default function L({ children }: { children: React.ReactNode }) { return <PortalShell role="admin">{children}</PortalShell>; }
