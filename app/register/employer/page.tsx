import { EmployerAccountForm } from "../../components/employer-account-form";
import { SimpleHeader } from "../../components/simple-header";
import { GoogleSignIn } from "../../components/google-sign-in";
export const metadata = { title: "Employer registration" };
export default function Page() {
  return (
    <>
      <SimpleHeader />
      <main className="form-page">
        <section className="form-intro">
          <span>Employer workspace</span>
          <h1>Create your workspace.</h1>
          <p>Track requests, contracts, payments and replacements in one place.</p>
        </section>
        <section className="form-panel">
          <h2>Create employer account</h2>
          <EmployerAccountForm />
          <GoogleSignIn role="employer" />
        </section>
      </main>
    </>
  );
}
