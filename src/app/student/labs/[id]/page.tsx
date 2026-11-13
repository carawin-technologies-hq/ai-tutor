import { LabPage } from "@/features/labs/LabsHub";
import { LAB_IDS } from "@/data/labs-meta";
import { notFound } from "next/navigation";
export function generateStaticParams() { return LAB_IDS.map((id) => ({ id })); }
export default function Page({ params }: { params: { id: string } }) {
  if (!LAB_IDS.includes(params.id)) notFound();
  return <LabPage id={params.id} />;
}
