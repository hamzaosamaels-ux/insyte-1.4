// ============================================================================
// Transactional email via Brevo (formerly Sendinblue).
//
// Why Brevo over Resend: Resend's shared sending domain only delivers to the
// email address that owns the Resend account itself unless a real DNS domain
// is verified — and this project has no custom domain yet. Brevo supports
// Single Sender Verification: verify one plain address (no DNS/SPF/DKIM),
// then send to any real recipient. Free tier: 300 emails/day.
//
// Active only when BREVO_API_KEY is set. If it's missing, callers must treat
// that as a hard failure for anything security-relevant (see server.ts) —
// never silently let an unverified signup through.
// ============================================================================

export function emailEnabled(): boolean {
  return Boolean((process.env.BREVO_API_KEY || "").trim());
}

export async function sendVerificationEmail(toEmail: string, toName: string, verifyUrl: string): Promise<void> {
  const fromEmail = process.env.MAIL_FROM_EMAIL || "insyte.startup@gmail.com";
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": process.env.BREVO_API_KEY as string
    },
    body: JSON.stringify({
      sender: { email: fromEmail, name: "insyte" },
      to: [{ email: toEmail, name: toName }],
      subject: "Verify your insyte account",
      htmlContent: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #4f46e5;">Welcome to insyte, ${escapeHtml(toName)}!</h2>
          <p>Click the button below to verify your email and activate your account.</p>
          <a href="${verifyUrl}" style="display: inline-block; margin: 16px 0; padding: 12px 24px; background: #4f46e5; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Verify my email
          </a>
          <p style="color: #64748b; font-size: 12px;">If the button doesn't work, copy this link: ${verifyUrl}</p>
          <p style="color: #94a3b8; font-size: 11px;">This link expires in 24 hours. If you didn't sign up for insyte, ignore this email.</p>
        </div>
      `
    })
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Brevo send failed: ${res.status} ${body}`);
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}
