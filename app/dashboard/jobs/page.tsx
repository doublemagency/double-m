"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { Eye, Plus, X } from "lucide-react";

const api = process.env.NEXT_PUBLIC_API_URL;

export default function ManageJobs() {
  const [data, setData] = useState<any>({
    employers: [],
    requests: [],
    jobs: [],
  });
  const [message, setMessage] = useState("");
  const [editor, setEditor] = useState<any | "new" | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const response = await fetch(`${api}/staff/job-options`, {
      credentials: "include",
    });
    const body = await response.json();
    if (response.ok) setData(body);
    else setMessage(body.message || "The job register could not be loaded.");
  }
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const form = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const response = await fetch(`${api}/staff/jobs`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          employerUserId: form.employerUserId || undefined,
          staffingRequestId: form.staffingRequestId || undefined,
          salaryMin: form.salaryMin || undefined,
          salaryMax: form.salaryMax || undefined,
          applicationDeadline: form.applicationDeadline || undefined,
          publish: form.publish === "true",
        }),
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.issues?.[0]?.message || body.message);
      setMessage(body.message);
      setEditor(null);
      await load();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "The job could not be saved.",
      );
    } finally {
      setBusy(false);
    }
  }

  const request = editor === "new" ? null : editor;
  return (
    <main className="admin-controls job-register-page">
      <header className="register-heading">
        <div>
          <span>Placement management</span>
          <h1>Job requests and vacancies</h1>
          <p>
            Review what employers submitted, refine the public vacancy, then
            approve it for applications and matching.
          </p>
        </div>
        <button className="button dark" onClick={() => setEditor("new")}>
          <Plus /> Create job
        </button>
      </header>

      <section className="dash-panel register-section">
        <div className="panel-heading">
          <div>
            <span>Submitted by employers</span>
            <h2>Job requests</h2>
          </div>
          <b>{data.requests.length}</b>
        </div>
        <div className="table-scroll">
          <table className="operations-table">
            <thead>
              <tr>
                <th>Request</th>
                <th>Employer</th>
                <th>Category</th>
                <th>Location</th>
                <th>Status</th>
                <th>Applicants</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {data.requests.map((item: any) => (
                <tr key={item.id}>
                  <td>
                    <b>{item.reference_code}</b>
                    <small>
                      {new Date(item.created_at).toLocaleDateString()}
                    </small>
                  </td>
                  <td>
                    <b>{item.full_name}</b>
                    <small>
                      {item.phone}
                      <br />
                      {item.email}
                    </small>
                  </td>
                  <td>{item.role_needed}</td>
                  <td>{item.location}</td>
                  <td>
                    <span
                      className={`table-status status-${item.job_status || item.status}`}
                    >
                      {(item.job_status || item.status).replaceAll("_", " ")}
                    </span>
                  </td>
                  <td>{item.applicant_count || 0}</td>
                  <td>
                    <button
                      className="table-action"
                      onClick={() => setEditor(item)}
                    >
                      <Eye /> View & review
                    </button>
                  </td>
                </tr>
              ))}
              {!data.requests.length && (
                <tr>
                  <td colSpan={7}>No employer requests have been submitted.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="dash-panel register-section">
        <div className="panel-heading">
          <div>
            <span>Agency register</span>
            <h2>Jobs</h2>
          </div>
          <b>{data.jobs.length}</b>
        </div>
        <div className="table-scroll">
          <table className="operations-table">
            <thead>
              <tr>
                <th>Job</th>
                <th>Employer</th>
                <th>Location</th>
                <th>Type</th>
                <th>Applicants</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {data.jobs.map((job: any) => (
                <tr key={job.id}>
                  <td>
                    <b>{job.title}</b>
                    <small>
                      {job.reference_code}
                      {job.request_reference
                        ? ` · ${job.request_reference}`
                        : ""}
                    </small>
                  </td>
                  <td>{job.employer_email || "General vacancy"}</td>
                  <td>{job.location}</td>
                  <td>{job.employment_type}</td>
                  <td>{job.applicant_count || 0}</td>
                  <td>
                    <span className={`table-status status-${job.status}`}>
                      {job.status}
                    </span>
                  </td>
                  <td>
                    {job.status === "published" ? (
                      <Link className="table-action" href="/jobs">
                        View live
                      </Link>
                    ) : (
                      <span>Agency record</span>
                    )}
                  </td>
                </tr>
              ))}
              {!data.jobs.length && (
                <tr>
                  <td colSpan={7}>No jobs have been created.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {editor && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={() => setEditor(null)}
        >
          <section
            className="job-editor-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="job-editor-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <span>
                  {request
                    ? `Request ${request.reference_code}`
                    : "New agency vacancy"}
                </span>
                <h2 id="job-editor-title">
                  {request ? "Review and approve job" : "Create a job"}
                </h2>
              </div>
              <button aria-label="Close" onClick={() => setEditor(null)}>
                <X />
              </button>
            </header>
            {request && (
              <div className="request-detail-card">
                <span>
                  <small>Employer</small>
                  {request.full_name}
                </span>
                <span>
                  <small>Contact</small>
                  {request.phone} · {request.email}
                </span>
                <span>
                  <small>Preferred contact</small>
                  {request.preferred_contact}
                </span>
                <span>
                  <small>Original requirement</small>
                  {request.requirements}
                </span>
              </div>
            )}
            <form key={request?.id || "new"} onSubmit={submit}>
              <input
                type="hidden"
                name="staffingRequestId"
                value={request?.id || ""}
              />
              <label>
                Employer
                <select
                  name="employerUserId"
                  defaultValue={request?.employer_user_id || ""}
                >
                  <option value="">General vacancy</option>
                  {data.employers.map((employer: any) => (
                    <option key={employer.id} value={employer.id}>
                      {employer.full_name} · {employer.email}
                    </option>
                  ))}
                </select>
              </label>
              <div className="field-grid">
                <label>
                  Job title
                  <input
                    name="title"
                    required
                    minLength={3}
                    defaultValue={request?.role_needed || ""}
                  />
                </label>
                <label>
                  Location
                  <input
                    name="location"
                    required
                    defaultValue={request?.location || ""}
                  />
                </label>
              </div>
              <div className="field-grid">
                <label>
                  Employment type
                  <select name="employmentType" defaultValue="Full time">
                    <option>Full time</option>
                    <option>Part time</option>
                    <option>Contract</option>
                  </select>
                </label>
                <label>
                  Experience required
                  <input name="experienceRequired" />
                </label>
              </div>
              <label>
                Public description
                <textarea
                  name="description"
                  required
                  minLength={30}
                  rows={3}
                  defaultValue={request?.requirements || ""}
                />
              </label>
              <label>
                Duties
                <textarea
                  name="duties"
                  required
                  minLength={20}
                  rows={3}
                  defaultValue={request?.requirements || ""}
                />
              </label>
              <label>
                Expectations
                <textarea
                  name="expectations"
                  required
                  minLength={20}
                  rows={3}
                  defaultValue="Reliable, respectful and able to perform the agreed duties professionally."
                />
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
              <div className="field-grid">
                <label>
                  Arrangement
                  <select name="workArrangement">
                    <option value="not_applicable">Not specified</option>
                    <option value="live_in">Live in</option>
                    <option value="live_out">Live out</option>
                    <option value="either">Either</option>
                  </select>
                </label>
                <label>
                  Accommodation
                  <select name="accommodation">
                    <option value="not_applicable">Not specified</option>
                    <option value="provided">Provided</option>
                    <option value="not_provided">Not provided</option>
                  </select>
                </label>
              </div>
              <label>
                Schedule
                <input name="schedule" />
              </label>
              <label>
                Benefits or important notes
                <input name="benefits" />
              </label>
              <label>
                Application deadline
                <input name="applicationDeadline" type="datetime-local" />
              </label>
              <div className="modal-actions">
                <button type="button" onClick={() => setEditor(null)}>
                  Cancel
                </button>
                <button name="publish" value="false" disabled={busy}>
                  Save draft
                </button>
                <button
                  className="button dark"
                  name="publish"
                  value="true"
                  disabled={busy}
                >
                  {busy ? "Approving…" : "Approve & publish"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
      {message && (
        <div className="admin-toast" role="status">
          {message}
        </div>
      )}
    </main>
  );
}
