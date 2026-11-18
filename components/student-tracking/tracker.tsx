"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PublicShell } from "@/components/demo/public-shell";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { useOperationalData } from "@/components/operations/use-operational-data";
import { demoContextStore } from "@/lib/demo/context";
import { validateTrackingInput } from "@/lib/operations/student-facing";
export default function StudentTracker() {
  const router = useRouter(),
    data = useOperationalData();
  const [code, setCode] = useState(""),
    [email, setEmail] = useState(""),
    [sample, setSample] = useState("stu-1"),
    [step, setStep] = useState<"lookup" | "verification" | "expired">("lookup");
  const [errors, setErrors] = useState({ code: "", email: "" });
  return (
    <PublicShell student>
      <div className="mx-auto grid max-w-3xl gap-5">
        <Card>
          <CardHeader>
            <h1 className="text-2xl font-semibold">Track Your Application</h1>
            <p className="text-sm text-muted-foreground">
              Student ID and registered email begin a future verification
              request. They never grant access by themselves.
            </p>
          </CardHeader>
          <CardContent>
            {step === "lookup" ? (
              <form
                noValidate
                className="grid gap-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  const validation = validateTrackingInput(code, email);
                  setErrors(validation);
                  if (!validation.code && !validation.email)
                    setStep("verification");
                }}
              >
                <label>
                  Unique Student ID
                  <input
                    className="mt-1 block min-h-11 w-full rounded border bg-background px-3"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="UAIS-STU-DEMO-0001"
                    aria-invalid={!!errors.code}
                    aria-describedby="student-id-error"
                  />
                </label>
                <p id="student-id-error" className="text-sm text-destructive">
                  {errors.code}
                </p>
                <label>
                  Registered email address
                  <input
                    className="mt-1 block min-h-11 w-full rounded border bg-background px-3"
                    type="email"
                    autoComplete="off"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={!!errors.email}
                    aria-describedby="tracking-email-error"
                  />
                </label>
                <p
                  id="tracking-email-error"
                  className="text-sm text-destructive"
                >
                  {errors.email}
                </p>
                <p className="text-xs text-muted-foreground">
                  Enter fictional details only. This preview does not perform a
                  lookup, contact a server, or send email. Valid-looking entries
                  receive the same response whether or not a matching profile
                  exists.
                </p>
                <Button type="submit">Continue to Verification</Button>
              </form>
            ) : (
              <section aria-label="Verification">
                <h2 className="mb-2 font-semibold">Verification required</h2>
                <p role="status" className="mb-4 text-sm">
                  {step === "expired"
                    ? "Expired-code example only. Requesting a new code requires UAIS Server."
                    : "Secure verification is unavailable until UAIS Server is connected. No lookup was performed and no email was sent."}
                </p>
                <label>
                  Email verification code
                  <input
                    className="mt-1 block min-h-11 w-full rounded border bg-muted px-3"
                    inputMode="numeric"
                    disabled
                    placeholder="Server verification unavailable"
                  />
                </label>
                <Button className="my-3" disabled>
                  Verify Code
                </Button>
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" onClick={() => setStep("lookup")}>
                    Back to lookup
                  </Button>
                  <Button variant="outline" onClick={() => setStep("expired")}>
                    Preview expired-code state
                  </Button>
                </div>
                <p className="mt-3 text-sm">
                  For a working fictional journey, explicitly choose a sample
                  below. It does not verify your identity.
                </p>
              </section>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Explore fictional sample results</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="block">
              Sample student
              <select
                className="mt-1 block min-h-11 w-full rounded border bg-background px-3"
                value={sample}
                onChange={(e) => setSample(e.target.value)}
              >
                {data.students
                  .filter((s) => s.code.startsWith("UAIS-STU-DEMO-"))
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} — {s.firstName} {s.lastName}
                    </option>
                  ))}
              </select>
            </label>
            <p className="text-sm text-muted-foreground">
              Sample selection is separate from ID/email entry. No
              authentication takes place. Sample access resets on refresh and
              expires after ten minutes.
            </p>
            <Button
              disabled={!data.students.some((s) => s.id === sample)}
              onClick={() => {
                demoContextStore.exploreSample(sample);
                router.push("/track-application/results");
              }}
            >
              Explore Sample Student Results
            </Button>
          </CardContent>
        </Card>
      </div>
    </PublicShell>
  );
}
