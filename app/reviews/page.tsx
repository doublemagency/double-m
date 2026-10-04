import { PublicPage } from "../components/public-page";
import { PublicReviewForm } from "../components/public-review-form";

export const metadata = {
  title: "Leave a review",
  description:
    "Share genuine feedback about your Double M Agency experience. Every review is checked before publication.",
};

export default function LeaveReview() {
  return (
    <PublicPage
      eyebrow="Reviews"
      title="Leave a review."
      intro="No sign-in needed. Reviews appear after approval."
    >
      <section className="public-review-section shell">
        <div>
          <span className="kicker">Before you submit</span>
          <h2>Short, honest and useful.</h2>
          <p>
            Write 20–100 characters about your real experience. We show only
            your first name after approval.
          </p>
        </div>
        <PublicReviewForm />
      </section>
    </PublicPage>
  );
}
