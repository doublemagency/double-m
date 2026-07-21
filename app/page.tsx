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

const services = [
  {
    icon: HeartHandshake,
    title: "Home & care",
    text: "Caregivers, nannies, house managers, cooks and cleaners.",
  },
  {
    icon: UsersRound,
    title: "Farms & operations",
    text: "Shamba workers, drivers, security and reliable support teams.",
  },
  {
    icon: BriefcaseBusiness,
    title: "Business talent",
    text: "Office support, hospitality staff and skilled professionals.",
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
  return (
    <main>
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
            <span /> Recruitment that puts people first
          </div>
          <h1>
            Right people.
            <br />
            <em>Real opportunity.</em>
          </h1>
          <p>
            We connect homes, farms and businesses with carefully screened
            people—while helping job seekers find genuine work.
          </p>
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
          <h2>Recruitment built around the work that matters.</h2>
        </div>
        <p>
          Whether you need one trusted person at home or a dependable team for
          your organisation, we keep the process clear, careful and human.
        </p>
      </section>
      <section className="services-window shell reveal-section">
        <div className="services">
          {services.map(({ icon: Icon, title, text }, i) => (
            <article className="service-card" key={title}>
              <span className="service-no">0{i + 1}</span>
              <Icon />
              <h3>{title}</h3>
              <p>{text}</p>
              <Link href="/hire">
                Explore service <ChevronRight size={16} />
              </Link>
            </article>
          ))}
        </div>
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

      <section className="home-article shell reveal-section">
        <div>
          <Image
            src="/images/care-story.webp"
            fill
            sizes="(max-width: 700px) 100vw, 48vw"
            alt="A caregiver supporting everyday life at home"
          />
        </div>
        <article>
          <span>From our knowledge centre</span>
          <h2>How to choose the right caregiver</h2>
          <p>
            A practical guide to defining the role, assessing trust and choosing
            support that fits the person, home and daily routine.
          </p>
          <Link className="arrow-link" href="/blog/choose-the-right-caregiver">
            Read more <ArrowRight size={18} />
          </Link>
        </article>
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
