const streamifier = require("streamifier");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const cloudinary = require("../utils/cloudinary");

function generatePublicId(filename, folder = "uploads") {
  const base = filename ? path.parse(filename).name : "file";
  const safeBase = base.replace(/[^\w\-]+/g, "_"); // remove unsafe chars
  const uniqueSuffix = uuidv4();
  return `${folder}/${safeBase}_${uniqueSuffix}`;
}

const uploadFromBuffer = async (buffer, filename) => {
  return new Promise((resolve, reject) => {
    const public_id = generatePublicId(filename, "uploads");
    const stream = cloudinary.uploader.upload_stream(
      {
        public_id,
        resource_type: "auto", // handles images, pdf, videos automatically
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      }
    );

    // ✅ Use streamifier for safe buffer handling
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

module.exports = { uploadFromBuffer };
