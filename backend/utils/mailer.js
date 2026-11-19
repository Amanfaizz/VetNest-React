// backend/utils/mailer.js
//
// Sends status e-mails (Checked-in / Consultation started) to the pet owner.
//
// WHY BREVO'S HTTPS API AND NOT GMAIL SMTP?
// Free Render web services block outbound SMTP ports 25/465/587 (since 26 Sep 2025), so
// nodemailer + Gmail would just time out once deployed. An HTTPS API call goes out on port
// 443, which is allowed. Brevo's free plan gives 300 e-mails/day and needs no domain, only one
// verified "sender" address. It also needs NO extra npm package: Node 18+ has a built-in fetch().

import User from '../models/User.js';
import Hospital from '../models/Hospital.js';

const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';

// Which appointment statuses trigger an e-mail, and what each e-mail says.
// To e-mail on another status (e.g. COMPLETED) just add another entry here.
const STATUS_EMAILS = {
  CHECKED_IN: {
    subject: (a, h) => `✅ ${a.petName} is checked in at ${h.hospitalName} (Token ${a.tokenNumber})`,
    headline: "You're checked in",
    message: (a) =>
      `The hospital staff have checked in ${a.petName}. Please stay nearby - the veterinarian will call you shortly.`,
  },
  IN_CONSULTATION: {
    subject: (a, h) => `🩺 ${a.petName}'s consultation has started at ${h.hospitalName}`,
    headline: 'Consultation has started',
    message: (a) => `${a.petName} is now being seen by ${a.assignedVet || 'the duty veterinarian'}.`,
  },
};

export const hasEmailTemplate = (status) => Boolean(STATUS_EMAILS[status]);

export const isEmailConfigured = () =>
  Boolean(process.env.BREVO_API_KEY && process.env.EMAIL_FROM_ADDRESS);

// Anything typed by a user (pet name, owner name...) must be escaped before going into HTML.
const escapeHtml = (value) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])
  );

// Low-level sender. It NEVER throws: it always returns { sent: true|false, ... }
// so a failed e-mail can never crash a request.
export async function sendEmail({ to, toName, subject, html, text }) {
  if (!isEmailConfigured()) {
    console.warn(
      `[Email] Not configured (set BREVO_API_KEY and EMAIL_FROM_ADDRESS). Skipped "${subject}" -> ${to}`
    );
    return { sent: false, reason: 'not_configured' };
  }

  // Abort the request if Brevo doesn't answer within 10 seconds.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(BREVO_URL, {
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: process.env.EMAIL_FROM_NAME || 'VetNest',
          email: process.env.EMAIL_FROM_ADDRESS,
        },
        to: [{ email: to, name: toName || to }],
        subject,
        htmlContent: html,
        textContent: text,
      }),
      signal: controller.signal,
    });

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error(`[Email] Brevo rejected the email (HTTP ${res.status}): ${body.message || JSON.stringify(body)}`);
      return { sent: false, reason: 'provider_error', status: res.status };
    }

    console.log(`[Email] Sent "${subject}" -> ${to} (messageId ${body.messageId})`);
    return { sent: true, messageId: body.messageId };
  } catch (err) {
    const reason = err.name === 'AbortError' ? 'timeout' : err.message;
    console.error(`[Email] Failed to send to ${to}: ${reason}`);
    return { sent: false, reason };
  } finally {
    clearTimeout(timer);
  }
}

// Called by the status route after staff change an appointment's status.
// Looks up the OWNER's registered e-mail (User.email) and the hospital, then sends the e-mail.
export async function notifyOwnerOfStatus(appointment, status) {
  const template = STATUS_EMAILS[status];
  if (!template) return { sent: false, reason: 'no_template_for_status' };

  try {
    const [owner, hospital] = await Promise.all([
      User.findById(appointment.ownerId).select('name email'),
      Hospital.findById(appointment.hospitalId).select('hospitalName address area contactPhone'),
    ]);

    if (!owner?.email) {
      console.warn(`[Email] Owner for appointment ${appointment.tokenNumber} has no email on file.`);
      return { sent: false, reason: 'no_owner_email' };
    }

    const h = hospital || { hospitalName: 'the hospital' };
    const place = [h.address, h.area].filter(Boolean).join(', ');
    const message = template.message(appointment);

    const html = `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
  <div style="background:#2563eb;color:#ffffff;padding:18px 22px;font-size:20px;font-weight:700">VetNest</div>
  <div style="padding:22px">
    <h2 style="margin:0 0 8px;color:#111827">${escapeHtml(template.headline)}</h2>
    <p style="color:#374151;line-height:1.5">Hi ${escapeHtml(owner.name)},</p>
    <p style="color:#374151;line-height:1.5">${escapeHtml(message)}</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px">
      <tr><td style="padding:6px 0;color:#6b7280">Pet</td><td style="padding:6px 0;font-weight:600">${escapeHtml(appointment.petName)}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280">Token</td><td style="padding:6px 0;font-weight:600">${escapeHtml(appointment.tokenNumber)}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280">Hospital</td><td style="padding:6px 0;font-weight:600">${escapeHtml(h.hospitalName)}</td></tr>
      ${place ? `<tr><td style="padding:6px 0;color:#6b7280">Address</td><td style="padding:6px 0">${escapeHtml(place)}</td></tr>` : ''}
      ${h.contactPhone ? `<tr><td style="padding:6px 0;color:#6b7280">Phone</td><td style="padding:6px 0">${escapeHtml(h.contactPhone)}</td></tr>` : ''}
    </table>
    <p style="color:#9ca3af;font-size:12px;margin-top:20px">This is an automated message from VetNest.</p>
  </div>
</div>`;

    const text = [
      template.headline,
      '',
      `Hi ${owner.name},`,
      message,
      '',
      `Pet: ${appointment.petName}`,
      `Token: ${appointment.tokenNumber}`,
      `Hospital: ${h.hospitalName}`,
      place ? `Address: ${place}` : null,
      h.contactPhone ? `Phone: ${h.contactPhone}` : null,
    ]
      .filter((line) => line !== null)
      .join('\n');

    return await sendEmail({
      to: owner.email,
      toName: owner.name,
      subject: template.subject(appointment, h),
      html,
      text,
    });
  } catch (err) {
    console.error('[Email] notifyOwnerOfStatus error:', err.message);
    return { sent: false, reason: err.message };
  }
}
