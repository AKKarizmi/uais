"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { PublicShell } from "./public-shell";
import { useDemoContext } from "./use-demo-context";
import {
  demoContextStore,
  roleDescriptions,
  roleWorkspaces,
  type PreviewRole,
} from "@/lib/demo/context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
export default function Login() {
  const context = useDemoContext(),
    router = useRouter();
  const [role, setRole] = useState<PreviewRole>(context.role ?? "admin");
  const [email, setEmail] = useState(""),
    [error, setError] = useState(""),
    [visible, setVisible] = useState(false);
  const validate = () =>
    setError(
      email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        ? "Enter a valid email address."
        : "Secure staff sign-in is unavailable until UAIS Server is connected.",
    );
  return (
    <PublicShell>
      <Card className="mx-auto max-w-lg">
        <CardHeader>
          <h1 className="text-2xl font-semibold">Welcome back</h1>
          <p className="text-sm text-muted-foreground">
            Your admissions workspace, thoughtfully connected.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <fieldset>
            <legend className="mb-2 font-medium">Preview role</legend>
            <div className="flex flex-wrap gap-2">
              {(["admin", "manager", "employee"] as const).map((value) => (
                <label
                  key={value}
                  className={`flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border px-3 ${role === value ? "bg-primary text-primary-foreground" : "bg-background"}`}
                >
                  <input
                    type="radio"
                    name="preview-role"
                    value={value}
                    checked={role === value}
                    onChange={() => setRole(value)}
                  />
                  <span className="capitalize">
                    {value[0].toUpperCase() + value.slice(1)}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <p aria-live="polite" className="text-sm">
            {roleDescriptions[role]}
          </p>
          <form
            noValidate
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              validate();
            }}
          >
            <label className="block">
              Email address
              <input
                className="mt-1 min-h-11 w-full rounded-md border bg-background px-3"
                type="email"
                autoComplete="off"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => {
                  if (email) validate();
                }}
                aria-describedby="login-feedback"
              />
            </label>
            <div className="block">
              <label htmlFor="staff-password">Password</label>
              <div className="mt-1 flex gap-2">
                <input
                  className="min-h-11 min-w-0 flex-1 rounded-md border bg-muted px-3"
                  type={visible ? "text" : "password"}
                  aria-label="Password"
                  id="staff-password"
                  disabled
                  value=""
                  autoComplete="off"
                  aria-describedby="password-unavailable"
                />
                <Button
                  type="button"
                  variant="outline"
                  aria-label={visible ? "Hide password" : "Show password"}
                  onClick={() => setVisible(!visible)}
                >
                  {visible ? <EyeOff /> : <Eye />}
                </Button>
              </div>
            </div>
            <p
              id="password-unavailable"
              className="text-xs text-muted-foreground"
            >
              Password entry and real Sign In are disabled. No credentials are
              stored or checked.
            </p>
            <a href="#password-reset" className="text-sm underline">
              Forgot Password?
            </a>
            <Button className="w-full" disabled type="submit">
              Sign In — server unavailable
            </Button>
            <p id="login-feedback" role="status" className="text-sm">
              {error ||
                "Secure staff login will become available after UAIS Server integration."}
            </p>
          </form>
          <Button
            className="w-full"
            variant="outline"
            onClick={() => {
              demoContextStore.enter(role);
              router.push(roleWorkspaces[role]);
            }}
          >
            Explore Demo Workspace
          </Button>
          <p className="text-xs text-muted-foreground">
            Selected destination: {roleWorkspaces[role]}. Role selection is demo
            navigation, not authorization.
          </p>
          <section id="password-reset" tabIndex={-1}>
            <h2 className="font-medium">Password reset</h2>
            <p className="text-sm text-muted-foreground">
              Password resets require the future server. No request or email is
              sent in this preview.
            </p>
          </section>
        </CardContent>
      </Card>
    </PublicShell>
  );
}
