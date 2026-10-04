import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Check,
  ChevronRight,
  ClipboardList,
  CreditCard,
  FileCheck2,
  RefreshCcw,
  HeartHandshake,
  MessageCircle,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { SiteHeader } from "./components/site-header";
import { SiteFooter } from "./components/site-footer";
import { AutoScrollRail } from "./components/auto-scroll-rail";
import type { Metadata } from "next";
import { HeroMessage } from "./components/hero-message";
import { AvailableCandidateRail } from "./components/available-candidate-rail";
import { PublicReviewRail } from "./components/public-review-rail";

export const metadata: Metadata = {
  title: "Trusted Househelp & Nanny Agency in Nairobi",
  description:
    "Double M Agency in Kahawa West connects Nairobi families with vetted househelps, nannies, dayburg nannies, caregivers and house managers, with professional matching and replacement support.",
  keywords: [
    "househelp agency Nairobi",
    "nanny agency Nairobi",
    "dayburg nanny Nairobi",
    "caregivers Nairobi",
    "house managers Kenya",
    "shamba boys Kenya",
    "domestic workers Kenya",
    "looking for a househelp in Nairobi",
    "looking for a nanny in Kenya",
    "looking for a job in Nairobi",
    "available verified househelps",
  ],
  alternates: { canonical: "/" },
};

const services = [
  {
    icon: HeartHandshake,
    image: "/images/service-nanny.webp",
    title: "Nannies & househelps",
    text: "Playful childcare, dayburg nannies, live-in househelps, house managers, cooks and cleaners.",
  },
  {
    icon: UsersRound,
    image: "/images/service-caregiver.webp",
    title: "Caregivers & home support",
    text: "Compassionate caregivers supporting older people and families with dignity, patience and practical care.",
  },
  {
    icon: BriefcaseBusiness,
    image: "/images/service-shamba.webp",
    title: "Shamba boys & practical staff",
    text: "Dependable shamba boys, drivers, shop attendants, security staff and hands-on support workers.",
  },
];

const lanes = [
  {
    who: "Employers & families",
    action: "Request",
    points: [
      "Post a staffing request online",
      "Review an agency-approved shortlist",
      "Sign the contract and pay securely",
    ],
    href: "/register/employer",
    cta: "Create employer account",
  },
  {
    who: "Double M team",
    action: "Verify & match",
    points: [
      "Check IDs, references and documents",
      "Match candidates to each request",
      "Issue contracts, receipts and follow-up",
    ],
    href: "/about#how-we-work",
    cta: "How we vet",
    center: true,
  },
  {
    who: "Job seekers",
    action: "Register",
    points: [
      "Create a free profile and choose your work",
      "Upload documents for agency approval",
      "Get matched and notified of suitable jobs",
    ],
    href: "/register",
    cta: "Create candidate profile",
  },
];

const platformFeatures = [
  { icon: ShieldCheck, title: "Verified profiles", text: "Documents reviewed by staff before anyone is shown." },
  { icon: ClipboardList, title: "Tracked requests", text: "Every request has a status you can follow." },
  { icon: FileCheck2, title: "Online contracts", text: "Signed agreements stored with their exact terms." },
  { icon: CreditCard, title: "Receipts & payments", text: "M-Pesa or cash, verified and receipted." },
  { icon: RefreshCcw, title: "Replacement support", text: "Eligible replacements inside the service window." },
];

