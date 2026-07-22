"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
export default function Contracts() {
  const [options, setOptions] = useState<any>(null),
    [contracts, setContracts] = useState<any[]>([]),
    [message, setMessage] = useState("");
  async function load() {
    const [o, c] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/staff/contract-options`, {
        credentials: "include",
      }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/contracts`, {
        credentials: "include",
      }),
    ]);
    if (o.ok) setOptions(await o.json());
    if (c.ok) setContracts((await c.json()).contracts);
  }
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, []);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget),
      jobId = f.get("jobId");
    const r = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/staff/contracts`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employerUserId: f.get("employerUserId"),
          candidateUserId: f.get("candidateUserId"),
          jobId: jobId ? Number(jobId) : undefined,
          roleTitle: f.get("roleTitle"),
          anticipatedSalary: f.get("anticipatedSalary"),
          candidateFeeAmount: f.get("candidateFeeAmount") || 0,
          startDate: f.get("startDate"),
          endDate: f.get("endDate") || undefined,
          send: true,
        }),
      },
    );
    setMessage((await r.json()).message);
    if (r.ok) {
      e.currentTarget.reset();
      void load();
    }
  }
  async function replace(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/staff/contracts/${form.get("contractId")}/replacement`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          replacementCandidateUserId: form.get("replacementCandidateUserId"),
          reason: form.get("reason"),
        }),
      },
    );
    const body = await response.json();
    setMessage(body.message);
    if (response.ok) {
      e.currentTarget.reset();
      void load();
    }
  }
  return (
    <main className="admin-controls">
      <header>
        <Link href="/dashboard">← Dashboard</Link>
        <span>Employment agreements</span>
        <h1>Contract register</h1>
        <p>
          Create the same controlled agreement whether registration happened
          online or at the office. Choose the actual job when one exists.
        </p>
      </header>
      <div className="admin-grid">
        <form onSubmit={submit}>
          <h2>Create and send</h2>
          {!options?.template && (
            <p>An administrator must save contract terms first.</p>
          )}
          <label>
            Employer
            <select name="employerUserId" required>
              <option value="">Choose employer</option>
              {options?.employers.map((x: any) => (
                <option value={x.id} key={x.id}>
                  {x.full_name || x.email}
                </option>
              ))}
            </select>
          </label>
          <label>
            Employee / candidate
            <select name="candidateUserId" required>
              <option value="">Choose employee</option>
              {options?.candidates.map((x: any) => (
                <option value={x.id} key={x.id}>
                  {x.full_name || x.email}
                </option>
              ))}
            </select>
          </label>
          <label>
            Job being taken
            <select
              name="jobId"
              onChange={(event) => {
                const job = options?.jobs.find(
                    (item: any) => String(item.id) === event.target.value,
                  ),
                  form = event.currentTarget.form;
                if (job && form)
                  (
                    form.elements.namedItem("roleTitle") as HTMLInputElement
                  ).value = job.title;
              }}
            >
              <option value="">Onsite/direct placement</option>
              {options?.jobs.map((x: any) => (
                <option value={x.id} key={x.id}>
                  {x.reference_code} · {x.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Role title
            <input name="roleTitle" required />
          </label>
          <label>
            Agreed monthly salary (KES)
            <input
              name="anticipatedSalary"
              type="number"
              min="1"
              required
              onChange={(event) => {
                const salary = Number(event.target.value);
                const band = options?.feeBands.find(
                  (item: any) =>
                    salary >= Number(item.salary_min) &&
                    salary <= Number(item.salary_max),
                );
                const output = event.currentTarget.form?.elements.namedItem(
                  "calculatedFee",
                ) as HTMLInputElement;
                if (output)
                  output.value = band
                    ? `KES ${Number(band.fee_amount).toLocaleString()}`
                    : "No approved fee band";
              }}
            />
          </label>
          <label>
            Calculated employer office charge
            <input name="calculatedFee" readOnly />
          </label>
          <label>
            Candidate agency contribution (KES)
            <input
              name="candidateFeeAmount"
              type="number"
              min="0"
              defaultValue="0"
            />
            <small>
              Use the amount agreed for this placement. It is recorded in the
              signed contract.
            </small>
          </label>
          <label>
            Start date
            <input name="startDate" type="date" required />
          </label>
          <label>
            End date (optional)
            <input name="endDate" type="date" />
          </label>
          <button disabled={!options?.template}>
            Create and send contract
          </button>
        </form>
        <section className="dash-panel">
          <div className="panel-heading">
            <h2>All contracts</h2>
            <span>{contracts.length}</span>
          </div>
          <div className="simple-rows">
            {contracts.map((c) => (
              <div key={c.id}>
                <b>
                  {c.contract_number} · {c.role_title}
                  <small>
                    {c.job_reference
                      ? `Job ${c.job_reference}`
                      : "Direct placement"}
                  </small>
                  <small>
                    Salary KES {Number(c.salary_amount || 0).toLocaleString()} ·
                    Office fee KES{" "}
                    {Number(c.agency_fee_amount || 0).toLocaleString()}
                  </small>
                </b>
                <span>
                  {c.status.replaceAll("_", " ")}
                  <small>
                    Last edited {new Date(c.updated_at).toLocaleDateString()}{" "}
                    {c.last_edited_by_email
                      ? `by ${c.last_edited_by_email}`
                      : ""}
                  </small>
                </span>
              </div>
            ))}
          </div>
        </section>
        <form onSubmit={replace}>
          <h2>Replacement amendment</h2>
          <p>
            Use this after reviewing an employer complaint. The old placement is
            closed, the replacement is linked and both parties must sign the
            amended contract.
          </p>
          <label>
            Existing contract
            <select name="contractId" required>
              <option value="">Choose contract</option>
              {contracts.map((contract) => (
                <option key={contract.id} value={contract.id}>
                  {contract.contract_number} · {contract.role_title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Verified replacement candidate
            <select name="replacementCandidateUserId" required>
              <option value="">Choose candidate</option>
              {options?.candidates.map((candidate: any) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.full_name || candidate.email}
                </option>
              ))}
            </select>
          </label>
          <label>
            Complaint review and reason
            <textarea name="reason" minLength={10} rows={5} required />
          </label>
          <button>Create replacement amendment</button>
        </form>
      </div>
      {message && <div className="admin-toast">{message}</div>}
    </main>
  );
}
