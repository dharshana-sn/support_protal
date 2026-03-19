const express = require('express');
const router = express.Router();
const SupportRequest = require('../models/SupportRequest');
const auth = require('../middleware/auth');
const nodemailer = require('nodemailer');

// Create Support Request
router.post('/', auth, async (req, res) => {
  try {
    const requestData = { ...req.body, userId: req.user.id };
    const request = await SupportRequest.create(requestData);

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

// Get User's Support Requests (paginated)
router.get('/', auth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit) || 5));
    const offset = (page - 1) * limit;

    const { count, rows } = await SupportRequest.findAndCountAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
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

module.exports = router;
