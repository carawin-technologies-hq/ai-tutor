import { AdminCurriculum } from "@/features/admin/AdminPages1";
import { notFound } from "next/navigation";
const LEVELS = ["boards", "classes", "subjects", "chapters", "topics"];
export function generateStaticParams() { return LEVELS.map((level) => ({ level })); }
export default function Page({ params }: { params: { level: string } }) {
  if (!LEVELS.includes(params.level)) notFound();
  return <AdminCurriculum level={params.level} />;
}
