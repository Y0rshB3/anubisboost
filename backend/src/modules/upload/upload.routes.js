"use strict";

const { Router } = require("express");
const multer = require("multer");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const authenticate = require("../../middleware/authenticate");
const authorize = require("../../middleware/authorize");

const storage = multer.diskStorage({
  destination: path.join(__dirname, "../../../uploads"),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

// Images only (admin - game covers, chat images)
const imageUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  },
});

// Images + PDF (clients - payment proofs)
const proofUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".pdf"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error("Only images and PDF files are allowed"));
  },
});

const router = Router();

/**
 * @swagger
 * /upload:
 *   post:
 *     tags: [Upload]
 *     summary: Upload an image (admin)
 *     description: Upload image files (jpg, png, webp, gif). Max 5 MB.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: File uploaded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     url: { type: string }
 *                     filename: { type: string }
 *                     originalName: { type: string }
 *       400:
 *         description: No file uploaded or invalid format
 */
router.post("/", authenticate, authorize.role("admin"), imageUpload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });
  const url = `/uploads/${req.file.filename}`;
  res.json({ success: true, data: { url, filename: req.file.filename, originalName: req.file.originalname } });
});

/**
 * @swagger
 * /upload/proof:
 *   post:
 *     tags: [Upload]
 *     summary: Upload a proof file (authenticated)
 *     description: Upload images or PDF files. Max 10 MB.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Proof uploaded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     url: { type: string }
 *                     filename: { type: string }
 *                     originalName: { type: string }
 *                     type: { type: string, enum: [image, pdf] }
 *       400:
 *         description: No file uploaded or invalid format
 */
router.post("/proof", authenticate, proofUpload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });
  const url = `/uploads/${req.file.filename}`;
  const ext = path.extname(req.file.originalname).toLowerCase();
  res.json({ success: true, data: { url, filename: req.file.filename, originalName: req.file.originalname, type: ext === ".pdf" ? "pdf" : "image" } });
});

module.exports = router;
