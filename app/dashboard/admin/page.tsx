"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
const api = process.env.NEXT_PUBLIC_API_URL;
async function send(
  path: string,
  method: string,
  data: Record<string, unknown>,
) {
  if ("active" in data) data.active = data.active === "true";
  const r = await fetch(`${api}${path}`, {
      method,
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
    b = await r.json();
  if (!r.ok) throw new Error(b.message);
  return b.message;
}
export default function AdminControls() {
  const [message, setMessage] = useState("");
  async function submit(
    e: FormEvent<HTMLFormElement>,
    path: string,
    method = "PUT",
  ) {
    e.preventDefault();
    setMessage("Saving…");
    try {
      setMessage(
        await send(
          path,
          method,
          Object.fromEntries(new FormData(e.currentTarget)),
        ),
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not save.");
    }
  }
  return (
    <main className="admin-controls">
      <header>
        <Link href="/dashboard">← Workspace</Link>
        <span>Administrator only</span>
        <h1>System controls</h1>
        <p>
          Staff access, public contacts, pricing and payment availability are
          controlled here.
        </p>
        <div className="dash-actions">
          <Link href="/dashboard/admin/users">Manage accounts</Link>
          <Link href="/dashboard/admin/contracts">Contract terms</Link>
          <Link href="/dashboard/contracts">Contract register</Link>
        </div>
      </header>
      <div className="admin-grid">
        <form onSubmit={(e) => submit(e, "/admin/staff", "POST")}>
          <h2>Create agency staff</h2>
          <p>Public registration cannot create staff accounts.</p>
          <label>
            Staff email
            <input name="email" type="email" required />
          </label>
          <label>
            Temporary password
            <input
              name="temporaryPassword"
              type="password"
              minLength={8}
              pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,}"
              required
            />
          </label>
          <button>Create staff account</button>
        </form>
        <form onSubmit={(e) => submit(e, "/admin/settings")}>
          <h2>Contact details</h2>
          <label>
            Phone and WhatsApp
            <input name="contact_phone" />
          </label>
          <label>
            Public email
            <input name="contact_email" type="email" />
          </label>
          <label>
            Office address
            <input name="office_address" />
          </label>
          <label>
            Business hours
            <input name="business_hours" />
          </label>
          <button>Publish details</button>
        </form>
        <form onSubmit={(e) => submit(e, "/admin/service-prices")}>
          <h2>Service pricing</h2>
          <label>
            Service code
            <input name="serviceCode" required />
          </label>
          <label>
            Service name
            <input name="serviceName" required />
          </label>
          <label>
            Amount
            <input name="amount" type="number" min="0" required />
          </label>
          <input name="currency" value="KES" readOnly />
          <input name="active" value="true" type="hidden" />
          <button>Save price</button>
        </form>
        <form onSubmit={(e) => submit(e, "/admin/payment-methods")}>
          <h2>Payment activation</h2>
          <label>
            Method
            <select name="methodCode">
              <option value="mpesa">M-Pesa</option>
              <option value="bank_transfer">Bank transfer</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
            </select>
          </label>
          <label>
            Display name
            <input name="displayName" required />
          </label>
          <label>
            Availability
            <select name="active">
              <option value="true">Active</option>
              <option value="false">Disabled</option>
            </select>
          </label>
          <button>Update method</button>
        </form>
        <form onSubmit={(e) => submit(e, "/admin/fee-bands")}>
          <h2>Salary-based agency charges</h2>
          <p>
            Maintain the master fee schedule used to calculate new contracts.
          </p>
          <label>
            Payer
            <select name="payerRole">
              <option value="employer">Employer office charge</option>
              <option value="candidate">Candidate contribution</option>
            </select>
          </label>
          <label>
            Charge name
            <input name="feeName" defaultValue="Office charge" required />
          </label>
          <div className="field-grid">
            <label>
              Salary from
              <input name="salaryMin" type="number" min="0" required />
            </label>
            <label>
              Salary to
              <input name="salaryMax" type="number" min="0" required />
            </label>
          </div>
          <label>
            Agency charge (KES)
            <input name="feeAmount" type="number" min="0" required />
          </label>
          <button>Save fee band</button>
        </form>
      </div>
      {message && (
        <div className="admin-toast" role="status">
          {message}
        </div>
      )}
    </main>
  );
}
