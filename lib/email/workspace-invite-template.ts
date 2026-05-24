import { WORKSPACE_ROLE_LABELS, type WorkspaceRole } from "@/lib/types/collaboration";

export function buildWorkspaceInviteEmail(input: {
  workspaceName: string;
  inviterName: string;
  role: WorkspaceRole;
  loginUrl: string;
  signupUrl: string;
}) {
  const roleLabel = WORKSPACE_ROLE_LABELS[input.role];
  const subject = `You're invited to ${input.workspaceName} on PromoSync`;

  const html = `
<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background:#0B0B10;font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:#E4E4E7;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0B0B10;padding:32px 16px;">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#11111A;border:1px solid #232330;border-radius:12px;padding:28px;">
            <tr>
              <td>
                <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#71717A;">Team invite</p>
                <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#F5F5F7;">Join ${escapeHtml(input.workspaceName)}</h1>
                <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#A1A1AA;">
                  <strong style="color:#F5F5F7;">${escapeHtml(input.inviterName)}</strong> invited you as
                  <strong style="color:#F5F5F7;">${escapeHtml(roleLabel)}</strong> on PromoSync.
                </p>
                <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#A1A1AA;">
                  Sign in with this email address to access events, tasks, and your team workspace.
                  If you don&apos;t have an account yet, create one using the same email.
                </p>
                <p style="margin:0 0 12px;">
                  <a href="${input.loginUrl}" style="display:inline-block;background:#7C3AED;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 20px;border-radius:8px;">Sign in to PromoSync</a>
                </p>
                <p style="margin:0 0 24px;font-size:13px;line-height:1.5;color:#71717A;">
                  New here?
                  <a href="${input.signupUrl}" style="color:#C4B5FD;">Create an account</a>
                </p>
                <p style="margin:0;font-size:12px;line-height:1.5;color:#52525B;">
                  If you weren&apos;t expecting this invite, you can ignore this message.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`.trim();

  return { subject, html };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
