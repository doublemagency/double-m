"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
const checkCodes = [
  "phone_call",
  "identity",
  "passport_photo",
  "cv",
  "certificates",
  "references",
  "interview",
  "availability",
];
export default function CandidateReview() {
  const { id } = useParams<{ id: string }>(),
    [data, setData] = useState<any>(null),
    [message, setMessage] = useState("");
  const load = useCallback(
    async function load() {
      const r = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/staff/candidates/${id}`,
          { credentials: "include" },
        ),
        body = await r.json();
      if (r.ok) setData(body);
      else setMessage(body.message);
    },
    [id],
  );
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);
  async function update(checkCode: string, status: string) {
    const r = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/staff/candidates/${id}/verification`,
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            checkCode,
            status,
            note: "Updated during staff review",
          }),
        },
      ),
      body = await r.json();
    setMessage(body.message);
    if (r.ok) void load();
  }
  if (!data)
    return (
      <main className="admin-controls">
        <p>{message || "Loading protected profile…"}</p>
      </main>
    );
  return (
    <main className="admin-controls">
      <header>
        <Link href="/dashboard/matching">← Matching workspace</Link>
        <span>Authorised staff review</span>
        <h1>{data.profile.full_name}</h1>
        <p>
          {data.profile.profession} · {data.profile.location} ·{" "}
          {data.profile.email}. Date of birth remains staff-only and is not used
          for matching.
        </p>
      </header>
      <div className="admin-grid">
        <section className="dash-panel">
          <h2>Verification checklist</h2>
          <div className="check-list">
            {checkCodes.map((code) => {
              const item = data.checks.find((x: any) => x.check_code === code);
              return (
                <div key={code}>
                  <span>{code.replaceAll("_", " ")}</span>
                  <select
                    value={item?.status || "pending"}
                    onChange={(event) => update(code, event.target.value)}
                  >
                    <option value="pending">Pending</option>
                    <option value="in_review">In review</option>
                    <option value="verified">Verified</option>
                    <option value="needs_attention">Needs attention</option>
                    <option value="not_required">Not required</option>
                  </select>
                </div>
              );
            })}
          </div>
        </section>
        <section className="dash-panel">
          <h2>Private documents</h2>
          <p className="document-note">
            Preview is inline and audited. Employers cannot access these files.
          </p>
          <div className="simple-rows">
            {data.documents.map((doc: any) => (
              <div key={doc.id}>
                <b>
                  {doc.document_type.replaceAll("_", " ")}
                  <small>{doc.original_name}</small>
                </b>
                <a
                  target="_blank"
                  rel="noreferrer"
                  href={`${process.env.NEXT_PUBLIC_API_URL}/documents/${doc.id}/preview`}
                >
                  Preview
                </a>
              </div>
            ))}
          </div>
        </section>
      </div>
      {message && <div className="admin-toast">{message}</div>}
    </main>
  );
}
