"use client";
import { useDemoState } from "./demo-state";
import * as seed from "@/lib/operations/mock";
export function useOperationalData() {
  const [students] = useDemoState("students", seed.students);
  const [employees] = useDemoState("employees", seed.employees);
  const [tasks] = useDemoState("tasks", seed.tasks);
  const [documents] = useDemoState("documents", seed.documents);
  const [applications] = useDemoState("applications", seed.applications);
  const [universities] = useDemoState("universities", seed.universities);
  return { students, employees, tasks, documents, applications, universities };
}
