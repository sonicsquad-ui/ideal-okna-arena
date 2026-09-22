/**
 * Mailer service for Champion-Tennis.ru
 * Forwards form inquiries and newsletter subscriptions to the administrator: sonicsquad@mail.ru
 * (Note: Email address is strictly internal and never exposed to public website pages)
 */

const nodemailer = require('nodemailer');

const TARGET_EMAIL = 'sonicsquad@mail.ru';

// Create transport: can be configured via environment variables (SMTP_HOST, SMTP_PORT, etc.)
// If no credentials supplied, logs dispatch cleanly and saves status.
let transporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '465', 10),
    secure: process.env.SMTP_SECURE === 'true' || true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

async function forwardSubmission({ type, name, contact, subject, message, pageUrl }) {
  const mailSubject = `[Champion-Tennis.ru] Новая заявка: ${subject || type} (${name || 'Посетитель'})`;
  const mailBody = `
========================================
НОВАЯ ЗАЯВКА С САЙТА CHAMPION-TENNIS.RU
========================================
Тип формы: ${type}
Имя: ${name || 'Не указано'}
Контакт (Email / Телефон): ${contact}
Тема: ${subject || 'Без темы'}
Страница отправки: ${pageUrl || 'https://champion-tennis.ru/'}
Дата и время: ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })} (МСК)

Сообщение:
${message || '—'}
========================================
  `.trim();

  console.log(`[MAIL DISPATCH] Sending notification to ${TARGET_EMAIL}: ${mailSubject}`);

  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: '"Champion-Tennis.ru" <no-reply@champion-tennis.ru>',
        to: TARGET_EMAIL,
        subject: mailSubject,
        text: mailBody
      });
      return { success: true, messageId: info.messageId, recipient: TARGET_EMAIL };
    } catch (err) {
      console.error('[MAIL ERROR] Failed to send via SMTP:', err.message);
      return { success: false, error: err.message, recipient: TARGET_EMAIL };
    }
  } else {
    // Shared hosting fallback: mail is logged and queued in SQLite submissions
    return { success: true, simulated: true, recipient: TARGET_EMAIL };
  }
}

module.exports = { forwardSubmission, TARGET_EMAIL };
