const express = require("express");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const { User } = require("../models");
const router = express.Router();

let transporter = nodemailer.createTransport({
  host: process.env.HOST,
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


router.post("/", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "Email not found" });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiration = Date.now() + 3600000; 

    user.resetPasswordToken = token;
    user.resetPasswordExpires = resetTokenExpiration;
    await user.save();

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
   const mailOptions = {
  from: process.env.EMAIL_USER,
  to: email,
  subject: "Password Reset Request",
  html: `
    <div style="font-family: Arial, sans-serif; background-color: #4B0082; color: #FFFFFF; padding: 20px; border-radius: 8px; text-align: center;">
      <h2 style="margin-bottom: 20px;">Password Reset Request</h2>
      <p style="margin-bottom: 20px;">
        You requested a password reset. Click the button below to reset your password:
      </p>
      <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #FFFFFF; color: #4B0082; font-weight: bold; text-decoration: none; border-radius: 6px;">
        Reset Password
      </a>
      <p style="margin-top: 20px; font-size: 12px; color: #DDD;">
        If you did not request this, please ignore this message.
      </p>
    </div>
  `,
};


    await transporter.sendMail(mailOptions);

    res.json({ message: "Password reset email sent." });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ message: "Error sending password reset email." });
  }
});

module.exports = router;
