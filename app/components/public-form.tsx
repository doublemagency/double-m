"use client";
import { FormEvent, useEffect, useRef, useState } from "react";
import { PasswordField } from "./password-field";

const quickRoles = [
  "Nanny",
  "Househelp",
  "Dayburg nanny",
  "Caregiver",
  "House manager",
  "Cook",
  "Shamba boy",
  "Driver",
];
const candidateRoles = [
  "Nanny",
  "Househelp",
  "Caregiver",
  "House manager",
  "Cook",
  "Shamba boy",
  "Driver",
  "Shop attendant",
];

export function PublicForm({ kind }: { kind: "candidate" | "employer" }) {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">(
    "idle",
  );
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");
  const [needLength, setNeedLength] = useState(0);
  const roleField = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const role = new URLSearchParams(window.location.search).get("role");
    if (role && roleField.current && !roleField.current.value)
      roleField.current.value = role.slice(0, 120);
  }, []);
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
      const body = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(
          body.issues?.map((issue: { message: string }) => issue.message).join(" ") ||
            body.message ||
            "Registration could not be completed.",
        );
      setReference(body.reference || "");
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
        {reference && (
          <p className="request-reference">
            Your reference: <strong>{reference}</strong>
            <small>Keep it handy if you call or WhatsApp us.</small>
          </p>
        )}
        <p>
          {kind === "candidate"
            ? "Check your email to verify your account and continue your profile."
            : "Our team will review your request and contact you through your preferred channel."}
        </p>
        <ol className="next-steps">
          {(kind === "candidate"
            ? [
                "Open the email we sent and verify your address.",
                "Sign in and upload your ID, photo and CV.",
                "We approve your profile and match you to suitable jobs.",
              ]
            : [
                "We confirm your request by email right now.",
                "A consultant contacts you within one working day.",
                "You receive a shortlist of verified candidates to interview.",
              ]
          ).map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        {kind === "employer" && (
          <p>
            Want to follow progress online?{" "}
            <a href="/register/employer">Create a free employer account</a>{" "}
            with the same email and your request will appear there.
          </p>
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
          <input
            name="phone"
            autoComplete="tel"
            inputMode="numeric"
            pattern="0[0-9]{9}"
            maxLength={10}
            placeholder="0712345678"
            title="Enter 10 digits starting with 0."
            required
          />
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
              <input
                name="profession"
                required
                list="candidate-roles"
                placeholder="Pick or type, e.g. Caregiver"
              />
              <datalist id="candidate-roles">
                {candidateRoles.map((role) => (
                  <option value={role} key={role} />
                ))}
              </datalist>
            </label>
            <label>
              Current location
              <input
                name="location"
                required
                autoComplete="address-level2"
                placeholder="e.g. Kahawa West, Nairobi"
              />
            </label>
          </div>
          <label>
            Date of birth
            <input
              name="dateOfBirth"
              type="date"
              max={new Date(
                new Date().setFullYear(new Date().getFullYear() - 18),
              )
                .toISOString()
                .slice(0, 10)}
              required
            />
            <small>Job seekers must be 18 years or older.</small>
          </label>
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
          <div className="role-picker">
            <span id="role-picker-label">Who do you need? Tap one</span>
            <div role="group" aria-labelledby="role-picker-label">
              {quickRoles.map((role) => (
                <button
                  type="button"
                  key={role}
                  onClick={() => {
                    if (roleField.current) roleField.current.value = role;
                  }}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
          <div className="field-grid">
            <label>
              Worker or role needed
              <input
                name="roleNeeded"
                ref={roleField}
                required
                placeholder="e.g. Live-in nanny"
              />
            </label>
            <label>
              Work location
              <input
                name="location"
                required
                autoComplete="address-level2"
                placeholder="e.g. Kahawa West, Nairobi"
              />
            </label>
          </div>
          <label>
            Tell us what you need
            <textarea
              name="requirements"
              required
              minLength={20}
              rows={5}
              onChange={(event) => setNeedLength(event.target.value.length)}
              placeholder="e.g. Live-in nanny for a 2-year-old and a 5-year-old. Starts 1 November. Should cook simple meals. Budget around KES 12,000."
            />
            <small>
              Helpful to include: live-in or live-out, who they will care for,
              start date and budget.{" "}
              {needLength < 20
                ? `${20 - needLength} more characters needed.`
                : "Looks good."}
            </small>
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
