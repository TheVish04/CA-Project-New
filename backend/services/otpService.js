const otpGenerator = require('otp-generator');
const nodemailer = require('nodemailer');
require('dotenv').config();

// In-memory OTP storage (in production, use Redis or a database)
const otpStore = new Map();

// Configure nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Generate OTP and store it
const generateOTP = (email) => {
  // Generate a 6-digit OTP
  const otp = otpGenerator.generate(6, { 
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false
  });
  
  // Store OTP with expiry time (5 minutes)
  otpStore.set(email, {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
  });
  
  return otp;
};

// Verify OTP
const verifyOTP = (email, otp) => {
  const otpData = otpStore.get(email);
  
  if (!otpData) {
    return { valid: false, message: 'OTP not found. Please request a new OTP.' };
  }
  
  if (Date.now() > otpData.expiresAt) {
    otpStore.delete(email); // Clean up expired OTP
    return { valid: false, message: 'OTP has expired. Please request a new OTP.' };
  }
  
  if (otpData.otp !== otp) {
    return { valid: false, message: 'Invalid OTP. Please try again.' };
  }
  
  // OTP is valid, clean up
  otpStore.delete(email);
  return { valid: true, message: 'OTP verified successfully.' };
};

// Send OTP via email
const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your OTP for CA Exam Platform Registration',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #1a2a44;">CA Exam Platform - Email Verification</h2>
        <p>Thank you for registering with CA Exam Platform. Please use the following OTP to verify your email address:</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
          <h1 style="color: #00b4d8; letter-spacing: 5px; margin: 0;">${otp}</h1>
        </div>
        <p>This OTP is valid for 5 minutes.</p>
        <p>If you didn't request this OTP, please ignore this email.</p>
        <p style="margin-top: 30px; font-size: 12px; color: #777;">
          This is an automated email. Please do not reply.
        </p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  generateOTP,
  verifyOTP,
  sendOTPEmail
};