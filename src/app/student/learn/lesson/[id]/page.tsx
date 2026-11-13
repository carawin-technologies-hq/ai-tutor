import LessonPlayer from "@/features/learning/LessonPlayer";
import { LESSONS } from "@/data/mock-lessons";
import { notFound } from "next/navigation";
export function generateStaticParams() { return Object.keys(LESSONS).map((id) => ({ id })); }
export default function Page({ params }: { params: { id: string } }) {
  if (!LESSONS[params.id]) notFound();
  return <LessonPlayer lessonId={params.id} />;
}
