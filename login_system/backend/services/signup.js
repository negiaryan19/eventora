const User = require('../models/User');
const { validatePasswordRules, hashPassword, sendEmail } = require("./utils")

async function signup(email, password, userInfo) {
  // enforce policy server-side
  const validationResult = validatePasswordRules(password);
  if (!validationResult.ok) throw new Error(validationResult.msg);

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw new Error('Invalid credentials'); // avoid revealing which part failed
  
  const hash = await hashPassword(password);
  const user = new User({
    email: email.toLowerCase(),
    passwordHash: hash,
    passwordChangedAt: new Date(),
    passwordHistory: [{ hash, changedAt: new Date() }],
    isTempPassword: false,
    country: userInfo.country,
    phone: userInfo.phone,
    gender: userInfo.gender,
    dob: userInfo.dob,
  });
  await user.save();

  // Notify user (mock)
  await sendEmail(user.email, 'Welcome', 'Your account was created.');
  return { id: user._id, email: user.email };
}

module.exports = signup;