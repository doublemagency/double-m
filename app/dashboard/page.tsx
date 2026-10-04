"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  ClipboardList,
  CreditCard,
  FileCheck2,
  LockKeyhole,
  MessageCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
type Payload = {
  user: { email: string; role: string; forcePasswordChange: boolean };
  data: any;
};
const labels: Record<string, string> = {
  administrator: "Administrator",
  agency_staff: "Agency staff",
  candidate: "Candidate",
  employer: "Employer",
};
export default function Dashboard() {
  const router = useRouter();
  const [payload, setPayload] = useState<Payload | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard`, {
      credentials: "include",
      signal: controller.signal,
    })
      .then(async (r) => {
        if (r.status === 401) {
          router.replace("/login");
          return null;
        }
        if (!r.ok) throw new Error("Workspace could not load.");
        return r.json();
      })
      .then((v) => v && setPayload(v))
      .catch((e) => e.name !== "AbortError" && setError(e.message));
    return () => controller.abort();
  }, [router]);
  if (error)
    return (
      <main className="dashboard-loading">
        <h1>We couldn’t load your workspace.</h1>
        <p>{error}</p>
      </main>
    );
  if (!payload)
    return (
      <main className="dashboard-loading">
        <span className="loader" />
        <p>Opening your secure workspace…</p>
      </main>
    );
  const { user, data } = payload;
  const titles: Record<string, [string, string]> = {
    administrator: [
      "Agency control centre",
      "Everything moving through Double M, from verification to payment.",
    ],
    agency_staff: [
      "Placement workspace",
      "Verify candidates, match them to requests, then manage contracts and payments.",
    ],
    employer: [
      "Employer workspace",
      "Request staff, review the agency-approved shortlist and track each placement.",
    ],
    candidate: [
      "Job seeker workspace",
      "Complete your profile and documents so the agency can approve and match you.",
    ],
  };
  const [title, lead] = titles[user.role] || titles.candidate;
  return (
    <div className="dash-overview">
      <header className="page-intro">
        <span>{labels[user.role]}</span>
        <h1>{title}</h1>
        <p>{lead}</p>
      </header>
      {user.forcePasswordChange && (
        <div className="security-banner">
          <ShieldCheck />
          <div>
            <b>Secure your account before continuing</b>
            <p>The temporary password must be replaced on first sign-in.</p>
          </div>
          <Link href="/dashboard/security">
            Change password <ChevronRight />
          </Link>
        </div>
      )}
      <FlowTracker role={user.role} />
      {user.role === "employer" ? (
        <EmployerView data={data} />
      ) : user.role === "candidate" ? (
        <CandidateView data={data} />
      ) : (
        <StaffView data={data} />
      )}
    </div>
  );
}
const flows: Record<string, { title: string; text: string }[]> = {
  employer: [
    { title: "Request", text: "Tell us the role, location and start date." },
    { title: "Shortlist", text: "Review agency-approved candidates." },
    { title: "Contract", text: "Sign the placement agreement online." },
    { title: "Payment", text: "Pay the agency fee and get a receipt." },
    { title: "Placement", text: "Start work with replacement support." },
  ],
  candidate: [
    { title: "Profile", text: "Add your work history and preferences." },
    { title: "Documents", text: "Upload ID and references for checks." },
    { title: "Approval", text: "The agency verifies and approves you." },
    { title: "Matching", text: "You are matched to suitable requests." },
    { title: "Contract", text: "Sign and start your placement." },
  ],
  agency_staff: [
    { title: "Approve", text: "Review candidate documents." },
    { title: "Match", text: "Match approved candidates to requests." },
    { title: "Shortlist", text: "Send a shortlist to the employer." },
    { title: "Contract", text: "Issue and track signed contracts." },
    { title: "Payments", text: "Verify payments and issue receipts." },
  ],
};
flows.administrator = flows.agency_staff;

function FlowTracker({ role }: { role: string }) {
  const steps = flows[role] || flows.candidate;
  return (
    <ol className="flow-tracker" aria-label="How your work moves through Double M">
      {steps.map((step, index) => (
        <li key={step.title}>
          <b>{index + 1}</b>
          <div>
            <strong>{step.title}</strong>
            <small>{step.text}</small>
          </div>
        </li>
      ))}
    </ol>
  );
}
function EmployerView({ data }: { data: any }) {
  return (
    <>
      <div className="dash-actions">
        <Link href="/dashboard/requests" className="button dark">
          New staffing request
        </Link>
        <Link href="/dashboard/client">Replacement & placement support</Link>
        <Link href="/dashboard/my-contracts">My contracts</Link>
      </div>
      <div className="metric-grid">
        <Metric title="Ongoing requests" value={data.requests?.length || 0} href="/dashboard/requests" />
        <Metric
          title="Active placements"
          value={
            data.placements?.filter((x: any) => x.status === "active").length ||
            0
          }
          href="/dashboard/client"
        />
        <Metric title="Payment records" value={data.payments?.length || 0} href="/dashboard" />
        <Metric title="Support cases" value={data.replacements?.length || 0} href="/dashboard/client" />
      </div>
      {data.shortlist?.length > 0 && (
        <section className="dash-panel">
          <div className="panel-heading">
            <div>
              <span>Agency-approved candidates</span>
              <h2>Your shortlist</h2>
            </div>
            <ShieldCheck />
          </div>
          <p className="document-note">
            Compare relevant summaries and tell the agency who you would like to
            meet. Final coordination remains with Double M.
          </p>
          <div className="shortlist-grid">
            {data.shortlist.map((candidate: any) => (
              <ShortlistCandidate
                key={`${candidate.shortlist_id}-${candidate.candidate_user_id}`}
                candidate={candidate}
              />
            ))}
          </div>
        </section>
      )}
      <Panel
        title="Recruitment requests"
        empty="No staffing requests yet. Use Request staff to start a tracked request."
        rows={data.requests}
      />
      <PaymentTable rows={data.payments} />
    </>
  );
}
function ShortlistCandidate({ candidate }: { candidate: any }) {
  const [status, setStatus] = useState(candidate.employer_response);
  async function respond(response: string) {
    setStatus("saving");
    const r = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/client/shortlists/${candidate.shortlist_id}/candidates/${candidate.candidate_user_id}`,
      {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response }),
      },
    );
    setStatus(r.ok ? response : "pending");
  }
  return (
    <article className="shortlist-card">
      <div>
        <span>
          Candidate {String(candidate.candidate_user_id).padStart(4, "0")}
        </span>
        <b>{candidate.match_score}% match</b>
      </div>
      <p>{candidate.public_summary}</p>
      <small>Agency-approved summary · sensitive documents are not shown</small>
      <div>
        <button
          onClick={() => respond("interview_requested")}
          disabled={status === "saving"}
        >
          Request an interview
        </button>
        <button
          onClick={() => respond("preferred")}
          disabled={status === "saving"}
        >
          Mark as preferred
        </button>
      </div>
    </article>
  );
}
function CandidateView({ data }: { data: any }) {
  const [uploadType, setUploadType] = useState("national_id");
  const [consent, setConsent] = useState(
    Boolean(data.profile?.public_profile_consent),
  );
  const [consentMessage, setConsentMessage] = useState("");
  const documentTypes: Record<string, string> = {
    identity: "national_id",
    passport_photo: "passport_photo",
    cv: "cv",
    certificates: "certificate",
  };
  return (
    <>
      <div className="dash-actions">
        <Link href="/dashboard/my-contracts">Review my contracts</Link>
      </div>
      <div className="profile-progress">
        <div>
          <span>Profile strength</span>
          <b>{data.profile?.profile_completion || 0}%</b>
        </div>
        <div>
          <i style={{ width: `${data.profile?.profile_completion || 0}%` }} />
        </div>
        <p>
          Complete your profile and verified documents to improve suitable
          matching.
        </p>
      </div>
      <section className="dash-panel candidate-next-step">
        <div className="panel-heading">
          <div>
            <span>Next step</span>
            <h2>
              {data.profile?.profile_completion < 70
                ? "Complete your profile"
                : data.profile?.agency_approval_status !== "approved"
                  ? "Complete document review"
                  : "Apply for suitable jobs"}
            </h2>
          </div>
          <span className={`table-status status-${data.profile?.agency_approval_status}`}>
            {(data.profile?.agency_approval_status || "pending").replaceAll("_", " ")}
          </span>
        </div>
        <p>
          {data.profile?.agency_approval_note ||
            "Add your work preferences, then upload your National ID and passport-sized photo."}
        </p>
        <Link className="table-action" href="/dashboard/preferences">
          Update my profile
        </Link>
      </section>
      <div className="metric-grid">
        <Metric
          title="Availability"
          value={data.profile?.availability_status || "Not set"}
          href="/dashboard/preferences"
        />
        <Metric
          title="Profession"
          value={data.profile?.profession || "Not set"}
          href="/dashboard/preferences"
        />
        <Metric title="Applications" value={data.applications?.length || 0} href="/dashboard/applications" />
        <Metric
          title="Interviews"
          value={
            data.applications?.filter(
              (item: any) => item.status === "interview",
            ).length || 0
          }
          href="/dashboard/applications"
        />
      </div>
      <section className="verification-card">
        <div className="panel-heading">
          <div>
            <span>Agency verification</span>
            <h2>Your trust checklist</h2>
          </div>
          <ShieldCheck />
        </div>
        <p>
          Our team confirms each item. Uploading a document does not
          automatically mark it verified.
        </p>
        <div className="check-list">
          {(
            [
              "phone_call",
              "identity",
              "passport_photo",
              "cv",
              "certificates",
              "references",
              "interview",
              "availability",
            ] as const
          ).map((code) => {
            const item = data.checks?.find(
              (check: any) => check.check_code === code,
            );
            const status = item?.status || "pending";
            const documentType = documentTypes[code];
            const uploaded = documentType
              ? data.documents?.some(
                  (document: any) => document.document_type === documentType,
                )
              : false;
            return (
              <button
                type="button"
                key={code}
                className={documentType ? "check-row-action" : undefined}
                onClick={() => {
                  if (!documentType) return;
                  setUploadType(documentType);
                  document.getElementById("candidate-document-file")?.click();
                }}
                disabled={!documentType}
                title={
                  documentType
                    ? `${uploaded ? "Replace" : "Upload"} ${code.replaceAll("_", " ")}`
                    : undefined
                }
              >
                <FileCheck2 />
                <span>{code.replaceAll("_", " ")}</span>
                <b className={`status-${status}`}>
                  {uploaded && status === "pending"
                    ? "uploaded"
                    : status.replaceAll("_", " ")}
                </b>
              </button>
            );
          })}
        </div>
      </section>
      <section className="dash-panel">
        <div className="panel-heading">
          <h2>Private documents</h2>
          <span>{data.documents?.length || 0} uploaded</span>
        </div>
        <div className="document-note">
          <LockKeyhole />
          Identity documents stay private and are reviewed only by authorised
          agency staff.
        </div>
        <DocumentUpload
          documentType={uploadType}
          onDocumentTypeChange={setUploadType}
        />
        {data.documents?.length > 0 && (
          <div className="simple-rows">
            {data.documents.map((doc: any) => (
              <div key={doc.id}>
                <b>{doc.document_type.replaceAll("_", " ")}</b>
                <span>{doc.status}</span>
              </div>
            ))}
          </div>
        )}
        <label className="consent-field">
          <input
            type="checkbox"
            checked={consent}
            onChange={async (event) => {
              const nextConsent = event.target.checked;
              setConsent(nextConsent);
              const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/candidate/public-profile-consent`,
                {
                  method: "PUT",
                  credentials: "include",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ consent: nextConsent }),
                },
              );
              const result = await response.json();
              setConsentMessage(result.message);
              if (!response.ok) setConsent(!nextConsent);
            }}
          />
          I agree that my approved passport photo and work-profile summary may
          be shown on the Double M website. IDs, contacts and documents remain
          private.
        </label>
        {consentMessage && <small>{consentMessage}</small>}
      </section>
      <section className="dash-panel">
        <div className="panel-heading">
          <h2>Application movement</h2>
          <span>Candidate-visible updates</span>
        </div>
        {data.applications?.length ? (
          <div className="timeline-list">
            {data.applications.map((a: any) => (
              <div key={a.id}>
                <i />
                <div>
                  <b>{a.title || "Agency matching"}</b>
                  <p>{a.status.replaceAll("_", " ")}</p>
                </div>
                <time>{new Date(a.updated_at).toLocaleDateString()}</time>
              </div>
            ))}
          </div>
        ) : (
          <div className="panel-empty">
            <ClipboardList />
            <p>
              No application movement yet. Your profile can still be considered
              for suitable opportunities.
            </p>
          </div>
        )}
      </section>
      {data.messages?.length > 0 && (
        <section className="dash-panel">
          <div className="panel-heading">
            <h2>Notes from Double M</h2>
            <span>{data.messages.length} updates</span>
          </div>
          <div className="message-list">
            {data.messages.map((m: any) => (
              <article key={m.id} className={`message-${m.message_type}`}>
                <b>{m.title}</b>
                <p>{m.message}</p>
              </article>
            ))}
          </div>
        </section>
      )}
      <section className="dash-panel">
        <div className="panel-heading">
          <h2>Work preferences</h2>
          <Link href="/dashboard/preferences">Update preferences</Link>
        </div>
        <div className="preference-summary">
          <span>
            <small>Best role</small>
            {data.preferences?.best_role || "Not set"}
          </span>
          <span>
            <small>Location</small>
            {data.preferences?.preferred_location || "Not set"}
          </span>
          <span>
            <small>Expected salary</small>
            {data.preferences?.expected_salary
              ? `KES ${Number(data.preferences.expected_salary).toLocaleString()}`
              : "Not set"}
          </span>
        </div>
      </section>
      <section className="dash-panel" id="recommended-jobs">
        <div className="panel-heading">
          <h2>Available verified jobs</h2>
          <span>{data.recommendedJobs?.length || 0}</span>
        </div>
        {data.recommendedJobs?.length ? (
          <div className="payment-table-wrap">
            <table className="payment-table">
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Location</th>
                  <th>Work type</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.recommendedJobs.map((job: any) => (
                  <tr key={job.id}>
                    <td>
                      <b>{job.title}</b>
                      <small>{job.reference_code}</small>
                    </td>
                    <td>{job.location}</td>
                    <td>{job.employment_type?.replaceAll("_", " ")}</td>
                    <td>
                      <CandidateApply jobId={job.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="panel-empty">
            <p>
              There are no published opportunities matching your profile yet.
            </p>
          </div>
        )}
      </section>
      <PaymentTable rows={data.payments} />
    </>
  );
}
function StaffView({ data }: { data: any }) {
  const m = data.metrics || {};
  return (
    <>
      <div className="metric-grid">
        <Metric title="Candidates" value={m.candidates || 0} href="/dashboard/candidates" />
        <Metric title="Open requests" value={m.openRequests || 0} href="/dashboard/jobs" />
        <Metric title="Published jobs" value={m.publishedJobs || 0} href="/dashboard/jobs" />
        <Metric title="Emails queued" value={m.pendingEmails || 0} href="/dashboard/activity" />
        <Link className="metric metric-link" href="/dashboard/candidates/pending">
          <span>Candidate approvals</span>
          <strong>{m.pendingApprovals || 0}</strong>
          <small>Open review queue</small>
        </Link>
      </div>
      <div className="workspace-grid">
        <Panel
          title="Recruitment attention"
          empty="No open workflow items. Create a job, register a client or open matching."
        />
        <div className="ai-assistant">
          <Sparkles />
          <span>Matching assistant</span>
          <h2>Shortlist with reasons, decide with experience.</h2>
          <p>
            Candidate recommendations remain explainable and require human
            approval.
          </p>
          <Link href="/dashboard/matching">Open matching workspace</Link>
        </div>
      </div>
    </>
  );
}
function CandidateApply({ jobId }: { jobId: number }) {
  const [message, setMessage] = useState("");
  async function apply() {
    setMessage("Applyingâ€¦");
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/candidate/jobs/${jobId}/apply`,
      { method: "POST", credentials: "include" },
    );
    const body = await response.json();
    setMessage(response.ok ? "Applied" : body.message);
  }
  return (
    <button
      type="button"
      className="table-action"
      onClick={apply}
      disabled={message === "Applied"}
    >
      {message || "Apply"}
    </button>
  );
}
function DocumentUpload({
  documentType,
  onDocumentTypeChange,
}: {
  documentType: string;
  onDocumentTypeChange: (value: string) => void;
}) {
  const [message, setMessage] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("Uploading privately…");
    const form = new FormData(e.currentTarget);
    const file = form.get("document");
    if (file instanceof File && file.size > 2 * 1024 * 1024) {
      setMessage("Choose a file no larger than 2 MB.");
      return;
    }
    const r = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/candidate/documents`,
      { method: "POST", credentials: "include", body: form },
    );
    const body = await r.json();
    setMessage(body.message);
    if (r.ok) window.location.reload();
  }
  return (
    <form className="document-upload" onSubmit={submit}>
      <select
        name="documentType"
        aria-label="Document type"
        value={documentType}
        onChange={(event) => onDocumentTypeChange(event.target.value)}
      >
        <option value="national_id">National ID</option>
        <option value="passport_photo">Passport photo</option>
        <option value="cv">CV</option>
        <option value="certificate">Certificate</option>
        <option value="recommendation">Recommendation letter</option>
        <option value="police_clearance">Police clearance</option>
        <option value="driving_licence">Driving licence</option>
      </select>
      <input
        id="candidate-document-file"
        name="document"
        type="file"
        accept="application/pdf,image/jpeg,image/png"
        required
      />
      <button>Upload for agency review</button>
      {message && <small>{message}</small>}
    </form>
  );
}
function Metric({
  title,
  value,
  href,
}: {
  title: string;
  value: string | number;
  href: string;
}) {
  return (
    <Link className="metric metric-link" href={href}>
      <span>{title}</span>
      <strong>{value}</strong>
      <small>Open workspace</small>
    </Link>
  );
}
function PaymentTable({ rows = [] }: { rows?: any[] }) {
  return (
    <section className="dash-panel payment-panel">
      <div className="panel-heading">
        <div>
          <span>Account ledger</span>
          <h2>Payments & receipts</h2>
        </div>
        <CreditCard />
      </div>
      {rows.length ? (
        <div className="payment-table-wrap">
          <table className="payment-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Purpose</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
                <th>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.reference_code}
                  className={`payment-${row.status}`}
                >
                  <td>
                    <b>{row.reference_code}</b>
                    <small>
                      {new Date(row.created_at).toLocaleDateString()}
                    </small>
                  </td>
                  <td>{row.purpose}</td>
                  <td>
                    <b>
                      {row.currency} {Number(row.amount).toLocaleString()}
                    </b>
                  </td>
                  <td>
                    {row.method_code?.replaceAll("_", " ") ||
                      "Pending selection"}
                  </td>
                  <td>
                    <span className="payment-status">{row.status}</span>
                  </td>
                  <td>
                    {row.receipt_number ? (
                      <Link href={`/dashboard/receipts/${row.receipt_number}`}>
                        View receipt
                      </Link>
                    ) : (
                      <span className="muted-cell">Not issued</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="panel-empty">
          <CreditCard />
          <p>
            No payment records yet. Use a contract or service reference when
            making the first payment.
          </p>
        </div>
      )}
    </section>
  );
}
function Panel({
  title,
  empty,
  rows = [],
}: {
  title: string;
  empty: string;
  rows?: any[];
}) {
  return (
    <section className="dash-panel">
      <div className="panel-heading">
        <h2>{title}</h2>
      </div>
      {rows.length ? (
        <div className="simple-rows">
          {rows.map((r, i) => (
            <div key={r.reference_code || r.id || i}>
              <b>{r.role_needed || r.title || r.reference_code}</b>
              <span>{r.status || r.location}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="panel-empty">
          <MessageCircle />
          <p>{empty}</p>
        </div>
      )}
    </section>
  );
}
