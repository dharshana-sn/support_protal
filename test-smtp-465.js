require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('--- SMTP TEST (PORT 465) ---');
console.log('SMTP_USER:', process.env.SMTP_USER);
console.log('SMTP_HOST:', process.env.SMTP_HOST);
console.log('SMTP_PORT:', process.env.SMTP_PORT);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 465,
  secure: true, // true for 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const mailOptions = {
  from: `"TerrA Support Port 465 Test" <${process.env.SMTP_USER}>`,
  to: process.env.MAIL_TO || process.env.SMTP_USER,
  subject: 'TerrA Support - Port 465 Test Mail',
  text: 'This test uses Port 465 with secure: true.'
};

transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.error('SMTP PORT 465 TEST FAILED:', error);
    process.exit(1);
  } else {
    console.log('SMTP PORT 465 TEST SUCCESSFUL:', info.response);
    process.exit(0);
  }
});
