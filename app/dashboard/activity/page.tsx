"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { useEffect, useState } from "react";

export default function ActivityRegister() {
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/staff/activity`, {
      credentials: "include",
    })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.message);
        setItems(body.activity);
      })
      .catch((caught) => setError(caught.message));
  }, []);
  return (
    <main className="admin-controls">
      <header>
        <Link href="/dashboard">← Dashboard</Link>
        <span>Accountability register</span>
        <h1>Who served which record</h1>
        <p>
          Trace important staff actions to the person, record and exact time.
        </p>
      </header>
      {error && <p className="form-error">{error}</p>}
      <section className="dash-panel payment-table-wrap">
        <table className="payment-table">
          <thead>
            <tr>
              <th>Staff</th>
              <th>Action</th>
              <th>Record</th>
              <th>Date and time</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.staff_email}</td>
                <td>{item.action_code.replaceAll(".", " ")}</td>
                <td>
                  {item.entity_type} #{item.entity_id}
                </td>
                <td>{new Date(item.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
