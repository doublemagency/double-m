import { PublicPage } from "../components/public-page";
import { PublicReviewRail } from "../components/public-review-rail";
import Link from "next/link";
export const metadata = { title: "Client and candidate experiences" };
export default function Testimonials() {
  return (
    <PublicPage
      eyebrow="Experiences"
      title="What clients say."
      intro="Approved reviews from employers and placed workers."
    >
      <section className="honest-empty shell">
        <PublicReviewRail />
        <h2>Feedback is verified before publication.</h2>
        <p>
          We do not invent endorsements. Returning clients and placed candidates
          submit feedback from their secure workspace, and the agency confirms
          consent and the related placement before publishing any review.
        </p>
        <Link className="button dark" href="/reviews">
          Leave a review
        </Link>
      </section>
    </PublicPage>
  );
}
