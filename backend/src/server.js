import crypto from "node:crypto";
import { createReadStream, mkdirSync } from "node:fs";
import { unlink } from "node:fs/promises";
import path from "node:path";
import express from "express";
import multer from "multer";
import sanitizeHtml from "sanitize-html";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import argon2 from "argon2";
import { OAuth2Client } from "google-auth-library";
import { SignJWT, jwtVerify } from "jose";
import { z } from "zod";
import { config } from "./config.js";
import { db } from "./db.js";
import { queueEmail, templates } from "./email.js";
import { scoreCandidate } from "./matching.js";
const app = express(),
  secret = new TextEncoder().encode(config.JWT_SECRET);
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(helmet());
app.use(
  cors({
    origin: config.FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }),
);
app.use(express.json({ limit: "300kb" }));
app.use(cookieParser());
app.use(
  "/api/",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 120,
    standardHeaders: "draft-7",
    legacyHeaders: false,
  }),
);
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
});
const cookie = {
  httpOnly: true,
  secure: config.NODE_ENV === "production",
  sameSite: config.NODE_ENV === "production" ? "none" : "lax",
  domain: config.COOKIE_DOMAIN || undefined,
  path: "/",
  maxAge: 8 * 60 * 60 * 1000,
};
const uploadRoot = path.resolve(config.UPLOAD_DIR);
mkdirSync(uploadRoot, { recursive: true });
const articleImageRoot = path.join(uploadRoot, "article-images");
mkdirSync(articleImageRoot, { recursive: true });
const articleImageUpload = multer({
  storage: multer.diskStorage({
    destination: articleImageRoot,
    filename: (_req, file, done) =>
      done(
        null,
        `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`,
      ),
  }),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, done) =>
    done(
      null,
      ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype),
    ),
});
const cleanArticleHtml = (value) =>
  sanitizeHtml(value, {
    allowedTags: [
      "h2",
      "h3",
      "p",
      "strong",
      "em",
      "blockquote",
      "ul",
      "ol",
      "li",
      "br",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      "a",
    ],
    allowedAttributes: { a: ["href"] },
    allowedSchemes: ["https", "mailto"],
  });
