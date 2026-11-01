import nodemailer from 'nodemailer';

export function isNoticeEmailConfigured() {
  const port = Number(process.env.SMTP_PORT);
  return Boolean(
    process.env.SMTP_HOST
    && Number.isInteger(port)
    && port > 0
    && port <= 65535
    && process.env.SMTP_USER
    && process.env.SMTP_PASSWORD
    && process.env.SMTP_FROM
  );
}

export async function sendSmtpEmail({ to, subject, text, html }) {
  if (!isNoticeEmailConfigured()) {
    throw new Error('SMTP email settings are not configured.');
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  return transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject,
    text,
    html,
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export async function sendNoticeSubscriptionEmail(email, notice) {
  if (!isNoticeEmailConfigured()) {
    throw new Error('SMTP email settings are not configured.');
  }

  const noticeUrl = new URL(`/notifications/${notice.id}`, process.env.NEXTAUTH_URL || 'http://localhost:3000').toString();
  const manageUrl = new URL('/notices', process.env.NEXTAUTH_URL || 'http://localhost:3000').toString();
  const title = escapeHtml(notice.title);
  const description = escapeHtml(notice.description).replaceAll('\n', '<br>');
  const safeNoticeUrl = escapeHtml(noticeUrl);
  const safeManageUrl = escapeHtml(manageUrl);

  await sendSmtpEmail({
    to: email,
    subject: `Chiutahara notice: ${notice.title}`,
    text: `${notice.title}\n\n${notice.description}\n\nRead notice: ${noticeUrl}\nManage subscriptions: ${manageUrl}`,
    html: `<h2>${title}</h2><p>${description}</p><p><a href="${safeNoticeUrl}">Read notice</a></p><p><a href="${safeManageUrl}">Manage subscriptions</a></p>`,
  });
}
