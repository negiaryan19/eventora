const crypto = require('crypto');
const User = require('../models/User');

async function verifyEnable2FA(userId, otp) {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }
  const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
  if (user.twoFactorOTPHash !== otpHash) {
    throw new Error('Invalid OTP');
  }

  if (user.twoFactorOTPExpires < Date.now()) {
    throw new Error('OTP expired');
  }
  user.enable2FA = true;
  user.twoFactorOTPHash = null;
  user.twoFactorOTPExpires = null;
  await user.save();
}

module.exports = verifyEnable2FA;