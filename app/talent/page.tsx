import type { Metadata } from "next";
import { AvailableCandidateRail } from "../components/available-candidate-rail";
import { ShareButton } from "../components/share-button";
import { BoardTabs, SimpleHeader } from "../components/simple-header";
import { SiteFooter } from "../components/site-footer";

export const metadata: Metadata = {
  title: "Available Househelps, Nannies and Caregivers",
  description:
    "Explore agency-approved profiles of househelps, nannies, caregivers and practical staff available through Double M Agency.",
};

export default function TalentPage() {
  return (
    <>
      <SimpleHeader />
      <main className="talent-page shell">
        <BoardTabs active="talent" />
        <section className="talent-page-heading">
          <h1>Available workers</h1>
          <p>Short public profiles. IDs and sensitive details stay private.</p>
          <ShareButton
            title="Available workers at Double M Agency"
            url="/talent"
            label="Share available workers"
            text="View available househelps, nannies, caregivers and practical staff through Double M Agency."
          />
        </section>
        <AvailableCandidateRail layout="grid" />
      </main>
      <SiteFooter />
    </>
  );
}
