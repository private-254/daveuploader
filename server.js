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
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// ⚙️ Multer setup — random short names with original extension
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);        // keep original extension
    const shortName = crypto.randomBytes(3).toString("hex"); // e.g., sop69y
    cb(null, `${shortName}${ext}`);
  }
});
const upload = multer({ storage });

// 🚀 Upload API
app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file)
    return res.status(400).json({ success: false, error: "No file uploaded" });

  // Generate URL using custom domain
  const fileUrl = `https://daveuploads.zone.id/${req.file.filename}`;
  res.json({ success: true, url: fileUrl });
});

// 🌍 Serve uploaded files from root
app.use(express.static(uploadDir));

// 🌐 Serve index.html at root
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Optional: catch-all 404
app.use((req, res) => {
  res.status(404).send("404 Not Found");
});

app.listen(PORT, () => {
  console.log(`✅ Daveuploader server running on port ${PORT}`);
  console.log(`🌐 Custom domain URL example: https://daveuploads.zone.id/yourfile.mp4`);
});
