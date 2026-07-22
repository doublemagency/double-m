import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Check,
  ChevronRight,
  HeartHandshake,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { SiteHeader } from "./components/site-header";
import { SiteFooter } from "./components/site-footer";
import { AutoScrollRail } from "./components/auto-scroll-rail";
import { HomeArticleRail } from "./components/home-article-rail";
import { articles } from "./lib/articles";
import type { Metadata } from "next";
import { HeroMessage } from "./components/hero-message";

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

const steps = [
  [
    "01",
    "Tell us what you need",
    "Share the role, location, responsibilities and start date.",
  ],
  [
    "02",
    "We screen carefully",
    "Our team reviews profiles, documents, references and suitability.",
  ],
  [
    "03",
    "Meet strong matches",
    "Review a focused shortlist and interview the right people.",
  ],
  [
    "04",
    "Place with confidence",
    "We support onboarding, follow-up and eligible replacements.",
  ],
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
          <div className="hero-actions">
            <Link className="button" href="/hire">
              I want to hire <ArrowRight size={18} />
            </Link>
            <Link className="button secondary" href="/jobs">
              <Search size={18} /> Find a job
            </Link>
          </div>
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
          <h2>A trusted househelp and nanny placement agency in Nairobi.</h2>
        </div>
        <p>
          From our Kahawa West office, we help families and employers find
          carefully screened people for full-time, part-time, live-in and
          live-out roles—without making the process complicated.
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
                <Link href="/hire">
                  Explore service <ChevronRight size={16} />
                </Link>
              </div>
            </article>
          ))}
        </AutoScrollRail>
      </section>

      <section className="home-trust shell reveal-section">
        <div>
          <span className="kicker">Why families choose Double M</span>
          <h2>Carefully vetted. Clearly matched. Supported after placement.</h2>
          <p>
            We review identity, experience, references, availability and the
            practical needs of each role. Employers receive a focused shortlist
            and can request eligible replacement support under the agreed terms.
          </p>
        </div>
        <ul>
          <li>
            <Check /> Househelps for cleaning, cooking and daily home routines
          </li>
          <li>
            <Check /> Nannies and dayburgs for childcare, school runs and family
            support
          </li>
          <li>
            <Check /> Caregivers who support elderly people with dignity
          </li>
          <li>
            <Check /> Experienced house managers for organised homes
          </li>
          <li>
            <Check /> Shamba boys, shop attendants and reliable business staff
          </li>
        </ul>
      </section>

      <section className="story reveal-section" id="about">
        <div className="shell story-heading">
          <div>
            <div className="kicker light">Care in action</div>
            <h2>
              More than a placement.
              <br />A better everyday.
            </h2>
          </div>
          <p>
            We look beyond a CV. The right match brings dignity, trust and calm
            into the moments people depend on most.
          </p>
        </div>
        <div
          className="story-strip"
          role="img"
          aria-label="A caregiver supporting an older man, a home professional washing dishes, and a nanny reading with a child while a parent looks on"
        >
          <Image src="/images/care-story.webp" fill sizes="100vw" alt="" />
          <div className="story-label label-one">
            <span>01</span>
            <strong>Compassionate care</strong>
            <small>Support that protects dignity</small>
          </div>
          <div className="story-label label-two">
            <span>02</span>
            <strong>Dependable homes</strong>
            <small>Skill in every detail</small>
          </div>
          <div className="story-label label-three">
            <span>03</span>
            <strong>Confident families</strong>
            <small>Care chosen thoughtfully</small>
          </div>
        </div>
        <div className="story-mobile" aria-label="Care in action">
          <div className="story-mobile-track">
            <article className="story-mobile-slide story-mobile-one">
              <div>
                <span>01</span>
                <strong>Compassionate care</strong>
                <small>Support that protects dignity</small>
              </div>
            </article>
            <article className="story-mobile-slide story-mobile-two">
              <div>
                <span>02</span>
                <strong>Dependable homes</strong>
                <small>Skill in every detail</small>
              </div>
            </article>
            <article className="story-mobile-slide story-mobile-three">
              <div>
                <span>03</span>
                <strong>Confident families</strong>
                <small>Care chosen thoughtfully</small>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="process shell reveal-section">
        <div className="process-copy">
          <div className="kicker">For employers</div>
          <h2>A clear path from request to placement.</h2>
          <p>
            No crowded lists. No guesswork. Our team and matching technology
            identify suitable candidates, then experienced staff make every
            final recommendation.
          </p>
          <Link className="arrow-link" href="/hire">
            Start a staffing request <ArrowRight size={18} />
          </Link>
        </div>
        <div className="steps">
          {steps.map(([n, t, d]) => (
            <div className="step" key={n}>
              <span>{n}</span>
              <div>
                <h3>{t}</h3>
                <p>{d}</p>
              </div>
              <Check />
            </div>
          ))}
        </div>
      </section>

      <section className="ai-section">
        <div className="shell ai-grid">
          <div className="ai-visual">
            <div className="match-card">
              <span className="avatar">AM</span>
              <p>
                <strong>Strong match</strong>
                <small>Candidate details remain private</small>
              </p>
              <b>92%</b>
            </div>
            <div className="match-reasons">
              <span>
                <Check /> Relevant experience
              </span>
              <span>
                <Check /> Location aligned
              </span>
              <span>
                <Check /> Available in time
              </span>
            </div>
          </div>
          <div className="ai-copy">
            <div className="kicker light">
              <Sparkles size={14} /> Assisted matching
            </div>
            <h2>Technology narrows the search. People make the decision.</h2>
            <p>
              Our matching engine compares skills, experience, location,
              availability and work preferences. It explains every
              recommendation so agency staff can review it fairly—never as an
              automatic hiring decision.
            </p>
          </div>
        </div>
      </section>

      <section className="jobs shell">
        <div className="section-top">
          <div>
            <div className="kicker">Current opportunities</div>
            <h2>Find work that fits.</h2>
          </div>
          <Link className="arrow-link" href="/jobs">
            View all jobs <ArrowRight size={18} />
          </Link>
        </div>
        <div className="empty-jobs">
          <Search />
          <h3>No published vacancies right now</h3>
          <p>
            Create your profile and choose the work you want. We’ll notify you
            when a suitable verified opportunity is published.
          </p>
          <Link className="button dark" href="/register">
            Create candidate profile
          </Link>
        </div>
      </section>

      <section className="home-guides shell reveal-section">
        <div className="section-top">
          <div>
            <div className="kicker">Helpful answers</div>
            <h2>Guidance for homes and job seekers.</h2>
          </div>
          <Link className="arrow-link" href="/blog">
            View all guides <ArrowRight size={18} />
          </Link>
        </div>
        <HomeArticleRail
          initial={articles.map((article) => ({
            slug: article.slug,
            title: article.title,
            excerpt: article.excerpt,
            cover_image: article.cover,
          }))}
        />
      </section>
      <section className="cta">
        <div className="shell cta-inner">
          <div>
            <span>Ready when you are.</span>
            <h2>Let’s make the right connection.</h2>
          </div>
          <div>
            <Link className="button white" href="/hire">
              Request staff <ArrowRight size={18} />
            </Link>
            <Link className="button ghost" href="/register">
              Register for work
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
