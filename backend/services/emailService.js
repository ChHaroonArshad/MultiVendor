import { transporter } from "../config/mailer.js";
import { env } from "../config/env.js";

export async function sendVerificationEmail(email, token) {
  const verifyUrl = `${env.clientUrl}/verify-email?token=${token}`;
await transporter.sendMail({
  from: process.env.EMAIL_USER,   // was process.env.EMAIL_FROM
  to: email,
  subject: "Verify your email address",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h2 style="color:#111111;">Verify your email</h2>
        <p style="color:#6B6B6B; font-size:14px;">
          Thanks for signing up. Please confirm your email address to activate your account.
        </p>
        <a href="${verifyUrl}"
           style="display:inline-block; margin-top:16px; padding:12px 24px;
                  background:#111111; color:#ffffff; text-decoration:none;
                  border-radius:999px; font-size:14px;">
          Verify Email
        </a>
        <p style="color:#B0B0B0; font-size:12px; margin-top:24px;">
          This link expires in 24 hours. If you didn't create this account, you can ignore this email.
        </p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(email, token) {
  const resetUrl = `${env.clientUrl}/reset-password?token=${token}`;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Reset your password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h2 style="color:#111111;">Reset your password</h2>
        <p style="color:#6B6B6B; font-size:14px;">
          We received a request to reset your password. Click below to choose a new one.
        </p>
        <a href="${resetUrl}"
           style="display:inline-block; margin-top:16px; padding:12px 24px;
                  background:#111111; color:#ffffff; text-decoration:none;
                  border-radius:999px; font-size:14px;">
          Reset Password
        </a>
        <p style="color:#B0B0B0; font-size:12px; margin-top:24px;">
          This link expires in 1 hour. If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}







export async function sendProductRejectionEmail(email, sellerName, productName, reason) {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Your product "${productName}" was not approved`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h2 style="color:#111111;">Product not approved</h2>
        <p style="color:#6B6B6B; font-size:14px;">
          Hi ${sellerName}, your product <strong style="color:#111111;">"${productName}"</strong> was reviewed and was not approved for the marketplace.
        </p>
        <div style="background:#FBEAEA; border:1px solid #F5C6C6; border-radius:12px; padding:16px; margin-top:16px;">
          <p style="color:#C0392B; font-size:13px; font-weight:bold; margin:0 0 6px 0;">Reason</p>
          <p style="color:#C0392B; font-size:14px; margin:0;">${reason}</p>
        </div>
        <p style="color:#6B6B6B; font-size:14px; margin-top:20px;">
          You can update the listing and resubmit it for review from your seller dashboard.
        </p>
        <a href="${env.clientUrl}/seller/products"
           style="display:inline-block; margin-top:16px; padding:12px 24px;
                  background:#111111; color:#ffffff; text-decoration:none;
                  border-radius:999px; font-size:14px;">
          Go to My Products
        </a>
        <p style="color:#B0B0B0; font-size:12px; margin-top:24px;">
          If you believe this was a mistake, please contact our support team.
        </p>
      </div>
    `,
  });
}