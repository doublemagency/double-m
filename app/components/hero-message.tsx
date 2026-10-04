"use client";
import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";

const roles = ["nanny", "househelp", "caregiver", "house manager"];

export function HeroMessage() {
  const [roleIndex, setRoleIndex] = useState(0);
  const [phone, setPhone] = useState("");
  useEffect(() => {
    const timer = window.setInterval(
      () => setRoleIndex((current) => (current + 1) % roles.length),
      2800,
    );
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings/public`)
      .then((response) => response.json())
      .then((body) => setPhone(body.settings?.contact_phone || ""))
      .catch(() => {});
    return () => window.clearInterval(timer);
  }, []);
  const digits = phone.replace(/\D/g, "");
  const whatsapp = digits.startsWith("0") ? `254${digits.slice(1)}` : digits;
  return (
    <>
      <h1>
        Hire a vetted
        <br />
        <em className="rotating-role" key={roles[roleIndex]}>
          {roles[roleIndex]} in Nairobi.
        </em>
      </h1>
      <p>
        Tell us who you need. We verify every candidate, send you a shortlist
        and handle the contract. Replacement support included.
      </p>
      <div className="hero-actions">
        <Link className="button" href="/hire">
          Request staff <ArrowRight size={18} />
        </Link>
        {whatsapp && (
          <a
            className="button secondary"
            href={`https://wa.me/${whatsapp}`}
            target="_blank"
            rel="noreferrer"
          >
            <MessageCircle size={18} /> WhatsApp us
          </a>
        )}
      </div>
      <Link className="hero-seeker-link" href="/jobs">
        Looking for work? Browse jobs <ArrowRight size={14} />
      </Link>
    </>
  );
}
