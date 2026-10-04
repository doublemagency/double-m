"use client";

import {
  BadgeCheck,
  CalendarCheck,
  ChevronRight,
  Home,
  Languages,
  MapPin,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { AutoScrollRail } from "./auto-scroll-rail";

type Candidate = {
  id: number;
  public_name: string;
  profession: string;
  location: string;
  best_role?: string;
  education_level?: string;
  county?: string;
  languages?: string;
  experience_summary?: string;
  skills_summary?: string;
  other_roles?: string;
  available_from?: string;
  age?: number;
  work_arrangement?: string;
  profile_image?: string;
  is_verified: number;
};

const roleOf = (candidate: Candidate) =>
  (candidate.best_role || candidate.profession || "").trim();

const arrangementLabel = (value: string) =>
  value === "either"
    ? "Live-in or live-out"
    : value === "live_in"
      ? "Live-in"
      : value === "live_out"
        ? "Live-out"
        : value.replaceAll("_", " ");

function availabilityLabel(candidate: Candidate) {
  if (!candidate.available_from) return "Available now";
  const date = new Date(candidate.available_from);
  return date.getTime() > Date.now()
    ? `From ${date.toLocaleDateString("en-KE", { day: "numeric", month: "short" })}`
    : "Available now";
}

export function AvailableCandidateRail({
  layout = "rail",
}: {
  layout?: "rail" | "grid";
}) {
  const [items, setItems] = useState<Candidate[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState<Candidate | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/candidates`, {
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : { candidates: [] }))
      .then((body) => setItems(body.candidates || []))
      .catch(() => {})
      .finally(() => setLoaded(true));
    return () => controller.abort();
  }, []);

  if (!loaded)
    return (
      <div className="candidate-skeletons" aria-hidden="true">
        {[0, 1, 2].map((n) => (
          <span key={n} />
        ))}
      </div>
    );
  if (!items.length) return null;

  const roles = [...new Set(items.map(roleOf).filter(Boolean))].slice(0, 6);
  const visible =
    filter === "All" ? items : items.filter((item) => roleOf(item) === filter);

  return (
    <>
      {roles.length > 1 && (
        <div className="candidate-filters" role="group" aria-label="Filter by role">
          {["All", ...roles].map((role) => (
            <button
              type="button"
              key={role}
              className={filter === role ? "active" : undefined}
              aria-pressed={filter === role}
              onClick={() => setFilter(role)}
            >
              {role}
            </button>
          ))}
        </div>
      )}
      {layout === "grid" ? (
        <div className="candidate-grid">
        {visible.map((candidate) => (
          <article className="candidate-public-card" key={candidate.id}>
            <div className="candidate-photo">
              {candidate.profile_image ? (
                // This image is served only for agency-verified public profiles.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`${process.env.NEXT_PUBLIC_API_URL}${candidate.profile_image}`}
                  alt={`${candidate.public_name}, verified ${candidate.profession}`}
                />
              ) : (
                <UserRound aria-hidden="true" />
              )}
              <span
                className={
                  candidate.is_verified ? "is-verified" : "is-enrolled"
                }
              >
                <BadgeCheck /> {candidate.is_verified ? "ID verified" : "Enrolled"}
              </span>
              <em className="availability-chip">
                <CalendarCheck /> {availabilityLabel(candidate)}
              </em>
            </div>
            <div className="candidate-card-copy">
              <small>Available through Double M</small>
              <h3>{candidate.public_name}</h3>
              <b>{candidate.best_role || candidate.profession}</b>
              <p>
                <MapPin /> {candidate.location}
              </p>
              <div className="candidate-card-facts">
                {candidate.age && <span>{candidate.age} yrs</span>}
                {candidate.work_arrangement && (
                  <span>
                    <Home />
                    {arrangementLabel(candidate.work_arrangement)}
                  </span>
                )}
                {candidate.languages && (
                  <span>
                    <Languages />
                    {candidate.languages}
                  </span>
                )}
              </div>
              {candidate.experience_summary && (
                <p className="candidate-card-experience">
                  {candidate.experience_summary}
                </p>
              )}
              <div className="candidate-card-actions">
                <button type="button" onClick={() => setSelected(candidate)}>
                  View summary <ChevronRight />
                </button>
                <a
                  href={`/hire?role=${encodeURIComponent(roleOf(candidate))}`}
                >
                  Request this profile
                </a>
              </div>
            </div>
          </article>
        ))}
        </div>
      ) : (
      <AutoScrollRail
        className="public-card-rail candidate-public-rail"
        label="Verified available workers"
      >
        {visible.map((candidate) => (
          <article className="candidate-public-card" key={candidate.id}>
            <div className="candidate-photo">
              {candidate.profile_image ? (
                // This image is served only for agency-verified public profiles.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`${process.env.NEXT_PUBLIC_API_URL}${candidate.profile_image}`}
                  alt={`${candidate.public_name}, verified ${candidate.profession}`}
                />
              ) : (
                <UserRound aria-hidden="true" />
              )}
              <span
                className={
                  candidate.is_verified ? "is-verified" : "is-enrolled"
                }
              >
                <BadgeCheck /> {candidate.is_verified ? "ID verified" : "Enrolled"}
              </span>
              <em className="availability-chip">
                <CalendarCheck /> {availabilityLabel(candidate)}
              </em>
            </div>
            <div className="candidate-card-copy">
              <small>Available through Double M</small>
              <h3>{candidate.public_name}</h3>
              <b>{candidate.best_role || candidate.profession}</b>
              <p>
                <MapPin /> {candidate.location}
              </p>
              <div className="candidate-card-facts">
                {candidate.age && <span>{candidate.age} yrs</span>}
                {candidate.work_arrangement && (
                  <span>
                    <Home />
                    {arrangementLabel(candidate.work_arrangement)}
                  </span>
                )}
                {candidate.languages && (
                  <span>
                    <Languages />
                    {candidate.languages}
                  </span>
                )}
              </div>
              {candidate.experience_summary && (
                <p className="candidate-card-experience">
                  {candidate.experience_summary}
                </p>
              )}
              <div className="candidate-card-actions">
                <button type="button" onClick={() => setSelected(candidate)}>
                  View summary <ChevronRight />
                </button>
                <a
                  href={`/hire?role=${encodeURIComponent(roleOf(candidate))}`}
                >
                  Request this profile
                </a>
              </div>
            </div>
          </article>
        ))}
      </AutoScrollRail>
      )}
      {selected && (
        <div
          className="profile-summary-modal"
          role="presentation"
          onMouseDown={() => setSelected(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="candidate-summary-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              className="modal-close"
              type="button"
              onClick={() => setSelected(null)}
            >
              Close
            </button>
            <span
              className={`verified-heading ${selected.is_verified ? "is-verified" : "is-enrolled"}`}
            >
              <BadgeCheck />{" "}
              {selected.is_verified ? "Agency verified" : "Agency enrolled"}
            </span>
            <h2 id="candidate-summary-title">{selected.public_name}</h2>
            <p>
              {selected.profession} based in {selected.location}, currently
              available for a suitable placement.
            </p>
            <dl>
              {selected.age && (
                <div>
                  <dt>Age</dt>
                  <dd>{selected.age} years</dd>
                </div>
              )}
              {selected.county && (
                <div>
                  <dt>Home county</dt>
                  <dd>{selected.county}</dd>
                </div>
              )}
              {selected.languages && (
                <div>
                  <dt>Languages</dt>
                  <dd>{selected.languages}</dd>
                </div>
              )}
              <div>
                <dt>Best suited for</dt>
                <dd>{selected.best_role || selected.profession}</dd>
              </div>
              {selected.skills_summary && (
                <div>
                  <dt>Excels in</dt>
                  <dd>{selected.skills_summary}</dd>
                </div>
              )}
              {selected.experience_summary && (
                <div>
                  <dt>Work experience</dt>
                  <dd>{selected.experience_summary}</dd>
                </div>
              )}
              {selected.education_level && (
                <div>
                  <dt>Education</dt>
                  <dd>{selected.education_level}</dd>
                </div>
              )}
              {selected.work_arrangement && (
                <div>
                  <dt>Work arrangement</dt>
                  <dd>{selected.work_arrangement.replaceAll("_", " ")}</dd>
                </div>
              )}
              <div>
                <dt>Availability</dt>
                <dd>
                  {selected.available_from
                    ? new Date(selected.available_from).toLocaleDateString(
                        "en-KE",
                        { day: "numeric", month: "short", year: "numeric" },
                      )
                    : "Available now"}
                </dd>
              </div>
            </dl>
            <a
              className="button dark"
              href={`/hire?role=${encodeURIComponent(roleOf(selected))}`}
            >
              Ask Double M about this profile
            </a>
            <small>
              {selected.is_verified
                ? "Identity verified by authorised agency staff. Private documents and sensitive personal details are never displayed publicly."
                : "This profile is enrolled and available. Verification is still in progress; private documents and sensitive details remain hidden."}
            </small>
          </section>
        </div>
      )}
    </>
  );
}
