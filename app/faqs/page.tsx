import { PublicPage } from "../components/public-page";
const faqs = [
  [
    "How do I request a worker?",
    "Submit the short staffing request. An agency team member will contact you to clarify duties, location, schedule, experience and timing before candidates are shortlisted.",
  ],
  [
    "Does registration guarantee a job?",
    "No. Registration makes your profile available for suitable opportunities. Every vacancy has requirements and employers make final hiring decisions with agency guidance.",
  ],
  [
    "How are candidates assessed?",
    "Assessment may include profile and CV review, interviews, experience checks, references and role-relevant document verification. The checks used depend on the position.",
  ],
  [
    "Can I request a replacement?",
    "Returning employers can submit a replacement request from their workspace. Eligibility depends on the agreed placement terms and the circumstances recorded by the agency.",
  ],
  [
    "Will employers see identity documents?",
    "Sensitive documents are not openly shared. Employers receive only relevant, agency-approved information and candidate information is shared according to consent and recruitment need.",
  ],
  [
    "How will Double M contact me?",
    "Only through official contact details published on this website or messages tied to your secure account. Be cautious of anyone promising a job or requesting payment through unofficial channels.",
  ],
];
export const metadata = { title: "Frequently asked questions" };
export default function FAQs() {
  return (
    <PublicPage
      eyebrow="FAQs"
      title="Common questions."
      intro="Not answered here? Talk to our team."
    >
      <section className="faq-list shell">
        {faqs.map(([q, a]) => (
          <details key={q}>
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </section>
    </PublicPage>
  );
}
