const crypto = require('crypto');
const User = require('../models/User');
const { generateJWT, sendEmail, comparePassword } = require("./utils")
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_TIME_MIN = 15; // lock account for 15 minutes

async function login(email, password) {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    // uniform failure response
    throw new Error('Invalid credentials');
  }

  // check locked
  if (user.isLocked()) {
    throw new Error('Account locked. Try later.');
  }

  const ok = await comparePassword(password, user.passwordHash);
  if (!ok) {
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
    if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
      user.lockUntil = new Date(Date.now() + LOCK_TIME_MIN * 60 * 1000);
      // notify user of lockout
      await sendEmail(user.email, 'Account locked', `Your account locked until ${user.lockUntil.toISOString()}`);
    }
    await user.save();
    throw new Error('Invalid credentials');
  }

  // successful login
  user.failedLoginAttempts = 0;
  user.lockUntil = null;

  if (user.enable2FA) {
    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    user.twoFactorOTPHash = otpHash;
    user.twoFactorOTPExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();
    await sendEmail(
      user.email,
      'Login OTP',
      `Your login OTP is ${otp}`
    );
    return {
      requires2FA: true,
      email: user.email
    };
  }
  user.lastLogin = new Date();
  await user.save();
  const token = generateJWT(user);
  return { token, user };
}

module.exports = login;