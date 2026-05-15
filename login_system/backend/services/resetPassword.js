const crypto = require('crypto');
const User = require('../models/User');
const { validatePasswordRules, hashPassword, sendEmail, comparePassword } = require("./utils")

const PASSWORD_HISTORY_LIMIT = 5;

async function resetPassword(email, token, newPassword) {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) throw new Error('Invalid token or user');

  if (!user.resetPasswordTokenHash || !user.resetPasswordExpires) throw new Error('Invalid token or expired');

  // check expiry
  if (user.resetPasswordExpires < new Date()) throw new Error('Invalid token or expired');

  // verify token
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  if (tokenHash !== user.resetPasswordTokenHash) throw new Error('Invalid token or expired');

  // enforce password rules
  const validationResult = validatePasswordRules(newPassword);
  if (!validationResult.ok) throw new Error(validationResult.msg);

  // prevent reuse
  for (let ph of user.passwordHistory || []) {
    const reused = await comparePassword(newPassword, ph.hash);
    if (reused) throw new Error('New password must not match recent passwords');
  }

  const newHash = await hashPassword(newPassword);
  user.passwordHistory.unshift({ hash: newHash, changedAt: new Date() });
  user.passwordHistory = user.passwordHistory.slice(0, PASSWORD_HISTORY_LIMIT);
  user.passwordHash = newHash;
  user.passwordChangedAt = new Date();
  user.isTempPassword = false;
  user.resetPasswordTokenHash = null;
  user.resetPasswordExpires = null;
  await user.save();

  await sendEmail(user.email, 'Password reset completed', 'Your password was reset.');

  return true;
}

module.exports = resetPassword
