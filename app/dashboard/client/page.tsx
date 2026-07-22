"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
const api = process.env.NEXT_PUBLIC_API_URL;
export default function ClientSupport() {
  const [message, setMessage] = useState("");
  const [placements, setPlacements] = useState<any[]>([]);
  useEffect(() => {
    fetch(`${api}/dashboard`, { credentials: "include" })
      .then((response) => response.json())
      .then((body) => setPlacements(body.data?.placements || []))
      .catch(() => setMessage("Your placement records could not be loaded."));
  }, []);
  async function submit(e: FormEvent<HTMLFormElement>, path: string) {
    e.preventDefault();
    setMessage("Sending…");
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const r = await fetch(`${api}${path}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
      b = await r.json();
    setMessage(b.message);
  }
  return (
    <main className="admin-controls">
      <header>
        <Link href="/dashboard">← Employer workspace</Link>
        <span>Placement support</span>
        <h1>How can we support your placement?</h1>
        <p>
          Use the placement number shown in your workspace. An agency team
          member reviews every request.
        </p>
      </header>
      <div className="admin-grid">
        <form onSubmit={(e) => submit(e, "/client/replacements")}>
          <h2>Request a replacement</h2>
          <label>
            Placement number
            <select name="placementId" required>
              <option value="">Choose your placement</option>
              {placements.map((placement) => (
                <option key={placement.id} value={placement.id}>
                  #{placement.id} · {placement.role_title} · {placement.status}
                </option>
              ))}
            </select>
          </label>
          <label>
            What happened?
            <textarea name="reason" minLength={20} rows={5} required />
          </label>
          <button>Submit request</button>
        </form>
        <form onSubmit={(e) => submit(e, "/client/extensions")}>
          <h2>Extend a contract</h2>
          <label>
            Placement number
            <select name="placementId" required>
              <option value="">Choose your placement</option>
              {placements.map((placement) => (
                <option key={placement.id} value={placement.id}>
                  #{placement.id} · {placement.role_title} · {placement.status}
                </option>
              ))}
            </select>
          </label>
          <label>
            Requested end date
            <input name="requestedEndDate" type="date" required />
          </label>
          <label>
            Note
            <textarea name="note" rows={4} />
          </label>
          <button>Request extension</button>
        </form>
        <form onSubmit={(e) => submit(e, "/client/reviews")}>
          <h2>Leave a review</h2>
          <label>
            Placement number (optional)
            <select name="placementId">
              <option value="">General agency review</option>
              {placements.map((placement) => (
                <option key={placement.id} value={placement.id}>
                  #{placement.id} · {placement.role_title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Rating
            <select name="rating">
              <option value="5">5 — Excellent</option>
              <option value="4">4 — Good</option>
              <option value="3">3 — Fair</option>
              <option value="2">2 — Needs improvement</option>
              <option value="1">1 — Poor</option>
            </select>
          </label>
          <label>
            Your experience
            <textarea name="reviewText" minLength={20} rows={5} required />
          </label>
          <button>Submit privately</button>
        </form>
      </div>
      {message && <div className="admin-toast">{message}</div>}
    </main>
  );
}
