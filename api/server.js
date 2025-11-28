const express = require("express");
const cors = require("cors");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

const upload = multer();

// API Route
app.post("/api/analyze", upload.single("pdf"), async (req, res) => {
  try {
    const pdfBuffer = req.file.buffer;
    const data = await pdfParse(pdfBuffer);

    res.json({
      text: data.text,
      summary: "Summary placeholder",
      topics: []
    });

  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

// Serve frontend
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

module.exports = app;
