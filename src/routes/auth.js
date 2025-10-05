const express = require("express");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const User = require("../models/User");
const Otp = require("../models/Otp");
const VerifiedEmail = require("../models/VerifiedEmail");

const router = express.Router();

// Removed in-memory stores; using MongoDB collections instead

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: 587,
    secure: false,
    auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
  });
}

router.post("/send-otp", async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ message: "Email required" });
  const normalizedEmail = String(email).toLowerCase();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    return res
      .status(409)
      .json({ success: false, message: "Email already registered" });
  }
  const code = generateOtp();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
  await Otp.deleteMany({ email: normalizedEmail });
  // await Otp.create({ email: normalizedEmail, otp: code, expiresAt });
  try {
    const transporter = createTransport();
    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: normalizedEmail,
      subject: "Your SafeTalk OTP Code",
      text: `Your OTP code is ${code}. It expires in 5 minutes.`,
    });
    return res.json({ success: true, message: "OTP sent" });
  } catch (err) {
    console.error("Failed to send OTP email:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to send OTP" });
  }
});

router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body || {};
  if (!email || !otp)
    return res.status(400).json({ message: "Email and otp required" });
  const normalizedEmail = String(email).toLowerCase();
  const record = await Otp.findOne({ email: normalizedEmail, otp });
  if (!record) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid or expired OTP" });
  }
  await Otp.deleteMany({ email: normalizedEmail });
  const user = await User.findOneAndUpdate(
    { email: normalizedEmail },
    { $set: { isEmailVerified: true } },
    { new: true }
  );
  if (!user) {
    await VerifiedEmail.updateOne(
      { email: normalizedEmail },
      { $set: { email: normalizedEmail } },
      { upsert: true }
    );
  }
  return res.json({
    success: true,
    message: "OTP verified",
    user: user
      ? {
          id: user._id,
          email: user.email,
          isEmailVerified: user.isEmailVerified,
        }
      : null,
  });
});

router.post("/register", async (req, res) => {
  const { name, username, email, password } = req.body || {};
  if (!username || !email || !password) {
    return res
      .status(400)
      .json({ message: "username, email and password are required" });
  }
  const normalizedEmail = String(email).toLowerCase();
  const normalizedUsername = String(username).toLowerCase();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    return res.status(409).json({ message: "Email already registered" });
  }
  const existingUsername = await User.findOne({ username: normalizedUsername });
  if (existingUsername) {
    return res.status(409).json({ message: "Username already taken" });
  }
  const verified = await VerifiedEmail.findOne({ email: normalizedEmail });
  if (!verified) {
    return res.status(403).json({ message: "Email not verified" });
  }
  const passwordHash = await User.hashPassword(password);
  const user = await User.create({
    name,
    username: normalizedUsername,
    email: normalizedEmail,
    passwordHash,
    isEmailVerified: true,
  });
  await VerifiedEmail.deleteOne({ email: normalizedEmail });
  const token = jwt.sign(
    { sub: user._id.toString(), email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
  res
    .status(201)
    .json({
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
      },
    });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }
  const ok = await user.verifyPassword(password);
  if (!ok) {
    return res.status(401).json({ message: "Invalid credentials" });
  }
  if (!user.isEmailVerified) {
    return res.status(403).json({ message: "Email not verified" });
  }
  const token = jwt.sign(
    { sub: user._id.toString(), email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
  res.json({
    token,
    user: { id: user._id, name: user.name, email: user.email },
  });
});

module.exports = router;
