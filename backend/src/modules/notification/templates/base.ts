import { env } from '../../../config/env';

export function baseEmailTemplate(title: string, message: string, ctaUrl?: string, ctaLabel?: string): string {
  const frontendUrl = env.FRONTEND_URL;
  const cta = ctaUrl && ctaLabel
    ? `<a href="${ctaUrl}" style="display:inline-block;padding:12px 24px;background:#4F46E5;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;margin-top:16px;">${ctaLabel}</a>`
    : '';

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;margin-top:20px;">
    <tr>
      <td style="padding:24px 32px;background:#4F46E5;text-align:center;">
        <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">Indu AE</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:32px;">
        <h2 style="margin:0 0 16px;color:#1f2937;font-size:18px;">${title}</h2>
        <p style="margin:0;color:#4b5563;font-size:14px;line-height:1.6;">${message}</p>
        ${cta}
      </td>
    </tr>
    <tr>
      <td style="padding:16px 32px;background:#f9fafb;text-align:center;border-top:1px solid #e5e7eb;">
        <p style="margin:0;color:#9ca3af;font-size:12px;">
          Indu AE — Quality Education, Simplified<br>
          <a href="${frontendUrl}" style="color:#6366f1;text-decoration:none;">Visit Platform</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