export default function Home() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "EmploymentAgency",
    name: "Double M Agency",
    url: "https://www.doublemagency.co.ke",
    email: "support@doublemagency.co.ke",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Kahawa West",
      addressRegion: "Nairobi",
      addressCountry: "KE",
    },
    areaServed: ["Nairobi", "Kenya"],
    description:
      "Househelp, nanny, caregiver, farm worker and business staff recruitment and placement agency in Kahawa West, Nairobi.",
  };
  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <SiteHeader />

      <section className="hero">
        <Image
          className="hero-image"
          src="/images/recruitment-hero.webp"
          fill
          priority
          sizes="100vw"
          alt="A Double M recruitment consultant speaking with a candidate and employer"
        />
        <div className="hero-wash" />
        <div className="shell hero-inner">
          <div className="eyebrow">
            <span /> Recruitment and placement agency · Nairobi, Kenya
          </div>
          <HeroMessage />
          <div className="trust-line">
            <Link href="/about#how-we-work">
              <ShieldCheck /> Human-reviewed matches
            </Link>
            <Link href="/about#values">
              <BadgeCheck /> Confidential by design
            </Link>
            <Link href="/services#recruitment">
              <MessageCircle /> Continued support
            </Link>
          </div>
        </div>
      </section>

      <section className="intro shell reveal-section" id="services">
        <div>
          <div className="kicker">What we do</div>
          <h2>Vetted househelps, nannies and caregivers for Nairobi homes.</h2>
        </div>
        <p>
          From our Kahawa West office we place carefully screened professionals
          in full-time, part-time, live-in and live-out roles, with replacement
          support after placement.
        </p>
      </section>
      <section className="services-window shell reveal-section">
        <AutoScrollRail className="services" label="Staffing services">
          {services.map(({ icon: Icon, image, title, text }, i) => (
            <article className="service-card" key={title}>
              <div className="service-card-image">
                <Image
                  src={image}
                  fill
                  sizes="(max-width: 620px) 70vw, 33vw"
                  alt=""
                />
              </div>
              <div className="service-card-content">
                <span className="service-no">0{i + 1}</span>
                <Icon />
                <h3>{title}</h3>
                <p>{text}</p>
                <Link href={`/hire?role=${encodeURIComponent(title.split(" &")[0])}`}>
                  Request this service <ChevronRight size={16} />
                </Link>
              </div>
            </article>
          ))}
        </AutoScrollRail>
      </section>

      <section className="platform shell reveal-section" id="how-it-works">
        <div className="platform-head">
          <div className="kicker">How it works</div>
          <h2>One workspace connecting employers, job seekers and our team.</h2>
          <p>
            Double M is a managed placement service, not an open job board.
            Information only moves forward after our staff have checked it.
          </p>
        </div>
        <div className="platform-flow">
          {lanes.map((lane, index) => (
            <div
              className={`platform-lane${lane.center ? " is-agency" : ""}`}
              key={lane.who}
            >
              <span className="platform-step">{index + 1}</span>
              <small>{lane.who}</small>
              <h3>{lane.action}</h3>
              <ul>
                {lane.points.map((point) => (
                  <li key={point}>
                    <Check /> {point}
                  </li>
                ))}
              </ul>
              <Link className="arrow-link" href={lane.href}>
                {lane.cta} <ArrowRight size={16} />
              </Link>
            </div>
          ))}
        </div>
        <ul className="platform-features">
          {platformFeatures.map(({ icon: Icon, title, text }) => (
            <li key={title}>
              <Icon />
              <strong>{title}</strong>
              <small>{text}</small>
            </li>
          ))}
        </ul>
      </section>

      <section className="available-talent shell reveal-section">
        <div className="section-top">
          <div>
            <div className="kicker">Available, verified talent</div>
            <h2>Looking for a househelp, nanny or caregiver?</h2>
            <p>
              Agency-approved profiles of enrolled workers who are ready for a
              suitable placement.
            </p>
          </div>
          <div className="section-actions">
            <Link className="arrow-link" href="/talent">
              See all available workers <ArrowRight size={18} />
            </Link>
          </div>
        </div>
        <AvailableCandidateRail />
      </section>

      <section className="home-reviews shell reveal-section">
        <div className="section-top">
          <div>
            <div className="kicker">Verified experiences</div>
            <h2>What clients and placed workers say.</h2>
          </div>
          <Link className="arrow-link" href="/testimonials">
            Read more experiences <ArrowRight size={18} />
          </Link>
        </div>
        <PublicReviewRail />
      </section>

      <section className="seeker-banner shell">
        <div>
          <b>Looking for work?</b>
          <span>
            Register free, upload your documents once and get matched to
            verified jobs.
          </span>
        </div>
        <div>
          <Link className="button dark" href="/jobs">
            Browse jobs
          </Link>
          <Link className="arrow-link" href="/register">
            Create candidate profile <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <section className="cta">
        <div className="shell cta-inner">
          <div>
            <span>Ready when you are.</span>
            <h2>Tell us who you need. We&apos;ll do the rest.</h2>
          </div>
          <div>
            <Link className="button white" href="/hire">
              Request staff <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
