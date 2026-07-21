"use client";
import Link from "next/link";
import { MapPin, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
type Settings = {
  contact_phone?: string;
  contact_email?: string;
  office_address?: string;
};
export function SiteFooter() {
  const [settings, setSettings] = useState<Settings>({
    contact_email: "hello@doublemagency.co.ke",
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
  const phone = settings.contact_phone?.trim(),
    whatsapp = phone ? `https://wa.me/${phone.replace(/\D/g, "")}` : "/contact";
  return (
    <>
      <footer>
        <div className="shell footer-grid">
          <div className="footer-brand">
            <b>DOUBLE M AGENCY</b>
            <p>Trusted recruitment for homes, farms and businesses.</p>
          </div>
          <div>
            <h3>Explore</h3>
            <Link href="/jobs">Find jobs</Link>
            <Link href="/hire">Hire staff</Link>
            <Link href="/services">Services</Link>
            <Link href="/blog">Resources</Link>
          </div>
          <div>
            <h3>Support</h3>
            <Link href="/privacy">Privacy</Link>
            <Link href="/fraud-safety">Fraud safety</Link>
            <Link href="/contact">Contact us</Link>
          </div>
          <div>
            <h3>Visit or speak to us</h3>
            <p>
              <MapPin size={16} /> {settings.office_address || "Kenya"}
            </p>
            <p>{phone || settings.contact_email}</p>
          </div>
        </div>
        <div className="shell footer-bottom">
          <span>
            © {new Date().getFullYear()} Double M Agency. All rights reserved.
          </span>
          <span>Recruitment with care and accountability.</span>
        </div>
      </footer>
      <Link
        className="whatsapp"
        href={whatsapp}
        target={phone ? "_blank" : undefined}
        rel={phone ? "noreferrer" : undefined}
        aria-label="Chat with Double M Agency"
      >
        <MessageCircle />
        <span>Chat with us</span>
      </Link>
    </>
  );
}
