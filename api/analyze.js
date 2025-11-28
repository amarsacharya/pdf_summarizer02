const pdfParse = require("pdf-parse");
const Busboy = require("busboy");

module.exports = async function (req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const busboy = Busboy({ headers: req.headers });
  let pdfBuffer = Buffer.from([]);

  return new Promise((resolve, reject) => {
    busboy.on("file", (fieldname, file) => {
      file.on("data", (data) => {
        pdfBuffer = Buffer.concat([pdfBuffer, data]);
      });

      file.on("end", async () => {
        try {
          const data = await pdfParse(pdfBuffer);

          res.setHeader("Content-Type", "application/json");
          res.status(200).end(
            JSON.stringify({
              text: data.text,
              summary: "Summary placeholder",
              topics: []
            })
          );

          resolve();
        } catch (err) {
          res.status(500).end(JSON.stringify({ error: err.toString() }));
          resolve();
        }
      });
    });

    busboy.on("error", (error) => {
      res.status(500).end(JSON.stringify({ error: error.toString() }));
      reject(error);
    });

    req.pipe(busboy);
  });
};
