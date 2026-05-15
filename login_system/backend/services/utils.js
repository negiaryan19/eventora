const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
// Password policy (example) - adjust per your policy/regulation
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/; // at least 1 lower, upper, digit, symbol
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';


function validatePasswordRules(password) {
  if (typeof password !== 'string') return { ok: false, msg: 'password must be string' };
  if (password.length < PASSWORD_MIN_LENGTH) return { ok: false, msg: `password must be at least ${PASSWORD_MIN_LENGTH} chars` };
  if (!PASSWORD_REGEX.test(password)) return { ok: false, msg: 'password must include upper/lower/digit/symbol' };
  return { ok: true };
}

async function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}


async function sendEmail(to, subject, text, html) {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SYSTEM_EMAIL,
        pass: process.env.SYSTEM_EMAIL_APP_PASS,
      },
    });

    const mailOptions = {
      from: `"App Support" <${process.env.SYSTEM_EMAIL}>`, 
      to: to,
      subject: subject,
    };

    if(text){
      mailOptions.text = text;
    }

    if(html){
      mailOptions.html = html;
    }

    const info = await transporter.sendMail(mailOptions);
    
    console.log(`Email sent successfully: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Email delivery failed');
  }
}

function generateJWT(user) {
  const payload = { sub: user._id.toString(), email: user.email };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

module.exports = {
  validatePasswordRules,
  hashPassword,
  comparePassword,
  sendEmail,
  generateJWT
};
