"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
export default function Assisted() {
  const [message, setMessage] = useState("");
  const [role, setRole] = useState("candidate");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("Creating the account…");
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const r = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/staff/assisted-registration`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      ),
      b = await r.json();
    setMessage(b.message);
  }
  return (
    <main className="admin-controls">
      <header>
        <Link href="/dashboard">← Staff workspace</Link>
        <span>Assisted registration</span>
        <h1>Register someone in the office.</h1>
        <p>
          Choose the correct role. The person receives a welcome message and
          must change the temporary password.
        </p>
      </header>
      <div className="admin-grid">
        <form onSubmit={submit}>
          <h2>Account and profile</h2>
          <label>
            Register as
            <select
              name="role"
              value={role}
              onChange={(event) => setRole(event.target.value)}
            >
              <option value="candidate">Candidate seeking work</option>
              <option value="employer">Employer hiring staff</option>
            </select>
          </label>
          <label>
            Full name
            <input name="fullName" required />
          </label>
          <label>
            Email
            <input name="email" type="email" required />
          </label>
          <label>
            Phone
            <input name="phone" required />
          </label>
          <label>
            County or town
            <input name="location" required />
          </label>
          {role === "candidate" && (
            <>
              <label>
                Main profession
                <input name="profession" placeholder="For example: caregiver" />
              </label>
              <label>
                Year and date of birth
                <input name="dateOfBirth" type="date" />
              </label>
              <label>
                Education level
                <input
                  name="educationLevel"
                  placeholder="For example: secondary school"
                />
              </label>
            </>
          )}
          <label>
            Temporary password
            <input
              name="temporaryPassword"
              type="password"
              minLength={10}
              required
            />
          </label>
          <button>Create the correct account and send welcome email</button>
        </form>
      </div>
      {message && <div className="admin-toast">{message}</div>}
    </main>
  );
}
