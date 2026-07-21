import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";
export function PublicPage({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="page-hero">
          <div className="shell">
            <span>{eyebrow}</span>
            <h1>{title}</h1>
            <p>{intro}</p>
          </div>
        </section>
        {children}
        <section className="page-cta">
          <div className="shell">
            <div>
              <span>Your next step</span>
              <h2>Let’s make the right connection.</h2>
            </div>
            <div>
              <Link className="button white" href="/hire">
                Request staff <ArrowRight />
              </Link>
              <Link className="button ghost" href="/register">
                Register for work
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
