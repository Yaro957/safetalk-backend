import mongoose from 'mongoose';
import sgMail from '@sendgrid/mail';

const MONGODB_URI = process.env.MONGODB_URI;
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL;

// Cache connection
let cached = global.__mongoose;
if (!cached) {
  cached = global.__mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }
  
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 3000, // Reduced timeout
      maxPoolSize: 1,
      minPoolSize: 0,
      bufferCommands: false,
      bufferMaxEntries: 0,
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

// Define schemas WITHOUT duplicate indexes
const otpSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, index: true },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true }, // NO index: true here
}, { timestamps: true });

// Single TTL index definition
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
}, { timestamps: true });

// Get models
const Otp = mongoose.models.Otp || mongoose.model('Otp', otpSchema);
const User = mongoose.models.User || mongoose.model('User', userSchema);

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

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

    // Connect to database with timeout
    try {
      await connectToDatabase();
    } catch (dbError) {
      console.error('Database connection failed:', dbError.message);
      return res.status(500).json({ 
        success: false, 
        message: 'Database connection failed' 
      });
    }

    // Check if user already exists
    const existing = await User.findOne({ email: normalizedEmail }).lean();
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    // Generate and store OTP
    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await Otp.deleteMany({ email: normalizedEmail });
    await Otp.create({ email: normalizedEmail, otp: code, expiresAt });

    // Send email
    sgMail.setApiKey(SENDGRID_API_KEY);
    await sgMail.send({
      to: normalizedEmail,
      from: FROM_EMAIL,
      subject: 'Your SafeTalk OTP Code',
      text: `Your OTP code is ${code}. It expires in 5 minutes.`,
      html: `<p>Your OTP code is <strong>${code}</strong>. It expires in 5 minutes.</p>`,
    });

    return res.status(200).json({ success: true, message: 'OTP sent' });

  } catch (err) {
    console.error('Send OTP error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
}
