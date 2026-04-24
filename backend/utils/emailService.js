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

/**
 * Send email notification when a group invitation is sent to a student.
 * @param {string} recipientEmail - The invited student's email
 * @param {string} recipientName - The invited student's name
 * @param {string} inviterName - The group leader who sent the invite
 * @param {string} groupName - Name of the group
 * @param {string} moduleCode - Module code (e.g. SE3040)
 * @param {string} personalMessage - Optional personal message from the inviter
 */
const sendGroupInvitationEmail = async (recipientEmail, recipientName, inviterName, groupName, moduleCode, personalMessage) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const subject = `You've been invited to join "${groupName}" — LearnLoop`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Group Invitation</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f0f2f5; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; padding: 35px 30px; text-align: center; border-radius: 12px 12px 0 0; }
        .header h1 { margin: 0 0 8px 0; font-size: 24px; }
        .header p { margin: 0; opacity: 0.9; font-size: 14px; }
        .content { background: #ffffff; padding: 30px; border-radius: 0 0 12px 12px; }
        .group-card { background: #f8f7ff; border: 1px solid #e0e0ff; border-radius: 10px; padding: 20px; margin: 20px 0; }
        .group-card .label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 4px; }
        .group-card .value { font-size: 16px; font-weight: 700; color: #1a1a2e; }
        .message-box { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px 20px; border-radius: 0 8px 8px 0; margin: 20px 0; }
        .message-box .from { font-size: 12px; color: #92400e; font-weight: 600; margin-bottom: 6px; }
        .message-box .text { font-size: 14px; color: #78350f; font-style: italic; }
        .button { display: inline-block; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; padding: 14px 36px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 700; font-size: 14px; }
        .info { font-size: 13px; color: #6b7280; margin-top: 20px; padding-top: 20px; border-top: 1px solid #f0f0f0; }
        .footer { text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📨 Group Invitation</h1>
          <p>You've been invited to join a study group!</p>
        </div>
        <div class="content">
          <p>Hi <strong>${recipientName || 'there'}</strong>,</p>

          <p><strong>${inviterName}</strong> has invited you to join their study group on LearnLoop:</p>

          <div class="group-card">
            <div style="margin-bottom: 12px;">
              <div class="label">Group Name</div>
              <div class="value">${groupName}</div>
            </div>
            <div>
              <div class="label">Module</div>
              <div class="value">${moduleCode}</div>
            </div>
          </div>

          ${personalMessage ? `
          <div class="message-box">
            <div class="from">💬 Message from ${inviterName}:</div>
            <div class="text">"${personalMessage}"</div>
          </div>
          ` : ''}

          <p>Log in to LearnLoop to <strong>accept or decline</strong> this invitation:</p>

          <div style="text-align: center;">
            <a href="${frontendUrl}/module4" class="button">View Invitation →</a>
          </div>

          <div class="info">
            <p>⏰ This invitation will expire in <strong>7 days</strong>. Please respond before it expires.</p>
            <p>If you did not expect this invitation, you can safely ignore this email.</p>
          </div>
        </div>
        <div class="footer">
          <p>This is an automated message from LearnLoop. Please do not reply to this email.</p>
          <p>© 2026 LearnLoop. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail(recipientEmail, subject, html);
};

/**
 * Send email notification when an invitation is accepted or declined.
 * @param {string} inviterEmail - The group leader's email
 * @param {string} inviterName - The group leader's name
 * @param {string} responderName - The student who accepted/declined
 * @param {string} groupName - Name of the group
 * @param {string} moduleCode - Module code
 * @param {string} action - 'accepted' or 'declined'
 */
const sendInvitationResponseEmail = async (inviterEmail, inviterName, responderName, groupName, moduleCode, action) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const isAccepted = action === 'accepted';
  const emoji = isAccepted ? '🎉' : '😔';
  const statusColor = isAccepted ? '#059669' : '#dc2626';
  const statusBg = isAccepted ? '#ecfdf5' : '#fef2f2';
  const statusBorder = isAccepted ? '#a7f3d0' : '#fecaca';
  const subject = isAccepted
    ? `${responderName} accepted your invitation to "${groupName}" — LearnLoop`
    : `${responderName} declined your invitation to "${groupName}" — LearnLoop`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invitation ${action}</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f0f2f5; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, ${isAccepted ? '#059669, #10b981' : '#dc2626, #ef4444'}); color: white; padding: 35px 30px; text-align: center; border-radius: 12px 12px 0 0; }
        .header h1 { margin: 0 0 8px 0; font-size: 24px; }
        .header p { margin: 0; opacity: 0.9; font-size: 14px; }
        .content { background: #ffffff; padding: 30px; border-radius: 0 0 12px 12px; }
        .status-card { background: ${statusBg}; border: 1px solid ${statusBorder}; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: center; }
        .status-card .status { font-size: 18px; font-weight: 700; color: ${statusColor}; }
        .button { display: inline-block; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; padding: 14px 36px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 700; font-size: 14px; }
        .footer { text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${emoji} Invitation ${isAccepted ? 'Accepted' : 'Declined'}</h1>
          <p>Update on your group invitation</p>
        </div>
        <div class="content">
          <p>Hi <strong>${inviterName || 'there'}</strong>,</p>

          <div class="status-card">
            <div class="status">
              ${isAccepted
                ? `${responderName} has joined "${groupName}"!`
                : `${responderName} declined to join "${groupName}"`
              }
            </div>
            <p style="margin: 8px 0 0; font-size: 13px; color: #6b7280;">Module: <strong>${moduleCode}</strong></p>
          </div>

          ${isAccepted
            ? `<p>Great news! Your group now has a new member. Head to your group page to get started collaborating.</p>`
            : `<p>Unfortunately, ${responderName} has declined your invitation. You can browse other students and send new invitations from the Find Members section.</p>`
          }

          <div style="text-align: center;">
            <a href="${frontendUrl}/module4" class="button">Go to My Groups →</a>
          </div>
        </div>
        <div class="footer">
          <p>This is an automated message from LearnLoop. Please do not reply to this email.</p>
          <p>© 2026 LearnLoop. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail(inviterEmail, subject, html);
};

/**
 * Send email notification to ALL admin users when a new group is created.
 * @param {object} groupInfo - { name, moduleCode, academicYear, year, semester, mainGroup, subGroup }
 * @param {object} creatorInfo - { name, email, registrationNumber, role }
 */
const sendGroupCreatedAdminEmail = async (groupInfo, creatorInfo) => {
  try {
    const User = require('../models/User');
    const admins = await User.find({
      role: { $in: ['admin', 'super_admin'] },
      isActivated: true,
    }).select('email name');

    if (!admins.length) {
      console.log('ℹ️ No admin users found to notify about group creation.');
      return { success: true, sent: 0 };
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const subject = `New Group Created: "${groupInfo.name}" — LearnLoop`;
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Group Created</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f0f2f5; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #276332, #556B2F); color: white; padding: 35px 30px; text-align: center; border-radius: 12px 12px 0 0; }
        .header h1 { margin: 0 0 8px 0; font-size: 24px; }
        .header p { margin: 0; opacity: 0.9; font-size: 14px; }
        .content { background: #ffffff; padding: 30px; border-radius: 0 0 12px 12px; }
        .detail-card { background: #f8faf8; border: 1px solid #d4edda; border-radius: 10px; padding: 20px; margin: 20px 0; }
        .detail-row { display: flex; margin-bottom: 10px; }
        .detail-row .label { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #888; min-width: 120px; }
        .detail-row .value { font-size: 14px; font-weight: 600; color: #1a1a2e; }
        .creator-card { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 15px 20px; margin: 20px 0; }
        .creator-card .title { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #3b82f6; font-weight: 600; margin-bottom: 8px; }
        .button { display: inline-block; background: linear-gradient(135deg, #276332, #556B2F); color: white; padding: 14px 36px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 700; font-size: 14px; }
        .footer { text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📢 New Group Created</h1>
          <p>A student has created a new study group</p>
        </div>
        <div class="content">
          <p>Hello Admin,</p>
          <p>A new study group has been created on LearnLoop:</p>

          <div class="detail-card">
            <table style="width:100%; border-collapse:collapse;">
              <tr><td style="padding:6px 0; color:#888; font-size:12px; text-transform:uppercase; letter-spacing:1px;">Group Name</td><td style="padding:6px 0; font-weight:700; color:#1a1a2e;">${groupInfo.name}</td></tr>
              <tr><td style="padding:6px 0; color:#888; font-size:12px; text-transform:uppercase; letter-spacing:1px;">Module</td><td style="padding:6px 0; font-weight:700; color:#1a1a2e;">${groupInfo.moduleCode.toUpperCase()}</td></tr>
              <tr><td style="padding:6px 0; color:#888; font-size:12px; text-transform:uppercase; letter-spacing:1px;">Year / Semester</td><td style="padding:6px 0; font-weight:700; color:#1a1a2e;">Y${groupInfo.year} / S${groupInfo.semester}</td></tr>
              <tr><td style="padding:6px 0; color:#888; font-size:12px; text-transform:uppercase; letter-spacing:1px;">Group / Sub</td><td style="padding:6px 0; font-weight:700; color:#1a1a2e;">${groupInfo.mainGroup}.${groupInfo.subGroup}</td></tr>
            </table>
          </div>

          <div class="creator-card">
            <div class="title">👤 Created By</div>
            <table style="width:100%; border-collapse:collapse;">
              <tr><td style="padding:4px 0; color:#555;">Name:</td><td style="padding:4px 0; font-weight:600;">${creatorInfo.name}</td></tr>
              <tr><td style="padding:4px 0; color:#555;">Email:</td><td style="padding:4px 0; font-weight:600;">${creatorInfo.email}</td></tr>
              <tr><td style="padding:4px 0; color:#555;">ID:</td><td style="padding:4px 0; font-weight:600;">${creatorInfo.registrationNumber}</td></tr>
              <tr><td style="padding:4px 0; color:#555;">Role:</td><td style="padding:4px 0; font-weight:600;">${creatorInfo.role}</td></tr>
            </table>
          </div>

          <div style="text-align: center;">
            <a href="${frontendUrl}/module4" class="button">View in Admin Panel →</a>
          </div>
        </div>
        <div class="footer">
          <p>This is an automated notification from LearnLoop.</p>
          <p>© 2026 LearnLoop. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    `;

    const results = [];
    for (const admin of admins) {
      console.log(`📧 Sending group-created notification to admin: ${admin.email}`);
      const result = await sendEmail(admin.email, subject, html);
      results.push({ email: admin.email, ...result });
    }

    const sentCount = results.filter(r => r.success).length;
    console.log(`✅ Group creation email sent to ${sentCount}/${admins.length} admin(s)`);
    return { success: true, sent: sentCount, results };
  } catch (error) {
    console.error('❌ Failed to send group-created admin email:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendSessionLeadApprovalEmail,
  sendSessionLeadRejectionEmail,
  sendGroupInvitationEmail,
  sendInvitationResponseEmail,
  sendGroupCreatedAdminEmail,
};