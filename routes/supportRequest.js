const express = require('express');
const router = express.Router();
const SupportRequest = require('../models/SupportRequest');
const Comment = require('../models/Comment');
const User = require('../models/User');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');
const nodemailer = require('nodemailer');
const { Op, Sequelize } = require('sequelize');

// Create Support Request
router.post('/', auth, async (req, res) => {
  try {
    const requestData = { ...req.body, userId: req.user.id };
    const request = await SupportRequest.create(requestData);

    try {
      // Notify support team
      const supportUsers = await User.findAll({ where: { role: 'support' } });
      const notifications = supportUsers
        .filter(u => u.id !== req.user.id)
        .map(u => ({
          userId: u.id,
          message: `New Ticket #${request.id}: ${request.summary.substring(0, 40)}`,
          SupportRequestId: request.id,
          isRead: false
        }));
      if (notifications.length > 0) await Notification.bulkCreate(notifications);
    } catch (notifErr) { console.error('Notification error:', notifErr); }

    // Send Email (if SMTP credentials are configured)
    console.log('--- Email Check ---');
    console.log('SMTP_USER:', process.env.SMTP_USER ? 'Set' : 'Missing');
    console.log('SMTP_PASS:', process.env.SMTP_PASS ? 'Set' : 'Missing');
    console.log('MAIL_TO:', process.env.MAIL_TO);

    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      console.log('Attempting to create transporter...');
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_PORT == 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      const submittedAt = new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short',
        year: 'numeric', hour: '2-digit', minute: '2-digit'
      });

      const row = (label, value) =>
        value ? `<tr><td style="padding:10px 16px;font-weight:600;color:#054279;width:38%;border-bottom:1px solid #edf2f7;font-size:0.88rem;">${label}</td><td style="padding:10px 16px;color:#374151;border-bottom:1px solid #edf2f7;font-size:0.88rem;">${value || '—'}</td></tr>` : '';

      const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:40px 0;">
    <tr><td align="center">
      <table width="620" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.1);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#054279,#0891b2);padding:32px 36px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:1.6rem;font-weight:800;letter-spacing:-0.02em;">TerrA Support Request</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:0.9rem;">New defect ticket submitted via the Support Portal</p>
          </td>
        </tr>

        <!-- Summary Banner -->
        <tr>
          <td style="background:#f0f7ff;padding:20px 36px;border-bottom:3px solid #054279;">
            <p style="margin:0;font-size:0.8rem;color:#64748b;text-transform:uppercase;letter-spacing:0.07em;font-weight:600;">Summary</p>
            <p style="margin:6px 0 0;font-size:1.15rem;font-weight:700;color:#054279;">${request.summary || '—'}</p>
          </td>
        </tr>

        <!-- Section: Defect Identification -->
        <tr><td style="padding:24px 36px 8px;">
          <p style="margin:0 0 12px;font-size:0.78rem;text-transform:uppercase;letter-spacing:0.1em;font-weight:700;color:#0891b2;">📋 Defect Identification</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
            ${row('Reported By', request.reportedBy)}
            ${row('Date Reported', request.dateReported)}
            ${row('Project Name', request.projectName)}
            ${row('Module / Feature', request.moduleFeature)}
            ${row('Environment', request.environment)}
            ${row('TerrA Version', request.terraVersion)}
          </table>
        </td></tr>

        <!-- Section: Description -->
        <tr><td style="padding:20px 36px 8px;">
          <p style="margin:0 0 12px;font-size:0.78rem;text-transform:uppercase;letter-spacing:0.1em;font-weight:700;color:#0891b2;">📝 Description</p>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;font-size:0.9rem;color:#374151;line-height:1.7;">
            <strong style="color:#054279;">Detailed Description:</strong><br>${(request.detailedDescription || '—').replace(/\n/g,'<br>')}
          </div>
          ${request.preconditions ? `<div style="margin-top:10px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;font-size:0.9rem;color:#374151;line-height:1.7;"><strong style="color:#054279;">Preconditions:</strong><br>${request.preconditions.replace(/\n/g,'<br>')}</div>` : ''}
        </td></tr>

        <!-- Section: Steps to Reproduce -->
        ${(request.step1 || request.step2 || request.step3) ? `
        <tr><td style="padding:20px 36px 8px;">
          <p style="margin:0 0 12px;font-size:0.78rem;text-transform:uppercase;letter-spacing:0.1em;font-weight:700;color:#0891b2;">🔄 Steps to Reproduce</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
            ${row('Step 1', request.step1)}
            ${row('Step 2', request.step2)}
            ${row('Step 3', request.step3)}
            ${row('Expected Result', request.expectedResult)}
            ${row('Actual Result', request.actualResult)}
          </table>
        </td></tr>` : ''}

        <!-- Section: Attachments -->
        <tr><td style="padding:20px 36px 8px;">
          <p style="margin:0 0 12px;font-size:0.78rem;text-transform:uppercase;letter-spacing:0.1em;font-weight:700;color:#0891b2;">📎 Attachments & Notes</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
            ${row('Screenshots Attached?', request.screenshotsAttached)}
            ${row('Log Files Attached?', request.logFilesAttached)}
            ${row('Additional Notes', request.additionalNotes)}
          </table>
        </td></tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:24px 36px;border-top:1px solid #e2e8f0;margin-top:24px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:0.82rem;color:#94a3b8;">Submitted by <strong style="color:#054279;">${req.user.username}</strong> on ${submittedAt} IST</td>
                <td align="right" style="font-size:0.82rem;color:#94a3b8;">Ticket ID: <strong style="color:#054279;">#${request.id}</strong></td>
              </tr>
            </table>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

      const plainText = `TerrA Support Request #${request.id}
Submitted by: ${req.user.username} on ${submittedAt} IST

SUMMARY: ${request.summary}
Project: ${request.projectName} | Environment: ${request.environment}
Reported By: ${request.reportedBy} | Date: ${request.dateReported}
Module: ${request.moduleFeature} | TerrA Version: ${request.terraVersion}

DESCRIPTION:
${request.detailedDescription}

Preconditions: ${request.preconditions || '—'}

STEPS TO REPRODUCE:
1. ${request.step1 || '—'}
2. ${request.step2 || '—'}
3. ${request.step3 || '—'}
Expected: ${request.expectedResult || '—'}
Actual:   ${request.actualResult || '—'}

ATTACHMENTS:
Screenshots: ${request.screenshotsAttached} | Log Files: ${request.logFilesAttached}
Notes: ${request.additionalNotes || '—'}`;

      const mailOptions = {
        from: `"TerrA Support Portal" <${process.env.SMTP_USER}>`,
        to: process.env.MAIL_TO || process.env.SMTP_USER,
        subject: `[TerrA] #${request.id} – ${request.summary} (${request.environment || 'N/A'})`,
        text: plainText,
        html: htmlBody
      };

      console.log('Calling sendMail to:', mailOptions.to);
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('SERVER SMTP ERROR:', error);
        } else {
          console.log('SERVER SMTP SUCCESS:', info.response);
        }
      });
    } else {
      console.log('No SMTP credentials found, skipping email notification.');
    }

    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get list of Project Names (for filters)
