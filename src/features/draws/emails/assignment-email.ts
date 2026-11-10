import "server-only";
import { getTranslations } from "next-intl/server";

export type AssignmentEmailData = {
  locale: string;
  drawName: string;
  organizerName: string;
  giverName: string;
  receiverName: string;
  eventDate: string | null;
  budget: string | null;
  message: string | null;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function formatEventDate(date: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "UTC" }).format(
    new Date(`${date}T00:00:00Z`)
  );
}

export async function buildAssignmentEmail(data: AssignmentEmailData) {
  const t = await getTranslations({ locale: data.locale, namespace: "Email" });
  const e = escapeHtml;

  const details: { label: string; value: string }[] = [];
  if (data.eventDate) {
    details.push({ label: t("date"), value: formatEventDate(data.eventDate, data.locale) });
  }
  if (data.budget) details.push({ label: t("budget"), value: data.budget });

  const subject = t("subject", { drawName: data.drawName });
  const intro = t("intro", { organizer: data.organizerName, drawName: data.drawName });

  const text = [
    t("greeting", { name: data.giverName }),
    "",
    intro,
    "",
    `${t("yourMatch")} ${data.receiverName}`,
    "",
    ...details.map((d) => `${d.label}: ${d.value}`),
    ...(data.message ? ["", `${t("organizerMessage")}:`, data.message] : []),
    "",
    t("secret"),
    "",
    t("footer"),
  ].join("\n");

  const detailsHtml = details
    .map(
      (d) => `<tr>
        <td style="padding:6px 0;color:#6b7280;font-size:14px;">${e(d.label)}</td>
        <td style="padding:6px 0;text-align:right;font-weight:600;font-size:14px;color:#111827;">${e(d.value)}</td>
      </tr>`
    )
    .join("");

  const html = `<!doctype html>
<html lang="${e(data.locale)}">
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;">
        <tr><td style="background:#b91c1c;padding:28px 32px;text-align:center;">
          <div style="font-size:40px;line-height:1;">🎁</div>
          <div style="color:#ffffff;font-size:20px;font-weight:700;margin-top:12px;">${e(data.drawName)}</div>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 12px;font-size:18px;font-weight:600;color:#111827;">${e(t("greeting", { name: data.giverName }))}</p>
          <p style="margin:0 0 24px;font-size:15px;line-height:1.5;color:#374151;">${e(intro)}</p>
          <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
            <div style="font-size:14px;color:#991b1b;margin-bottom:6px;">${e(t("yourMatch"))}</div>
            <div style="font-size:26px;font-weight:700;color:#7f1d1d;">${e(data.receiverName)}</div>
          </div>
          ${detailsHtml ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;border-top:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;">${detailsHtml}</table>` : ""}
          ${
            data.message
              ? `<div style="margin-bottom:24px;">
            <div style="font-size:14px;color:#6b7280;margin-bottom:6px;">${e(t("organizerMessage"))}</div>
            <div style="font-size:15px;line-height:1.5;color:#111827;white-space:pre-line;">${e(data.message)}</div>
          </div>`
              : ""
          }
          <p style="margin:0;font-size:15px;text-align:center;color:#374151;">${e(t("secret"))}</p>
        </td></tr>
        <tr><td style="padding:16px 32px;background:#fafafa;text-align:center;font-size:12px;color:#9ca3af;">${e(t("footer"))}</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, html, text };
}
