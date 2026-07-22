"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { Eye, Pencil, Plus, Trash2, X } from "lucide-react";

const api = process.env.NEXT_PUBLIC_API_URL;

export default function ArticleWorkspace() {
  const [articles, setArticles] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [admin, setAdmin] = useState(false);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);

  async function load() {
    const [list, session] = await Promise.all([
      fetch(`${api}/staff/articles`, { credentials: "include" }),
      fetch(`${api}/auth/session`, { credentials: "include" }),
    ]);
    if (list.ok) setArticles((await list.json()).articles);
    if (session.ok)
      setAdmin((await session.json()).user.role === "administrator");
  }
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const response = await fetch(`${api}/staff/articles`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.get("title"),
        excerpt: form.get("excerpt"),
        content: form.get("content"),
        submit: form.get("action") === "submit",
      }),
    });
    const result = await response.json();
    const cover = form.get("image");
    if (response.ok && cover instanceof File && cover.size) {
      const image = new FormData();
      image.set("image", cover);
      const upload = await fetch(`${api}/staff/articles/${result.id}/cover`, {
        method: "POST",
        credentials: "include",
        body: image,
      });
      if (!upload.ok)
        setMessage(`${result.message} Cover image was not accepted.`);
    }
    setMessage(result.message);
    setBusy(false);
    if (response.ok) {
      setCreating(false);
      await load();
    }
  }
  async function review(id: number, decision: "published" | "rejected") {
    const response = await fetch(`${api}/admin/articles/${id}/review`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision }),
    });
    setMessage((await response.json()).message);
    await load();
  }
  async function remove(id: number) {
    if (!window.confirm("Delete this article? This cannot be undone.")) return;
    const response = await fetch(`${api}/staff/articles/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    setMessage((await response.json()).message);
    if (response.ok) await load();
  }

  return (
    <main className="admin-controls article-register-page">
      <header className="register-heading">
        <div>
          <span>Editorial workspace</span>
          <h1>Article review and publishing</h1>
          <p>
            Staff prepare useful articles. Administrators review and approve
            what becomes public.
          </p>
        </div>
        <button className="button dark" onClick={() => setCreating(true)}>
          <Plus /> Write article
        </button>
      </header>
      <section className="dash-panel register-section">
        <div className="panel-heading">
          <div>
            <span>Content register</span>
            <h2>Articles</h2>
          </div>
          <b>{articles.length}</b>
        </div>
        <div className="table-scroll">
          <table className="operations-table article-table">
            <thead>
              <tr>
                <th>Article</th>
                <th>Author</th>
                <th>Status</th>
                <th>Updated</th>
                <th>Review</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((article) => (
                <tr key={article.id}>
                  <td>
                    <b>{article.title}</b>
                    <small>{article.excerpt}</small>
                  </td>
                  <td>{article.author_email}</td>
                  <td>
                    <span className={`table-status status-${article.status}`}>
                      {article.status.replaceAll("_", " ")}
                    </span>
                  </td>
                  <td>{new Date(article.updated_at).toLocaleDateString()}</td>
                  <td>
                    {admin && article.status === "pending_approval" ? (
                      <div className="table-button-group">
                        <button onClick={() => review(article.id, "published")}>
                          Approve
                        </button>
                        <button onClick={() => review(article.id, "rejected")}>
                          Return
                        </button>
                      </div>
                    ) : (
                      <span>{article.review_note || "—"}</span>
                    )}
                  </td>
                  <td>
                    <div className="table-button-group">
                      {article.status === "published" && (
                        <Link href={`/blog/${article.slug}`}>
                          <Eye /> View
                        </Link>
                      )}
                      {(admin || article.status !== "published") && (
                        <Link href={`/dashboard/articles/${article.id}`}>
                          <Pencil /> Edit
                        </Link>
                      )}
                      <button
                        aria-label="Delete article"
                        onClick={() => remove(article.id)}
                      >
                        <Trash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!articles.length && (
                <tr>
                  <td colSpan={6}>No articles have been created.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      {creating && (
        <div className="modal-backdrop" onMouseDown={() => setCreating(false)}>
          <section
            className="job-editor-modal article-editor-modal"
            role="dialog"
            aria-modal="true"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <span>New article</span>
                <h2>Write and submit</h2>
              </div>
              <button aria-label="Close" onClick={() => setCreating(false)}>
                <X />
              </button>
            </header>
            <form onSubmit={submit}>
              <label>
                Headline
                <input name="title" minLength={8} maxLength={180} required />
              </label>
              <label>
                Short introduction
                <textarea
                  name="excerpt"
                  minLength={20}
                  maxLength={320}
                  rows={3}
                  required
                />
              </label>
              <label>
                Rich article content
                <textarea name="content" minLength={200} rows={12} required />
                <small>
                  Use safe HTML headings, paragraphs, lists, quotes and tables.
                  Unsafe code is removed.
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
              <div className="modal-actions">
                <button type="button" onClick={() => setCreating(false)}>
                  Cancel
                </button>
                <button name="action" value="draft" disabled={busy}>
                  Save draft
                </button>
                <button
                  className="button dark"
                  name="action"
                  value="submit"
                  disabled={busy}
                >
                  {busy ? "Submitting…" : "Submit for approval"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
      {message && (
        <div className="admin-toast" role="status">
          {message}
        </div>
      )}
    </main>
  );
}
