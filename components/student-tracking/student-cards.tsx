import { StatusBadge } from "@/components/dashboard/shared";
import { applicationDisplay } from "@/lib/operations/student-facing";
export function StudentProfileFields({
  personal,
}: {
  personal: {
    name: string;
    code: string;
    email: string;
    phone?: string;
    nationality: string;
    updated?: string;
  };
}) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {[
        ["Full name", personal.name],
        ["Student ID", personal.code],
        ["Registered email", personal.email],
        ["Phone", personal.phone || "Not recorded"],
        ["Nationality", personal.nationality],
        ["Last updated", personal.updated || "Not recorded"],
      ].map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="text-xs text-muted-foreground">{label}</dt>
          <dd className="break-words text-sm font-medium">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
export function ApplicationStatus({ value }: { value: string }) {
  const display = applicationDisplay(value);
  return <StatusBadge tone={display.tone}>{display.label}</StatusBadge>;
}
