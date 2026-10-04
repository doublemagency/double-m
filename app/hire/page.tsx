import { AccountAwareHire } from "../components/account-aware-hire";
import { SimpleHeader } from "../components/simple-header";
export const metadata = { title: "Request staff" };
export default function Hire() {
  return (
    <>
      <SimpleHeader />
      <main className="form-page">
        <section className="form-intro">
          <span>Staffing request</span>
          <h1>Request a worker.</h1>
          <p>No account needed. We clarify the role before introducing anyone.</p>
          <ol className="form-steps">
            <li>
              <b>1</b> Send this short request. It takes about two minutes.
            </li>
            <li>
              <b>2</b> A consultant calls you within one working day.
            </li>
            <li>
              <b>3</b> You interview a shortlist of verified candidates.
            </li>
          </ol>
        </section>
        <section className="form-panel">
          <h2>Request a worker</h2>
          <p>Only necessary details are collected at this stage.</p>
          <AccountAwareHire />
        </section>
      </main>
    </>
  );
}
