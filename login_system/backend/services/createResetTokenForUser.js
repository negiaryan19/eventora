const crypto = require('crypto');
const User = require('../models/User');
const { sendEmail } = require("./utils");
const { getResetPasswordEmailTemplate } = require("./emailTemplate");

const RESET_TOKEN_EXPIRES_MIN = parseInt(process.env.RESET_TOKEN_EXPIRES_MIN || '60', 10);

async function createResetTokenForUser(email) {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    // Do not reveal absence of account; return success to caller
    return;
  }

  // generate random token, store hashed version
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  user.resetPasswordTokenHash = tokenHash;
  user.resetPasswordExpires = new Date(Date.now() + RESET_TOKEN_EXPIRES_MIN * 60 * 1000);
  user.isTempPassword = true; // after reset user must change
  await user.save();

  // Send email with reset link (mock)
  /*
  Your frontend app (e.g. React, HTML form, etc.) has a frontend route /reset-password 
  that reads token and email from the URL. /reset-password opens the password reset form in the browser.
  user enters a new password in reset form and submits. This submit with call POST request to /reset-password
  */
  const link = `${process.env.CLIENT_URL}/reset-password`;
  const html = getResetPasswordEmailTemplate(user.email,link,token);
  await sendEmail(user.email, 'Password reset', null, html);

  return;
}
module.exports = createResetTokenForUser;