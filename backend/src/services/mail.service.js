const { env } = require('../config/env');
const { logError } = require('../monitoring/logger');

async function sendMail({ to, subject, text, html }) {
  if (!env.resendApiKey) {
    console.info('[mail:dev]', { to, subject, text, html });
    return { sent: false, provider: 'console' };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.mailFrom,
      to,
      subject,
      text,
      html,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    logError('mail_send_failed', { to, status: response.status, body });
    return { sent: false, provider: 'resend' };
  }

  return { sent: true, provider: 'resend' };
}

module.exports = {
  mailService: {
    sendMail,
  },
};
