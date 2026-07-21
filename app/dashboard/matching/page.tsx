"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { useEffect, useState } from "react";
export default function Matching() {
  const [requests, setRequests] = useState<any[]>([]),
    [selected, setSelected] = useState<any>(null),
    [matches, setMatches] = useState<any[]>([]),
    [chosen, setChosen] = useState<number[]>([]),
    [message, setMessage] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/staff/recruitment-requests`, {
      credentials: "include",
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : { requests: [] }))
      .then((x) => setRequests(x.requests))
      .catch(() => {});
    return () => controller.abort();
  }, []);
  async function open(request: any) {
    setSelected(request);
    setChosen([]);
    setMessage("Reading requirements and comparing approved profile data…");
    const r = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/staff/matches/${request.id}`,
        { credentials: "include" },
      ),
      body = await r.json();
    setMatches(body.matches || []);
    setMessage(body.notice || "");
  }
  async function share() {
    if (!selected?.employer_user_id) {
      setMessage(
        "The request must be linked to an employer account before a shortlist can be shared.",
      );
      return;
    }
    const r = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/staff/shortlists`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            employerUserId: selected.employer_user_id,
            staffingRequestId: selected.id,
            candidateUserIds: chosen,
          }),
        },
      ),
      body = await r.json();
    setMessage(body.message);
  }
  return (
    <main className="admin-controls">
      <header>
        <Link href="/dashboard">← Dashboard</Link>
        <span>Human-reviewed matching</span>
        <h1>Focused recommendations, explained.</h1>
        <p>
          Select a live employer request, review the reasons, and share no more
          than six suitable candidates. Tribe, family status and private
          identity documents are never used here.
        </p>
      </header>
      <div className="matching-layout">
        <section className="dash-panel">
          <h2>Open requests</h2>
          <div className="simple-rows">
            {requests.map((request) => (
              <button
                className={selected?.id === request.id ? "active" : ""}
                onClick={() => open(request)}
                key={request.id}
              >
                <b>
                  {request.role_needed}
                  <small>
                    {request.reference_code} · {request.location}
                  </small>
                </b>
                <span>{request.status}</span>
              </button>
            ))}
          </div>
        </section>
        <section className="dash-panel">
          <div className="panel-heading">
            <h2>Candidate recommendations</h2>
            {chosen.length > 0 && (
              <button onClick={share}>
                Share {chosen.length} with employer
              </button>
            )}
          </div>
          {matches.map((item) => (
            <label className="match-row" key={item.candidate.user_id}>
              <input
                type="checkbox"
                checked={chosen.includes(item.candidate.user_id)}
                disabled={
                  !chosen.includes(item.candidate.user_id) && chosen.length >= 6
                }
                onChange={(e) =>
                  setChosen((current) =>
                    e.target.checked
                      ? [...current, item.candidate.user_id]
                      : current.filter((id) => id !== item.candidate.user_id),
                  )
                }
              />
              <div>
                <b>
                  <Link
                    href={`/dashboard/candidates/${item.candidate.user_id}`}
                  >
                    {item.candidate.full_name}
                  </Link>
                </b>
                <span>
                  {item.candidate.profession} · {item.candidate.location}
                </span>
                <small>{item.reasons.join(" · ")}</small>
              </div>
              <strong>{item.score}%</strong>
            </label>
          ))}
          {!matches.length && (
            <p className="panel-empty">Choose an open request to begin.</p>
          )}
        </section>
      </div>
      {message && <div className="admin-toast">{message}</div>}
    </main>
  );
}
