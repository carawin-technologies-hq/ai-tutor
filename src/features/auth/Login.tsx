"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Field, Input, Tabs } from "@/components/ui";
import { roleOf, signIn } from "@/lib/session";
import type { Role } from "@/types";

const HOME: Record<Role, string> = { student: "/student", parent: "/parent", admin: "/admin" };
const TABS = [{ id: "student", label: "Student" }, { id: "parent", label: "Parent" }, { id: "admin", label: "Admin" }];

export function Login({ initialRole }: { initialRole: Role }) {
  const router = useRouter();
  const [role, setRole] = useState<Role>(initialRole);
  const [signup, setSignup] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const creating = signup && role !== "admin"; // admins are created by the seed or by another admin

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true); setError("");
    try {
      const s = await signIn(String(f.get("email")), String(f.get("password")),
        creating ? { name: String(f.get("name")), role: role.toUpperCase() as "STUDENT" | "PARENT" } : undefined);
      router.replace(HOME[roleOf(s)]); // the account's real role decides the portal, not the tab
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <Card id="login" className="mx-auto w-full max-w-md scroll-mt-24 p-6 shadow-lift sm:p-8">
        <h2 className="text-2xl font-bold text-oxford dark:text-white">{creating ? "Create your account" : "Sign in"}</h2>
        <Tabs className="mt-4" tabs={TABS} value={role} onChange={(id) => { setRole(id as Role); setError(""); }} />
        <form onSubmit={submit} className="mt-5 space-y-4">
          {creating && <Field label="Full name"><Input name="name" required minLength={2} maxLength={80} autoComplete="name" /></Field>}
          <Field label="Email"><Input name="email" type="email" required autoComplete="email" /></Field>
          <Field label="Password" hint={creating ? "At least 8 characters." : undefined}>
            <Input name="password" type="password" required minLength={creating ? 8 : 1} autoComplete={creating ? "new-password" : "current-password"} />
          </Field>
          {error && <p role="alert" className="text-sm text-crimson">{error}</p>}
          <Button type="submit" disabled={busy} className="w-full justify-center">{busy ? "Please wait…" : creating ? "Create account" : "Sign in"}</Button>
        </form>
        {role === "admin" ? (
          <p className="mt-4 text-center text-xs text-slate-500">Admin accounts are created by an existing admin.</p>
        ) : (
          <p className="mt-4 text-center text-sm text-slate-600">
            {creating ? "Already have an account? " : "New here? "}
            <button type="button" onClick={() => { setSignup(!signup); setError(""); }} className="font-semibold text-oxford hover:underline">{creating ? "Sign in" : "Create an account"}</button>
          </p>
        )}
    </Card>
  );
}
