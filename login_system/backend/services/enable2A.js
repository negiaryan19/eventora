const crypto = require('crypto');
const User = require('../models/User');
const { sendEmail } = require("./utils");

async function enable2FA(userId) {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error('User not found');
  }

  // generate 6 digit OTP
  const otp = Math.floor(
    100000 + Math.random() * 900000
  ).toString();

  // hash otp
  const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

  user.twoFactorOTPHash = otpHash;
  user.twoFactorOTPExpires = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();

  await sendEmail(
    user.email,
    'Your 2FA OTP',
    `Your OTP is ${otp}`
  );
}

module.exports = enable2FA;