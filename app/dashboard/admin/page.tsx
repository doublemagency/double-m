"use client";
import { FormEvent, ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { Eye, Pencil, X } from "lucide-react";

const api = process.env.NEXT_PUBLIC_API_URL;
type Editor = "staff" | "contacts" | "pricing" | "payments" | "fees" | null;

async function send(
  path: string,
  method: string,
  data: Record<string, unknown>,
) {
  if ("active" in data) data.active = data.active === "true";
  const response = await fetch(`${api}${path}`, {
    method,
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message);
  return body.message;
}

export default function AdminControls() {
  const [message, setMessage] = useState("");
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [editor, setEditor] = useState<Editor>(null);
  useEffect(() => {
    fetch(`${api}/settings/public`, { credentials: "include" })
      .then((response) => response.json())
      .then((body) => setSettings(body.settings || {}))
      .catch(() => {});
  }, []);
  async function submit(
    event: FormEvent<HTMLFormElement>,
    path: string,
    method = "PUT",
  ) {
    event.preventDefault();
    setMessage("Saving…");
    try {
      setMessage(
        await send(
          path,
          method,
          Object.fromEntries(new FormData(event.currentTarget)),
        ),
      );
      setEditor(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save.");
    }
  }

  const rows = [
    [
      "contacts",
      "Public contact details",
      "Phone, WhatsApp, email, location, hours and social links",
    ],
    ["staff", "Staff access", "Create protected agency staff accounts"],
    ["pricing", "Service pricing", "Activate and update agency service prices"],
    [
      "payments",
      "Payment methods",
      "Control M-Pesa, cash, bank and card availability",
    ],
    [
      "fees",
      "Salary-based charges",
      "Maintain employer and candidate fee bands",
    ],
  ] as const;

  return (
    <main className="admin-controls settings-register-page">
      <header className="register-heading">
        <div>
          <span>Administrator only</span>
          <h1>System settings</h1>
          <p>
            Review one control area at a time. Forms open only when an
            administrator chooses to edit.
          </p>
        </div>
      </header>
      <section className="dash-panel register-section">
        <div className="panel-heading">
          <div>
            <span>Configuration register</span>
            <h2>Settings</h2>
          </div>
          <b>{rows.length + 2}</b>
        </div>
        <div className="table-scroll">
          <table className="operations-table settings-table">
            <thead>
              <tr>
                <th>Control area</th>
                <th>Purpose</th>
                <th>Access</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([key, title, purpose]) => (
                <tr key={key}>
                  <td>
                    <b>{title}</b>
                  </td>
                  <td>{purpose}</td>
                  <td>
                    <span className="table-status">Administrator</span>
                  </td>
                  <td>
                    <button
                      className="table-action"
                      onClick={() => setEditor(key)}
                    >
                      <Pencil /> Edit
                    </button>
                  </td>
                </tr>
              ))}
              <tr>
                <td>
                  <b>Users and staff</b>
                </td>
                <td>Review, suspend and manage system accounts</td>
                <td>
                  <span className="table-status">Administrator</span>
                </td>
                <td>
                  <Link className="table-action" href="/dashboard/admin/users">
                    <Eye /> View
                  </Link>
                </td>
              </tr>
              <tr>
                <td>
                  <b>Contract terms</b>
                </td>
                <td>Review the active legal template and version history</td>
                <td>
                  <span className="table-status">Administrator</span>
                </td>
                <td>
                  <Link
                    className="table-action"
                    href="/dashboard/admin/contracts"
                  >
                    <Pencil /> Edit
                  </Link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {editor && (
        <SettingsModal
          title={rows.find(([key]) => key === editor)?.[1] || "System setting"}
          close={() => setEditor(null)}
        >
          {editor === "staff" && (
            <form onSubmit={(event) => submit(event, "/admin/staff", "POST")}>
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
          )}
          {editor === "contacts" && (
            <form
              key={JSON.stringify(settings)}
              onSubmit={(event) => submit(event, "/admin/settings")}
            >
              <label>
                Phone and WhatsApp
                <input
                  name="contact_phone"
                  defaultValue={settings.contact_phone}
                />
              </label>
              <label>
                Public email
                <input
                  name="contact_email"
                  type="email"
                  defaultValue={
                    settings.contact_email || "support@doublemagency.co.ke"
                  }
                />
              </label>
              <label>
                Office address
                <input
                  name="office_address"
                  defaultValue={
                    settings.office_address || "Kahawa West, Nairobi"
                  }
                />
              </label>
              <label>
                Business hours
                <input
                  name="business_hours"
                  defaultValue={settings.business_hours}
                />
              </label>
              <label>
                Google Maps location link
                <input
                  name="map_url"
                  type="url"
                  defaultValue={settings.map_url}
                />
              </label>
              <label>
                Facebook page
                <input
                  name="facebook_url"
                  type="url"
                  defaultValue={settings.facebook_url}
                />
              </label>
              <label>
                TikTok page
                <input
                  name="tiktok_url"
                  type="url"
                  defaultValue={settings.tiktok_url}
                />
              </label>
              <label>
                YouTube channel
                <input
                  name="youtube_url"
                  type="url"
                  defaultValue={settings.youtube_url}
                />
              </label>
              <button>Publish contact details</button>
            </form>
          )}
          {editor === "pricing" && (
            <form onSubmit={(event) => submit(event, "/admin/service-prices")}>
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
          )}
          {editor === "payments" && (
            <form onSubmit={(event) => submit(event, "/admin/payment-methods")}>
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
          )}
          {editor === "fees" && (
            <form onSubmit={(event) => submit(event, "/admin/fee-bands")}>
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
          )}
        </SettingsModal>
      )}
      {message && (
        <div className="admin-toast" role="status">
          {message}
        </div>
      )}
    </main>
  );
}

function SettingsModal({
  title,
  close,
  children,
}: {
  title: string;
  close: () => void;
  children: ReactNode;
}) {
  return (
    <div className="modal-backdrop" onMouseDown={close}>
      <section
        className="job-editor-modal settings-editor-modal"
        role="dialog"
        aria-modal="true"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <span>Administrator control</span>
            <h2>{title}</h2>
          </div>
          <button aria-label="Close" onClick={close}>
            <X />
          </button>
        </header>
        <div className="settings-editor-body">{children}</div>
      </section>
    </div>
  );
}
