"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
export default function MyContracts() {
  const [items, setItems] = useState<any[]>([]),
    [selected, setSelected] = useState<any>(null),
    [message, setMessage] = useState("");
  async function load() {
    const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/contracts`, {
      credentials: "include",
    });
    if (r.ok) setItems((await r.json()).contracts);
  }
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, []);
  async function open(id: number) {
    const r = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/contracts/${id}`,
      { credentials: "include" },
    );
    if (r.ok) setSelected(await r.json());
  }
  async function sign(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const r = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/contracts/${selected.contract.id}/sign`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signedName: f.get("signedName"),
          accepted: true,
        }),
      },
    );
    setMessage((await r.json()).message);
    if (r.ok) {
      setSelected(null);
      void load();
    }
  }
  return (
    <main className="admin-controls">
      <header>
        <Link href="/dashboard">← Dashboard</Link>
        <span>Private agreements</span>
        <h1>My contracts</h1>
        <p>
          Read the complete agreement before accepting. Your acceptance, name
          and time are recorded against the unchanged contract version.
        </p>
      </header>
      <section className="dash-panel">
        <div className="simple-rows">
          {items.map((c) => (
            <div key={c.id}>
              <b>
                {c.contract_number} · {c.role_title}
                <small>
                  {c.job_reference
                    ? `Job ${c.job_reference}`
                    : "Direct placement"}
                </small>
              </b>
              <button onClick={() => open(c.id)}>
                {c.status === "fully_signed" ? "View signed" : "Review & sign"}
              </button>
            </div>
          ))}
        </div>
      </section>
      {selected && (
        <section className="contract-dialog">
          <div className="contract-sheet">
            <div className="contract-toolbar">
              <button onClick={() => setSelected(null)}>Close</button>
              <button onClick={() => window.print()}>Print / save PDF</button>
            </div>
            <header className="contract-letterhead">
              <Image
                src="/brand/logo.jpeg"
                width={64}
                height={64}
                alt="Double M Agency"
              />
              <div>
                <small>DOUBLE M AGENCY</small>
                <h2>Employment and placement agreement</h2>
                <p>
                  {selected.contract.contract_number} · Template version{" "}
                  {selected.contract.template_version}
                </p>
              </div>
              <b>{selected.contract.status.replaceAll("_", " ")}</b>
            </header>
            <div className="contract-facts">
              <span>
                <small>Role</small>
                {selected.contract.role_title}
              </span>
              <span>
                <small>Monthly salary</small>KES{" "}
                {Number(selected.contract.salary_amount || 0).toLocaleString()}
              </span>
              <span>
                <small>Agency fee</small>KES{" "}
                {Number(
                  selected.contract.agency_fee_amount || 0,
                ).toLocaleString()}
              </span>
              <span>
                <small>Term</small>
                {new Date(
                  selected.contract.start_date,
                ).toLocaleDateString()} –{" "}
                {selected.contract.end_date
                  ? new Date(selected.contract.end_date).toLocaleDateString()
                  : "Open-ended"}
              </span>
            </div>
            <iframe
              title="Contract terms"
              sandbox=""
              srcDoc={`<!doctype html><html><head><style>body{font-family:Arial,sans-serif;color:#271d27;line-height:1.65;padding:28px;margin:0}h2{font-size:22px;color:#54134f;border-bottom:2px solid #df1675;padding-bottom:10px}h3{font-size:15px;color:#54134f;margin-top:24px;text-transform:uppercase;letter-spacing:.06em}p{font-size:14px}table{width:100%;border-collapse:collapse}td,th{border:1px solid #ddd;padding:9px}</style></head><body>${selected.contract.terms_snapshot}</body></html>`}
            />
            {selected.amendments?.length > 0 && (
              <section className="contract-amendments">
                <h3>Amendment history</h3>
                {selected.amendments.map((amendment: any) => (
                  <p key={amendment.id}>
                    <b>{new Date(amendment.created_at).toLocaleDateString()}</b>{" "}
                    · {amendment.reason}
                    <br />
                    <small>Recorded by {amendment.created_by_email}</small>
                  </p>
                ))}
              </section>
            )}
            <div className="signature-record">
              <span>
                <small>Employer signature</small>
                {selected.contract.employer_signed_name || "Awaiting signature"}
                <br />
                {selected.contract.employer_signed_at
                  ? new Date(
                      selected.contract.employer_signed_at,
                    ).toLocaleString()
                  : ""}
              </span>
              <span>
                <small>Employee signature</small>
                {selected.contract.candidate_signed_name ||
                  "Awaiting signature"}
                <br />
                {selected.contract.candidate_signed_at
                  ? new Date(
                      selected.contract.candidate_signed_at,
                    ).toLocaleString()
                  : ""}
              </span>
            </div>
            {selected.canSign &&
              selected.contract.status !== "fully_signed" && (
                <form onSubmit={sign}>
                  <label>
                    Type your full legal name
                    <input name="signedName" required />
                  </label>
                  <label className="contract-consent">
                    <input type="checkbox" required /> I have read and accept
                    this agreement.
                  </label>
                  <button>Accept and sign</button>
                </form>
              )}
          </div>
        </section>
      )}
      {message && <div className="admin-toast">{message}</div>}
    </main>
  );
}
