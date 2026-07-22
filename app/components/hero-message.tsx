"use client";
import { useEffect, useState } from "react";

const roles = ["caregivers", "shamba boys", "shop attendants"];

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
        Trusted, vetted househelps, nannies and
        <br />
        <em className="rotating-role" key={roles[roleIndex]}>
          {roles[roleIndex]} in Kenya.
        </em>
      </h1>
      <p>
        Double M places qualified, reliable and vetted staff that suits your
        family, business and childcare needs.{" "}
        {whatsapp ? (
          <a
            href={`https://wa.me/${whatsapp}`}
            target="_blank"
            rel="noreferrer"
          >
            Talk to us on WhatsApp.
          </a>
        ) : (
          <a href="/contact">Talk to our team.</a>
        )}
      </p>
    </>
  );
}
