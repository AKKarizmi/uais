import type { ReactNode } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { SectionHeader } from "@/components/dashboard/shared";
export function WorkSection({
  title,
  description,
  children,
  id,
  action,
}: {
  title: string;
  description: string;
  children: ReactNode;
  id?: string;
  action?: ReactNode;
}) {
  return (
    <section id={id} aria-label={title} className="min-w-0 scroll-mt-5">
      <Card className="dashboard-card">
        <CardHeader>
          <SectionHeader
            title={title}
            description={description}
            action={action}
          />
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </section>
  );
}
