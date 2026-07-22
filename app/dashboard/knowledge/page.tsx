"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

export default function KnowledgePage() {
  const [items, setItems] = useState<any[]>([]);
  const [role, setRole] = useState("");
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  async function load() {
    const [knowledgeResponse, dashboardResponse] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/knowledge`, {
        credentials: "include",
      }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard`, {
        credentials: "include",
      }),
    ]);
    const knowledge = await knowledgeResponse.json();
    const dashboard = await dashboardResponse.json();
    if (!knowledgeResponse.ok) throw new Error(knowledge.message);
    setItems(knowledge.items);
    setRole(dashboard.user?.role || "");
  }
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load().catch((caught) => setMessage(caught.message));
  }, []);
  async function acknowledge(id: number) {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/knowledge/${id}/acknowledge`,
      { method: "POST", credentials: "include" },
    );
    const body = await response.json();
    setMessage(body.message);
    if (response.ok) {
      await load();
      setEditingId(null);
    }
  }
  async function update(event: FormEvent<HTMLFormElement>, id: number) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/staff/knowledge/${id}`,
      {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, requiresAcknowledgement: true }),
      },
    );
    const body = await response.json();
    setMessage(body.message);
    if (response.ok) await load();
  }
  const staff = role === "administrator" || role === "agency_staff";
  return (
    <main className="workspace-page knowledge-page">
      <header>
        <Link href="/dashboard">← Dashboard</Link>
        <span>Knowledge base</span>
        <h1>Know the process. Know what is expected.</h1>
        <p>
          Agency procedures, rights, responsibilities and placement guidance.
        </p>
      </header>
      {message && (
        <p className="notice" aria-live="polite">
          {message}
        </p>
      )}
      <div className="knowledge-grid">
        {items.map((item) => (
          <article key={item.id} className="dash-panel">
            <small>
              {item.category} · Version {item.version}
            </small>
            {staff && editingId === item.id ? (
              <form onSubmit={(event) => update(event, item.id)}>
                <input
                  name="title"
                  defaultValue={item.title}
                  required
                  minLength={5}
                />
                <textarea
                  name="summary"
                  defaultValue={item.summary}
                  required
                  minLength={15}
                />
                <textarea
                  name="content"
                  defaultValue={item.content}
                  required
                  minLength={100}
                  rows={12}
                />
                <button>Save as a new acknowledged version</button>
                <button type="button" onClick={() => setEditingId(null)}>
                  Cancel
                </button>
              </form>
            ) : (
              <>
                <h2>{item.title}</h2>
                <p>{item.summary}</p>
                <div
                  className="managed-article"
                  dangerouslySetInnerHTML={{ __html: item.content }}
                />
                {staff && (
                  <button onClick={() => setEditingId(item.id)}>
                    Edit master guidance
                  </button>
                )}
                {item.requires_acknowledgement &&
                  !staff &&
                  Number(item.acknowledged_version) !==
                    Number(item.version) && (
                    <button onClick={() => acknowledge(item.id)}>
                      I have read and agree
                    </button>
                  )}
                {!staff &&
                  Number(item.acknowledged_version) ===
                    Number(item.version) && (
                    <b className="acknowledged">
                      ✓ Agreed on{" "}
                      {new Date(item.acknowledged_at).toLocaleDateString()}
                    </b>
                  )}
              </>
            )}
          </article>
        ))}
      </div>
    </main>
  );
}
