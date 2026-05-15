const getResetPasswordEmailTemplate = (email,resetUrl,resetToken) => {

    const htmlContent = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #4f46e5; padding: 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Password Reset</h1>
            </div>
            <div style="padding: 30px; color: #333333; line-height: 1.6;">
            <p>Hello ${email},</p>
            <p>We received a request to reset your password. Use the verification token below to complete the process on the reset page:</p>
            
            <!-- Token Display -->
            <div style="background-color: #f3f4f6; border-radius: 4px; padding: 15px; text-align: center; margin: 20px 0; border: 1px dashed #4f46e5;">
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 18px; font-weight: bold; color: #1f2937; word-break: break-all;">
                ${resetToken}
                </span>
            </div>

            <p>Click the button below to go to the reset page:</p>
            
            <!-- Action Button -->
            <div style="text-align: center; margin-top: 30px;">
                <a href="${resetUrl}" style="background-color: #4f46e5; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Reset Password
                </a>
            </div>

            <p style="font-size: 12px; color: #6b7280; margin-top: 30px;">
                This token will expire in <strong>60 minutes</strong>. If you did not request this, please ignore this email or contact support.
            </p>
            </div>
            <div style="background-color: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e0e0e0;">
            © ${new Date().getFullYear()} Your App Name. All rights reserved.
            </div>
        </div>
        `;
    return htmlContent;
}

module.exports = {getResetPasswordEmailTemplate}