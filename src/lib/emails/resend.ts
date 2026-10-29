import { Resend } from "resend";
import * as React from "react";

// Initialize Resend with the API key from the environment
// We use a dummy value during build time if it's missing to prevent build failures.
const apiKey = process.env.RESEND_API_KEY || "re_dummy_key_for_build_only";
export const resend = new Resend(apiKey);

export const SENDER_EMAIL = "noreply@employability360.com";

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  react: React.ReactElement;
  replyTo?: string | string[];
}

/**
 * Utility function to send an email using Resend and React Email.
 */
export async function sendEmail({ to, subject, react, replyTo }: SendEmailOptions) {
  // Prevent actually trying to send emails if the API key isn't configured in dev/build
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY is not configured. Simulating email send:", {
      to,
      subject,
    });
    return { success: true, id: "simulated-id" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: `Employability 360° <${SENDER_EMAIL}>`,
      to,
      subject,
      replyTo,
      react,
    });

    if (error) {
      console.error("Resend email error:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Unexpected error sending email:", error);
    return { success: false, error };
  }
}
