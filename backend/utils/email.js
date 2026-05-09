const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendWelcomeEmail(to, name) {
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
          <p>We're thrilled to have you on board. Eventora brings you the best movies, events, and experiences — all personalized by AI just for you.</p>
          <p>Discover trending movies, book tickets instantly, and let our AI concierge plan your perfect night out.</p>
          <a href="http://localhost:5173" class="cta">Start Discovering →</a>
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
      html,
    });
    console.log(`✅ Welcome email sent to ${to}`);
  } catch (err) {
    console.error('❌ Welcome email error:', err.message);
  }
}

async function sendBookingConfirmation(to, booking) {
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
        .detail { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .label { color: #8b8ca0; font-size: 14px; }
        .value { color: #f0f0f5; font-size: 14px; font-weight: 600; }
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
            <div class="detail"><span class="label">Booking ID</span><span class="value">${booking._id}</span></div>
            <div class="detail"><span class="label">Seats</span><span class="value">${booking.seats.join(', ')}</span></div>
            <div class="detail"><span class="label">Showtime</span><span class="value">${booking.showtime}</span></div>
            <div class="total">₹${booking.totalAmount}</div>
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
      html,
    });
    console.log(`✅ Booking confirmation sent to ${to}`);
  } catch (err) {
    console.error('❌ Booking email error:', err.message);
  }
}

module.exports = { sendWelcomeEmail, sendBookingConfirmation };
