require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function testEmail() {
  console.log(`Testing SMTP connection for ${process.env.EMAIL_USER}...`);
  try {
    await transporter.verify();
    console.log("✅ Server is ready to take our messages. Authentication successful!");
  } catch (error) {
    console.error("❌ Authentication or Connection Error:");
    console.error(error.message);
  }
}

testEmail();
