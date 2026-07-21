import { PublicPage } from "../components/public-page";
export const metadata = { title: "Privacy and data protection" };
export default function Privacy() {
  return (
    <PublicPage
      eyebrow="Privacy"
      title="Your information is handled for a clear purpose."
      intro="Double M Agency uses recruitment and service data to verify people, make suitable introductions, manage placements and meet lawful obligations."
    >
      <article className="prose shell">
        <h2>How information is handled</h2>
        <p>
          We collect only information relevant to registration, verification,
          recruitment, contracting, payment records and ongoing support.
          Identity documents remain restricted to authorised agency staff and
          are not exposed to employers through the platform.
        </p>
        <h2>Your choices and rights</h2>
        <p>
          You may ask the agency to explain the information held about you,
          correct inaccurate details or consider a lawful deletion or
          restriction request. Some contract, payment and audit records must be
          retained where the law or legitimate accountability requires it.
        </p>
        <h2>Security and sharing</h2>
        <p>
          Access is role-based, sensitive downloads are restricted, document
          previews are audited, passwords are hashed and suspended accounts lose
          API access. Information is shared only for the recruitment or service
          purpose communicated to you.
        </p>
        <h2>Contact</h2>
        <p>
          Use the official contact page for privacy questions or requests.
          Identity may be confirmed before private information is released or
          changed.
        </p>
      </article>
    </PublicPage>
  );
}
