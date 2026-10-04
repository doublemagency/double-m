import { PublicPage } from "../components/public-page";
const groups = [
  {
    id: "home-care",
    title: "Home & care staffing",
    items: [
      "Caregivers and elderly-care assistants",
      "Nannies and child-care support",
      "House managers, cooks and cleaners",
      "Drivers, gardeners and shamba boys",
    ],
  },
  {
    id: "business",
    title: "Business staffing",
    items: [
      "Office and administrative support",
      "Hospitality and customer service",
      "Drivers, security and operations staff",
      "Skilled and professional recruitment",
    ],
  },
  {
    id: "recruitment",
    title: "Recruitment support",
    items: [
      "Candidate sourcing and CV review",
      "Structured screening and interviews",
      "Reference and document checks",
      "Explainable matching and shortlisting",
      "Placement follow-up and eligible replacement support",
    ],
  },
];
export const metadata = { title: "Recruitment services in Kenya" };
export default function Services() {
  return (
    <PublicPage
      eyebrow="Services"
      title="Support for every role."
      intro="Homes, farms and organisations. Requirements are clarified before screening."
    >
      <section className="service-groups shell">
        {groups.map((g) => (
          <article id={g.id} key={g.id}>
            <span>Double M service</span>
            <h2>{g.title}</h2>
            <ul>
              {g.items.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
            <a href="/hire">Discuss your requirements</a>
          </article>
        ))}
      </section>
    </PublicPage>
  );
}
