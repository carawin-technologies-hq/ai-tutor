import Landing from "@/components/landing/Landing";
import type { Role } from "@/types";

const ROLES: Role[] = ["student", "parent", "admin"];
export default function Home({ searchParams }: { searchParams: { role?: string } }) {
  const r = searchParams.role as Role;
  return <Landing role={ROLES.includes(r) ? r : "student"} />;
}
