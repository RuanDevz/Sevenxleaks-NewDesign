const nodemailer = require('nodemailer');

const sendConfirmationEmail = async (email) => {
let transporter = nodemailer.createTransport({
  host:  process.env.HOST,
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


  // Email content
const mailOptions = {
  from: '"VIP Service" <your-email@example.com>',
  to: email,
  subject: 'VIP Membership Confirmation!',
  text: 'Congratulations! You are now a VIP member.',
  html: `
    <div style="font-family: Arial, sans-serif; background-color: #4B0082; color: #FFFFFF; padding: 25px; border-radius: 8px; text-align: center;">
      <h1 style="margin-bottom: 20px;">🎉 Welcome to VIP Access 🎉</h1>
      <p style="margin-bottom: 20px;">Hello,</p>
      <p style="margin-bottom: 20px;">
        We are excited to inform you that your payment was <b>successful</b> and you are now a <span style="color: #FFD700;">VIP member</span>!
      </p>
      <p style="margin-bottom: 20px;">
        Enjoy exclusive content, ad-free experiences, and much more.
      </p>
      <p style="margin-top: 20px;">
        Thank you for being a part of our community!
      </p>
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #DDD;">
      <p style="font-size: 14px; color: #DDD;">
        Best regards,<br/> Your Service Team
      </p>
    </div>
  `,
};


  await transporter.sendMail(mailOptions);
};

module.exports = sendConfirmationEmail;