const privateUpload = multer({
  storage: multer.diskStorage({
    destination: uploadRoot,
    filename: (_req, file, done) =>
      done(
        null,
        `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`,
      ),
  }),
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, done) =>
    done(
      null,
      ["application/pdf", "image/jpeg", "image/png"].includes(file.mimetype),
    ),
});
async function tokenFor(user) {
  return new SignJWT({
    role: user.role,
    email: user.email,
    forcePasswordChange: !!user.force_password_change,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret);
}
async function requireAuth(req, res, next) {
  try {
    const raw = req.cookies.dm_session;
    if (!raw) return res.status(401).json({ message: "Sign in required." });
    const { payload } = await jwtVerify(raw, secret);
    const [[current]] = await db().execute(
      "SELECT id,email,role,status,force_password_change FROM users WHERE id=? LIMIT 1",
      [Number(payload.sub)],
    );
    if (!current || current.status !== "active") {
      res.clearCookie("dm_session", cookie);
      return res.status(401).json({
        message: "This account is not active. Contact Double M Agency.",
      });
    }
    req.user = {
      id: current.id,
      role: current.role,
      email: current.email,
      forcePasswordChange: !!current.force_password_change,
    };
    next();
  } catch {
    return res.status(401).json({ message: "Your session has expired." });
  }
}
const allow =
  (...roles) =>
  (req, res, next) =>
    roles.includes(req.user.role)
      ? next()
      : res
          .status(403)
          .json({ message: "You do not have permission for this action." });
const strongPassword = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(128)
  .regex(/[a-z]/, "Password must include a lowercase letter.")
  .regex(/[A-Z]/, "Password must include a capital letter.")
  .regex(/[0-9]/, "Password must include a number.");
const registration = z.object({
  fullName: z.string().trim().min(2).max(150),
  phone: z.string().trim().min(7).max(30),
  email: z
    .string()
    .email()
    .max(254)
    .transform((v) => v.toLowerCase()),
  password: strongPassword,
  accountType: z.enum(["candidate", "employer"]).default("candidate"),
  profession: z.string().trim().max(120).optional(),
  location: z.string().trim().min(2).max(160),
  privacyConsent: z.literal("true"),
});
app.post("/api/v1/auth/register", authLimiter, async (req, res, next) => {
  try {
    const v = registration.parse(req.body),
      hash = await argon2.hash(v.password, {
        type: argon2.argon2id,
        memoryCost: 19456,
        timeCost: 2,
        parallelism: 1,
      }),
      conn = await db().getConnection();
    try {
      await conn.beginTransaction();
      const [r] = await conn.execute(
        "INSERT INTO users(email,password_hash,role,status) VALUES(?,?,?,'active')",
        [v.email, hash, v.accountType],
      );
      if (v.accountType === "candidate") {
        await conn.execute(
          "INSERT INTO candidate_profiles(user_id,full_name,phone,profession,location) VALUES(?,?,?,?,?)",
          [
            r.insertId,
            v.fullName,
            v.phone,
            v.profession || "Not specified",
            v.location,
          ],
        );
        await conn.execute(
          "INSERT INTO job_alerts(user_id,profession,location) VALUES(?,?,?)",
          [r.insertId, v.profession || null, v.location],
        );
      } else
        await conn.execute(
          "INSERT INTO employer_profiles(user_id,full_name,phone) VALUES(?,?,?)",
          [r.insertId, v.fullName, v.phone],
        );
      await conn.execute(
        "INSERT INTO consent_logs(user_id,subject_email,consent_type,consent_version,ip_hash) VALUES(?,?,?,'2026-07-21',?)",
        [
          r.insertId,
          v.email,
          `${v.accountType}_registration`,
          crypto
            .createHash("sha256")
            .update(req.ip || "")
            .digest("hex"),
        ],
      );
      await conn.commit();
      await queueEmail(
        v.email,
        v.accountType === "candidate"
          ? templates.candidateWelcome(v.fullName)
          : templates.employerWelcome(v.fullName),
      );
      res
        .status(201)
        .json({ message: "Account created. Welcome email queued." });
    } catch (e) {
      await conn.rollback();
      if (e.code === "ER_DUP_ENTRY")
        return res
          .status(409)
          .json({ message: "An account already exists for this email." });
      throw e;
    } finally {
      conn.release();
    }
  } catch (e) {
    next(e);
  }
});
app.post("/api/v1/auth/login", authLimiter, async (req, res, next) => {
  try {
    const v = z
      .object({
        email: z
          .string()
          .email()
          .transform((x) => x.toLowerCase()),
        password: z.string().min(1),
      })
      .parse(req.body);
    const [rows] = await db().execute(
      "SELECT id,email,password_hash,role,status,force_password_change FROM users WHERE email=? LIMIT 1",
      [v.email],
    );
    const user = rows[0];
    if (
      !user ||
      !user.password_hash ||
      !(await argon2.verify(user.password_hash, v.password))
    )
      return res
        .status(401)
        .json({ message: "Email or password is incorrect." });
    if (user.status !== "active")
      return res.status(403).json({ message: "Account access is restricted." });
    res.cookie("dm_session", await tokenFor(user), cookie);
    await db().execute(
      "INSERT INTO audit_logs(actor_user_id,action,entity_type,entity_id) VALUES(?,'auth.login','user',?)",
      [user.id, String(user.id)],
    );
    res.json({
      user: {
        email: user.email,
        role: user.role,
        forcePasswordChange: !!user.force_password_change,
      },
    });
  } catch (e) {
    next(e);
  }
});
app.post("/api/v1/auth/google", authLimiter, async (req, res, next) => {
  const connection = await db().getConnection();
  try {
    if (!config.GOOGLE_CLIENT_ID)
      return res
        .status(503)
        .json({ message: "Google sign-in is not configured." });
    const v = z
        .object({
          credential: z.string().min(100),
          role: z.enum(["candidate", "employer"]).optional(),
        })
        .parse(req.body),
      ticket = await new OAuth2Client(config.GOOGLE_CLIENT_ID).verifyIdToken({
        idToken: v.credential,
        audience: config.GOOGLE_CLIENT_ID,
      }),
      payload = ticket.getPayload(),
      email = payload?.email?.toLowerCase();
    if (
      !payload?.sub ||
      !email ||
      !payload.email_verified ||
      !email.endsWith("@gmail.com")
    )
      return res.status(403).json({ message: "Use a verified Gmail account." });
    await connection.beginTransaction();
    const [[existing]] = await connection.execute(
      "SELECT id,email,role,status,force_password_change FROM users WHERE email=? OR google_subject=? LIMIT 1",
      [email, payload.sub],
    );
    let user = existing;
    if (!user) {
      if (!v.role) {
        await connection.rollback();
        return res.status(400).json({
          message: "Choose employer or job seeker registration first.",
        });
      }
      const [created] = await connection.execute(
        "INSERT INTO users(email,google_subject,role,status,email_verified_at,force_password_change) VALUES(?,?,?,'active',UTC_TIMESTAMP(),FALSE)",
        [email, payload.sub, v.role],
      );
      user = {
        id: created.insertId,
        email,
        role: v.role,
        status: "active",
        force_password_change: false,
      };
      const name = (payload.name || email.split("@")[0]).slice(0, 150);
      if (v.role === "candidate")
        await connection.execute(
          "INSERT INTO candidate_profiles(user_id,full_name,phone,profession,location) VALUES(?,?,'','','')",
          [user.id, name],
        );
      else
        await connection.execute(
          "INSERT INTO employer_profiles(user_id,full_name) VALUES(?,?)",
          [user.id, name],
        );
      const welcome =
        v.role === "candidate"
          ? templates.candidateWelcome(name)
          : templates.employerWelcome(name);
      await connection.execute(
        "INSERT INTO email_outbox(recipient,subject,html) VALUES(?,?,?)",
        [email, welcome.subject, welcome.html],
      );
    } else {
      if (existing.status !== "active") {
        await connection.rollback();
        return res
          .status(403)
          .json({ message: "Account access is restricted." });
      }
      if (!existing.google_subject)
        await connection.execute(
          "UPDATE users SET google_subject=?,email_verified_at=COALESCE(email_verified_at,UTC_TIMESTAMP()) WHERE id=?",
          [payload.sub, existing.id],
        );
    }
    await connection.commit();
    res.cookie("dm_session", await tokenFor(user), cookie);
    res.json({
      user: {
        email: user.email,
        role: user.role,
        forcePasswordChange: !!user.force_password_change,
      },
    });
  } catch (e) {
    await connection.rollback();
    next(e);
  } finally {
    connection.release();
  }
});
app.get("/api/v1/auth/session", requireAuth, (req, res) =>
  res.json({ user: req.user }),
);
app.post("/api/v1/auth/logout", (_req, res) => {
  res.clearCookie("dm_session", cookie);
  res.status(204).end();
});
app.post(
  "/api/v1/auth/change-password",
  requireAuth,
  async (req, res, next) => {
    try {
      const { password } = z
        .object({ password: strongPassword })
        .parse(req.body);
      const hash = await argon2.hash(password, { type: argon2.argon2id });
      await db().execute(
        "UPDATE users SET password_hash=?,force_password_change=FALSE WHERE id=?",
        [hash, req.user.id],
      );
      res.clearCookie("dm_session", cookie);
      res.json({ message: "Password updated. Please sign in again." });
    } catch (e) {
      next(e);
    }
  },
);
app.get("/api/v1/dashboard", requireAuth, async (req, res, next) => {
  try {
    const u = req.user;
    let data = {};
    if (u.role === "employer") {
      const [[requests], [payments], [placements], [replacements]] =
        await Promise.all([
          db().execute(
            "SELECT reference_code,role_needed,status,created_at FROM staffing_requests WHERE email=? ORDER BY created_at DESC LIMIT 10",
            [u.email],
          ),
          db().execute(
            "SELECT ft.reference_code,ft.purpose,ft.amount,ft.currency,ft.method_code,ft.status,ft.paid_at,ft.created_at,r.receipt_number FROM financial_transactions ft LEFT JOIN receipts r ON r.transaction_id=ft.id WHERE ft.payer_user_id=? ORDER BY ft.created_at DESC LIMIT 20",
            [u.id],
          ),
          db().execute(
            "SELECT id,role_title,status,start_date,end_date FROM placements WHERE employer_user_id=? ORDER BY created_at DESC LIMIT 10",
            [u.id],
          ),
          db().execute(
            "SELECT id,placement_id,status,created_at FROM replacement_requests WHERE employer_user_id=? ORDER BY created_at DESC LIMIT 10",
            [u.id],
          ),
        ]);
      const [shortlist] = await db().execute(
        "SELECT es.id shortlist_id,sc.candidate_user_id,sc.public_summary,sc.match_score,sc.match_reasons,sc.employer_response FROM employer_shortlists es JOIN shortlist_candidates sc ON sc.shortlist_id=es.id WHERE es.employer_user_id=? AND es.status IN ('shared','responded') ORDER BY es.shared_at DESC,sc.match_score DESC LIMIT 20",
        [u.id],
      );
      data = { requests, payments, placements, replacements, shortlist };
    } else if (u.role === "candidate") {
      const [profiles] = await db().execute(
        "SELECT full_name,profession,location,availability_status,profile_completion FROM candidate_profiles WHERE user_id=?",
        [u.id],
      );
      const [jobs] = await db().execute(
        "SELECT reference_code,title,location,employment_type FROM jobs WHERE status='published' ORDER BY created_at DESC LIMIT 6",
      );
      const [checks] = await db().execute(
        "SELECT check_code,status,note,updated_at FROM candidate_verification_checks WHERE candidate_user_id=? ORDER BY FIELD(check_code,'phone_call','identity','passport_photo','cv','certificates','references','interview','availability')",
        [u.id],
      );
      const [documents] = await db().execute(
        "SELECT id,document_type,original_name,status,created_at FROM candidate_documents WHERE candidate_user_id=? ORDER BY created_at DESC",
        [u.id],
      );
      const [preferences] = await db().execute(
        "SELECT best_role,other_roles,preferred_location,work_arrangement,employment_type,minimum_salary,expected_salary,available_from,willing_to_relocate FROM candidate_preferences WHERE candidate_user_id=?",
        [u.id],
      );
      const [applications] = await db().execute(
        "SELECT a.id,a.status,a.updated_at,j.title,j.reference_code FROM applications a LEFT JOIN jobs j ON j.id=a.job_id WHERE a.candidate_user_id=? ORDER BY a.updated_at DESC LIMIT 20",
        [u.id],
      );
      const [messages] = await db().execute(
        "SELECT id,title,message,message_type,is_read,visible_from FROM candidate_messages WHERE candidate_user_id=? AND visible_from<=UTC_TIMESTAMP() ORDER BY visible_from DESC LIMIT 20",
        [u.id],
      );
      const [payments] = await db().execute(
        "SELECT ft.reference_code,ft.purpose,ft.amount,ft.currency,ft.method_code,ft.status,ft.paid_at,ft.created_at,r.receipt_number FROM financial_transactions ft LEFT JOIN receipts r ON r.transaction_id=ft.id WHERE ft.payer_user_id=? ORDER BY ft.created_at DESC LIMIT 20",
        [u.id],
      );
      data = {
        profile: profiles[0],
        recommendedJobs: jobs,
        checks,
        documents,
        preferences: preferences[0] || null,
        applications,
        messages,
        payments,
      };
    } else {
      const [[candidates], [requests], [jobs], [outbox]] = await Promise.all([
        db().query("SELECT COUNT(*) total FROM users WHERE role='candidate'"),
        db().query(
          "SELECT COUNT(*) total FROM staffing_requests WHERE status IN ('new','contacted','confirmed','matching')",
        ),
        db().query("SELECT COUNT(*) total FROM jobs WHERE status='published'"),
        db().query(
          "SELECT COUNT(*) total FROM email_outbox WHERE status='pending'",
        ),
      ]);
      data = {
        metrics: {
          candidates: candidates[0].total,
          openRequests: requests[0].total,
          publishedJobs: jobs[0].total,
          pendingEmails: outbox[0].total,
        },
      };
    }
    res.json({ user: u, data });
  } catch (e) {
    next(e);
  }
});
const requestSchema = z.object({
  fullName: z.string().trim().min(2).max(150),
  phone: z.string().trim().min(7).max(30),
  email: z
    .string()
    .email()
    .max(254)
    .transform((v) => v.toLowerCase()),
  roleNeeded: z.string().trim().min(2).max(120),
  location: z.string().trim().min(2).max(160),
  requirements: z.string().trim().min(20).max(4000),
  preferredContact: z.enum(["phone", "email", "whatsapp"]),
  privacyConsent: z.literal("true"),
});
app.post("/api/v1/staffing-requests", async (req, res, next) => {
  try {
    const v = requestSchema.parse(req.body),
      ref = `DM-${new Date().getUTCFullYear()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
    await db().execute(
      "INSERT INTO staffing_requests(reference_code,full_name,phone,email,role_needed,location,requirements,preferred_contact) VALUES(?,?,?,?,?,?,?,?)",
      [
        ref,
        v.fullName,
        v.phone,
        v.email,
        v.roleNeeded,
        v.location,
        v.requirements,
        v.preferredContact,
      ],
    );
    res
      .status(201)
      .json({ reference: ref, message: "Staffing request received." });
  } catch (e) {
    next(e);
  }
});
app.post(
  "/api/v1/client/replacements",
  requireAuth,
  allow("employer"),
  async (req, res, next) => {
    try {
      const v = z
        .object({
          placementId: z.coerce.number().int().positive(),
          reason: z.string().min(20).max(3000),
        })
        .parse(req.body);
      const [p] = await db().execute(
        "SELECT id FROM placements WHERE id=? AND employer_user_id=?",
        [v.placementId, req.user.id],
      );
      if (!p.length)
        return res.status(404).json({ message: "Placement not found." });
      await db().execute(
        "INSERT INTO replacement_requests(placement_id,employer_user_id,reason) VALUES(?,?,?)",
        [v.placementId, req.user.id, v.reason],
      );
      res.status(201).json({ message: "Replacement request received." });
    } catch (e) {
      next(e);
    }
  },
);
app.post(
  "/api/v1/client/extensions",
  requireAuth,
  allow("employer"),
  async (req, res, next) => {
    try {
      const v = z
        .object({
          placementId: z.coerce.number().int().positive(),
          requestedEndDate: z.string(),
          note: z.string().max(1000).optional(),
        })
        .parse(req.body);
      const [p] = await db().execute(
        "SELECT id FROM placements WHERE id=? AND employer_user_id=?",
        [v.placementId, req.user.id],
      );
      if (!p.length)
        return res.status(404).json({ message: "Placement not found." });
      await db().execute(
        "INSERT INTO contract_extensions(placement_id,employer_user_id,requested_end_date,note) VALUES(?,?,?,?)",
        [v.placementId, req.user.id, v.requestedEndDate, v.note || null],
      );
      res.status(201).json({ message: "Extension request received." });
    } catch (e) {
      next(e);
    }
  },
);
app.post("/api/v1/client/reviews", requireAuth, async (req, res, next) => {
  try {
    const v = z
      .object({
        placementId: z.coerce.number().int().positive().optional(),
        rating: z.coerce.number().int().min(1).max(5),
        reviewText: z.string().min(20).max(3000),
      })
      .parse(req.body);
    await db().execute(
      "INSERT INTO reviews(user_id,placement_id,rating,review_text) VALUES(?,?,?,?)",
      [req.user.id, v.placementId || null, v.rating, v.reviewText],
    );
    res
      .status(201)
      .json({ message: "Thank you. Your review is awaiting approval." });
  } catch (e) {
    next(e);
  }
});
app.get("/api/v1/jobs", async (_req, res, next) => {
  try {
    const [jobs] = await db().execute(
      "SELECT j.id,j.reference_code,j.title,j.location,j.employment_type,j.description,j.application_deadline,j.created_at,d.salary_min,d.salary_max,d.schedule,d.work_arrangement,d.accommodation FROM jobs j LEFT JOIN job_details d ON d.job_id=j.id WHERE j.status='published' AND (j.application_deadline IS NULL OR j.application_deadline>=UTC_TIMESTAMP()) ORDER BY j.created_at DESC LIMIT 50",
    );
    res.json({ jobs });
  } catch (e) {
    next(e);
  }
});
app.post(
  "/api/v1/staff/jobs",
  requireAuth,
  allow("administrator", "agency_staff"),
  async (req, res, next) => {
    try {
      const v = z
          .object({
            title: z.string().min(3).max(180),
            location: z.string().min(2).max(160),
            employmentType: z.string().min(2).max(60),
            description: z.string().min(30).max(8000),
            duties: z.string().min(20).max(8000),
            expectations: z.string().min(20).max(8000),
            experienceRequired: z.string().max(500).optional(),
            salaryMin: z.coerce.number().min(0).optional(),
            salaryMax: z.coerce.number().min(0).optional(),
            schedule: z.string().max(500).optional(),
            accommodation: z.enum([
              "provided",
              "not_provided",
              "not_applicable",
            ]),
            workArrangement: z.enum([
              "live_in",
              "live_out",
              "either",
              "not_applicable",
            ]),
            benefits: z.string().max(1000).optional(),
            applicationDeadline: z.string().optional(),
            employerUserId: z.coerce.number().int().positive().optional(),
            staffingRequestId: z.coerce.number().int().positive().optional(),
            publish: z.boolean().default(false),
          })
          .parse(req.body),
        ref = `JOB-${new Date().getUTCFullYear()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`,
        conn = await db().getConnection();
      let employerUserId = v.employerUserId || null;
      if (v.staffingRequestId) {
        const [requests] = await db().execute(
          "SELECT u.id employer_user_id FROM staffing_requests sr LEFT JOIN users u ON u.email=sr.email AND u.role='employer' WHERE sr.id=? AND sr.status NOT IN ('closed','cancelled') LIMIT 1",
          [v.staffingRequestId],
        );
        if (!requests.length)
          return res.status(400).json({
            message: "Choose an open recruitment request.",
          });
        const requestEmployerId = requests[0].employer_user_id || null;
        if (
          employerUserId &&
          requestEmployerId &&
          Number(employerUserId) !== Number(requestEmployerId)
        )
          return res.status(400).json({
            message: "The selected request belongs to a different employer.",
          });
        employerUserId = requestEmployerId || employerUserId;
      }
      let jobId;
      try {
        await conn.beginTransaction();
        const [created] = await conn.execute(
          "INSERT INTO jobs(staffing_request_id,employer_user_id,created_by,reference_code,title,location,employment_type,description,status,application_deadline) VALUES(?,?,?,?,?,?,?,?,?,?)",
          [
            v.staffingRequestId || null,
            employerUserId,
            req.user.id,
            ref,
            v.title,
            v.location,
            v.employmentType,
            v.description,
            v.publish ? "published" : "draft",
            v.applicationDeadline || null,
          ],
        );
        jobId = created.insertId;
        await conn.execute(
          "INSERT INTO job_details(job_id,duties,expectations,experience_required,salary_min,salary_max,schedule,accommodation,work_arrangement,benefits) VALUES(?,?,?,?,?,?,?,?,?,?)",
          [
            jobId,
            v.duties,
            v.expectations,
            v.experienceRequired || null,
            v.salaryMin || null,
            v.salaryMax || null,
            v.schedule || null,
            v.accommodation,
            v.workArrangement,
            v.benefits || null,
          ],
        );
        await conn.commit();
      } catch (e) {
        await conn.rollback();
        throw e;
      } finally {
        conn.release();
      }
      await db().execute(
        "INSERT INTO staff_activity(staff_user_id,action_code,entity_type,entity_id,context) VALUES(?,'job.created','job',?,JSON_OBJECT('reference',?,'employer_id',?))",
        [req.user.id, String(jobId), ref, employerUserId],
      );
      if (v.publish) {
        const [alerts] = await db().query(
          "SELECT u.email FROM users u JOIN job_alerts a ON a.user_id=u.id WHERE u.status='active' AND a.enabled=TRUE LIMIT 5000",
        );
        for (const recipient of alerts)
          await queueEmail(
            recipient.email,
            templates.jobAlert(v.title, v.location),
          );
      }
      res.status(201).json({
        reference: ref,
        message: v.publish
          ? "Job published and matching alerts queued."
          : "Job saved as a draft.",
      });
    } catch (e) {
      next(e);
    }
  },
);
app.get(
  "/api/v1/staff/job-options",
  requireAuth,
  allow("administrator", "agency_staff"),
  async (_req, res, next) => {
    try {
      const [[employers], [requests], [jobs]] = await Promise.all([
        db().query(
          "SELECT u.id,u.email,COALESCE(ep.full_name,u.email) full_name FROM users u LEFT JOIN employer_profiles ep ON ep.user_id=u.id WHERE u.role='employer' AND u.status='active' ORDER BY full_name",
        ),
        db().query(
          "SELECT sr.id,sr.reference_code,sr.role_needed,sr.location,u.id employer_user_id FROM staffing_requests sr LEFT JOIN users u ON u.email=sr.email AND u.role='employer' WHERE sr.status NOT IN ('closed','cancelled') ORDER BY sr.created_at DESC LIMIT 100",
        ),
        db().query(
          "SELECT j.id,j.reference_code,j.title,j.location,j.status,j.created_at,u.email employer_email,creator.email created_by_email FROM jobs j LEFT JOIN users u ON u.id=j.employer_user_id LEFT JOIN users creator ON creator.id=j.created_by ORDER BY j.created_at DESC LIMIT 100",
        ),
      ]);
      res.json({ employers, requests, jobs });
    } catch (error) {
      next(error);
    }
  },
);
app.post(
  "/api/v1/candidate/jobs/:jobId/save",
  requireAuth,
  allow("candidate"),
  async (req, res, next) => {
    try {
      const id = z.coerce.number().int().positive().parse(req.params.jobId);
      const [existing] = await db().execute(
        "SELECT job_id FROM saved_jobs WHERE candidate_user_id=? AND job_id=?",
        [req.user.id, id],
      );
      if (existing.length) {
        await db().execute(
          "DELETE FROM saved_jobs WHERE candidate_user_id=? AND job_id=?",
          [req.user.id, id],
        );
        return res.json({
          saved: false,
          message: "Removed from interested jobs.",
        });
      }
      await db().execute(
        "INSERT INTO saved_jobs(candidate_user_id,job_id) VALUES(?,?)",
        [req.user.id, id],
      );
      res.json({ saved: true, message: "Marked as interested." });
    } catch (e) {
      next(e);
    }
  },
);
app.post(
  "/api/v1/candidate/jobs/:jobId/apply",
  requireAuth,
  allow("candidate"),
  async (req, res, next) => {
    try {
      const id = z.coerce.number().int().positive().parse(req.params.jobId);
      const [jobs] = await db().execute(
        "SELECT id FROM jobs WHERE id=? AND status='published' AND (application_deadline IS NULL OR application_deadline>=UTC_TIMESTAMP())",
        [id],
      );
      if (!jobs.length)
        return res
          .status(404)
          .json({ message: "This job is not accepting applications." });
      const [created] = await db().execute(
        "INSERT INTO applications(candidate_user_id,job_id,status) VALUES(?,?,'received')",
        [req.user.id, id],
      );
      await db().execute(
        "INSERT INTO application_status_history(application_id,new_status,candidate_note) VALUES(?,'received','Your application has been received and is waiting for agency review.')",
        [created.insertId],
      );
      res.status(201).json({
        message: "Application received. Track progress in your workspace.",
      });
    } catch (e) {
      if (e.code === "ER_DUP_ENTRY")
        return res
          .status(409)
          .json({ message: "You already applied for this job." });
      next(e);
    }
  },
);
app.get(
  "/api/v1/admin/contract-template",
  requireAuth,
  allow("administrator"),
  async (_req, res, next) => {
    try {
      const [rows] = await db().query(
        "SELECT ct.id,ct.name,ct.version,ct.terms_html,ct.is_active,ct.updated_at,u.email updated_by_email FROM contract_templates ct JOIN users u ON u.id=ct.updated_by WHERE ct.is_active=TRUE ORDER BY ct.version DESC LIMIT 1",
      );
      res.json({ template: rows[0] || null });
    } catch (e) {
      next(e);
    }
  },
);
app.put(
  "/api/v1/admin/contract-template",
  requireAuth,
  allow("administrator"),
  async (req, res, next) => {
    try {
      const v = z
        .object({
          name: z.string().min(3).max(160),
          termsHtml: z.string().min(100).max(100000),
        })
        .parse(req.body);
      const safe = sanitizeHtml(v.termsHtml, {
        allowedTags: [
          "h2",
          "h3",
          "p",
          "strong",
          "em",
          "ul",
          "ol",
          "li",
          "br",
          "table",
          "thead",
          "tbody",
          "tr",
          "th",
          "td",
        ],
        allowedAttributes: {},
      });
      const [[latest]] = await db().query(
        "SELECT COALESCE(MAX(version),0) version FROM contract_templates",
      );
      await db().execute(
        "UPDATE contract_templates SET is_active=FALSE WHERE is_active=TRUE",
      );
      await db().execute(
        "INSERT INTO contract_templates(name,version,terms_html,updated_by) VALUES(?,?,?,?)",
        [v.name, Number(latest.version) + 1, safe, req.user.id],
      );
      res.json({ message: "Contract terms saved as a new version." });
    } catch (e) {
      next(e);
    }
  },
);
app.get(
  "/api/v1/staff/contract-options",
  requireAuth,
  allow("administrator", "agency_staff"),
  async (_req, res, next) => {
    try {
      const [[employers], [candidates], [jobs], [templates], [feeBands]] =
        await Promise.all([
          db().query(
            "SELECT u.id,u.email,ep.full_name FROM users u LEFT JOIN employer_profiles ep ON ep.user_id=u.id WHERE u.role='employer' AND u.status='active' ORDER BY ep.full_name",
          ),
          db().query(
            "SELECT u.id,u.email,cp.full_name FROM users u LEFT JOIN candidate_profiles cp ON cp.user_id=u.id WHERE u.role='candidate' AND u.status='active' ORDER BY cp.full_name",
          ),
          db().query(
            "SELECT id,reference_code,title FROM jobs WHERE status IN ('published','filled') ORDER BY created_at DESC",
          ),
          db().query(
            "SELECT id,name,version FROM contract_templates WHERE is_active=TRUE ORDER BY version DESC LIMIT 1",
          ),
          db().query(
            "SELECT salary_min,salary_max,fee_amount FROM fee_bands WHERE payer_role='employer' AND is_active=TRUE ORDER BY salary_min",
          ),
        ]);
      res.json({
        employers,
        candidates,
        jobs,
        template: templates[0] || null,
        feeBands,
      });
    } catch (e) {
      next(e);
    }
  },
);
app.post(
  "/api/v1/staff/contracts",
  requireAuth,
  allow("administrator", "agency_staff"),
  async (req, res, next) => {
    try {
      const v = z
        .object({
          employerUserId: z.coerce.number().int().positive(),
          candidateUserId: z.coerce.number().int().positive(),
          jobId: z.coerce.number().int().positive().optional(),
          roleTitle: z.string().min(2).max(180),
          anticipatedSalary: z.coerce.number().positive().max(10000000),
          candidateFeeAmount: z.coerce.number().min(0).max(10000000).default(0),
          startDate: z.string().date(),
          endDate: z.string().date().optional(),
          send: z.boolean().default(true),
        })
        .parse(req.body);
      const [[template]] = await db().query(
        "SELECT id,version,terms_html FROM contract_templates WHERE is_active=TRUE ORDER BY version DESC LIMIT 1",
      );
      if (!template)
        return res.status(400).json({
          message: "An administrator must activate contract terms first.",
        });
      const [[employer]] = await db().execute(
          "SELECT COALESCE(ep.full_name,u.email) name FROM users u LEFT JOIN employer_profiles ep ON ep.user_id=u.id WHERE u.id=? AND u.role='employer' AND u.status='active'",
          [v.employerUserId],
        ),
        [[candidate]] = await db().execute(
          "SELECT COALESCE(cp.full_name,u.email) name FROM users u LEFT JOIN candidate_profiles cp ON cp.user_id=u.id WHERE u.id=? AND u.role='candidate' AND u.status='active'",
          [v.candidateUserId],
        );
      if (!employer || !candidate)
        return res
          .status(400)
          .json({ message: "Choose active employer and candidate accounts." });
      const [[feeBand]] = await db().execute(
        "SELECT fee_amount FROM fee_bands WHERE payer_role='employer' AND is_active=TRUE AND ? BETWEEN salary_min AND salary_max ORDER BY salary_min DESC LIMIT 1",
        [v.anticipatedSalary],
      );
      if (!feeBand)
        return res.status(400).json({
          message:
            "No approved agency charge covers this salary. Ask an administrator to add the fee before creating the contract.",
        });
      const esc = (x) =>
        String(x || "").replace(
          /[&<>\"']/g,
          (c) =>
            ({
              "&": "&amp;",
              "<": "&lt;",
              ">": "&gt;",
              '\"': "&quot;",
              "'": "&#39;",
            })[c],
        );
      const values = {
        "{{employer_name}}": employer.name,
        "{{candidate_name}}": candidate.name,
        "{{role_title}}": v.roleTitle,
        "{{start_date}}": v.startDate,
        "{{end_date}}": v.endDate || "Open-ended",
        "{{contract_date}}": new Date().toISOString().slice(0, 10),
        "{{salary_amount}}": `KES ${Number(v.anticipatedSalary).toLocaleString()}`,
        "{{agency_fee_amount}}": `KES ${Number(feeBand.fee_amount).toLocaleString()}`,
        "{{candidate_fee_amount}}": `KES ${Number(v.candidateFeeAmount).toLocaleString()}`,
      };
      let snapshot = template.terms_html;
      for (const [token, value] of Object.entries(values))
        snapshot = snapshot.replaceAll(token, esc(value));
      const number = `DMC-${new Date().getUTCFullYear()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
      await db().execute(
        "INSERT INTO employment_contracts(contract_number,template_id,template_version,employer_user_id,candidate_user_id,job_id,role_title,salary_amount,agency_fee_amount,candidate_fee_amount,start_date,end_date,terms_snapshot,status,created_by,last_edited_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
        [
          number,
          template.id,
          template.version,
          v.employerUserId,
          v.candidateUserId,
          v.jobId || null,
          v.roleTitle,
          v.anticipatedSalary,
          feeBand.fee_amount,
          v.candidateFeeAmount,
          v.startDate,
          v.endDate || null,
          snapshot,
          v.send ? "sent" : "draft",
          req.user.id,
          req.user.id,
        ],
      );
      const [[createdContract]] = await db().execute(
        "SELECT id FROM employment_contracts WHERE contract_number=?",
        [number],
      );
      await db().execute(
        "INSERT INTO staff_activity(staff_user_id,action_code,entity_type,entity_id,context) VALUES(?,'contract.created','employment_contract',?,JSON_OBJECT('contract_number',?,'employer_id',?,'candidate_id',?))",
        [
          req.user.id,
          String(createdContract.id),
          number,
          v.employerUserId,
          v.candidateUserId,
        ],
      );
      res.status(201).json({
        message: v.send
          ? "Contract created and sent to both parties."
          : "Contract draft created.",
        contractNumber: number,
      });
    } catch (e) {
      next(e);
    }
  },
);
app.get("/api/v1/contracts", requireAuth, async (req, res, next) => {
  try {
    let where = "",
      params = [];
    if (req.user.role === "employer") {
      where = "WHERE ec.employer_user_id=?";
      params = [req.user.id];
    } else if (req.user.role === "candidate") {
      where = "WHERE ec.candidate_user_id=?";
      params = [req.user.id];
    }
    const [contracts] = await db().execute(
      `SELECT ec.id,ec.contract_number,ec.role_title,ec.salary_amount,ec.agency_fee_amount,ec.candidate_fee_amount,ec.start_date,ec.end_date,ec.status,ec.employer_signed_at,ec.candidate_signed_at,ec.created_at,ec.updated_at,editor.email last_edited_by_email,j.reference_code job_reference,j.title job_title FROM employment_contracts ec LEFT JOIN jobs j ON j.id=ec.job_id LEFT JOIN users editor ON editor.id=ec.last_edited_by ${where} ORDER BY ec.created_at DESC LIMIT 100`,
      params,
    );
    res.json({ contracts });
  } catch (e) {
    next(e);
  }
});
app.put(
  "/api/v1/staff/contracts/:id",
  requireAuth,
  allow("administrator", "agency_staff"),
  async (req, res, next) => {
    try {
      const id = z.coerce.number().int().positive().parse(req.params.id);
      const value = z
        .object({
          roleTitle: z.string().min(2).max(180),
          startDate: z.string().date(),
          endDate: z.string().date().nullable().optional(),
        })
        .parse(req.body);
      const [result] = await db().execute(
        "UPDATE employment_contracts SET role_title=?,start_date=?,end_date=?,last_edited_by=? WHERE id=? AND status IN ('draft','sent') AND employer_signed_at IS NULL AND candidate_signed_at IS NULL",
        [
          value.roleTitle,
          value.startDate,
          value.endDate || null,
          req.user.id,
          id,
        ],
      );
      if (!result.affectedRows)
        return res.status(400).json({
          message:
            "Signed contracts cannot be edited. Create an amendment instead.",
        });
      await db().execute(
        "INSERT INTO staff_activity(staff_user_id,action_code,entity_type,entity_id) VALUES(?,'contract.edited','employment_contract',?)",
        [req.user.id, String(id)],
      );
      res.json({ message: "Contract updated and editor recorded." });
    } catch (error) {
      next(error);
    }
  },
);
app.post(
  "/api/v1/staff/contracts/:id/replacement",
  requireAuth,
  allow("administrator", "agency_staff"),
  async (req, res, next) => {
    const connection = await db().getConnection();
    try {
      const id = z.coerce.number().int().positive().parse(req.params.id);
      const value = z
        .object({
          replacementCandidateUserId: z.coerce.number().int().positive(),
          reason: z.string().min(10).max(1000),
        })
        .parse(req.body);
      await connection.beginTransaction();
      const [[contract]] = await connection.execute(
        "SELECT * FROM employment_contracts WHERE id=? FOR UPDATE",
        [id],
      );
      if (!contract) {
        await connection.rollback();
        return res.status(404).json({ message: "Contract not found." });
      }
      const [[candidate]] = await connection.execute(
        "SELECT id FROM users WHERE id=? AND role='candidate' AND status='active'",
        [value.replacementCandidateUserId],
      );
      if (!candidate) {
        await connection.rollback();
        return res.status(400).json({ message: "Choose an active candidate." });
      }
      await connection.execute(
        "INSERT INTO contract_amendments(contract_id,previous_candidate_user_id,replacement_candidate_user_id,reason,terms_snapshot,created_by) VALUES(?,?,?,?,?,?)",
        [
          id,
          contract.candidate_user_id,
          candidate.id,
          value.reason,
          contract.terms_snapshot,
          req.user.id,
        ],
      );
      if (contract.placement_id)
        await connection.execute(
          "UPDATE placements SET status='terminated',end_date=CURDATE() WHERE id=?",
          [contract.placement_id],
        );
      const [placement] = await connection.execute(
        "INSERT INTO placements(employer_user_id,candidate_user_id,role_title,status,start_date,end_date) VALUES(?,?,?,'probation',CURDATE(),?)",
        [
          contract.employer_user_id,
          candidate.id,
          contract.role_title,
          contract.end_date,
        ],
      );
      const amendment = `<h2>Replacement amendment</h2><p>The previous placement has ended. Candidate #${candidate.id} is proposed as the replacement for the same role. Reason recorded by the agency: ${sanitizeHtml(value.reason, { allowedTags: [], allowedAttributes: {} })}</p>`;
      await connection.execute(
        "UPDATE employment_contracts SET candidate_user_id=?,placement_id=?,terms_snapshot=CONCAT(terms_snapshot,?),status='sent',employer_signed_name=NULL,employer_signed_at=NULL,candidate_signed_name=NULL,candidate_signed_at=NULL,last_edited_by=? WHERE id=?",
        [candidate.id, placement.insertId, amendment, req.user.id, id],
      );
      await connection.execute(
        "INSERT INTO staff_activity(staff_user_id,action_code,entity_type,entity_id,context) VALUES(?,'contract.replacement','employment_contract',?,JSON_OBJECT('previous_candidate_id',?,'replacement_candidate_id',?))",
        [req.user.id, String(id), contract.candidate_user_id, candidate.id],
      );
      await connection.commit();
      res.json({
        message:
          "Replacement amendment recorded. Both parties must review and sign the updated contract.",
      });
    } catch (error) {
      await connection.rollback();
      next(error);
    } finally {
      connection.release();
    }
  },
);
app.get("/api/v1/contracts/:id", requireAuth, async (req, res, next) => {
  try {
    const id = z.coerce.number().int().positive().parse(req.params.id);
    const [rows] = await db().execute(
      "SELECT * FROM employment_contracts WHERE id=? AND (? IN ('administrator','agency_staff') OR employer_user_id=? OR candidate_user_id=?)",
      [id, req.user.role, req.user.id, req.user.id],
    );
    if (!rows[0])
      return res.status(404).json({ message: "Contract not found." });
    const [amendments] = await db().execute(
      "SELECT ca.id,ca.reason,ca.created_at,previous.email previous_candidate_email,replacement.email replacement_candidate_email,staff.email created_by_email FROM contract_amendments ca LEFT JOIN users previous ON previous.id=ca.previous_candidate_user_id LEFT JOIN users replacement ON replacement.id=ca.replacement_candidate_user_id JOIN users staff ON staff.id=ca.created_by WHERE ca.contract_id=? ORDER BY ca.created_at",
      [id],
    );
    res.json({
      contract: rows[0],
      amendments,
      canSign: ["employer", "candidate"].includes(req.user.role),
    });
  } catch (e) {
    next(e);
  }
});
app.post(
  "/api/v1/contracts/:id/sign",
  requireAuth,
  allow("employer", "candidate"),
  async (req, res, next) => {
    const connection = await db().getConnection();
    try {
      const id = z.coerce.number().int().positive().parse(req.params.id),
        { signedName } = z
          .object({
            signedName: z.string().min(2).max(180),
            accepted: z.literal(true),
          })
          .parse(req.body),
        party = req.user.role,
        owner = party === "employer" ? "employer_user_id" : "candidate_user_id",
        nameColumn =
          party === "employer"
            ? "employer_signed_name"
            : "candidate_signed_name",
        dateColumn =
          party === "employer" ? "employer_signed_at" : "candidate_signed_at",
        otherDate =
          party === "employer" ? "candidate_signed_at" : "employer_signed_at";
      await connection.beginTransaction();
      const [result] = await connection.execute(
        `UPDATE employment_contracts SET ${nameColumn}=?,${dateColumn}=UTC_TIMESTAMP(),status=CASE WHEN ${otherDate} IS NOT NULL THEN 'fully_signed' ELSE '${party}_signed' END WHERE id=? AND ${owner}=? AND status NOT IN ('cancelled','expired','fully_signed')`,
        [signedName, id, req.user.id],
      );
      if (!result.affectedRows) {
        await connection.rollback();
        return res
          .status(400)
          .json({ message: "This contract cannot be signed." });
      }
      const [[contract]] = await connection.execute(
        "SELECT job_id,placement_id,employer_user_id,candidate_user_id,role_title,start_date,end_date,status FROM employment_contracts WHERE id=? FOR UPDATE",
        [id],
      );
      if (contract.status === "fully_signed") {
        if (!contract.placement_id) {
          const [placement] = await connection.execute(
            "INSERT INTO placements(employer_user_id,candidate_user_id,role_title,status,start_date,end_date) VALUES(?,?,?,'active',?,?)",
            [
              contract.employer_user_id,
              contract.candidate_user_id,
              contract.role_title,
              contract.start_date,
              contract.end_date,
            ],
          );
          await connection.execute(
            "UPDATE employment_contracts SET placement_id=? WHERE id=?",
            [placement.insertId, id],
          );
        }
        await connection.execute(
          "UPDATE candidate_profiles SET availability_status='placed' WHERE user_id=?",
          [contract.candidate_user_id],
        );
        if (contract.job_id) {
          await connection.execute(
            "UPDATE jobs SET status='filled' WHERE id=?",
            [contract.job_id],
          );
          await connection.execute(
            "UPDATE applications SET status=IF(candidate_user_id=?,'placed','not_selected') WHERE job_id=? AND status NOT IN ('placed','not_selected')",
            [contract.candidate_user_id, contract.job_id],
          );
        }
      }
      await connection.commit();
      res.json({
        message:
          contract.status === "fully_signed"
            ? "Contract fully signed. The placement and job records are now closed."
            : "Your contract acceptance has been recorded.",
      });
    } catch (e) {
      await connection.rollback();
      next(e);
    } finally {
      connection.release();
    }
  },
);
app.get("/api/v1/settings/public", async (_req, res, next) => {
  try {
    const [rows] = await db().query(
      "SELECT setting_key,setting_value FROM site_settings WHERE setting_key IN ('contact_phone','contact_email','office_address','business_hours')",
    );
    res.json({
      settings: Object.fromEntries(
        rows.map((r) => [r.setting_key, r.setting_value]),
      ),
    });
  } catch (e) {
    next(e);
  }
});
app.put(
  "/api/v1/admin/settings",
  requireAuth,
  allow("administrator"),
  async (req, res, next) => {
    try {
      const values = z
        .record(
          z.enum([
            "contact_phone",
            "contact_email",
            "office_address",
            "business_hours",
          ]),
          z.string().max(500),
        )
        .parse(req.body);
      for (const [k, v] of Object.entries(values))
        await db().execute(
          "INSERT INTO site_settings(setting_key,setting_value,updated_by) VALUES(?,?,?) ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value),updated_by=VALUES(updated_by)",
          [k, v, req.user.id],
        );
      res.json({ message: "Public contact details updated." });
    } catch (e) {
      next(e);
    }
  },
);
app.post(
  "/api/v1/admin/staff",
  requireAuth,
  allow("administrator"),
  async (req, res, next) => {
    try {
      const v = z
          .object({
            email: z
              .string()
              .email()
              .transform((x) => x.toLowerCase()),
            temporaryPassword: strongPassword,
          })
          .parse(req.body),
        hash = await argon2.hash(v.temporaryPassword, {
          type: argon2.argon2id,
        });
      await db().execute(
        "INSERT INTO users(email,password_hash,role,status,email_verified_at,force_password_change) VALUES(?,?,'agency_staff','active',UTC_TIMESTAMP(),TRUE)",
        [v.email, hash],
      );
      await db().execute(
        "INSERT INTO audit_logs(actor_user_id,action,entity_type,metadata) VALUES(?,'staff.create','user',JSON_OBJECT('email',?))",
        [req.user.id, v.email],
      );
      res.status(201).json({
        message:
          "Staff account created. Password change is required on first sign-in.",
      });
    } catch (e) {
      next(e);
    }
  },
);
app.put(
  "/api/v1/admin/service-prices",
  requireAuth,
  allow("administrator"),
  async (req, res, next) => {
    try {
      const v = z
        .object({
          serviceCode: z.string().regex(/^[a-z0-9_-]+$/),
          serviceName: z.string().min(2).max(160),
          amount: z.coerce.number().min(0),
          currency: z.string().length(3).default("KES"),
          active: z.boolean().default(true),
        })
        .parse(req.body);
      await db().execute(
        "INSERT INTO service_prices(service_code,service_name,amount,currency,is_active,updated_by) VALUES(?,?,?,?,?,?) ON DUPLICATE KEY UPDATE service_name=VALUES(service_name),amount=VALUES(amount),currency=VALUES(currency),is_active=VALUES(is_active),updated_by=VALUES(updated_by)",
        [
          v.serviceCode,
          v.serviceName,
          v.amount,
          v.currency.toUpperCase(),
          v.active,
          req.user.id,
        ],
      );
      res.json({ message: "Service price updated." });
    } catch (e) {
      next(e);
    }
  },
);
app.get(
  "/api/v1/admin/users",
  requireAuth,
  allow("administrator"),
  async (_req, res, next) => {
    try {
      const [users] = await db().query(
        "SELECT id,email,role,status,created_at FROM users ORDER BY created_at DESC LIMIT 200",
      );
      res.json({ users });
    } catch (e) {
      next(e);
    }
  },
);
app.put(
  "/api/v1/admin/users/:id/status",
  requireAuth,
  allow("administrator"),
  async (req, res, next) => {
    try {
      const id = z.coerce.number().int().positive().parse(req.params.id),
        { status } = z
          .object({ status: z.enum(["active", "suspended"]) })
          .parse(req.body);
      if (id === req.user.id)
        return res
          .status(400)
          .json({ message: "You cannot suspend your own account." });
      await db().execute("UPDATE users SET status=? WHERE id=?", [status, id]);
      await db().execute(
        "INSERT INTO audit_logs(actor_user_id,action,entity_type,entity_id,metadata) VALUES(?,'user.status','user',?,JSON_OBJECT('status',?))",
        [req.user.id, String(id), status],
      );
      res.json({
        message:
          status === "suspended"
            ? "Account suspended immediately."
            : "Account restored.",
      });
    } catch (e) {
      next(e);
    }
  },
);
app.put(
  "/api/v1/admin/payment-methods",
  requireAuth,
  allow("administrator"),
  async (req, res, next) => {
    try {
      const v = z
        .object({
          methodCode: z.enum(["mpesa", "bank_transfer", "cash", "card"]),
          displayName: z.string().min(2).max(100),
          active: z.boolean(),
          configuration: z.record(z.string(), z.string()).optional(),
        })
        .parse(req.body);
      await db().execute(
        "INSERT INTO payment_methods(method_code,display_name,is_active,configuration,updated_by) VALUES(?,?,?,?,?) ON DUPLICATE KEY UPDATE display_name=VALUES(display_name),is_active=VALUES(is_active),configuration=VALUES(configuration),updated_by=VALUES(updated_by)",
        [
          v.methodCode,
          v.displayName,
          v.active,
          JSON.stringify(v.configuration || {}),
          req.user.id,
        ],
      );
      res.json({ message: "Payment method updated." });
    } catch (e) {
      next(e);
    }
  },
);
app.put(
  "/api/v1/admin/fee-bands",
  requireAuth,
  allow("administrator"),
  async (req, res, next) => {
    try {
      const value = z
        .object({
          payerRole: z.enum(["employer", "candidate"]),
          feeName: z.string().min(3).max(120),
          salaryMin: z.coerce.number().min(0),
          salaryMax: z.coerce.number().min(0),
          feeAmount: z.coerce.number().min(0),
        })
        .refine((item) => item.salaryMax >= item.salaryMin, {
          message: "Maximum salary must be equal to or above minimum salary.",
          path: ["salaryMax"],
        })
        .parse(req.body);
      await db().execute(
        "INSERT INTO fee_bands(payer_role,fee_name,salary_min,salary_max,fee_amount,updated_by) VALUES(?,?,?,?,?,?) ON DUPLICATE KEY UPDATE fee_name=VALUES(fee_name),fee_amount=VALUES(fee_amount),is_active=TRUE,updated_by=VALUES(updated_by)",
        [
          value.payerRole,
          value.feeName,
          value.salaryMin,
          value.salaryMax,
          value.feeAmount,
          req.user.id,
        ],
      );
      res.json({ message: "Salary-based agency charge saved." });
    } catch (error) {
      next(error);
    }
  },
);
app.get(
  "/api/v1/staff/finance",
  requireAuth,
  allow("administrator", "agency_staff"),
  async (_req, res, next) => {
    try {
      const [transactions] = await db().query(
        "SELECT ft.id,ft.reference_code,ft.purpose,ft.amount,ft.currency,ft.method_code,ft.detected_method,ft.status,ft.external_reference,ft.paid_at,ft.created_at,u.email,u.role,r.receipt_number FROM financial_transactions ft JOIN users u ON u.id=ft.payer_user_id LEFT JOIN receipts r ON r.transaction_id=ft.id ORDER BY ft.created_at DESC LIMIT 100",
      );
      const [prices] = await db().query(
        "SELECT id,service_code,service_name,amount,currency FROM service_prices WHERE is_active=TRUE ORDER BY service_name",
      );
      const [methods] = await db().query(
        "SELECT method_code,display_name FROM payment_methods WHERE is_active=TRUE ORDER BY display_name",
      );
      const [payers] = await db().query(
        "SELECT u.id,u.email,u.role,COALESCE(cp.full_name,ep.full_name,u.email) full_name FROM users u LEFT JOIN candidate_profiles cp ON cp.user_id=u.id LEFT JOIN employer_profiles ep ON ep.user_id=u.id WHERE u.role IN ('candidate','employer') AND u.status='active' ORDER BY full_name",
      );
      const [contracts] = await db().query(
        "SELECT ec.id,ec.contract_number,ec.employer_user_id,ec.candidate_user_id,ec.role_title,ec.salary_amount,ec.agency_fee_amount,ec.candidate_fee_amount,ue.email employer_email,uc.email candidate_email FROM employment_contracts ec JOIN users ue ON ue.id=ec.employer_user_id JOIN users uc ON uc.id=ec.candidate_user_id WHERE ec.status<>'cancelled' ORDER BY ec.created_at DESC LIMIT 100",
      );
      const [feeBands] = await db().query(
        "SELECT payer_role,fee_name,salary_min,salary_max,fee_amount FROM fee_bands WHERE is_active=TRUE ORDER BY payer_role,salary_min",
      );
      res.json({ transactions, prices, methods, payers, contracts, feeBands });
    } catch (e) {
      next(e);
    }
  },
);
app.post(
  "/api/v1/staff/transactions",
  requireAuth,
  allow("administrator", "agency_staff"),
  async (req, res, next) => {
    try {
      const v = z
        .object({
          payerEmail: z.string().email(),
          servicePriceId: z.coerce.number().int().positive().optional(),
          contractId: z.coerce.number().int().positive().optional(),
          purpose: z.string().min(3).max(180),
          amount: z.coerce.number().positive().max(10000000),
          currency: z.enum(["KES", "USD"]).default("KES"),
          methodCode: z.string().max(40).optional(),
          externalReference: z.string().max(120).optional(),
        })
        .parse(req.body);
      const [[payer]] = await db().execute(
        "SELECT id FROM users WHERE email=? AND role IN ('employer','candidate') AND status='active' LIMIT 1",
        [v.payerEmail.toLowerCase()],
      );
      if (!payer)
        return res.status(404).json({ message: "Payer account not found." });
      const detectedMethod =
        !v.methodCode && /^[A-Z0-9]{10}$/i.test(v.externalReference || "")
          ? "mpesa"
          : v.methodCode || null;
      if (detectedMethod) {
        const [[method]] = await db().execute(
          "SELECT method_code FROM payment_methods WHERE method_code=? AND is_active=TRUE",
          [detectedMethod],
        );
        if (!method)
          return res
            .status(400)
            .json({ message: "That payment method is not active." });
      }
      const reference = `DM-${new Date().getUTCFullYear()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
      const [createdPayment] = await db().execute(
        "INSERT INTO financial_transactions(payer_user_id,service_price_id,contract_id,reference_code,purpose,amount,currency,method_code,detected_method,external_reference,recorded_by) VALUES(?,?,?,?,?,?,?,?,?,?,?)",
        [
          payer.id,
          v.servicePriceId || null,
          v.contractId || null,
          reference,
          v.purpose,
          v.amount,
          v.currency,
          detectedMethod,
          detectedMethod,
          v.externalReference || null,
          req.user.id,
        ],
      );
      await db().execute(
        "INSERT INTO staff_activity(staff_user_id,action_code,entity_type,entity_id,context) VALUES(?,'payment.created','financial_transaction',?,JSON_OBJECT('reference',?,'payer_id',?))",
        [req.user.id, String(createdPayment.insertId), reference, payer.id],
      );
      res.status(201).json({ message: "Payment record created.", reference });
    } catch (e) {
      next(e);
    }
  },
);
app.put(
  "/api/v1/staff/transactions/:id/paid",
  requireAuth,
  allow("administrator", "agency_staff"),
  async (req, res, next) => {
    const connection = await db().getConnection();
    try {
      const id = z.coerce.number().int().positive().parse(req.params.id);
      const v = z
        .object({ externalReference: z.string().min(2).max(120) })
        .parse(req.body);
      await connection.beginTransaction();
      const [[transaction]] = await connection.execute(
        "SELECT id,status FROM financial_transactions WHERE id=? FOR UPDATE",
        [id],
      );
      if (!transaction) {
        await connection.rollback();
        return res.status(404).json({ message: "Payment record not found." });
      }
      const receiptNumber = `DMR-${new Date().getUTCFullYear()}-${String(id).padStart(6, "0")}`;
      await connection.execute(
        "UPDATE financial_transactions SET status='paid',external_reference=?,detected_method=COALESCE(detected_method,IF(? REGEXP '^[A-Za-z0-9]{10}$','mpesa',method_code)),paid_at=UTC_TIMESTAMP() WHERE id=?",
        [v.externalReference, v.externalReference, id],
      );
      await connection.execute(
        "INSERT INTO receipts(transaction_id,receipt_number,issued_by) VALUES(?,?,?) ON DUPLICATE KEY UPDATE issued_by=VALUES(issued_by)",
        [id, receiptNumber, req.user.id],
      );
      await connection.commit();
      await db().execute(
        "INSERT INTO staff_activity(staff_user_id,action_code,entity_type,entity_id,context) VALUES(?,'payment.verified','financial_transaction',?,JSON_OBJECT('receipt',?))",
        [req.user.id, String(id), receiptNumber],
      );
      res.json({
        message: "Payment verified and receipt issued.",
        receiptNumber,
      });
    } catch (e) {
      await connection.rollback();
      next(e);
    } finally {
      connection.release();
    }
  },
);
app.get(
  "/api/v1/receipts/:receiptNumber",
  requireAuth,
  async (req, res, next) => {
    try {
      const [rows] = await db().execute(
        "SELECT r.receipt_number,r.issued_at,ft.payer_user_id,ft.reference_code,ft.purpose,ft.amount,ft.currency,ft.method_code,ft.external_reference,ft.paid_at,u.email,u.role FROM receipts r JOIN financial_transactions ft ON ft.id=r.transaction_id JOIN users u ON u.id=ft.payer_user_id WHERE r.receipt_number=? LIMIT 1",
        [req.params.receiptNumber],
      );
      const receipt = rows[0];
      if (!receipt)
        return res.status(404).json({ message: "Receipt not found." });
      if (
        !["administrator", "agency_staff"].includes(req.user.role) &&
        receipt.payer_user_id !== req.user.id
      )
        return res.status(403).json({ message: "Not permitted." });
      delete receipt.payer_user_id;
      res.json({ receipt });
    } catch (e) {
      next(e);
    }
  },
);
app.post(
  "/api/v1/auth/forgot-password",
  authLimiter,
  async (req, res, next) => {
    try {
      const { email } = z
        .object({
          email: z
            .string()
            .email()
            .transform((v) => v.toLowerCase()),
        })
        .parse(req.body);
      const [rows] = await db().execute(
        "SELECT id FROM users WHERE email=? AND status='active' LIMIT 1",
        [email],
      );
      if (rows[0]) {
        const token = crypto.randomBytes(32).toString("hex");
        const hash = crypto.createHash("sha256").update(token).digest("hex");
        await db().execute(
          "INSERT INTO password_reset_tokens(user_id,token_hash,expires_at) VALUES(?,?,DATE_ADD(UTC_TIMESTAMP(),INTERVAL 30 MINUTE))",
          [rows[0].id, hash],
        );
        await queueEmail(
          email,
          templates.passwordReset(
            `${config.APP_URL}/reset-password?token=${token}`,
          ),
        );
      }
      res.json({
        message: "If the account exists, a secure reset email has been queued.",
      });
    } catch (e) {
      next(e);
    }
  },
);
app.post("/api/v1/auth/reset-password", authLimiter, async (req, res, next) => {
  try {
    const v = z
      .object({
        token: z.string().length(64),
        password: strongPassword,
      })
      .parse(req.body);
    const hash = crypto.createHash("sha256").update(v.token).digest("hex");
    const [rows] = await db().execute(
      "SELECT id,user_id FROM password_reset_tokens WHERE token_hash=? AND used_at IS NULL AND expires_at>UTC_TIMESTAMP() LIMIT 1",
      [hash],
    );
    if (!rows[0])
      return res
        .status(400)
        .json({ message: "This reset link is invalid or expired." });
    const passwordHash = await argon2.hash(v.password, {
      type: argon2.argon2id,
    });
    const conn = await db().getConnection();
    try {
      await conn.beginTransaction();
      await conn.execute(
        "UPDATE users SET password_hash=?,force_password_change=FALSE WHERE id=?",
        [passwordHash, rows[0].user_id],
      );
      await conn.execute(
        "UPDATE password_reset_tokens SET used_at=UTC_TIMESTAMP() WHERE id=?",
        [rows[0].id],
      );
      await conn.commit();
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
    res.clearCookie("dm_session", cookie);
    res.json({ message: "Password updated. You can now sign in." });
  } catch (e) {
    next(e);
  }
});
app.post(
  "/api/v1/staff/assisted-registration",
  requireAuth,
  allow("administrator", "agency_staff"),
  async (req, res, next) => {
    try {
      const v = z
        .object({
          fullName: z.string().min(2).max(150),
          email: z
            .string()
            .email()
            .transform((x) => x.toLowerCase()),
          phone: z.string().min(7).max(30),
          role: z.enum(["candidate", "employer"]),
          location: z.string().min(2).max(160),
          profession: z.string().max(120).optional(),
          dateOfBirth: z.string().optional(),
          educationLevel: z.string().max(120).optional(),
          temporaryPassword: z.string().min(10).max(128),
        })
        .parse(req.body);
      const passwordHash = await argon2.hash(v.temporaryPassword, {
        type: argon2.argon2id,
      });
      const conn = await db().getConnection();
      try {
        await conn.beginTransaction();
        const [created] = await conn.execute(
          "INSERT INTO users(email,password_hash,role,status,email_verified_at,force_password_change) VALUES(?,?,?,'active',UTC_TIMESTAMP(),TRUE)",
          [v.email, passwordHash, v.role],
        );
        if (v.role === "candidate") {
          await conn.execute(
            "INSERT INTO candidate_profiles(user_id,full_name,phone,profession,location) VALUES(?,?,?,?,?)",
            [
              created.insertId,
              v.fullName,
              v.phone,
              v.profession || "Not specified",
              v.location,
            ],
          );
          await conn.execute(
            "INSERT INTO candidate_private_details(candidate_user_id,date_of_birth,education_level) VALUES(?,?,?)",
            [created.insertId, v.dateOfBirth || null, v.educationLevel || null],
          );
        } else
          await conn.execute(
            "INSERT INTO employer_profiles(user_id,full_name,phone) VALUES(?,?,?)",
            [created.insertId, v.fullName, v.phone],
          );
        await conn.execute(
          "INSERT INTO audit_logs(actor_user_id,action,entity_type,entity_id,metadata) VALUES(?,'assisted.registration','user',?,JSON_OBJECT('role',?))",
          [req.user.id, String(created.insertId), v.role],
        );
        await conn.commit();
      } catch (e) {
        await conn.rollback();
        throw e;
      } finally {
        conn.release();
      }
      await queueEmail(
        v.email,
        v.role === "candidate"
          ? templates.candidateWelcome(v.fullName)
          : templates.employerWelcome(v.fullName),
      );
      res.status(201).json({
        message: `${v.role === "candidate" ? "Candidate" : "Employer"} account created with a required first-login password change.`,
      });
    } catch (e) {
      next(e);
    }
  },
);
app.get(
  "/api/v1/staff/recruitment-requests",
  requireAuth,
  allow("administrator", "agency_staff"),
  async (_req, res, next) => {
    try {
      const [requests] = await db().query(
        "SELECT sr.id,sr.reference_code,sr.role_needed,sr.location,sr.requirements,sr.status,u.id employer_user_id,sr.email FROM staffing_requests sr LEFT JOIN users u ON u.email=sr.email AND u.role='employer' WHERE sr.status IN ('new','contacted','confirmed','matching','shortlisted') ORDER BY sr.created_at DESC LIMIT 100",
      );
      res.json({ requests });
    } catch (e) {
      next(e);
    }
  },
);
app.get(
  "/api/v1/staff/matches/:requestId",
  requireAuth,
  allow("administrator", "agency_staff"),
  async (req, res, next) => {
    try {
      const [requests] = await db().execute(
        "SELECT id,role_needed,location,requirements FROM staffing_requests WHERE id=? LIMIT 1",
        [req.params.requestId],
      );
      if (!requests[0])
        return res.status(404).json({ message: "Staffing request not found." });
      const [candidates] = await db().query(
        "SELECT cp.user_id,cp.full_name,cp.profession,cp.location,cp.availability_status FROM candidate_profiles cp JOIN users u ON u.id=cp.user_id AND u.status='active' JOIN candidate_verification_checks identity_check ON identity_check.candidate_user_id=cp.user_id AND identity_check.check_code='identity' AND identity_check.status='verified' JOIN candidate_verification_checks phone_check ON phone_check.candidate_user_id=cp.user_id AND phone_check.check_code='phone_call' AND phone_check.status='verified' WHERE cp.availability_status='available' LIMIT 200",
      );
      const matches = candidates
        .map((candidate) => ({
          candidate,
          ...scoreCandidate(requests[0], candidate),
        }))
        .sort((a, b) => b.score - a.score);
      res.json({
        understoodAs: {
          role: requests[0].role_needed,
          location: requests[0].location,
        },
        matches,
        notice:
          "Plain-English details were normalized into role and location signals. Staff must verify every fact before sharing a shortlist.",
      });
    } catch (e) {
      next(e);
    }
  },
);
app.post(
  "/api/v1/staff/shortlists",
  requireAuth,
  allow("administrator", "agency_staff"),
  async (req, res, next) => {
    try {
      const v = z
        .object({
          employerUserId: z.coerce.number().int().positive(),
          staffingRequestId: z.coerce.number().int().positive(),
          candidateUserIds: z
            .array(z.coerce.number().int().positive())
            .min(1)
            .max(6),
        })
        .parse(req.body);
      const [requests] = await db().execute(
        "SELECT id,role_needed,location,requirements FROM staffing_requests WHERE id=?",
        [v.staffingRequestId],
      );
      if (!requests[0])
        return res.status(404).json({ message: "Staffing request not found." });
      const placeholders = v.candidateUserIds.map(() => "?").join(",");
      const [candidates] = await db().execute(
        `SELECT cp.user_id,cp.full_name,cp.profession,cp.location,cp.availability_status FROM candidate_profiles cp JOIN users u ON u.id=cp.user_id AND u.status='active' JOIN candidate_verification_checks identity_check ON identity_check.candidate_user_id=cp.user_id AND identity_check.check_code='identity' AND identity_check.status='verified' JOIN candidate_verification_checks phone_check ON phone_check.candidate_user_id=cp.user_id AND phone_check.check_code='phone_call' AND phone_check.status='verified' WHERE cp.user_id IN (${placeholders}) AND cp.availability_status='available'`,
        v.candidateUserIds,
      );
      const conn = await db().getConnection();
      try {
        await conn.beginTransaction();
        const [created] = await conn.execute(
          "INSERT INTO employer_shortlists(employer_user_id,staffing_request_id,status,shared_at,created_by) VALUES(?,?,'shared',UTC_TIMESTAMP(),?)",
          [v.employerUserId, v.staffingRequestId, req.user.id],
        );
        for (const c of candidates) {
          const match = scoreCandidate(requests[0], c),
            summary = `${c.profession}. General location: ${c.location}. Availability: ${c.availability_status}.`;
          await conn.execute(
            "INSERT INTO shortlist_candidates(shortlist_id,candidate_user_id,public_summary,match_score,match_reasons) VALUES(?,?,?,?,?)",
            [
              created.insertId,
              c.user_id,
              summary,
              match.score,
              JSON.stringify(match.reasons),
            ],
          );
        }
        await conn.commit();
      } catch (e) {
        await conn.rollback();
        throw e;
      } finally {
        conn.release();
      }
      res
        .status(201)
        .json({ message: "Approved shortlist shared with the employer." });
    } catch (e) {
      next(e);
    }
  },
);
app.put(
  "/api/v1/client/shortlists/:shortlistId/candidates/:candidateId",
  requireAuth,
  allow("employer"),
  async (req, res, next) => {
    try {
      const ids = z
          .object({
            shortlistId: z.coerce.number().int().positive(),
            candidateId: z.coerce.number().int().positive(),
          })
          .parse(req.params),
        v = z
          .object({
            response: z.enum([
              "preferred",
              "interview_requested",
              "not_preferred",
            ]),
            note: z.string().max(1000).optional(),
          })
          .parse(req.body);
      const [owned] = await db().execute(
        "SELECT id FROM employer_shortlists WHERE id=? AND employer_user_id=? AND status IN ('shared','responded')",
        [ids.shortlistId, req.user.id],
      );
      if (!owned.length)
        return res.status(404).json({ message: "Shortlist not found." });
      await db().execute(
        "UPDATE shortlist_candidates SET employer_response=?,employer_note=?,responded_at=UTC_TIMESTAMP() WHERE shortlist_id=? AND candidate_user_id=?",
        [v.response, v.note || null, ids.shortlistId, ids.candidateId],
      );
      await db().execute(
        "UPDATE employer_shortlists SET status='responded' WHERE id=?",
        [ids.shortlistId],
      );
      res.json({
        message:
          "Your preference was shared with the agency. The agency will coordinate the next step.",
      });
    } catch (e) {
      next(e);
    }
  },
);
app.get(
  "/api/v1/staff/candidates/:candidateId",
  requireAuth,
  allow("administrator", "agency_staff"),
  async (req, res, next) => {
    try {
      const id = z.coerce
        .number()
        .int()
        .positive()
        .parse(req.params.candidateId);
      const [[profiles], [documents], [checks]] = await Promise.all([
        db().execute(
          "SELECT cp.user_id,cp.full_name,cp.phone,cp.profession,cp.location,cp.availability_status,cp.profile_completion,cd.date_of_birth,cd.education_level,u.email,u.status FROM candidate_profiles cp JOIN users u ON u.id=cp.user_id LEFT JOIN candidate_private_details cd ON cd.candidate_user_id=cp.user_id WHERE cp.user_id=?",
          [id],
        ),
        db().execute(
          "SELECT id,document_type,original_name,mime_type,file_size,status,created_at FROM candidate_documents WHERE candidate_user_id=? ORDER BY created_at DESC",
          [id],
        ),
        db().execute(
          "SELECT check_code,status,note,updated_at FROM candidate_verification_checks WHERE candidate_user_id=?",
          [id],
        ),
      ]);
      if (!profiles[0])
        return res.status(404).json({ message: "Candidate not found." });
      res.json({ profile: profiles[0], documents, checks });
    } catch (e) {
      next(e);
    }
  },
);
app.put(
  "/api/v1/staff/candidates/:candidateId/verification",
  requireAuth,
  allow("administrator", "agency_staff"),
  async (req, res, next) => {
    try {
      const candidateId = z.coerce
        .number()
        .int()
        .positive()
        .parse(req.params.candidateId);
      const v = z
        .object({
          checkCode: z.enum([
            "phone_call",
            "identity",
            "passport_photo",
            "cv",
            "certificates",
            "references",
            "interview",
            "availability",
          ]),
          status: z.enum([
            "pending",
            "in_review",
            "verified",
            "needs_attention",
            "not_required",
          ]),
          note: z.string().max(1000).optional(),
        })
        .parse(req.body);
      const [candidate] = await db().execute(
        "SELECT id FROM users WHERE id=? AND role='candidate'",
        [candidateId],
      );
      if (!candidate.length)
        return res.status(404).json({ message: "Candidate not found." });
      await db().execute(
        "INSERT INTO candidate_verification_checks(candidate_user_id,check_code,status,note,updated_by) VALUES(?,?,?,?,?) ON DUPLICATE KEY UPDATE status=VALUES(status),note=VALUES(note),updated_by=VALUES(updated_by)",
        [candidateId, v.checkCode, v.status, v.note || null, req.user.id],
      );
      await db().execute(
        "INSERT INTO audit_logs(actor_user_id,action,entity_type,entity_id,metadata) VALUES(?,'candidate.verification.update','candidate',?,JSON_OBJECT('check',?,'status',?))",
        [req.user.id, String(candidateId), v.checkCode, v.status],
      );
      res.json({ message: "Verification checklist updated." });
    } catch (e) {
      next(e);
    }
  },
);
app.put(
  "/api/v1/candidate/preferences",
  requireAuth,
  allow("candidate"),
  async (req, res, next) => {
    try {
      const v = z
        .object({
          bestRole: z.string().max(120).optional(),
          otherRoles: z.string().max(500).optional(),
          preferredLocation: z.string().max(160).optional(),
          workArrangement: z.enum(["live_in", "live_out", "either"]),
          employmentType: z.enum(["full_time", "part_time", "contract", "any"]),
          minimumSalary: z.coerce.number().min(0).optional(),
          expectedSalary: z.coerce.number().min(0).optional(),
          availableFrom: z.string().optional(),
          willingToRelocate: z.boolean().default(false),
        })
        .parse(req.body);
      await db().execute(
        "INSERT INTO candidate_preferences(candidate_user_id,best_role,other_roles,preferred_location,work_arrangement,employment_type,minimum_salary,expected_salary,available_from,willing_to_relocate) VALUES(?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE best_role=VALUES(best_role),other_roles=VALUES(other_roles),preferred_location=VALUES(preferred_location),work_arrangement=VALUES(work_arrangement),employment_type=VALUES(employment_type),minimum_salary=VALUES(minimum_salary),expected_salary=VALUES(expected_salary),available_from=VALUES(available_from),willing_to_relocate=VALUES(willing_to_relocate)",
        [
          req.user.id,
          v.bestRole || null,
          v.otherRoles || null,
          v.preferredLocation || null,
          v.workArrangement,
          v.employmentType,
          v.minimumSalary || null,
          v.expectedSalary || null,
          v.availableFrom || null,
          v.willingToRelocate,
        ],
      );
      res.json({
        message:
          "Work preferences updated. Future matching will use these details.",
      });
    } catch (e) {
      next(e);
    }
  },
);
app.put(
  "/api/v1/staff/applications/:applicationId/status",
  requireAuth,
  allow("administrator", "agency_staff"),
  async (req, res, next) => {
    try {
      const id = z.coerce
          .number()
          .int()
          .positive()
          .parse(req.params.applicationId),
        v = z
          .object({
            status: z.enum([
              "received",
              "under_review",
              "documents_needed",
              "verification",
              "matched",
              "interview",
              "awaiting_placement",
              "selected",
              "placed",
              "not_selected",
              "talent_pool",
            ]),
            candidateNote: z.string().max(1000).optional(),
          })
          .parse(req.body);
      const [rows] = await db().execute(
        "SELECT candidate_user_id,status FROM applications WHERE id=?",
        [id],
      );
      if (!rows[0])
        return res.status(404).json({ message: "Application not found." });
      const conn = await db().getConnection();
      try {
        await conn.beginTransaction();
        await conn.execute("UPDATE applications SET status=? WHERE id=?", [
          v.status,
          id,
        ]);
        await conn.execute(
          "INSERT INTO application_status_history(application_id,previous_status,new_status,candidate_note,changed_by) VALUES(?,?,?,?,?)",
          [id, rows[0].status, v.status, v.candidateNote || null, req.user.id],
        );
        if (v.candidateNote)
          await conn.execute(
            "INSERT INTO candidate_messages(candidate_user_id,title,message,message_type,created_by) VALUES(?,?,?,?,?)",
            [
              rows[0].candidate_user_id,
              v.status === "selected"
                ? "Congratulations — you have been selected"
                : "Application update",
              v.candidateNote,
              v.status === "selected"
                ? "congratulations"
                : v.status === "placed"
                  ? "placement_instruction"
                  : "information",
              req.user.id,
            ],
          );
        await conn.commit();
      } catch (e) {
        await conn.rollback();
        throw e;
      } finally {
        conn.release();
      }
      res.json({ message: "Candidate-visible progress updated." });
    } catch (e) {
      next(e);
    }
  },
);
app.post(
  "/api/v1/candidate/documents",
  requireAuth,
  allow("candidate"),
  privateUpload.single("document"),
  async (req, res, next) => {
    try {
      if (!req.file)
        return res
          .status(400)
          .json({ message: "Choose a PDF, JPG or PNG file up to 8 MB." });
      const { documentType } = z
        .object({
          documentType: z.enum([
            "national_id",
            "passport_photo",
            "cv",
            "certificate",
            "recommendation",
            "police_clearance",
            "driving_licence",
          ]),
        })
        .parse(req.body);
      await db().execute(
        "INSERT INTO candidate_documents(candidate_user_id,document_type,storage_key,original_name,mime_type,file_size) VALUES(?,?,?,?,?,?)",
        [
          req.user.id,
          documentType,
          req.file.filename,
          req.file.originalname.slice(0, 255),
          req.file.mimetype,
          req.file.size,
        ],
      );
      res.status(201).json({
        message: "Document uploaded privately and queued for agency review.",
      });
    } catch (e) {
      next(e);
    }
  },
);
app.get(
  "/api/v1/documents/:documentId/preview",
  requireAuth,
  async (req, res, next) => {
    try {
      const id = z.coerce
        .number()
        .int()
        .positive()
        .parse(req.params.documentId);
      const [rows] = await db().execute(
        "SELECT id,candidate_user_id,storage_key,original_name,mime_type FROM candidate_documents WHERE id=?",
        [id],
      );
      const doc = rows[0];
      if (!doc) return res.status(404).json({ message: "Document not found." });
      if (
        req.user.role === "candidate" &&
        doc.candidate_user_id !== req.user.id
      )
        return res.status(403).json({ message: "Access denied." });
      if (req.user.role === "employer")
        return res.status(403).json({
          message: "Identity documents are not available to employers.",
        });
      const safePath = path.join(uploadRoot, path.basename(doc.storage_key));
      res.setHeader("Content-Type", doc.mime_type);
      res.setHeader(
        "Content-Disposition",
        `inline; filename*=UTF-8''${encodeURIComponent(doc.original_name)}`,
      );
      res.setHeader("Cache-Control", "private, no-store");
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.removeHeader("X-Frame-Options");
      res.setHeader(
        "Content-Security-Policy",
        `default-src 'none'; frame-ancestors ${config.FRONTEND_URL}`,
      );
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      await db().execute(
        "INSERT INTO audit_logs(actor_user_id,action,entity_type,entity_id) VALUES(?,'document.preview','candidate_document',?)",
        [req.user.id, String(id)],
      );
      createReadStream(safePath).on("error", next).pipe(res);
    } catch (e) {
      next(e);
    }
  },
);
app.get("/api/v1/articles", async (_req, res, next) => {
  try {
    const [articles] = await db().query(
      "SELECT cp.slug,cp.title,cp.excerpt,cp.published_at,ci.storage_key cover_image FROM content_posts cp LEFT JOIN content_post_images ci ON ci.post_id=cp.id WHERE cp.status='published' ORDER BY cp.published_at DESC LIMIT 30",
    );
    res.json({ articles });
  } catch (e) {
    next(e);
  }
});
app.get("/api/v1/articles/:slug", async (req, res, next) => {
  try {
    const [rows] = await db().execute(
      "SELECT cp.slug,cp.title,cp.excerpt,cp.content,cp.published_at,ci.storage_key cover_image FROM content_posts cp LEFT JOIN content_post_images ci ON ci.post_id=cp.id WHERE cp.slug=? AND cp.status='published' LIMIT 1",
      [req.params.slug],
    );
    if (!rows[0])
      return res.status(404).json({ message: "Article not found." });
    res.json({ article: rows[0] });
  } catch (e) {
    next(e);
  }
});
app.get(
  "/api/v1/staff/articles",
  requireAuth,
  allow("administrator", "agency_staff"),
  async (req, res, next) => {
    try {
      const [articles] = await db().execute(
        "SELECT cp.id,cp.slug,cp.title,cp.excerpt,cp.status,cp.review_note,cp.updated_at,u.email author_email FROM content_posts cp JOIN users u ON u.id=cp.author_user_id WHERE ?='administrator' OR cp.author_user_id=? ORDER BY cp.updated_at DESC",
        [req.user.role, req.user.id],
      );
      res.json({ articles });
    } catch (e) {
      next(e);
    }
  },
);
app.post(
  "/api/v1/staff/articles",
  requireAuth,
  allow("administrator", "agency_staff"),
  async (req, res, next) => {
    try {
      const v = z
        .object({
          title: z.string().min(8).max(180),
          excerpt: z.string().min(20).max(320),
          content: z.string().min(200).max(100000),
          submit: z.boolean().default(false),
        })
        .parse(req.body);
      const base = v.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 150);
      const slug = `${base}-${crypto.randomBytes(3).toString("hex")}`;
      const [created] = await db().execute(
        "INSERT INTO content_posts(slug,title,excerpt,content,status,author_user_id) VALUES(?,?,?,?,?,?)",
        [
          slug,
          v.title,
          v.excerpt,
          cleanArticleHtml(v.content),
          v.submit ? "pending_approval" : "draft",
          req.user.id,
        ],
      );
      res.status(201).json({
        id: created.insertId,
        message: v.submit
          ? "Article sent for administrator approval."
          : "Draft saved.",
        slug,
      });
    } catch (e) {
      next(e);
    }
  },
);
app.post(
  "/api/v1/staff/articles/:id/cover",
  requireAuth,
  allow("administrator", "agency_staff"),
  articleImageUpload.single("image"),
  async (req, res, next) => {
    try {
      if (!req.file)
        return res
          .status(400)
          .json({ message: "Upload a JPG, PNG or WebP image up to 2 MB." });
      const id = z.coerce.number().int().positive().parse(req.params.id);
      const [[post]] = await db().execute(
        "SELECT id FROM content_posts WHERE id=? AND (?='administrator' OR author_user_id=?)",
        [id, req.user.role, req.user.id],
      );
      if (!post) return res.status(404).json({ message: "Article not found." });
      await db().execute(
        "INSERT INTO content_post_images(post_id,storage_key,mime_type,file_size) VALUES(?,?,?,?) ON DUPLICATE KEY UPDATE storage_key=VALUES(storage_key),mime_type=VALUES(mime_type),file_size=VALUES(file_size)",
        [id, req.file.filename, req.file.mimetype, req.file.size],
      );
      res.json({ message: "Cover image uploaded." });
    } catch (e) {
      next(e);
    }
  },
);
app.get(
  "/api/v1/staff/articles/:id",
  requireAuth,
  allow("administrator", "agency_staff"),
  async (req, res, next) => {
    try {
      const id = z.coerce.number().int().positive().parse(req.params.id);
      const [rows] = await db().execute(
        "SELECT id,title,excerpt,content,status FROM content_posts WHERE id=? AND (?='administrator' OR author_user_id=?)",
        [id, req.user.role, req.user.id],
      );
      if (!rows[0])
        return res.status(404).json({ message: "Article not found." });
      res.json({ article: rows[0] });
    } catch (e) {
      next(e);
    }
  },
);
app.put(
  "/api/v1/staff/articles/:id",
  requireAuth,
  allow("administrator", "agency_staff"),
  async (req, res, next) => {
    try {
      const id = z.coerce.number().int().positive().parse(req.params.id),
        v = z
          .object({
            title: z.string().min(8).max(180),
            excerpt: z.string().min(20).max(320),
            content: z.string().min(200).max(100000),
            submit: z.boolean().default(false),
          })
          .parse(req.body);
      const [result] = await db().execute(
        "UPDATE content_posts SET title=?,excerpt=?,content=?,status=?,review_note=NULL,published_at=NULL WHERE id=? AND (?='administrator' OR author_user_id=?) AND (?='administrator' OR status<>'published')",
        [
          v.title,
          v.excerpt,
          cleanArticleHtml(v.content),
          v.submit ? "pending_approval" : "draft",
          id,
          req.user.role,
          req.user.id,
          req.user.role,
        ],
      );
      if (!result.affectedRows)
        return res.status(400).json({
          message:
            "Published articles must be withdrawn by an administrator before editing.",
        });
      res.json({
        message: v.submit
          ? "Changes submitted for approval."
          : "Draft updated.",
      });
    } catch (e) {
      next(e);
    }
  },
);
app.delete(
  "/api/v1/staff/articles/:id",
  requireAuth,
  allow("administrator", "agency_staff"),
  async (req, res, next) => {
    try {
      const id = z.coerce.number().int().positive().parse(req.params.id);
      const [[image]] = await db().execute(
        "SELECT ci.storage_key FROM content_post_images ci JOIN content_posts cp ON cp.id=ci.post_id WHERE cp.id=? AND (?='administrator' OR cp.author_user_id=?) AND (?='administrator' OR cp.status<>'published')",
        [id, req.user.role, req.user.id, req.user.role],
      );
      const [result] = await db().execute(
        "DELETE FROM content_posts WHERE id=? AND (?='administrator' OR author_user_id=?) AND (?='administrator' OR status<>'published')",
        [id, req.user.role, req.user.id, req.user.role],
      );
      if (!result.affectedRows)
        return res
          .status(403)
          .json({ message: "This article cannot be deleted." });
      if (image?.storage_key)
        await unlink(
          path.join(articleImageRoot, path.basename(image.storage_key)),
        ).catch(() => {});
      res.json({ message: "Article deleted." });
    } catch (e) {
      next(e);
    }
  },
);
app.get("/api/v1/media/articles/:filename", async (req, res, next) => {
  try {
    const filename = path.basename(req.params.filename);
    const [[image]] = await db().execute(
      "SELECT mime_type FROM content_post_images WHERE storage_key=?",
      [filename],
    );
    if (!image) return res.status(404).end();
    res.setHeader("Content-Type", image.mime_type);
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    createReadStream(path.join(articleImageRoot, filename))
      .on("error", next)
      .pipe(res);
  } catch (e) {
    next(e);
  }
});
app.put(
  "/api/v1/admin/articles/:id/review",
  requireAuth,
  allow("administrator"),
  async (req, res, next) => {
    try {
      const id = z.coerce.number().int().positive().parse(req.params.id);
      const v = z
        .object({
          decision: z.enum(["published", "rejected"]),
          note: z.string().max(500).optional(),
        })
        .parse(req.body);
      await db().execute(
        "UPDATE content_posts SET status=?,review_note=?,reviewed_by=?,published_at=IF(?='published',UTC_TIMESTAMP(),NULL) WHERE id=? AND status='pending_approval'",
        [v.decision, v.note || null, req.user.id, v.decision, id],
      );
      res.json({
        message:
          v.decision === "published"
            ? "Article approved and published."
            : "Article returned to the author.",
      });
    } catch (e) {
      next(e);
    }
  },
);
app.get("/api/v1/knowledge", requireAuth, async (req, res, next) => {
  try {
    const audience =
      req.user.role === "candidate"
        ? "candidate"
        : req.user.role === "employer"
          ? "employer"
          : "staff";
    const [items] = await db().execute(
      "SELECT ki.id,ki.slug,ki.audience,ki.category,ki.title,ki.summary,ki.content,ki.version,ki.requires_acknowledgement,ki.updated_at,ka.acknowledged_version,ka.acknowledged_at FROM knowledge_items ki LEFT JOIN knowledge_acknowledgements ka ON ka.knowledge_item_id=ki.id AND ka.user_id=? WHERE ki.is_published=TRUE AND (ki.audience='all' OR ki.audience=? OR ?='staff') ORDER BY ki.category,ki.title",
      [req.user.id, audience, audience],
    );
    res.json({ items });
  } catch (error) {
    next(error);
  }
});
app.post(
  "/api/v1/knowledge/:id/acknowledge",
  requireAuth,
  async (req, res, next) => {
    try {
      const id = z.coerce.number().int().positive().parse(req.params.id);
      const [[item]] = await db().execute(
        "SELECT id,version FROM knowledge_items WHERE id=? AND is_published=TRUE",
        [id],
      );
      if (!item)
        return res.status(404).json({ message: "Guidance not found." });
      const ipHash = crypto
        .createHash("sha256")
        .update(req.ip || "")
        .digest("hex");
      await db().execute(
        "INSERT INTO knowledge_acknowledgements(knowledge_item_id,user_id,acknowledged_version,ip_address) VALUES(?,?,?,?) ON DUPLICATE KEY UPDATE acknowledged_version=VALUES(acknowledged_version),acknowledged_at=UTC_TIMESTAMP(),ip_address=VALUES(ip_address)",
        [id, req.user.id, item.version, ipHash],
      );
      res.json({ message: "Your acknowledgement has been recorded." });
    } catch (error) {
      next(error);
    }
  },
);
app.put(
  "/api/v1/staff/knowledge/:id",
  requireAuth,
  allow("administrator", "agency_staff"),
  async (req, res, next) => {
    try {
      const id = z.coerce.number().int().positive().parse(req.params.id);
      const value = z
        .object({
          title: z.string().min(5).max(180),
          summary: z.string().min(15).max(320),
          content: z.string().min(100).max(100000),
          requiresAcknowledgement: z.boolean().default(true),
        })
        .parse(req.body);
      await db().execute(
        "UPDATE knowledge_items SET title=?,summary=?,content=?,requires_acknowledgement=?,version=version+1,updated_by=? WHERE id=?",
        [
          value.title,
          value.summary,
          cleanArticleHtml(value.content),
          value.requiresAcknowledgement,
          req.user.id,
          id,
        ],
      );
      await db().execute(
        "INSERT INTO staff_activity(staff_user_id,action_code,entity_type,entity_id,context) VALUES(?,'knowledge.updated','knowledge_item',?,JSON_OBJECT('title',?))",
        [req.user.id, String(id), value.title],
      );
      res.json({
        message: "Guidance updated. Users must accept the new version.",
      });
    } catch (error) {
      next(error);
    }
  },
);
app.get(
  "/api/v1/candidate/applications",
  requireAuth,
  allow("candidate"),
  async (req, res, next) => {
    try {
      const [applications] = await db().execute(
        "SELECT a.id,a.status,a.created_at,a.updated_at,j.title,j.reference_code,j.location,j.employment_type FROM applications a LEFT JOIN jobs j ON j.id=a.job_id WHERE a.candidate_user_id=? ORDER BY a.updated_at DESC",
        [req.user.id],
      );
      res.json({ applications });
    } catch (error) {
      next(error);
    }
  },
);
app.get(
  "/api/v1/staff/activity",
  requireAuth,
  allow("administrator", "agency_staff"),
  async (req, res, next) => {
    try {
      const [[recorded], [audited]] = await Promise.all([
        db().execute(
          "SELECT CONCAT('S',sa.id) id,sa.action_code,sa.entity_type,sa.entity_id,sa.context,sa.created_at,u.email staff_email FROM staff_activity sa JOIN users u ON u.id=sa.staff_user_id ORDER BY sa.created_at DESC LIMIT 200",
        ),
        db().execute(
          "SELECT CONCAT('A',al.id) id,al.action action_code,al.entity_type,COALESCE(al.entity_id,'') entity_id,al.metadata context,al.created_at,u.email staff_email FROM audit_logs al JOIN users u ON u.id=al.actor_user_id WHERE u.role IN ('administrator','agency_staff') ORDER BY al.created_at DESC LIMIT 200",
        ),
      ]);
      const activity = [...recorded, ...audited]
        .sort(
          (left, right) =>
            new Date(right.created_at) - new Date(left.created_at),
        )
        .slice(0, 200);
      res.json({ activity });
    } catch (error) {
      next(error);
    }
  },
);
app.get("/health", async (_req, res) => {
  try {
    await db().query("SELECT 1");
    res.json({ status: "ok" });
  } catch {
    res.status(503).json({ status: "unavailable" });
  }
});
app.use((err, _req, res, _next) => {
  void _next;
  if (err instanceof multer.MulterError)
    return res.status(err.code === "LIMIT_FILE_SIZE" ? 413 : 400).json({
      message:
        err.code === "LIMIT_FILE_SIZE"
          ? "The uploaded file is larger than the permitted limit."
          : "The uploaded file was not accepted.",
    });
  if (err instanceof z.ZodError)
    return res.status(400).json({
      message: "Please check the supplied details.",
      issues: err.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      })),
    });
  console.error(err);
  res.status(500).json({ message: "The request could not be completed." });
});
app.listen(config.PORT, () =>
  console.log(`Double M API listening on ${config.PORT}`),
);
