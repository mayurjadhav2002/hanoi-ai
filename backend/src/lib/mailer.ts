import nodemailer, { type Transporter } from "nodemailer";
import { Resend } from "resend";

let transporter: Transporter | null = null;

function getResendClient(): Resend | null {
  if (process.env.RESEND_API_KEY) {
    return new Resend(process.env.RESEND_API_KEY);
  }
  return null;
}

async function getTransporter(): Promise<Transporter> {
  if (transporter) return transporter;

  const gmailUser = process.env.GMAIL_USER || (process.env.SMTP_HOST === "smtp.gmail.com" ? process.env.SMTP_USER : undefined);
  const gmailPass = process.env.GMAIL_APP_PASSWORD || (process.env.SMTP_HOST === "smtp.gmail.com" ? process.env.SMTP_PASS : undefined);

  // 1. Prioritize Gmail App Password via Nodemailer with quick connect timeout for cloud environments
  if (gmailUser && gmailPass) {
    const cleanPassword = gmailPass.replace(/\s+/g, "");
    transporter = nodemailer.createTransport({
      service: "gmail",
      connectionTimeout: 4000,
      greetingTimeout: 4000,
      socketTimeout: 4000,
      auth: {
        user: gmailUser,
        pass: cleanPassword,
      },
    });
    console.log(`[Mailer] Configured Gmail SMTP service for ${gmailUser}`);
    return transporter;
  }

  // 2. Custom SMTP host & port
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      connectionTimeout: 4000,
      greetingTimeout: 4000,
      socketTimeout: 4000,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    console.log(`[Mailer] Configured custom SMTP transport via ${process.env.SMTP_HOST}`);
    return transporter;
  }

  // 3. Development fallback: ethereal test account
  const testAccount = await nodemailer.createTestAccount();
  transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    connectionTimeout: 4000,
    greetingTimeout: 4000,
    socketTimeout: 4000,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
  console.log("[Mailer] Ethereal dev test account created:", testAccount.user);

  return transporter;
}

interface SendInviteParams {
  to: string;
  inviterName: string;
  documentTitle: string;
  role: string;
  inviteToken: string;
  isRegisteredUser: boolean;
}

