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
    "INSERT INTO site_settings(setting_key,setting_value) VALUES('contact_phone','0792613346'),('contact_email','doublemagency56@gmail.com'),('office_address','Kenya'),('business_hours','Monday to Friday, 8:00 AM to 5:00 PM') ON DUPLICATE KEY UPDATE setting_value=IF(setting_value='',VALUES(setting_value),setting_value)",
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
  const [[manualTemplate]] = await conn.execute(
    "SELECT id FROM contract_templates WHERE name='Agency placement agreement' LIMIT 1",
  );
  if (!manualTemplate) {
    await conn.execute(
      "UPDATE contract_templates SET is_active=FALSE WHERE is_active=TRUE",
    );
    await conn.execute(
      "INSERT INTO contract_templates(name,version,terms_html,updated_by) VALUES('Agency placement agreement',2,?,?)",
      [
        "<h2>Agency placement agreement</h2><p>This agreement is made on <strong>{{contract_date}}</strong> between <strong>{{employer_name}}</strong> and <strong>{{candidate_name}}</strong> for the role of <strong>{{role_title}}</strong>.</p><h3>Term and salary</h3><p>The placement begins on {{start_date}} and ends on {{end_date}}. The anticipated monthly salary is <strong>{{salary_amount}}</strong>. Salary remains a matter agreed between employer and employee and must comply with applicable law.</p><h3>Agency charges</h3><p>The employer office charge is <strong>{{agency_fee_amount}}</strong>. The candidate agency contribution recorded for this placement is <strong>{{candidate_fee_amount}}</strong>. Payments are receipted after verification and are non-refundable or non-transferable except where an eligible replacement applies.</p><h3>Responsibilities</h3><p>The employer is responsible for the employee during the contract, including agreed pay, working conditions and safety. Any required medical test is paid for by the employer unless the parties record a different lawful agreement.</p><h3>Replacement</h3><p>Up to two eligible replacements may be considered within the first month. A complaint must be recorded through the agency. Days already worked remain payable. A replacement changes the placement record and requires a formal amendment and fresh acceptance.</p><h3>Conduct and property</h3><p>Both parties must act lawfully, honestly and respectfully. The agency screens and supports placements but cannot guarantee future conduct. Complaints, loss or damage will be reviewed according to the facts, signed terms and applicable law.</p><h3>Declaration</h3><p>Both parties confirm that they have reviewed the role, salary, agency charges, duties and current agency procedures before signing.</p>",
        admin.id,
      ],
    );
  }
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
  const knowledge = [
    [
      "candidate-code-of-conduct",
      "candidate",
      "Conduct",
      "Candidate code of conduct",
      "The standards expected before, during and after placement.",
      "<h2>Professional conduct</h2><p>Give accurate information, attend agreed interviews, communicate changes early and treat employers, families, colleagues and agency staff respectfully.</p><h2>At work</h2><p>Follow lawful instructions, protect privacy, care for property, observe safety procedures and never use violence, threats, theft or harassment.</p><h2>Leaving a role</h2><p>Contact the agency and provide the notice stated in your contract. Return property and personal belongings through an orderly handover.</p>",
      1,
    ],
    [
      "candidate-placement-process",
      "candidate",
      "Process",
      "Your recruitment and placement process",
      "What happens from registration to placement and follow-up.",
      "<h2>Registration and verification</h2><p>Complete your profile and provide requested documents. The agency reviews identity, experience, references and availability.</p><h2>Matching</h2><p>Suitable verified candidates may be shortlisted for a role. A shortlist is not a job guarantee; the employer and agency complete the selection.</p><h2>Placement</h2><p>Read the role, salary, duties and contract before signing. Keep your copy and contact the agency if the agreed work changes.</p>",
      1,
    ],
    [
      "candidate-rights-and-safety",
      "candidate",
      "Rights and safety",
      "Candidate rights and safety",
      "Clear expectations on dignity, pay, safety and reporting concerns.",
      "<h2>Your rights</h2><p>You should receive the agreed pay, rest, humane treatment and a safe workplace. You may ask questions before accepting a placement and receive a copy of what you sign.</p><h2>Raise concerns</h2><p>Report non-payment, violence, harassment, unsafe work or a serious change of duties to the agency promptly. In an immediate emergency, contact the appropriate emergency service first.</p>",
      1,
    ],
    [
      "employer-placement-and-replacement",
      "employer",
      "Placement",
      "Placement, complaints and replacements",
      "How responsibilities, complaints and eligible replacements are handled.",
      "<h2>Placement responsibility</h2><p>The employer is responsible for the employee during the contract and should provide the agreed duties, pay, accommodation where applicable and a safe environment.</p><h2>Replacement window</h2><p>The current agency form allows up to two eligible replacements within the first month. The agency reviews each complaint and records the outcome. Days already worked remain payable under the signed agreement.</p><h2>Changing the assigned employee</h2><p>Do not make an informal substitution. Submit a replacement request so the previous placement can be closed, the new employee verified and the contract formally amended.</p>",
      1,
    ],
    [
      "agency-payment-and-contract-process",
      "all",
      "Payments and contracts",
      "Agency payment and contract process",
      "Agency fees, receipts, signatures and contract records",
      "<h2>Before payment</h2><p>Confirm the role, agreed salary, agency fee and any candidate contribution shown in the contract. Agency charges may depend on the anticipated monthly salary and current approved fee schedule.</p><h2>Receipts</h2><p>Use the system payment reference for M-Pesa, cash or another activated method. A receipt is issued after the payment is verified.</p><h2>Contract record</h2><p>Every signed contract keeps the exact terms and template version used. Later corrections or employee replacements are recorded as amendments; the signed original is not silently changed.</p>",
      1,
    ],
  ];
  for (const item of knowledge)
    await conn.query(
      "INSERT INTO knowledge_items(slug,audience,category,title,summary,content,version,requires_acknowledgement,updated_by) VALUES(?,?,?,?,?,?,?,TRUE,?) ON DUPLICATE KEY UPDATE audience=VALUES(audience),category=VALUES(category),title=VALUES(title),summary=VALUES(summary),content=VALUES(content),version=VALUES(version),requires_acknowledgement=TRUE,updated_by=VALUES(updated_by)",
      [...item, admin.id],
    );
  const employerFees = [
    [6000, 6000, 2500],
    [7000, 7000, 3200],
    [8000, 8000, 4200],
    [9000, 9000, 5000],
    [10000, 10000, 6000],
    [11000, 11000, 6500],
    [12000, 12000, 7000],
    [13000, 13000, 7500],
    [14000, 14000, 8000],
    [15000, 15000, 8500],
    [16000, 16000, 9000],
    [17000, 17000, 9500],
    [18000, 18000, 10000],
    [19000, 19000, 10500],
    [20000, 20000, 11000],
  ];
  for (const [minimum, maximum, fee] of employerFees)
    await conn.execute(
      "INSERT INTO fee_bands(payer_role,fee_name,salary_min,salary_max,fee_amount,updated_by) SELECT 'employer','Office charge',?,?,?,? WHERE NOT EXISTS (SELECT 1 FROM fee_bands WHERE payer_role='employer' AND salary_min=? AND salary_max=?)",
      [minimum, maximum, fee, admin.id, minimum, maximum],
    );
  await conn.execute(
    "INSERT INTO payment_methods(method_code,display_name,is_active,configuration,updated_by) VALUES('mpesa','M-Pesa',TRUE,JSON_OBJECT('mode','reference_or_callback'),?),('cash','Cash',TRUE,JSON_OBJECT('verification','staff_required'),?) ON DUPLICATE KEY UPDATE display_name=VALUES(display_name)",
    [admin.id, admin.id],
  );
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
