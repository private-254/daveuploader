import express from "express";
import multer from "multer";
import cors from "cors";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 📁 Ensure uploads folder exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ✅ Allowed file types
const allowedMimeTypes = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'video/mp4', 'video/mpeg', 'video/quicktime',
  'audio/mpeg', 'audio/wav', 'audio/ogg',
  'application/pdf', 'text/plain'
];

// ⚙️ Multer setup with validation
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const shortName = crypto.randomBytes(3).toString("hex");
    cb(null, `${shortName}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`), false);
    }
  }
});

// 🚀 Upload API with error handling
app.post("/api/upload", upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: "No file uploaded or invalid file type" 
      });
    }

    // Generate URL using custom domain
    const fileUrl = `https://daveuploads.zone.id/${req.file.filename}`;
    res.json({ 
      success: true, 
      url: fileUrl,
      filename: req.file.filename,
      size: req.file.size
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ 
      success: false, 
      error: "Internal server error during upload" 
    });
  }
});

// Multer error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: "File too large. Maximum size is 50MB"
      });
    }
  }
  next(error);
});

// 🌍 Serve uploaded files securely
app.use("/files", express.static(uploadDir, {
  setHeaders: (res, path) => {
    // Security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
  }
}));

// 🌐 Serve index.html at root
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Optional: catch-all 404
app.use((req, res) => {
  res.status(404).json({ error: "404 Not Found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ 
    success: false, 
    error: "Something went wrong!" 
  });
});

app.listen(PORT, () => {
  console.log(`✅ Daveuploader server running on port ${PORT}`);
  console.log(`🌐 Custom domain URL example: https://daveuploads.zone.id/yourfile.mp4`);
  console.log(`📁 Upload directory: ${uploadDir}`);
});