export async function sendCollaborationInviteEmail({
  to,
  inviterName,
  documentTitle,
  role,
  inviteToken,
  isRegisteredUser,
}: SendInviteParams) {
  const frontendUrl =
    process.env.FRONTEND_URL || `http://localhost:${process.env.FRONEND_PORT || 3000}`;

  const joinUrl = isRegisteredUser
    ? `${frontendUrl}/documents/invite?token=${inviteToken}`
    : `${frontendUrl}/sign-up?invitation_token=${inviteToken}&redirect_url=${encodeURIComponent(
        `/documents/invite?token=${inviteToken}`
      )}`;

  const actionText = isRegisteredUser ? "Accept & Open Document" : "Sign Up & Join Collaboration";

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; color: #1f2937;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="color: #2563eb; margin: 0;">Hanoi AI Collaboration</h2>
      </div>
      <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        <h3 style="margin-top: 0; color: #111827; font-size: 20px;">
          ${inviterName} invited you to collaborate!
        </h3>
        <p style="color: #4b5563; font-size: 15px; line-height: 1.5;">
          You have been invited as an <strong>${role}</strong> to collaborate on <strong>"${documentTitle}"</strong>.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${joinUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
            ${actionText}
          </a>
        </div>
        <p style="color: #6b7280; font-size: 13px; line-height: 1.5; margin-bottom: 0;">
          Or copy and paste this link into your browser:<br />
          <a href="${joinUrl}" style="color: #2563eb; word-break: break-all;">${joinUrl}</a>
        </p>
      </div>
    </div>
  `;

  const gmailUser = process.env.GMAIL_USER || (process.env.SMTP_HOST === "smtp.gmail.com" ? process.env.SMTP_USER : undefined);
  const gmailPass = process.env.GMAIL_APP_PASSWORD || (process.env.SMTP_HOST === "smtp.gmail.com" ? process.env.SMTP_PASS : undefined);

  // 1. Try Gmail SMTP if configured
  if (gmailUser && gmailPass) {
    try {
      const client = await getTransporter();
      const fromAddress = process.env.SMTP_FROM || `Hanoi AI <${gmailUser}>`;

      const info = await client.sendMail({
        from: fromAddress,
        to,
        subject: `${inviterName} invited you to collaborate on "${documentTitle}"`,
        html,
      });

      console.log(`[Mailer] Successfully sent invite email to ${to} via Gmail SMTP (MessageId: ${info.messageId})`);
      return {
        success: true,
        provider: "nodemailer-gmail",
        messageId: info.messageId,
      };
    } catch (smtpErr: any) {
      console.warn(`[Mailer] SMTP connection failed/blocked (${smtpErr.code || smtpErr.message}). Cloud hosts like Render free tier block outbound SMTP ports 25/465/587.`);
      // Proceed to HTTPS Resend fallback
    }
  }

  // 2. HTTPS-based email delivery via Resend (never blocked by cloud firewalls on Render/Vercel)
  const resend = getResendClient();
  if (resend) {
    try {
      const response = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "Hanoi AI <onboarding@resend.dev>",
        to: [to],
        subject: `${inviterName} invited you to collaborate on "${documentTitle}"`,
        html,
      });

      if (!response.error) {
        console.log(`[Resend Mailer] Sent invite email via HTTPS to ${to}:`, response.data);
        return { success: true, provider: "resend", messageId: response.data?.id };
      }

      console.warn(`[Resend Mailer Sandbox Restriction] Resend could not deliver to ${to}:`, response.error.message);
    } catch (resendErr: any) {
      console.warn(`[Resend Mailer] HTTPS dispatch error:`, resendErr.message);
    }
  }

  // 3. Fallback to Nodemailer preview
  try {
    const client = await getTransporter();
    const fromAddress = process.env.SMTP_FROM || `"Hanoi AI" <no-reply@hanoiai.app>`;
    const info = await client.sendMail({
      from: fromAddress,
      to,
      subject: `${inviterName} invited you to collaborate on "${documentTitle}"`,
      html,
    });
    const previewUrl = nodemailer.getTestMessageUrl(info);
    return {
      success: true,
      provider: "nodemailer",
      messageId: info.messageId,
      previewUrl: previewUrl || undefined,
    };
  } catch (finalErr) {
    console.error("[Mailer] All email delivery options failed:", finalErr);
    return { success: false, error: finalErr };
  }
}

interface SendPendingDocsSummaryParams {
  to: string;
  userName: string;
  pendingDocuments: Array<{
    title: string;
    inviterName: string;
    role: string;
    token: string;
  }>;
}

export async function sendPendingDocumentsSummaryEmail({
  to,
  userName,
  pendingDocuments,
}: SendPendingDocsSummaryParams) {
  const frontendUrl =
    process.env.FRONTEND_URL || `http://localhost:${process.env.FRONEND_PORT || 3000}`;

  const itemsHtml = pendingDocuments
    .map(
      (doc) => `
      <li style="margin-bottom: 12px; padding: 12px; background: #f9fafb; border-radius: 6px; border: 1px solid #f3f4f6;">
        <strong>"${doc.title}"</strong> (Role: ${doc.role}) - Invited by ${doc.inviterName}<br />
        <a href="${frontendUrl}/documents/invite?token=${doc.token}" style="color: #2563eb; text-decoration: underline; font-weight: 500;">
          Accept Invitation
        </a>
      </li>
    `
    )
    .join("");

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; color: #1f2937;">
      <h2 style="color: #2563eb; margin: 0 0 16px;">Welcome to Hanoi AI, ${userName}!</h2>
      <p style="color: #4b5563; font-size: 15px;">
        You have pending collaboration invites waiting for your review:
      </p>
      <ul style="list-style-type: none; padding-left: 0;">
        ${itemsHtml}
      </ul>
      <p style="margin-top: 24px;">
        You can also view and manage all your pending invitations right from your
        <a href="${frontendUrl}" style="color: #2563eb;">dashboard</a>.
      </p>
    </div>
  `;

  // Try Resend over HTTPS first for cloud reliability
  const resend = getResendClient();
  if (resend) {
    try {
      const data = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "Hanoi AI <onboarding@resend.dev>",
        to: [to],
        subject: `Welcome to Hanoi AI! You have ${pendingDocuments.length} pending document invitation(s)`,
        html,
      });
      return { success: true, messageId: data.data?.id };
    } catch (e) {
      // ignore
    }
  }

  try {
    const client = await getTransporter();
    const gmailUser = process.env.GMAIL_USER || process.env.SMTP_USER;
    const fromAddress = process.env.SMTP_FROM || (gmailUser ? `Hanoi AI <${gmailUser}>` : `"Hanoi AI" <no-reply@hanoiai.app>`);

    const info = await client.sendMail({
      from: fromAddress,
      to,
      subject: `Welcome to Hanoi AI! You have ${pendingDocuments.length} pending document invitation(s)`,
      html,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    return { success: true, messageId: info.messageId, previewUrl };
  } catch (error) {
    console.error("[Mailer] Failed to send summary email:", error);
    return { success: false, error };
  }
}
