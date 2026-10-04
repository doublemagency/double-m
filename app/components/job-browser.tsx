"use client";
import { useEffect, useState } from "react";
import {
  Bookmark,
  BriefcaseBusiness,
  MapPin,
  Search,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { ShareButton } from "./share-button";
type Job = {
  id: number;
  reference_code: string;
  title: string;
  location: string;
  employment_type: string;
  description: string;
  salary_min?: number;
  salary_max?: number;
  work_arrangement?: string;
};
export function JobBrowser() {
  const [jobs, setJobs] = useState<Job[] | null>(null),
    [query, setQuery] = useState(""),
    [message, setMessage] = useState("");
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/jobs`)
      .then((r) => r.json())
      .then((x) => setJobs(x.jobs))
      .catch(() => setJobs([]));
  }, []);
  async function act(jobId: number, action: "save" | "apply") {
    setMessage(
      action === "save" ? "Saving your interest…" : "Sending your application…",
    );
    const r = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/candidate/jobs/${jobId}/${action}`,
        { method: "POST", credentials: "include" },
      ),
      b = await r.json();
    setMessage(
      r.status === 401 ? "Sign in as a candidate to continue." : b.message,
    );
  }
  if (!jobs)
    return (
      <div className="empty-jobs">
        <span className="loader" />
        <p>Loading verified opportunities…</p>
      </div>
    );
  const shown = jobs.filter((j) =>
    `${j.title} ${j.location}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <div className="job-search">
        <Search />
        <input
          aria-label="Search jobs"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by role or location"
        />
        <button type="button">Search jobs</button>
      </div>
      {message && (
        <div className="job-message" role="status">
          {message}{" "}
          {message.includes("Sign in") && <Link href="/login">Sign in</Link>}
        </div>
      )}
      {shown.length ? (
        <section className="job-grid">
          {shown.map((j) => (
            <article key={j.id} className="job-card">
              <h2>
                <Link className="card-link" href={`/jobs/${j.id}`}>
                  {j.title}
                </Link>
              </h2>
              <div>
                <small>
                  <MapPin /> {j.location}
                </small>
                <small>
                  <BriefcaseBusiness /> {j.employment_type}
                </small>
                {(j.salary_min || j.salary_max) && (
                  <small>
                    <WalletCards /> KES{" "}
                    {Number(j.salary_min || 0).toLocaleString()}–
                    {Number(j.salary_max || 0).toLocaleString()}
                  </small>
                )}
              </div>
              <p>{j.description}</p>
              <div>
                <Link className="table-action" href={`/jobs/${j.id}`}>
                  View details →
                </Link>
                <ShareButton
                  title={j.title}
                  url={`/jobs/${j.id}`}
                  label="Share job"
                  text={`${j.title} opportunity in ${j.location} through Double M Agency.`}
                />
                <button onClick={() => act(j.id, "save")}>
                  <Bookmark /> I’m interested
                </button>
                <button onClick={() => act(j.id, "apply")}>
                  Apply with my profile
                </button>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <div className="empty-jobs">
          <Search />
          <h2>No verified vacancies match right now</h2>
          <p>
            We never invent listings. Create a profile and choose your
            preferences to receive suitable job alerts.
          </p>
          <Link href="/register" className="button dark">
            Create my candidate profile
          </Link>
        </div>
      )}
    </>
  );
}
