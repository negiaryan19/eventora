const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendWelcomeEmail(to, name) {
  const text = `Welcome, ${name}!\n\nEventora brings you movies, showtimes, and tickets personalized by AI.\n\nOpen Eventora: ${process.env.PUBLIC_APP_URL || 'http://localhost:3000'}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { margin: 0; padding: 0; background: #08090d; font-family: 'Segoe UI', Arial, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; background: #13141f; border-radius: 16px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #7c5cfc, #a78bfa); padding: 40px 30px; text-align: center; }
        .header h1 { color: #fff; font-size: 32px; margin: 0; letter-spacing: 2px; }
        .header p { color: rgba(255,255,255,0.8); margin-top: 8px; font-size: 14px; }
        .body { padding: 40px 30px; color: #f0f0f5; }
        .body h2 { font-size: 24px; margin: 0 0 16px; }
        .body p { color: #8b8ca0; line-height: 1.6; font-size: 15px; }
        .cta { display: inline-block; margin-top: 24px; padding: 14px 32px; background: linear-gradient(135deg, #7c5cfc, #a78bfa); color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; }
        .footer { text-align: center; padding: 20px 30px; color: #555; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎬 EVENTORA</h1>
          <p>Your AI-Powered Entertainment Concierge</p>
        </div>
        <div class="body">
          <h2>Welcome, ${name}! 🎉</h2>
          <p>We're thrilled to have you on board. Eventora brings you the best movies, showtimes, and tickets — all personalized by AI just for you.</p>
          <p>Discover trending movies, book tickets instantly, and let our AI concierge plan your perfect night out.</p>
          <a href="${process.env.PUBLIC_APP_URL || 'http://localhost:3000'}" class="cta">Start Discovering →</a>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Eventora. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: `"Eventora" <${process.env.EMAIL_USER}>`,
      to,
      subject: 'Welcome to Eventora 🎬',
      text,
      html,
    });
    console.log(`✅ Welcome email sent to ${to}`);
    return true;
  } catch (err) {
    if (err.code === 'ENOTFOUND' || err.code === 'EAI_AGAIN' || err.message.includes('getaddrinfo')) {
      console.log(`⚠️ Network offline. Mock welcome email sent to ${to}`);
    } else {
      console.error('❌ Welcome email error:', err.message);
    }
    return false;
  }
}

async function sendBookingConfirmation(to, booking) {
  const text = [
    'Booking Confirmed!',
    '',
    `Movie: ${booking.movieTitle}`,
    `Booking ID: ${booking.bookingCode || booking._id}`,
    `Ticket ID: ${booking.ticketCode || booking._id}`,
    `Venue: ${booking.venue || 'Eventora Cinemas'}`,
    `Seats: ${booking.seats.join(', ')}`,
    `Showtime: ${booking.showtime}`,
    `Amount: ₹${booking.totalAmount}`,
    booking.ticketVerificationUrl ? `Verify ticket: ${booking.ticketVerificationUrl}` : '',
  ].filter(Boolean).join('\n');
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { margin: 0; padding: 0; background: #08090d; font-family: 'Segoe UI', Arial, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; background: #13141f; border-radius: 16px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #22c55e, #16a34a); padding: 30px; text-align: center; }
        .header h1 { color: #fff; font-size: 28px; margin: 0; }
        .body { padding: 30px; color: #f0f0f5; }
        .ticket { background: #1a1b2e; border-radius: 12px; padding: 24px; margin: 16px 0; border: 1px solid rgba(255,255,255,0.08); }
        .ticket h3 { margin: 0 0 16px; font-size: 20px; color: #a78bfa; }
        .detail-table { width: 100%; border-collapse: collapse; }
        .detail-table td { padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05); vertical-align: top; }
        .label { color: #8b8ca0; font-size: 14px; width: 120px; padding-right: 16px; }
        .value { color: #f0f0f5; font-size: 14px; font-weight: 600; word-break: break-word; }
        .qr { margin-top: 20px; text-align: center; }
        .qr img { width: 150px; height: 150px; border-radius: 10px; background: #fff; padding: 8px; }
        .qr p { margin: 8px 0 0; color: #8b8ca0; font-size: 13px; }
        .total { font-size: 24px; color: #22c55e; font-weight: 700; text-align: center; margin-top: 16px; }
        .footer { text-align: center; padding: 20px; color: #555; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎟️ Booking Confirmed!</h1>
        </div>
        <div class="body">
          <div class="ticket">
            <h3>${booking.movieTitle}</h3>
            <table class="detail-table" role="presentation">
              <tr><td class="label">Booking ID</td><td class="value">${booking.bookingCode || booking._id}</td></tr>
              <tr><td class="label">Ticket ID</td><td class="value">${booking.ticketCode || booking._id}</td></tr>
              <tr><td class="label">Venue</td><td class="value">${booking.venue || 'Eventora Cinemas'}</td></tr>
              <tr><td class="label">Seats</td><td class="value">${booking.seats.join(', ')}</td></tr>
              <tr><td class="label">Showtime</td><td class="value">${booking.showtime}</td></tr>
            </table>
            <div class="total">₹${booking.totalAmount}</div>
            ${booking.qrCodeUrl ? `<div class="qr"><img src="${booking.qrCodeUrl}" alt="Ticket QR code" /><p>Scan this QR at entry to verify the ticket.</p></div>` : ''}
          </div>
          <p style="color: #8b8ca0; text-align: center; font-size: 14px;">See your ticket in the app. Enjoy the show! 🍿</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Eventora. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: `"Eventora" <${process.env.EMAIL_USER}>`,
      to,
      subject: `Booking Confirmed 🎟️ — ${booking.movieTitle}`,
      text,
      html,
    });
    console.log(`✅ Booking confirmation sent to ${to}`);
    return true;
  } catch (err) {
    if (err.code === 'ENOTFOUND' || err.code === 'EAI_AGAIN' || err.message.includes('getaddrinfo')) {
      console.log(`⚠️ Network offline. Mock booking confirmation sent to ${to}`);
    } else {
      console.error('❌ Booking email error:', err.message);
    }
    return false;
  }
}

async function sendPasswordResetEmail(to, otp) {
  const text = `Password Reset OTP\n\nYour Eventora OTP is: ${otp}\n\nThis code expires in 10 minutes. If you did not request this, ignore this email.`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { margin: 0; padding: 0; background: #08090d; font-family: 'Segoe UI', Arial, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; background: #13141f; border-radius: 16px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #f43f5e, #e11d48); padding: 30px; text-align: center; }
        .header h1 { color: #fff; font-size: 24px; margin: 0; }
        .body { padding: 30px; color: #f0f0f5; text-align: center; }
        .otp { display: inline-block; background: #1a1b2e; padding: 15px 30px; font-size: 32px; font-weight: 700; letter-spacing: 5px; color: #f43f5e; border-radius: 10px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #555; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔒 Password Reset</h1>
        </div>
        <div class="body">
          <h2>Forgot your password?</h2>
          <p>No worries! Use the OTP below to reset your password. This code will expire in 10 minutes.</p>
          <div class="otp">${otp}</div>
          <p style="color: #8b8ca0; font-size: 14px;">If you didn't request a password reset, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Eventora. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: `"Eventora" <${process.env.EMAIL_USER}>`,
      to,
      subject: 'Password Reset OTP 🔒',
      text,
      html,
    });
    console.log(`✅ Password reset email sent to ${to}`);
    return true;
  } catch (err) {
    if (err.code === 'ENOTFOUND' || err.code === 'EAI_AGAIN' || err.message.includes('getaddrinfo')) {
      console.log(`⚠️ Network offline. Mock password reset email sent to ${to}`);
    } else {
      console.error('❌ Password reset email error:', err.message);
    }
    return false;
  }
}

module.exports = { sendWelcomeEmail, sendBookingConfirmation, sendPasswordResetEmail };
