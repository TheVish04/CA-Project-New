const otpGenerator = require('otp-generator');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
require('dotenv').config();

// Enhanced in-memory OTP storage with rate limiting and cleanup
// For production, use Redis or a database
const otpStore = new Map();
const rateLimit = new Map(); // Store attempt counts per email

// Regularly clean up expired OTPs to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [email, data] of otpStore.entries()) {
    if (now > data.expiresAt) {
      otpStore.delete(email);
    }
  }
}, 60000); // Clean up every minute

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
  // Check if rate limit exceeded (max 3 OTPs in 15 minutes)
  const now = Date.now();
  const recentAttempts = rateLimit.get(email) || [];
  
  // Remove attempts older than 15 minutes
  const recentValidAttempts = recentAttempts.filter(
    timestamp => now - timestamp < 15 * 60 * 1000
  );
  
  if (recentValidAttempts.length >= 3) {
    throw new Error('Rate limit exceeded. Please try again in 15 minutes.');
  }
  
  // Add current attempt and update rate limit
  recentValidAttempts.push(now);
  rateLimit.set(email, recentValidAttempts);
  
  // Generate a secure 6-digit OTP
  const otp = otpGenerator.generate(6, { 
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false
  });
  
  // Hash the OTP for storage (don't store in plain text)
  const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');
  
  // Store OTP with expiry time (5 minutes)
  otpStore.set(email, {
    hashedOTP,
    expiresAt: now + 5 * 60 * 1000, // 5 minutes
    attempts: 0 // Track failed verification attempts
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
  
  // Limit attempts to prevent brute force (max 5 attempts)
  if (otpData.attempts >= 5) {
    otpStore.delete(email); // Invalidate after too many attempts
    return { valid: false, message: 'Too many failed attempts. Please request a new OTP.' };
  }
  
  // Hash the user-provided OTP to compare
  const hashedInputOTP = crypto.createHash('sha256').update(otp).digest('hex');
  
  if (otpData.hashedOTP !== hashedInputOTP) {
    // Increment failed attempts
    otpData.attempts += 1;
    otpStore.set(email, otpData);
    return { valid: false, message: 'Invalid OTP. Please try again.' };
  }
  
  // OTP is valid, clean up
  otpStore.delete(email);
  
  // Also remove from rate limit after successful verification
  const recentAttempts = rateLimit.get(email) || [];
  if (recentAttempts.length <= 1) {
    rateLimit.delete(email);
  } else {
    rateLimit.set(email, recentAttempts.slice(0, -1));
  }
  
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
    console.log(`Attempting to send OTP email to: ${email}`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${email}. Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending OTP email:', {
      error: error.message,
      stack: error.stack,
      email: email
    });
    return { 
      success: false, 
      error: error.message,
      transportError: error.code || 'UNKNOWN'
    };
  }
};

module.exports = {
  generateOTP,
  verifyOTP,
  sendOTPEmail
};