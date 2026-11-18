"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronsUpDown,
  GraduationCap,
  LayoutDashboard,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const workspacePreviews = [
  { name: "Admin Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Employee Workspace", href: "/employee-workspace", icon: Users },
  { name: "Employee Management", href: "/employees", icon: ShieldCheck },
  { name: "Student Portal", href: "/student-portal", icon: GraduationCap },
] as const;
export const previewDisclaimer =
  "Demo navigation only. Real user roles and permissions will be enforced by UAIS Server.";
export function WorkspacePreview() {
  const pathname = usePathname();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="lg" aria-label="Workspace Preview" />
        }
      >
        <ShieldCheck />
        <span>Workspace Preview</span>
        <ChevronsUpDown />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Workspace Preview</DropdownMenuLabel>
          {workspacePreviews.map(({ name, href, icon: Icon }) => (
            <DropdownMenuItem
              key={href}
              render={
                <Link
                  href={href}
                  aria-current={pathname === href ? "page" : undefined}
                />
              }
            >
              <Icon aria-hidden="true" />
              {name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <p className="px-2 py-1.5 text-xs leading-relaxed text-muted-foreground">
          {previewDisclaimer}
        </p>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
