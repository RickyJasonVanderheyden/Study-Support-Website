const nodemailer = require('nodemailer');

const getEmailConfig = () => {
  const host = String(process.env.EMAIL_HOST || '').trim();
  const portRaw = String(process.env.EMAIL_PORT || '').trim();
  const user = String(process.env.EMAIL_USER || '').trim();
  const pass = String(process.env.EMAIL_PASS || '').trim();
  const from = String(process.env.EMAIL_FROM || '').trim() || user;

  const port = portRaw ? Number.parseInt(portRaw, 10) : NaN;
  const secure = port === 465;

  return { host, port, user, pass, from, secure };
};

const createTransporter = () => {
  const { host, port, user, pass, secure } = getEmailConfig();
  return nodemailer.createTransport({
    host,
    port,
    secure, // true for 465, false for other ports
    auth: { user, pass },
  });
};

const sendEmail = async (to, subject, html) => {
  try {
    // Check if email is configured
    const cfg = getEmailConfig();
    const missing = [];
    if (!cfg.host) missing.push('EMAIL_HOST');
    if (!Number.isFinite(cfg.port)) missing.push('EMAIL_PORT');
    if (!cfg.user || cfg.user === 'your-actual-gmail@gmail.com' || cfg.user === 'your_email@gmail.com') missing.push('EMAIL_USER');
    if (!cfg.pass || cfg.pass === 'your_16_char_app_password') missing.push('EMAIL_PASS');
    
    let transporter;
    let fromAddress = cfg.from;

    if (missing.length) {
      console.warn(`⚠️ Real email not configured: Missing/invalid ${missing.join(', ')}`);
      console.log(`🧪 Falling back to Ethereal Test Email for demonstration purposes!`);
      
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      fromAddress = testAccount.user;
    } else {
      transporter = createTransporter();
    }

    const mailOptions = {
      from: fromAddress,
      to,
      subject,
      html,
    };

    console.log(`📧 Attempting to send email to ${to}...`);
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    
    if (missing.length) {
      console.log(`\n======================================================`);
      console.log(`👀 VIVA DEMONSTRATION: PREVIEW EMAIL HERE`);
      console.log(`🔗 ${nodemailer.getTestMessageUrl(info)}`);
      console.log(`======================================================\n`);
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    return { success: false, error: error.message };
  }
};

const sendSessionLeadApprovalEmail = async (userEmail, userName) => {
  const subject = 'Session Lead Application Approved - LearnLoop';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Session Lead Approved</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #276332, #556B2F, #F59E0B); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #276332; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Congratulations!</h1>
          <h2>Your Session Lead Application Has Been Approved</h2>
        </div>
        <div class="content">
          <p>Dear <strong>${userName}</strong>,</p>

          <p>Great news! Your application to become a Session Lead on LearnLoop has been approved by our Super Admin.</p>

          <p>You now have access to:</p>
          <ul>
            <li>✅ Create and manage peer study sessions</li>
            <li>✅ Access to advanced session management tools</li>
            <li>✅ Lead study groups and mentoring sessions</li>
            <li>✅ Enhanced dashboard with session analytics</li>
          </ul>

          <p>You can now log in to your account and start exploring your new privileges!</p>

          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="button">Login to LearnLoop</a>

          <p>If you have any questions or need assistance getting started, please don't hesitate to contact our support team.</p>

          <p>Welcome to the LearnLoop leadership team!</p>

          <p>Best regards,<br>The LearnLoop Team</p>
        </div>
        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>© 2026 LearnLoop. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail(userEmail, subject, html);
};

const sendSessionLeadRejectionEmail = async (userEmail, userName) => {
  const subject = 'Session Lead Application Update - LearnLoop';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Session Lead Application Update</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #dc2626, #991b1b); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #276332; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Application Update</h1>
          <h2>Session Lead Application Status</h2>
        </div>
        <div class="content">
          <p>Dear <strong>${userName}</strong>,</p>

          <p>Thank you for your interest in becoming a Session Lead on LearnLoop.</p>

          <p>After careful review, we regret to inform you that your application has not been approved at this time.</p>

          <p>This decision was made based on our current requirements and capacity. We appreciate your enthusiasm and encourage you to continue participating as a student member of our community.</p>

          <p>You can still:</p>
          <ul>
            <li>✅ Join peer study sessions</li>
            <li>✅ Access all learning materials</li>
            <li>✅ Participate in group discussions</li>
            <li>✅ Use all student features</li>
          </ul>

          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="button">Continue Learning</a>

          <p>If you have any questions or would like feedback on your application, please contact our support team.</p>

          <p>Thank you for being part of the LearnLoop community!</p>

          <p>Best regards,<br>The LearnLoop Team</p>
        </div>
        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>© 2026 LearnLoop. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail(userEmail, subject, html);
};

module.exports = {
  sendSessionLeadApprovalEmail,
  sendSessionLeadRejectionEmail,
};