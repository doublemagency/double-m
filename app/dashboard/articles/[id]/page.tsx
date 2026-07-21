"use client";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
type Article = {
  title: string;
  excerpt: string;
  content: string;
  status: string;
};
export default function EditArticle() {
  const { id } = useParams<{ id: string }>(),
    router = useRouter(),
    [article, setArticle] = useState<Article | null>(null),
    [message, setMessage] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/staff/articles/${id}`, {
      credentials: "include",
      signal: controller.signal,
    })
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).message);
        return r.json();
      })
      .then((x) => setArticle(x.article))
      .catch(
        (reason) => reason.name !== "AbortError" && setMessage(reason.message),
      );
    return () => controller.abort();
  }, [id]);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget),
      action = (event.nativeEvent as SubmitEvent)
        .submitter as HTMLButtonElement | null;
    setMessage("Saving changes…");
    const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/staff/articles/${id}`,
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: form.get("title"),
            excerpt: form.get("excerpt"),
            content: form.get("content"),
            submit: action?.value === "submit",
          }),
        },
      ),
      result = await response.json();
    setMessage(result.message);
    if (response.ok && action?.value === "submit")
      router.push("/dashboard/articles");
  }
  if (!article)
    return (
      <main className="admin-controls">
        <p>{message || "Loading article…"}</p>
      </main>
    );
  return (
    <main className="admin-controls">
      <header>
        <Link href="/dashboard/articles">← Editorial workspace</Link>
        <span>Edit unpublished article</span>
        <h1>{article.title}</h1>
        <p>
          Published articles must be withdrawn by an administrator before their
          public wording changes.
        </p>
      </header>
      <div className="admin-grid">
        <form onSubmit={save}>
          <label>
            Headline
            <input
              name="title"
              defaultValue={article.title}
              minLength={8}
              maxLength={180}
              required
            />
          </label>
          <label>
            Short introduction
            <textarea
              name="excerpt"
              defaultValue={article.excerpt}
              minLength={20}
              maxLength={320}
              required
            />
          </label>
          <label>
            Rich article content
            <textarea
              name="content"
              defaultValue={article.content}
              minLength={200}
              rows={18}
              required
            />
            <small>
              Safe headings, paragraphs, lists, tables and blockquotes are
              supported.
            </small>
          </label>
          <div className="editor-actions">
            <button name="action" value="draft">
              Save draft
            </button>
            <button name="action" value="submit">
              Submit for approval
            </button>
          </div>
        </form>
        <section className="dash-panel contract-preview">
          <h2>Isolated preview</h2>
          <iframe title="Article preview" sandbox="" srcDoc={article.content} />
        </section>
      </div>
      {message && <div className="admin-toast">{message}</div>}
    </main>
  );
}
