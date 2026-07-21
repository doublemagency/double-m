"use client";
import { useEffect, useState } from "react";
type Settings = {
  contact_phone?: string;
  contact_email?: string;
  office_address?: string;
  business_hours?: string;
};
export function ContactDetails() {
  const [settings, setSettings] = useState<Settings>({
    contact_email: "hello@doublemagency.co.ke",
    business_hours: "Monday to Friday, 8:00 AM to 5:00 PM",
  });
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings/public`, {
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : { settings: {} }))
      .then((x) => setSettings((current) => ({ ...current, ...x.settings })))
      .catch(() => {});
    return () => controller.abort();
  }, []);
  const phone = settings.contact_phone?.trim();
  return (
    <section className="contact-grid shell">
      <article>
        <span>Email</span>
        <h2>
          <a href={`mailto:${settings.contact_email}`}>
            {settings.contact_email}
          </a>
        </h2>
        <p>For recruitment enquiries and account support.</p>
      </article>
      <article>
        <span>Phone & WhatsApp</span>
        <h2>
          {phone ? (
            <a href={`tel:${phone}`}>{phone}</a>
          ) : (
            "Awaiting agency confirmation"
          )}
        </h2>
        <p>
          {phone ? (
            <a href={`https://wa.me/${phone.replace(/\D/g, "")}`}>
              Start a WhatsApp conversation
            </a>
          ) : (
            "The verified number will appear once saved by the administrator."
          )}
        </p>
      </article>
      <article>
        <span>Office</span>
        <h2>{settings.office_address || "Kenya"}</h2>
        <p>Visits are confirmed with the agency before arrival.</p>
      </article>
      <article>
        <span>Hours</span>
        <h2>{settings.business_hours || "Contact the agency"}</h2>
        <p>
          Messages received outside these hours are handled on the next working
          day.
        </p>
      </article>
    </section>
  );
}
