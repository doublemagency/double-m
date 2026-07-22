"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { SimpleHeader } from "../components/simple-header";
import { GoogleSignIn } from "../components/google-sign-in";
export default function Login() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await r.json();
      if (!r.ok)
        throw new Error(
          body.issues?.[0]?.message || body.message || "Sign in failed.",
        );
      router.push("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign in failed.");
      setBusy(false);
    }
  }
  return (
    <>
      <SimpleHeader />
      <main className="login-page">
        <form className="form-panel" onSubmit={submit}>
          <span className="login-icon">
            <LockKeyhole />
          </span>
          <h1>Welcome back</h1>
          <p>Continue to your private Double M workspace.</p>
          <label>
            Email address
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <Link className="forgot-link" href="/forgot-password">
            Forgot password?
          </Link>
          <button className="button dark" disabled={busy}>
            {busy ? "Signing in…" : "Sign in securely"}
          </button>
          <GoogleSignIn />
          <small>
            <ShieldCheck size={14} /> Your private records are protected by
            role-based access.
          </small>
          <p>
            Looking for work?{" "}
            <Link href="/register">Create a candidate profile</Link>
          </p>
          <p>
            Hiring?{" "}
            <Link href="/register/employer">Create an employer account</Link>
          </p>
        </form>
      </main>
    </>
  );
}
