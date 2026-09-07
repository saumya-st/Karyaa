import { Resend } from "resend";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://anant-ivory.vercel.app";

interface InviteEmailParams {
  to: string;
  inviterName: string;
  projectName: string;
  projectColor: string;
  inviteToken: string;
}

export async function sendInviteEmail({
  to,
  inviterName,
  projectName,
  projectColor,
  inviteToken,
}: InviteEmailParams) {
  const inviteUrl = `${APP_URL}/invite/${inviteToken}`;

  if (!process.env.RESEND_API_KEY) {
    return { error: "Email service not configured (RESEND_API_KEY missing)" };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const { data, error } = await resend.emails.send({
    from: "Karya <noreply@arogyaherb.store>",
    to,
    subject: `${inviterName} invited you to join "${projectName}" on Karya`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.07);">
          
          <!-- Header gradient bar -->
          <tr>
            <td style="height:6px;background:linear-gradient(90deg,#6366f1,#a855f7);"></td>
          </tr>
          
          <!-- Logo area -->
          <tr>
            <td style="padding:32px 40px 0 40px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:36px;height:36px;background:linear-gradient(135deg,#6366f1,#a855f7);border-radius:10px;text-align:center;vertical-align:middle;color:#ffffff;font-weight:700;font-size:18px;">
                    K
                  </td>
                  <td style="padding-left:12px;font-size:20px;font-weight:700;color:#111827;">
                    Karya
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main content -->
          <tr>
            <td style="padding:28px 40px 0 40px;">
              <h1 style="margin:0 0 8px 0;font-size:22px;font-weight:700;color:#111827;">
                You've been invited!
              </h1>
              <p style="margin:0 0 24px 0;font-size:15px;color:#6b7280;line-height:1.6;">
                <strong style="color:#111827;">${inviterName}</strong> invited you to collaborate on a project.
              </p>
            </td>
          </tr>

          <!-- Project card -->
          <tr>
            <td style="padding:0 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;">
                <tr>
                  <td style="padding:20px;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:44px;height:44px;background-color:${projectColor};border-radius:10px;text-align:center;vertical-align:middle;color:#ffffff;font-weight:700;font-size:20px;">
                          ${projectName[0].toUpperCase()}
                        </td>
                        <td style="padding-left:14px;">
                          <div style="font-size:16px;font-weight:600;color:#111827;">${projectName}</div>
                          <div style="font-size:13px;color:#9ca3af;margin-top:2px;">Project on Karya</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding:28px 40px 0 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${inviteUrl}" style="display:inline-block;padding:14px 40px;background:linear-gradient(135deg,#6366f1,#a855f7);color:#ffffff;text-decoration:none;border-radius:10px;font-size:15px;font-weight:600;letter-spacing:0.3px;">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Secondary link -->
          <tr>
            <td style="padding:20px 40px 0 40px;text-align:center;">
              <p style="margin:0;font-size:13px;color:#9ca3af;">
                Or copy this link:
              </p>
              <p style="margin:6px 0 0 0;font-size:13px;word-break:break-all;">
                <a href="${inviteUrl}" style="color:#6366f1;text-decoration:underline;">${inviteUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:32px 40px 32px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e5e7eb;">
                <tr>
                  <td style="padding-top:20px;text-align:center;">
                    <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.5;">
                      This invite expires in 7 days.<br>
                      If you didn't expect this email, you can safely ignore it.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
  });

  if (error) {
    console.error("Failed to send invite email:", error);
    return { error: error.message };
  }

  return { success: true, emailId: data?.id };
}
