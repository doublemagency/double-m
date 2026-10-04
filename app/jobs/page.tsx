import { BoardTabs, SimpleHeader } from "../components/simple-header";
import { SiteFooter } from "../components/site-footer";
import Link from "next/link";
import { JobBrowser } from "../components/job-browser";
export const metadata = {
  title: "Verified jobs in Kenya",
  description: "Browse genuine opportunities published by Double M Agency.",
};
export default function Jobs() {
  return (
    <>
      <SimpleHeader />
      <main className="list-page shell">
        <BoardTabs active="jobs" />
        <h1>Jobs</h1>
        <p className="board-lead">
          Tap a card for details. Hiring? <Link href="/talent">See available workers</Link>.
        </p>
        <JobBrowser />
      </main>
      <SiteFooter />
    </>
  );
}
