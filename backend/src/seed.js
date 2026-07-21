import argon2 from "argon2";
import { copyFile, mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { db } from "./db.js";
import { config } from "./config.js";
import { seedArticles } from "./seed-articles.js";
const accounts = [
  {
    email: "admin@doublemagency.co.ke",
    role: "administrator",
    name: "Double M Administrator",
  },
  {
    email: "test@doublemagency.co.ke",
    role: "agency_staff",
    name: "Test Agency Staff",
  },
  { email: "seeker@gmail.com", role: "candidate", name: "Test Job Seeker" },
  { email: "employer@gmail.com", role: "employer", name: "Test Employer" },
];
const hash = await argon2.hash("Password", {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
});
const conn = await db().getConnection();
try {
  await conn.beginTransaction();
  for (const a of accounts) {
    await conn.execute(
      "INSERT INTO users(email,password_hash,role,status,email_verified_at,force_password_change) VALUES(?, ?, ?, 'active', UTC_TIMESTAMP(), TRUE) ON DUPLICATE KEY UPDATE password_hash=VALUES(password_hash),role=VALUES(role),status='active',force_password_change=TRUE",
      [a.email, hash, a.role],
    );
    const [rows] = await conn.execute("SELECT id FROM users WHERE email=?", [
      a.email,
    ]);
    const id = rows[0].id;
    if (a.role === "candidate")
      await conn.execute(
        "INSERT INTO candidate_profiles(user_id,full_name,phone,profession,location) VALUES(?,?,'','General worker','Kenya') ON DUPLICATE KEY UPDATE full_name=VALUES(full_name)",
        [id, a.name],
      );
    if (a.role === "employer")
      await conn.execute(
        "INSERT INTO employer_profiles(user_id,full_name) VALUES(?,?) ON DUPLICATE KEY UPDATE full_name=VALUES(full_name)",
        [id, a.name],
      );
  }
  await conn.execute(
    "INSERT INTO site_settings(setting_key,setting_value) VALUES('contact_phone',''),('contact_email','hello@doublemagency.co.ke'),('office_address',''),('business_hours','Monday to Friday, 8:00 AM to 5:00 PM') ON DUPLICATE KEY UPDATE setting_value=setting_value",
  );
  const [[admin]] = await conn.execute(
    "SELECT id FROM users WHERE email='admin@doublemagency.co.ke'",
  );
  const [[templateCount]] = await conn.query(
    "SELECT COUNT(*) total FROM contract_templates",
  );
  if (!Number(templateCount.total))
    await conn.execute(
      "INSERT INTO contract_templates(name,version,terms_html,updated_by) VALUES('Standard employment agreement',1,?,?)",
      [
        "<h2>Employment agreement</h2><p>This agreement is made on <strong>{{contract_date}}</strong> between <strong>{{employer_name}}</strong> and <strong>{{candidate_name}}</strong>.</p><h3>Role and term</h3><p>The employee will serve as <strong>{{role_title}}</strong> from {{start_date}} to {{end_date}}.</p><h3>Working relationship</h3><p>The parties agree to the lawful duties, working hours, pay, rest, leave, safety, confidentiality and termination terms confirmed during placement. Both parties will receive a completed copy after signing.</p>",
        admin.id,
      ],
    );
  const articleImageRoot = path.resolve(config.UPLOAD_DIR, "article-images");
  await mkdir(articleImageRoot, { recursive: true });
  const repoRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../..",
  );
  for (const article of seedArticles) {
    await conn.execute(
      "INSERT INTO content_posts(slug,title,excerpt,content,status,author_user_id,published_at) VALUES(?,?,?,?, 'published',?,UTC_TIMESTAMP()) ON DUPLICATE KEY UPDATE slug=VALUES(slug)",
      [article.slug, article.title, article.excerpt, article.content, admin.id],
    );
    const [[post]] = await conn.execute(
      "SELECT id FROM content_posts WHERE slug=?",
      [article.slug],
    );
    const filename = `seed-${article.slug}.webp`,
      source = path.join(
        repoRoot,
        "public",
        "images",
        article.cover === "care" ? "care-story.webp" : "recruitment-hero.webp",
      );
    await copyFile(source, path.join(articleImageRoot, filename)).catch(
      () => {},
    );
    const imageSize = await stat(path.join(articleImageRoot, filename))
      .then((file) => file.size)
      .catch(() => 0);
    await conn.execute(
      "INSERT INTO content_post_images(post_id,storage_key,mime_type,file_size) VALUES(?,?,'image/webp',?) ON DUPLICATE KEY UPDATE storage_key=VALUES(storage_key),file_size=VALUES(file_size)",
      [post.id, filename, imageSize],
    );
  }
  await conn.commit();
  console.log(
    "Four protected test accounts seeded; password change is required on first sign-in.",
  );
} catch (e) {
  await conn.rollback();
  throw e;
} finally {
  conn.release();
  await db().end();
}
