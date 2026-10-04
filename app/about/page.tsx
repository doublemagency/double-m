import { PublicPage } from "../components/public-page";
export const metadata = {
  title: "About us",
  description:
    "Learn how Double M Agency approaches careful, accountable recruitment.",
};
export default function About() {
  return (
    <PublicPage
      eyebrow="About Double M"
      title="Recruitment built on care and accountability."
      intro="We connect employers and job seekers, and support both beyond placement."
    >
      <section className="content-grid shell" id="how-we-work">
        <article>
          <span>Our mission</span>
          <h2>
            To create dependable employment connections that improve everyday
            life.
          </h2>
          <p>
            We help employers recruit with confidence and help job seekers
            access genuine opportunities through clear communication, thoughtful
            screening and continued support.
          </p>
        </article>
        <article>
          <span>Our vision</span>
          <h2>
            To become a trusted Kenyan recruitment partner known for
            professional, humane service.
          </h2>
          <p>
            Our standard is not simply filling a role. It is making a suitable,
            responsible connection and remaining available when either side
            needs guidance.
          </p>
        </article>
      </section>
      <section className="values shell" id="values">
        <h2>The values behind every introduction.</h2>
        <div>
          {[
            "Integrity",
            "Fairness",
            "Professionalism",
            "Respect",
            "Confidentiality",
            "Accountability",
          ].map((x) => (
            <span key={x}>{x}</span>
          ))}
        </div>
      </section>
    </PublicPage>
  );
}
