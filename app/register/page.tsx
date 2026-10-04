import { PublicForm } from "../components/public-form";
import { SimpleHeader } from "../components/simple-header";
import { GoogleSignIn } from "../components/google-sign-in";
export const metadata = { title: "Register for work" };
export default function Register() {
  return (
    <>
      <SimpleHeader />
      <main className="form-page">
        <section className="form-intro">
          <span>Candidate registration</span>
          <h1>Create your profile.</h1>
          <p>Start with the basics. Add documents after verifying your email.</p>
        </section>
        <section className="form-panel">
          <h2>Create your account</h2>
          <p>
            Already registered? <a href="/login">Sign in</a>
          </p>
          <PublicForm kind="candidate" />
          <GoogleSignIn role="candidate" />
        </section>
      </main>
    </>
  );
}
