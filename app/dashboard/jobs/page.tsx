"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

export default function ManageJobs() {
  const [data, setData] = useState<any>({
    employers: [],
    requests: [],
    jobs: [],
  });
  const [message, setMessage] = useState("");
  const [employerUserId, setEmployerUserId] = useState("");
  async function load() {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/staff/job-options`,
      { credentials: "include" },
    );
    const body = await response.json();
    if (response.ok) setData(body);
    else setMessage(body.message);
  }
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/staff/jobs`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          employerUserId: form.employerUserId || undefined,
          staffingRequestId: form.staffingRequestId || undefined,
          salaryMin: form.salaryMin || undefined,
          salaryMax: form.salaryMax || undefined,
          publish: form.publish === "true",
        }),
      },
    );
    const body = await response.json();
    setMessage(body.issues?.[0]?.message || body.message);
    if (response.ok) {
      event.currentTarget.reset();
      setEmployerUserId("");
      await load();
    }
  }
  return (
    <main className="admin-controls">
      <header>
        <Link href="/dashboard">← Dashboard</Link>
        <span>Vacancy control</span>
        <h1>Create and assign roles</h1>
        <p>
          Publish a general opportunity or pin it to a registered employer and
          recruitment request.
        </p>
      </header>
      <div className="admin-grid">
        <form onSubmit={submit}>
          <h2>New job</h2>
          <label>
            Employer (optional)
            <select
              name="employerUserId"
              value={employerUserId}
              onChange={(event) => setEmployerUserId(event.target.value)}
            >
              <option value="">General vacancy</option>
              {data.employers.map((item: any) => (
                <option key={item.id} value={item.id}>
                  {item.full_name} · {item.email}
                </option>
              ))}
            </select>
          </label>
          <label>
            Recruitment request (optional)
            <select
              name="staffingRequestId"
              onChange={(event) => {
                const request = data.requests.find(
                  (item: any) => String(item.id) === event.target.value,
                );
                if (request?.employer_user_id)
                  setEmployerUserId(String(request.employer_user_id));
              }}
            >
              <option value="">No linked request</option>
              {data.requests.map((item: any) => (
                <option key={item.id} value={item.id}>
                  {item.reference_code} · {item.role_needed} · {item.location}
                </option>
              ))}
            </select>
          </label>
          <label>
            Job title
            <input name="title" required minLength={3} />
          </label>
          <div className="field-grid">
            <label>
              Location
              <input name="location" required />
            </label>
            <label>
              Employment type
              <select name="employmentType">
                <option>Full time</option>
                <option>Part time</option>
                <option>Contract</option>
              </select>
            </label>
          </div>
          <label>
            Public description
            <textarea name="description" required minLength={30} rows={4} />
          </label>
          <label>
            Duties
            <textarea name="duties" required minLength={20} rows={4} />
          </label>
          <label>
            Expectations
            <textarea name="expectations" required minLength={20} rows={4} />
          </label>
          <label>
            Experience required
            <input name="experienceRequired" />
          </label>
          <div className="field-grid">
            <label>
              Minimum salary
              <input name="salaryMin" type="number" min="0" />
            </label>
            <label>
              Maximum salary
              <input name="salaryMax" type="number" min="0" />
            </label>
          </div>
          <label>
            Schedule
            <input name="schedule" />
          </label>
          <div className="field-grid">
            <label>
              Accommodation
              <select name="accommodation">
                <option value="not_applicable">Not applicable</option>
                <option value="provided">Provided</option>
                <option value="not_provided">Not provided</option>
              </select>
            </label>
            <label>
              Arrangement
              <select name="workArrangement">
                <option value="not_applicable">Not applicable</option>
                <option value="live_in">Live in</option>
                <option value="live_out">Live out</option>
                <option value="either">Either</option>
              </select>
            </label>
          </div>
          <label>
            Benefits
            <input name="benefits" />
          </label>
          <label>
            Application deadline
            <input name="applicationDeadline" type="datetime-local" />
          </label>
          <label className="consent">
            <input type="checkbox" name="publish" value="true" /> Publish
            immediately and notify matching candidates
          </label>
          <button>Create job</button>
        </form>
        <section className="dash-panel">
          <div className="panel-heading">
            <h2>Job register</h2>
            <span>{data.jobs.length}</span>
          </div>
          <div className="simple-rows">
            {data.jobs.map((job: any) => (
              <div key={job.id}>
                <b>
                  {job.reference_code} · {job.title}
                  <small>
                    {job.employer_email
                      ? `Pinned to ${job.employer_email}`
                      : "General vacancy"}
                  </small>
                </b>
                <span>
                  {job.status}
                  <small>Created by {job.created_by_email || "system"}</small>
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
      {message && <div className="admin-toast">{message}</div>}
    </main>
  );
}
