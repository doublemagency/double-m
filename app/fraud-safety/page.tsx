import { PublicPage } from "../components/public-page";
export const metadata = { title: "Fraud and recruitment safety" };
export default function FraudSafety() {
  return (
    <PublicPage
      eyebrow="Stay safe"
      title="Confirm before you pay, travel or share documents."
      intro="Use only Double M Agency’s official website, verified contacts and protected account pages."
    >
      <article className="prose shell">
        <h2>Check the opportunity</h2>
        <p>
          A genuine vacancy appears through the agency workflow with a clear
          role and status. A message, screenshot or social-media post alone is
          not proof of placement.
        </p>
        <h2>Protect identity documents</h2>
        <p>
          Upload IDs, CVs and certificates only through your private account or
          provide them directly to authorised agency staff. Employers never
          receive raw identity documents from the platform.
        </p>
        <h2>Confirm payments</h2>
        <p>
          Pay only through methods activated by the administrator. A verified
          payment creates a reference and, when confirmed, an official receipt
          in your account.
        </p>
        <h2>Report suspicious contact</h2>
        <p>
          Do not continue when someone promises a guaranteed job, asks for an
          unofficial transfer or pressures you to act secretly. Contact Double M
          Agency using the details on this website.
        </p>
      </article>
    </PublicPage>
  );
}
