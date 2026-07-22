"use client";
import { FormEvent, Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
function ResetForm() {
  const token = useSearchParams().get("token") || "";
  const [message, setMessage] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("Updating your password…");
    const password = String(new FormData(e.currentTarget).get("password"));
    const r = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/reset-password`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      },
    );
    const body = await r.json();
    setMessage(body.issues?.[0]?.message || body.message);
  }
  return (
    <form className="form-panel" onSubmit={submit}>
      <h1>Choose a new password</h1>
      <p>
        Use 8 or more characters with a capital letter, lowercase letter and
        number.
      </p>
      <label>
        New password
        <input
          name="password"
          type="password"
          minLength={8}
          pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,}"
          required
        />
      </label>
      <button className="button dark">Save my new password</button>
      {message && <p role="status">{message}</p>}
      <p>
        <Link href="/login">Go to sign in</Link>
      </p>
    </form>
  );
}
export default function Reset() {
  return (
    <main className="login-page">
      <Suspense fallback={<p>Preparing secure reset…</p>}>
        <ResetForm />
      </Suspense>
    </main>
  );
}
