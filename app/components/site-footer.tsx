"use client";
import Link from "next/link";
import {
  Facebook,
  MapPin,
  MessageCircle,
  Music2,
  Phone,
  Youtube,
} from "lucide-react";
import { useEffect, useState } from "react";
type Settings = {
  contact_phone?: string;
  contact_email?: string;
  office_address?: string;
  map_url?: string;
  facebook_url?: string;
  tiktok_url?: string;
  youtube_url?: string;
};
export function SiteFooter() {
  const [settings, setSettings] = useState<Settings>({
    contact_email: "support@doublemagency.co.ke",
    office_address: "Kahawa West, Nairobi",
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
    digits = phone?.replace(/\D/g, "") || "",
    whatsappNumber = digits.startsWith("0") ? `254${digits.slice(1)}` : digits,
    whatsapp = phone ? `https://wa.me/${whatsappNumber}` : "/contact";
  return (
    <>
      <footer>
        <div className="shell footer-grid">
          <div className="footer-brand">
            <b>DOUBLE M AGENCY</b>
            <p>Trusted recruitment for homes, farms and businesses.</p>
            <div
              className="social-links"
              aria-label="Double M Agency social media"
            >
              {settings.facebook_url && (
                <a
                  href={settings.facebook_url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Facebook"
                >
                  <Facebook />
                </a>
              )}
              {settings.tiktok_url && (
                <a
                  href={settings.tiktok_url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="TikTok"
                >
                  <Music2 />
                </a>
              )}
              {settings.youtube_url && (
                <a
                  href={settings.youtube_url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="YouTube"
                >
                  <Youtube />
                </a>
              )}
              {phone && (
                <a
                  href={whatsapp}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="WhatsApp"
                >
                  <MessageCircle />
                </a>
              )}
            </div>
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
              <MapPin size={16} />{" "}
              {settings.map_url ? (
                <a href={settings.map_url} target="_blank" rel="noreferrer">
                  {settings.office_address || "Kahawa West, Nairobi"}
                </a>
              ) : (
                settings.office_address || "Kahawa West, Nairobi"
              )}
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
      <nav className="mobile-action-bar" aria-label="Quick actions">
        {phone && (
          <a href={`tel:${digits.startsWith("0") ? `+254${digits.slice(1)}` : `+${digits}`}`}>
            <Phone /> Call
          </a>
        )}
        {phone && (
          <a href={whatsapp} target="_blank" rel="noreferrer">
            <MessageCircle /> WhatsApp
          </a>
        )}
        <Link className="primary" href="/hire">
          Request staff
        </Link>
      </nav>
    </>
  );
}