router.get('/projects', auth, async (req, res) => {
  try {
    const where = req.user.role === 'support' ? {} : { userId: req.user.id };
    const projects = await SupportRequest.findAll({
      where,
      attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('projectName')), 'projectName']],
      raw: true
    });
    res.json(projects.map(p => p.projectName).filter(Boolean));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get Support Requests (paginated)
router.get('/', auth, async (req, res) => {
  try {
    const { page: qPage, limit: qLimit, search, project } = req.query;
    console.log(`[Support API] GET /?page=${qPage}&limit=${qLimit}&search=${search}&project=${project}`);
    const page = Math.max(1, parseInt(qPage) || 1);
    const limit = Math.max(1, Math.min(50, parseInt(qLimit) || 5));
    const offset = (page - 1) * limit;

    let whereClause = req.user.role === 'support' ? {} : { userId: req.user.id };
    
    // Project Filter
    if (project && project.trim() !== '') {
      whereClause.projectName = project.trim();
    }

    const { count, rows } = await SupportRequest.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      include: [{ model: User, attributes: ['username'] }],
      limit,
      offset
    });

    res.json({
      rows,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get Single Request with Comments
router.get('/:id', auth, async (req, res) => {
  try {
    const request = await SupportRequest.findByPk(req.params.id, {
      include: [
        { 
          model: Comment, 
          include: [{ model: User, attributes: ['username'] }],
          order: [['createdAt', 'ASC']] 
        },
        { model: User, attributes: ['username'] }
      ]
    });
    
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (req.user.role !== 'support' && request.userId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add a Comment
router.post('/:id/comment', auth, async (req, res) => {
  try {
    const request = await SupportRequest.findByPk(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (req.user.role !== 'support' && request.userId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Comment text is required' });

    const comment = await Comment.create({
      text,
      authorName: req.user.username,
      SupportRequestId: request.id,
      UserId: req.user.id
    });

    try {
      // Notify support team ONLY if the commenter is NOT the only support person
      const supportUsers = await User.findAll({ where: { role: 'support' } });
      const notifications = supportUsers
         .filter(u => u.id !== req.user.id) // Don't notify the person who wrote the comment
         .map(u => ({
           userId: u.id,
           message: `New Comment on Ticket #${request.id} by ${req.user.username}`,
           SupportRequestId: request.id,
           isRead: false
         }));
      if (notifications.length > 0) await Notification.bulkCreate(notifications);
      
      // Notify ticket owner if commenter is support AND owner isn't the commenter
      if (req.user.role === 'support' && request.userId !== req.user.id) {
         await Notification.create({
           userId: request.userId,
           message: `Support replied to your Ticket #${request.id}`,
           SupportRequestId: request.id,
           isRead: false
         });
      }
    } catch (notifErr) { console.error('Notification error:', notifErr); }

    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update Status
// - Support team: New / Open / In Progress / Resolved  → notifies ticket owner
// - Ticket owner:  Reopened / Closed                  → notifies support + sends email
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const request = await SupportRequest.findByPk(req.params.id, {
      include: [{ model: User, attributes: ['username', 'id'] }]
    });
    if (!request) return res.status(404).json({ message: 'Request not found' });

    const { status } = req.body;
    if (!status) return res.status(400).json({ message: 'Status is required' });

    const isSupport = req.user.role === 'support';
    const isOwner  = Number(request.userId) === Number(req.user.id);

    const supportStatuses = ['New', 'Open', 'In Progress', 'Resolved', 'Reopened', 'Closed'];
    const userStatuses    = ['Reopened', 'Closed'];

    const isSupportStatus = supportStatuses.includes(status);
    const isUserStatus    = userStatuses.includes(status);

    if ((isSupport && isSupportStatus) || ((isOwner || isSupport) && isUserStatus)) {
      // Valid status transition
      request.status = status;
      await request.save();

      const actionBy = req.user.username;
      const actionLabel = isUserStatus ? (status === 'Reopened' ? 'Reopened' : 'Closed') : status;

      // 1. In-app notifications
      try {
        if (isSupportStatus && request.userId !== req.user.id) {
          // Support changed status -> notify owner
          await Notification.create({
            userId: request.userId,
            message: `Ticket #${request.id} status changed to "${status}" by support`,
            SupportRequestId: request.id,
          });
        } else if (isUserStatus) {
          // User changed status -> notify all support users
          const supportUsers = await User.findAll({ where: { role: 'support' } });
          const notifications = supportUsers
            .filter(u => u.id !== req.user.id)
            .map(u => ({
              userId: u.id,
              message: `Ticket #${request.id} was ${actionLabel} by ${actionBy}`,
              SupportRequestId: request.id,
            }));
          if (notifications.length > 0) await Notification.bulkCreate(notifications);
        }
      } catch (notifErr) { console.error('Notification error:', notifErr); }

      // 2. Email alert to Support Team (MAIL_TO) for ANY update
      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        try {
          const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT) || 465,
            secure: true,
            auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          });

          const actionTime = new Date().toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short',
            year: 'numeric', hour: '2-digit', minute: '2-digit'
          });

          // Visual context for email based on status
          let statusColor = '#054279'; let statusBg = '#f0f7ff'; let emoji = '🔔';
          if (status === 'Resolved') { statusColor = '#059669'; statusBg = '#ecfdf5'; emoji = '✅'; }
          if (status === 'Closed')   { statusColor = '#dc2626'; statusBg = '#fef2f2'; emoji = '🔒'; }
          if (status === 'Reopened') { statusColor = '#d97706'; statusBg = '#fffbeb'; emoji = '🔄'; }

          const htmlBody = `
<!DOCTYPE html>
<html><body style="font-family:sans-serif;background:#f3f4f6;padding:20px;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.05);">
    <div style="background:linear-gradient(135deg,#054279,#0891b2);padding:25px;text-align:center;color:#fff;">
      <h2 style="margin:0;">${emoji} Ticket Status Update</h2>
    </div>
    <div style="background:${statusBg};padding:15px 25px;border-bottom:2px solid ${statusColor};">
      <p style="margin:0;font-size:0.8rem;color:#64748b;text-transform:uppercase;">New Status</p>
      <p style="margin:5px 0 0;font-size:1.2rem;font-weight:bold;color:${statusColor};">${status}</p>
    </div>
    <div style="padding:25px;">
      <table width="100%" cellpadding="6" style="border-collapse:collapse;font-size:0.9rem;">
        <tr><td style="font-weight:bold;color:#4b5563;border-bottom:1px solid #f1f5f9;">Ticket ID</td><td style="border-bottom:1px solid #f1f5f9;">#${request.id}</td></tr>
        <tr><td style="font-weight:bold;color:#4b5563;border-bottom:1px solid #f1f5f9;">Summary</td><td style="border-bottom:1px solid #f1f5f9;">${request.summary || '—'}</td></tr>
        <tr><td style="font-weight:bold;color:#4b5563;border-bottom:1px solid #f1f5f9;">Action By</td><td style="border-bottom:1px solid #f1f5f9;">${actionBy}</td></tr>
        <tr><td style="font-weight:bold;color:#4b5563;">Time</td><td>${actionTime} IST</td></tr>
      </table>
    </div>
    <div style="background:#f9fafb;padding:15px 25px;font-size:0.8rem;color:#6b7280;border-top:1px solid #e5e7eb;">
      This is an automated alert from <strong>TerrA Support Portal</strong>.
    </div>
  </div>
</body></html>`;

          // Determing who needs to receive the email
          let targetEmail = process.env.MAIL_TO || process.env.SMTP_USER; // Default to support
          if (!isUserStatus && request.User && request.User.username && request.User.username.includes('@')) {
            // Support updated the ticket -> Notify the Owner!
            targetEmail = request.User.username;
          }

          await transporter.sendMail({
            from: `"TerrA Support Portal" <${process.env.SMTP_USER}>`,
            to: targetEmail,
            subject: `[TerrA] Ticket #${request.id} ${actionLabel} by ${actionBy}`,
            html: htmlBody
          });
        } catch (mailErr) { console.error('[SMTP ERROR]:', mailErr); }
      }

      return res.json({ message: 'Status updated successfully', request });
    }

    return res.status(403).json({ message: 'You are not allowed to set this status' });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;