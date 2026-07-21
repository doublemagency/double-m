"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

export default function ArticleWorkspace() {
  const [articles, setArticles] = useState<any[]>([]),
    [message, setMessage] = useState(""),
    [admin, setAdmin] = useState(false);
  async function load() {
    const [list, session] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/staff/articles`, {
        credentials: "include",
      }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/session`, {
        credentials: "include",
      }),
    ]);
    if (list.ok) setArticles((await list.json()).articles);
    if (session.ok)
      setAdmin((await session.json()).user.role === "administrator");
  }
  useEffect(() => {
    // The first protected fetch hydrates this client-only staff workspace.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("Saving article…");
    const form = new FormData(event.currentTarget);
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/staff/articles`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.get("title"),
          excerpt: form.get("excerpt"),
          content: form.get("content"),
          submit: form.get("action") === "submit",
        }),
      },
    );
    const result = await response.json();
    const cover = form.get("image");
    if (response.ok && cover instanceof File && cover.size) {
      const image = new FormData();
      image.set("image", cover);
      const upload = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/staff/articles/${result.id}/cover`,
        { method: "POST", credentials: "include", body: image },
      );
      if (!upload.ok) {
        setMessage(`${result.message} Cover image was not accepted.`);
        return;
      }
    }
    setMessage(result.message);
    if (response.ok) {
      event.currentTarget.reset();
      load();
    }
  }
  async function review(id: number, decision: "published" | "rejected") {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/admin/articles/${id}/review`,
      {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      },
    );
    setMessage((await response.json()).message);
    load();
  }
  async function remove(id: number) {
    if (!window.confirm("Delete this article? This cannot be undone.")) return;
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/staff/articles/${id}`,
      { method: "DELETE", credentials: "include" },
    );
    setMessage((await response.json()).message);
    if (response.ok) load();
  }
  return (
    <main className="admin-controls">
      <header>
        <Link href="/dashboard">← Dashboard</Link>
        <span>Editorial workspace</span>
        <h1>Useful articles, carefully approved.</h1>
        <p>
          Staff can write or submit an article. Public publishing remains an
          administrator decision.
        </p>
      </header>
      <div className="admin-grid">
        <form onSubmit={submit}>
          <h2>New article</h2>
          <label>
            Headline
            <input name="title" minLength={8} maxLength={180} required />
          </label>
          <label>
            Short introduction
            <textarea name="excerpt" minLength={20} maxLength={320} required />
          </label>
          <label>
            Rich article content
            <textarea name="content" minLength={200} rows={12} required />
            <small>
              Use safe HTML such as h2, h3, p, strong, blockquote, lists and
              tables. Scripts, styles and unsafe links are removed.
            </small>
          </label>
          <label>
            Cover image (JPG, PNG or WebP · maximum 2 MB)
            <input
              name="image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              required
            />
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
        <section className="dash-panel">
          <div className="panel-heading">
            <h2>Article status</h2>
            <span>{articles.length} records</span>
          </div>
          <div className="article-admin-list">
            {articles.map((article) => (
              <article key={article.id}>
                <div>
                  <b>{article.title}</b>
                  <small>
                    {article.author_email} ·{" "}
                    {article.status.replaceAll("_", " ")}
                  </small>
                </div>
                {admin && article.status === "pending_approval" && (
                  <div>
                    <button onClick={() => review(article.id, "published")}>
                      Approve
                    </button>
                    <button onClick={() => review(article.id, "rejected")}>
                      Return
                    </button>
                  </div>
                )}
                {(admin || article.status !== "published") && (
                  <div>
                    {(admin || article.status !== "published") && (
                      <Link href={`/dashboard/articles/${article.id}`}>
                        Edit
                      </Link>
                    )}
                    <button onClick={() => remove(article.id)}>Delete</button>
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      </div>
      {message && <div className="admin-toast">{message}</div>}
    </main>
  );
}
