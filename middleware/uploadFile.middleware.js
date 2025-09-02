const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadFromBuffer = async (buffer, filename) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "uploads",
        public_id: filename ? filename.split(".")[0] : undefined, // avoid errors if filename missing
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
