"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  BookOpen,
  BriefcaseBusiness,
  CalendarClock,
  ChevronRight,
  CircleUserRound,
  ClipboardList,
  CreditCard,
  FileCheck2,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  MessageCircle,
  RefreshCcw,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  UsersRound,
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
  async function logout() {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    router.replace("/login");
  }
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
  return (
    <main className="dashboard">
      <aside className="dash-sidebar">
        <Link href="/dashboard" className="dash-brand">
          DOUBLE M <small>AGENCY</small>
        </Link>
        <nav>
          <Link href="/dashboard" className="active">
            <LayoutDashboard />
            Overview
          </Link>
          {user.role === "employer" && (
            <>
              <Link href="/dashboard/requests">
                <ClipboardList />
                Requests
              </Link>
              <Link href="/dashboard/client">
                <UsersRound />
                Placements
              </Link>
              <Link href="/dashboard/client">
                <CreditCard />
                Payments
              </Link>
              <Link href="/dashboard/my-contracts">
                <FileCheck2 />
                My contracts
              </Link>
              <Link href="/dashboard/client">
                <RefreshCcw />
                Placement support
              </Link>
              <Link href="/dashboard/client">
                <Star />
                Reviews
              </Link>
              <Link href="/dashboard/knowledge">
                <BookOpen />
                Knowledge base
              </Link>
            </>
          )}
          {user.role === "candidate" && (
            <>
              <Link href="/dashboard/preferences">
                <CircleUserRound />
                My profile
              </Link>
              <Link href="/jobs">
                <Search />
                Recommended jobs
              </Link>
              <Link href="/dashboard/applications">
                <BriefcaseBusiness />
                My applications
              </Link>
              <Link href="/dashboard/knowledge">
                <BookOpen />
                Knowledge base
              </Link>
              <Link href="/dashboard">
                <FileCheck2 />
                Documents
              </Link>
              <Link href="/dashboard/my-contracts">
                <ClipboardList />
                My contracts
              </Link>
            </>
          )}
          {["administrator", "agency_staff"].includes(user.role) && (
            <>
              <Link href="/dashboard/matching">
                <UsersRound />
                Candidates
              </Link>
              <Link href="/dashboard/jobs">
                <BriefcaseBusiness />
                Job requests
              </Link>
              <Link href="/dashboard/jobs">
                <BriefcaseBusiness />
                Jobs
              </Link>
              <Link href="/dashboard/matching">
                <Sparkles />
                Matching
              </Link>
              <Link href="/dashboard/contracts">
                <CalendarClock />
                Interviews
              </Link>
              <Link href="/dashboard/assisted-registration">
                <CircleUserRound />
                Register client
              </Link>
              <Link href="/dashboard/articles">
                <FileCheck2 />
                Articles
              </Link>
              <Link href="/dashboard/contracts">
                <ClipboardList />
                Contracts
              </Link>
              <Link href="/dashboard/finance">
                <CreditCard />
                Payments
              </Link>
              <Link href="/dashboard/knowledge">
                <BookOpen />
                Knowledge base
              </Link>
            </>
          )}
          {user.role === "administrator" && (
            <Link href="/dashboard/admin">
              <Settings />
              System settings
            </Link>
          )}
        </nav>
        <details className="dash-quicklinks">
          <summary>Quick links</summary>
          <div>
            <Link href="/dashboard">Overview</Link>
            {user.role === "candidate" && (
              <Link href="/dashboard/applications">My applications</Link>
            )}
            {user.role === "employer" && (
              <Link href="/dashboard/client">Requests and placements</Link>
            )}
            {(["candidate", "employer"] as string[]).includes(user.role) && (
              <Link href="/dashboard/my-contracts">My contracts</Link>
            )}
            {(["administrator", "agency_staff"] as string[]).includes(
              user.role,
            ) && (
              <>
                <Link href="/dashboard/assisted-registration">
                  Register client
                </Link>
                <Link href="/dashboard/matching">Matching</Link>
                <Link href="/dashboard/jobs">Jobs</Link>
                <Link href="/dashboard/articles">Articles</Link>
                <Link href="/dashboard/contracts">Contracts</Link>
                <Link href="/dashboard/finance">Payments</Link>
                <Link href="/dashboard/activity">Staff activity</Link>
                {user.role === "administrator" && (
                  <Link href="/dashboard/admin">Administration</Link>
                )}
              </>
            )}
            <Link href="/dashboard/knowledge">Knowledge base</Link>
          </div>
        </details>
        <button onClick={logout}>
          <LogOut />
          Sign out
        </button>
      </aside>
      <section className="dash-main">
        <header className="dash-top">
          <div>
            <span>{labels[user.role]}</span>
            <h1>
              {user.role === "administrator"
                ? "Agency control centre"
                : user.role === "agency_staff"
                  ? "Placement workspace"
                  : user.role === "employer"
                    ? "Employer workspace"
                    : "Job seeker workspace"}
            </h1>
          </div>
          <div>
            <button aria-label="Notifications">
              <Bell />
            </button>
            <Link
              href="/dashboard/security"
              className="user-chip"
              aria-label="Account and security"
            >
              {user.email.slice(0, 2).toUpperCase()}
            </Link>
          </div>
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
        {user.role === "employer" ? (
          <EmployerView data={data} />
        ) : user.role === "candidate" ? (
          <CandidateView data={data} />
        ) : (
          <StaffView data={data} />
        )}
      </section>
    </main>
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
        <Metric title="Ongoing requests" value={data.requests?.length || 0} />
        <Metric
          title="Active placements"
          value={
            data.placements?.filter((x: any) => x.status === "active").length ||
            0
          }
        />
        <Metric title="Payment records" value={data.payments?.length || 0} />
        <Metric title="Support cases" value={data.replacements?.length || 0} />
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
      <div className="metric-grid">
        <Metric
          title="Availability"
          value={data.profile?.availability_status || "Not set"}
        />
        <Metric
          title="Profession"
          value={data.profile?.profession || "Not set"}
        />
        <Metric title="Applications" value={data.applications?.length || 0} />
        <Metric
          title="Interviews"
          value={
            data.applications?.filter(
              (item: any) => item.status === "interview",
            ).length || 0
          }
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
            return (
              <div key={code}>
                <FileCheck2 />
                <span>{code.replaceAll("_", " ")}</span>
                <b className={`status-${status}`}>
                  {status.replaceAll("_", " ")}
                </b>
              </div>
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
        <DocumentUpload />
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
      <Panel
        title="Recommended verified jobs"
        empty="There are no published opportunities matching your profile yet."
        rows={data.recommendedJobs}
      />
      <PaymentTable rows={data.payments} />
    </>
  );
}
function StaffView({ data }: { data: any }) {
  const m = data.metrics || {};
  return (
    <>
      <div className="metric-grid">
        <Metric title="Candidates" value={m.candidates || 0} />
        <Metric title="Open requests" value={m.openRequests || 0} />
        <Metric title="Published jobs" value={m.publishedJobs || 0} />
        <Metric title="Emails queued" value={m.pendingEmails || 0} />
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
function DocumentUpload() {
  const [message, setMessage] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("Uploading privately…");
    const form = new FormData(e.currentTarget);
    const r = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/candidate/documents`,
      { method: "POST", credentials: "include", body: form },
    );
    setMessage((await r.json()).message);
  }
  return (
    <form className="document-upload" onSubmit={submit}>
      <select name="documentType" aria-label="Document type">
        <option value="national_id">National ID</option>
        <option value="passport_photo">Passport photo</option>
        <option value="cv">CV</option>
        <option value="certificate">Certificate</option>
        <option value="recommendation">Recommendation letter</option>
        <option value="police_clearance">Police clearance</option>
        <option value="driving_licence">Driving licence</option>
      </select>
      <input
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
function Metric({ title, value }: { title: string; value: string | number }) {
  return (
    <article className="metric">
      <span>{title}</span>
      <strong>{value}</strong>
      <small>Live system data</small>
    </article>
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
