const multer = require("multer");
const pdfParse = require("pdf-parse");

const upload = multer();

module.exports = async function (req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  upload.single("pdf")(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.toString() });

    try {
      const pdfBuffer = req.file.buffer;
      const data = await pdfParse(pdfBuffer);

      res.json({
        text: data.text,
        summary: "Summary placeholder",
        topics: []
      });
    } catch (error) {
      res.status(500).json({ error: error.toString() });
    }
  });
};
