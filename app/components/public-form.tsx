"use client";
import { FormEvent, useState } from "react";
import { PasswordField } from "./password-field";
import Link from "next/link";

export function PublicForm({ kind }: { kind: "candidate" | "employer" }) {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">(
    "idle",
  );
  const [error, setError] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("sending");
    setError("");
    const form = new FormData(e.currentTarget);
    const data = Object.fromEntries(form.entries());
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1"}/${kind === "candidate" ? "auth/register" : "staffing-requests"}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );
      const body = await response.json();
      if (!response.ok)
        throw new Error(
          body.issues?.[0]?.message ||
            body.message ||
            "Registration could not be completed.",
        );
      setState("done");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Registration could not be completed.",
      );
      setState("error");
    }
  }
  if (state === "done")
    return (
      <div className="form-success">
        <h2>Thank you. We’ve received your details.</h2>
        <p>
          {kind === "candidate"
            ? "Check your email to verify your account and continue your profile."
            : "Our team will review your request and contact you through your preferred channel."}
        </p>
        {kind === "candidate" && (
          <Link className="button dark" href="/login">
            Proceed to login
          </Link>
        )}
      </div>
    );
  return (
    <form className="public-form" onSubmit={submit}>
      <div className="field-grid">
        <label>
          Full name
          <input name="fullName" autoComplete="name" required minLength={2} />
        </label>
        <label>
          Phone number
          <input name="phone" autoComplete="tel" required />
        </label>
      </div>
      <label>
        Email address
        <input name="email" type="email" autoComplete="email" required />
      </label>
      {kind === "candidate" ? (
        <>
          <label>
            Create password
            <PasswordField
              name="password"
              autoComplete="new-password"
              minLength={8}
              pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,}"
              title="Use at least 8 characters with a capital letter, lowercase letter and number."
              required
            />
            <small>
              8+ characters, including a capital letter, lowercase letter and
              number.
            </small>
          </label>
          <div className="field-grid">
            <label>
              Main profession
              <input name="profession" required placeholder="e.g. Caregiver" />
            </label>
            <label>
              Current location
              <input name="location" required />
            </label>
          </div>
          <label className="consent">
            <input
              type="checkbox"
              name="privacyConsent"
              value="true"
              required
            />{" "}
            I agree to the privacy notice and the use of my details for
            recruitment.
          </label>
        </>
      ) : (
        <>
          <div className="field-grid">
            <label>
              Worker or role needed
              <input name="roleNeeded" required />
            </label>
            <label>
              Work location
              <input name="location" required />
            </label>
          </div>
          <label>
            Tell us what you need
            <textarea name="requirements" required minLength={20} rows={5} />
          </label>
          <label>
            Preferred contact
            <select name="preferredContact">
              <option value="phone">Phone call</option>
              <option value="email">Email</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
          </label>
          <label className="consent">
            <input
              type="checkbox"
              name="privacyConsent"
              value="true"
              required
            />{" "}
            I agree to the privacy notice and to being contacted about this
            request.
          </label>
        </>
      )}
      <button className="button dark" disabled={state === "sending"}>
        {state === "sending"
          ? "Sending securely…"
          : kind === "candidate"
            ? "Create my profile"
            : "Submit staffing request"}
      </button>
      {state === "error" && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
