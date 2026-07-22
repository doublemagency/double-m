import { PublicPage } from "../components/public-page";
export const metadata = { title: "Client and candidate experiences" };
export default function Testimonials() {
  return (
    <PublicPage
      eyebrow="Experiences"
      title="Trust is earned through the work."
      intro="Only approved, permission-based reviews from employers and placed candidates are published here."
    >
      <section className="honest-empty shell">
        <h2>Feedback is verified before publication.</h2>
        <p>
          We do not invent endorsements. Returning clients and placed candidates
          submit feedback from their secure workspace, and the agency confirms
          consent and the related placement before publishing any review.
        </p>
      </section>
    </PublicPage>
  );
}
