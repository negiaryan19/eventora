const User = require('../models/User');
const { validatePasswordRules, hashPassword, sendEmail, comparePassword } = require("./utils")

const PASSWORD_HISTORY_LIMIT = 5;

async function changePassword(userId, currentPassword, newPassword) {
  // validate rules
  const validationResult = validatePasswordRules(newPassword);
  if (!validationResult.ok) throw new Error(validationResult.msg);

  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  // require min password age before allowing change (1 day)
//   const minAgeMs = 24 * 60 * 60 * 1000;
//   if (user.passwordChangedAt && (Date.now() - user.passwordChangedAt.getTime()) < minAgeMs) {
//     throw new Error('Password was changed recently. Try later.');
//   }

  // verify current password
  const ok = await comparePassword(currentPassword, user.passwordHash);
  if (!ok) throw new Error('Invalid credentials');

  // prevent reuse by comparing hash with history (bcrypt => compare)
  for (let oldPasswords of user.passwordHistory || []) {
    const reused = await comparePassword(newPassword, oldPasswords.hash);
    if (reused) throw new Error('New password must not match recent passwords');
  }

  const newHash = await hashPassword(newPassword);
  // push to history and keep limit
  user.passwordHistory.unshift({ hash: newHash, changedAt: new Date() });
  user.passwordHistory = user.passwordHistory.slice(0, PASSWORD_HISTORY_LIMIT);
  user.passwordHash = newHash;
  user.passwordChangedAt = new Date();
  user.isTempPassword = false; // no longer temp
  await user.save();

  await sendEmail(user.email, 'Password changed', 'Your password was changed successfully.');

  return true;
}

module.exports = changePassword;