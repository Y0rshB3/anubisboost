"use strict";

const nodemailer = require("nodemailer");

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.MAIL_HOST;
  const port = parseInt(process.env.MAIL_PORT || "587", 10);
  const user = process.env.MAIL_USER;
  const pass = process.env.MAIL_PASSWORD;

  if (!host || !user) {
    console.warn("[MAILER] Not configured — emails will be logged to console only");
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return transporter;
}

async function sendMail({ to, subject, html, text }) {
  const from = process.env.MAIL_FROM || "AnubisBoost <noreply@anubisboost.com>";
  const t = getTransporter();

  if (!t) {
    console.log(`[MAIL-LOG] To: ${to} | Subject: ${subject}`);
    console.log(`[MAIL-LOG] Body: ${text || html?.slice(0, 200)}`);
    return { logged: true };
  }

  const info = await t.sendMail({ from, to, subject, html, text });
  return { messageId: info.messageId };
}

// Template helpers
function send2FACode(email, code) {
  return sendMail({
    to: email,
    subject: "AnubisBoost - Código de verificación",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:2rem;background:#0f172a;color:#f1f5f9;border-radius:12px">
        <h2 style="color:#a78bfa;margin:0 0 1rem">AnubisBoost</h2>
        <p>Tu código de verificación es:</p>
        <div style="font-size:2rem;font-weight:800;letter-spacing:0.3em;text-align:center;padding:1rem;background:#1e293b;border-radius:8px;color:#a78bfa;margin:1rem 0">${code}</div>
        <p style="color:#64748b;font-size:0.85rem">Este código expira en 10 minutos. No compartas este código con nadie.</p>
      </div>`,
    text: `Tu código de verificación AnubisBoost es: ${code}. Expira en 10 minutos.`,
  });
}

function sendCredentialViewCode(email, code) {
  return sendMail({
    to: email,
    subject: "AnubisBoost - Código para ver credenciales",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:2rem;background:#0f172a;color:#f1f5f9;border-radius:12px">
        <h2 style="color:#a78bfa;margin:0 0 1rem">AnubisBoost</h2>
        <p>Se ha solicitado acceso a las credenciales de un pedido.</p>
        <div style="font-size:2rem;font-weight:800;letter-spacing:0.3em;text-align:center;padding:1rem;background:#1e293b;border-radius:8px;color:#fbbf24;margin:1rem 0">${code}</div>
        <p style="color:#64748b;font-size:0.85rem">Este código expira en 5 minutos. Las credenciales serán visibles por 2 minutos.</p>
      </div>`,
    text: `Código para ver credenciales AnubisBoost: ${code}. Expira en 5 minutos.`,
  });
}

function sendEmailChangeCode(email, code) {
  return sendMail({
    to: email,
    subject: "AnubisBoost - Verificar nuevo correo",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:2rem;background:#0f172a;color:#f1f5f9;border-radius:12px">
        <h2 style="color:#a78bfa;margin:0 0 1rem">AnubisBoost</h2>
        <p>Se ha solicitado cambiar tu correo electrónico a esta dirección.</p>
        <div style="font-size:2rem;font-weight:800;letter-spacing:0.3em;text-align:center;padding:1rem;background:#1e293b;border-radius:8px;color:#a78bfa;margin:1rem 0">${code}</div>
        <p style="color:#64748b;font-size:0.85rem">Si no solicitaste este cambio, ignora este correo.</p>
      </div>`,
    text: `Código para cambiar email AnubisBoost: ${code}`,
  });
}

function sendOrderNotification(email, title, body) {
  return sendMail({
    to: email,
    subject: `AnubisBoost - ${title}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:2rem;background:#0f172a;color:#f1f5f9;border-radius:12px">
        <h2 style="color:#a78bfa;margin:0 0 1rem">AnubisBoost</h2>
        <h3 style="margin:0 0 0.5rem">${title}</h3>
        <p style="color:#94a3b8">${body}</p>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="display:inline-block;margin-top:1rem;padding:0.6rem 1.5rem;background:#7c3aed;color:white;text-decoration:none;border-radius:8px;font-weight:600">Ir a AnubisBoost</a>
      </div>`,
    text: `${title}: ${body}`,
  });
}

function sendPasswordReset(email, token) {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
  return sendMail({
    to: email,
    subject: "AnubisBoost - Restablecer contraseña",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:2rem;background:#0f172a;color:#f1f5f9;border-radius:12px">
        <h2 style="color:#a78bfa;margin:0 0 1rem">AnubisBoost</h2>
        <p>Se ha solicitado restablecer tu contraseña.</p>
        <a href="${resetUrl}" style="display:inline-block;margin:1rem 0;padding:0.8rem 2rem;background:#7c3aed;color:white;text-decoration:none;border-radius:8px;font-weight:600">Restablecer Contraseña</a>
        <p style="color:#64748b;font-size:0.85rem">Este enlace expira en 30 minutos. Si no solicitaste esto, ignora este correo.</p>
      </div>`,
    text: `Restablece tu contraseña AnubisBoost: ${resetUrl}`,
  });
}

module.exports = { sendMail, send2FACode, sendCredentialViewCode, sendEmailChangeCode, sendOrderNotification, sendPasswordReset };
