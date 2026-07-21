import { ContactDetails } from "../components/contact-details";
import { PublicPage } from "../components/public-page";
export const metadata = { title: "Contact Double M Agency" };
export default function Contact() {
  return (
    <PublicPage
      eyebrow="Contact us"
      title="Speak with a real person."
      intro="Ask about a role, a staffing need or an ongoing placement. Official contact details are controlled from the secure administration workspace."
    >
      <ContactDetails />
    </PublicPage>
  );
}
