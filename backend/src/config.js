import "dotenv/config";
import { z } from "zod";
export const config = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    PORT: z.coerce.number().default(4000),
    FRONTEND_URL: z.string().url(),
    DATABASE_HOST: z.string(),
    DATABASE_PORT: z.coerce.number().default(3306),
    DATABASE_NAME: z.string(),
    DATABASE_USER: z.string(),
    DATABASE_PASSWORD: z.string().default(""),
    JWT_SECRET: z.string().min(32),
    GOOGLE_CLIENT_ID: z.string().optional(),
    MPESA_CALLBACK_TOKEN: z.string().min(24).optional(),
    COOKIE_DOMAIN: z.string().optional(),
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().default(587),
    SMTP_SECURE: z.string().default("false"),
    SMTP_USER: z.string().optional(),
    SMTP_PASSWORD: z.string().optional(),
    EMAIL_FROM: z
      .string()
      .default("Double M Agency <hello@doublemagency.co.ke>"),
    APP_URL: z.string().url().default("http://localhost:3000"),
    UPLOAD_DIR: z.string().default("./private-uploads"),
  })
  .parse(process.env);
