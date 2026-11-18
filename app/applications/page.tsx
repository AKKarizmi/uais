import OperationsWorkspace from "@/components/operations/workspace";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ record?: string }>;
}) {
  const { record } = await searchParams;
  return (
    <OperationsWorkspace
      screen="applications"
      recordFilter={typeof record === "string" ? record : undefined}
    />
  );
}
