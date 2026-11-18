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
import { demoContextStore } from "@/lib/demo/context";
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
  { name: "Manager Workspace", href: "/manager-workspace", icon: Users },
  { name: "Employee Workspace", href: "/employee-workspace", icon: Users },
  { name: "Employee Management", href: "/employees", icon: ShieldCheck },
  { name: "Student Portal", href: "/student-portal", icon: GraduationCap },
  {
    name: "Student Application Tracker",
    href: "/track-application",
    icon: GraduationCap,
  },
  { name: "Back to Login", href: "/login", icon: ShieldCheck },
] as const;
export const previewDisclaimer =
  "Workspace previews use fictional data. Real permissions require authenticated UAIS Server sessions.";
export function previewNavigation(href: string) {
  if (href === "/admin" || href === "/employees")
    demoContextStore.enter("admin");
  else if (href === "/manager-workspace") demoContextStore.enter("manager");
  else if (href === "/employee-workspace") demoContextStore.enter("employee");
  else demoContextStore.exit();
}
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
          <DropdownMenuLabel>Switch Workspace</DropdownMenuLabel>
          {workspacePreviews.map(({ name, href, icon: Icon }) => (
            <DropdownMenuItem
              key={href}
              render={
                <Link
                  href={href}
                  onClick={() => previewNavigation(href)}
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
