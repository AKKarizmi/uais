import { StudentsWorkspace } from "@/components/desktop/students-workspace";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <StudentsWorkspace studentId={id} />;
}
