"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { useEffect, useState } from "react";

export default function ApplicationsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/candidate/applications`, {
      credentials: "include",
    })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.message);
        setItems(body.applications);
      })
      .catch((caught) => setError(caught.message));
  }, []);
  return (
    <main className="workspace-page">
      <header>
        <Link href="/dashboard">← Dashboard</Link>
        <span>Candidate workspace</span>
        <h1>My applications</h1>
        <p>
          Follow every application from receipt through review and placement.
        </p>
      </header>
      {error && <p className="form-error">{error}</p>}
      <section className="dash-panel">
        {items.length ? (
          <div className="application-cards">
            {items.map((item) => (
              <article key={item.id}>
                <div>
                  <small>{item.reference_code || "Agency matching"}</small>
                  <h2>{item.title || "Private agency opportunity"}</h2>
                  <p>{item.location || "Location shared during matching"}</p>
                </div>
                <b className={`status-${item.status}`}>
                  {item.status.replaceAll("_", " ")}
                </b>
                <time>
                  Updated {new Date(item.updated_at).toLocaleDateString()}
                </time>
              </article>
            ))}
          </div>
        ) : (
          <div className="panel-empty">
            <h2>No applications yet</h2>
            <p>Explore verified jobs and apply using your saved profile.</p>
            <Link className="button dark" href="/jobs">
              View available jobs
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
