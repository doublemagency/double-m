"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
export default function Security() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const password = String(new FormData(e.currentTarget).get("password"));
    const r = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/change-password`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      },
    );
    const b = await r.json();
    setMessage(b.issues?.[0]?.message || b.message);
    if (r.ok) setTimeout(() => router.replace("/login"), 1200);
  }
  return (
    <main className="login-page">
      <form className="form-panel" onSubmit={submit}>
        <h1>Choose a private password</h1>
        <p>
          Use 8 or more characters with a capital letter, lowercase letter and
          number. Do not reuse the temporary password.
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
        <button className="button dark">Update password</button>
        {message && <p>{message}</p>}
      </form>
    </main>
  );
}
