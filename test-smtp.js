require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('--- SMTP TEST ---');
console.log('SMTP_USER:', process.env.SMTP_USER);
console.log('SMTP_PASS:', process.env.SMTP_PASS ? '********' : 'MISSING');
console.log('SMTP_HOST:', process.env.SMTP_HOST);
console.log('SMTP_PORT:', process.env.SMTP_PORT);
console.log('MAIL_TO:', process.env.MAIL_TO);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_PORT == 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const mailOptions = {
  from: `"TerrA Support SMTP Test" <${process.env.SMTP_USER}>`,
  to: process.env.MAIL_TO || process.env.SMTP_USER,
  subject: 'TerrA Support - SMTP Test Mail',
  text: 'If you are receiving this, SMTP is working correctly.'
};

transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.error('SMTP TEST FAILED:', error);
    process.exit(1);
  } else {
    console.log('SMTP TEST SUCCESSFUL:', info.response);
    process.exit(0);
  }
});
