import mongoose from 'mongoose';
import nodemailer from 'nodemailer';

const MONGODB_URI = process.env.MONGODB_URI;
const MAIL_HOST = process.env.MAIL_HOST;
const MAIL_USER = process.env.MAIL_USER;
const MAIL_PASS = process.env.MAIL_PASS;

// ---------------------
// MongoDB Connection
// ---------------------
let cached = global.__mongoose;
if (!cached) {
  cached = global.__mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // safer for Vercel cold starts
      maxPoolSize: 10,
      bufferCommands: false,
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (err) {
    cached.promise = null;
    throw err;
  }
}

// ---------------------
// Schemas & Models
// ---------------------
const otpSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, index: true },
    otp: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// TTL index for OTP expiration
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
  },
  { timestamps: true }
);

// Safe model compilation (avoids OverwriteModelError on hot reloads)
const Otp = mongoose.models.Otp || mongoose.model('Otp', otpSchema);
const User = mongoose.models.User || mongoose.model('User', userSchema);

// ---------------------
// Helpers
// ---------------------
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function createTransport() {
  return nodemailer.createTransport({
    host: MAIL_HOST,
    port: 587,
    secure: false,
    auth: { user: MAIL_USER, pass: MAIL_PASS },
  });
}

// ---------------------
// API Handler
// ---------------------
export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email required' });
    }

    const normalizedEmail = String(email).toLowerCase();

    // Connect to DB
    try {
      await connectToDatabase();
    } catch (dbError) {
      console.error('Database connection failed:', dbError.message);
      return res.status(500).json({
        success: false,
        message: 'Database connection failed',
      });
    }

    // Check if user exists
    const existing = await User.findOne({ email: normalizedEmail }).lean();
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    // Generate and store OTP
    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await Otp.deleteMany({ email: normalizedEmail });
    await Otp.create({ email: normalizedEmail, otp: code, expiresAt });

    // Send Email
    try {
      const transporter = createTransport();
      await transporter.sendMail({
        from: MAIL_USER,
        to: normalizedEmail,
        subject: 'Your SafeTalk OTP Code',
        text: `Your OTP code is ${code}. It expires in 5 minutes.`,
        html: `<p>Your OTP code is <strong>${code}</strong>. It expires in 5 minutes.</p>`,
      });
      console.log('Email sent successfully');
    } catch (emailError) {
      console.error('Email sending failed:', emailError.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to send email',
      });
    }

    return res.status(200).json({ success: true, message: 'OTP sent' });
  } catch (err) {
    console.error('Send OTP error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
}
