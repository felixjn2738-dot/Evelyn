require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Entry schema
const entrySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    letter: { type: String, required: true },
    photoUrl: { type: String, default: null },
    publicId: { type: String, default: null },
  },
  { timestamps: true }
);
const Entry = mongoose.model('Entry', entrySchema);

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Multer — memory storage, images only, max 10MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

// Cloudinary upload helper
function uploadToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'evelyn-birthday',
        transformation: [{ width: 1200, crop: 'limit', quality: 'auto' }],
      },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    stream.end(buffer);
  });
}

// Auth middleware
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// ─── AUTH ───────────────────────────────────────────────
app.post('/api/auth/login', (req, res) => {
  const { password } = req.body;
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid password' });
  }
  const token = jwt.sign({ admin: true }, process.env.JWT_SECRET, {
    expiresIn: '24h',
  });
  res.json({ token });
});

// ─── ENTRIES ────────────────────────────────────────────
app.get('/api/entries', async (req, res) => {
  try {
    const entries = await Entry.find().sort({ createdAt: 1 });
    res.json(entries);
  } catch {
    res.status(500).json({ error: 'Failed to fetch entries' });
  }
});

app.post(
  '/api/entries',
  authMiddleware,
  upload.single('photo'),
  async (req, res) => {
    try {
      const { name, letter } = req.body;
      if (!name?.trim() || !letter?.trim()) {
        return res.status(400).json({ error: 'Name and letter are required' });
      }

      let photoUrl = null,
        publicId = null;
      if (req.file) {
        const result = await uploadToCloudinary(req.file.buffer);
        photoUrl = result.secure_url;
        publicId = result.public_id;
      }

      const entry = await Entry.create({
        name: name.trim(),
        letter,
        photoUrl,
        publicId,
      });
      res.status(201).json(entry);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

app.put(
  '/api/entries/:id',
  authMiddleware,
  upload.single('photo'),
  async (req, res) => {
    try {
      const entry = await Entry.findById(req.params.id);
      if (!entry) return res.status(404).json({ error: 'Entry not found' });

      const { name, letter, removePhoto } = req.body;
      if (name?.trim()) entry.name = name.trim();
      if (letter !== undefined) entry.letter = letter;

      if (req.file) {
        if (entry.publicId) await cloudinary.uploader.destroy(entry.publicId);
        const result = await uploadToCloudinary(req.file.buffer);
        entry.photoUrl = result.secure_url;
        entry.publicId = result.public_id;
      } else if (removePhoto === 'true') {
        if (entry.publicId) await cloudinary.uploader.destroy(entry.publicId);
        entry.photoUrl = null;
        entry.publicId = null;
      }

      await entry.save();
      res.json(entry);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

app.delete('/api/entries/:id', authMiddleware, async (req, res) => {
  try {
    const entry = await Entry.findById(req.params.id);
    if (!entry) return res.status(404).json({ error: 'Entry not found' });
    if (entry.publicId) await cloudinary.uploader.destroy(entry.publicId);
    await entry.deleteOne();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Redirect /admin → /admin.html
app.get('/admin', (req, res) => res.redirect('/admin.html'));

// 404 → index.html
app.use((req, res) =>
  res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'))
);

app.listen(PORT, () =>
  console.log(`Server running → http://localhost:${PORT}`)
);
