import dotenv from "dotenv";

dotenv.config();

const requiredEnv = [
  "DATABASE_URL",
  "JWT_SECRET",
];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const env = {
  port: Number(process.env.PORT) || 5000,

  databaseUrl: process.env.DATABASE_URL!,

  jwtSecret: process.env.JWT_SECRET!,

  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",

  nodeEnv: process.env.NODE_ENV || "development",

  googleClientId: process.env.GOOGLE_CLIENT_ID || "",

  // Razorpay Payment Gateway Configuration
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || "rzp_test_eCommerceDemoKey123",
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || "eCommerceDemoSecret456789",
  razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || "eCommerceWebhookSecretDemo123",

  // Frontend & Backend URLs for Links & Static Assets in Emails & Notifications
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
  backendUrl: process.env.BACKEND_URL || (process.env.PORT ? `http://localhost:${process.env.PORT}` : "http://localhost:5000"),

  // SMTP Mail Server Configuration
  smtpHost: process.env.SMTP_HOST || "smtp.gmail.com",
  smtpPort: Number(process.env.SMTP_PORT) || 587,
  smtpSecure: process.env.SMTP_SECURE === "true",
  smtpUser: process.env.SMTP_USER || "",
  smtpPass: process.env.SMTP_PASS || "",
  smtpFrom: process.env.SMTP_FROM || '"E-Commerce Store" <no-reply@ecommerce.com>',
};