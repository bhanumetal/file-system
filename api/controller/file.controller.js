const FileModel = require("../model/file.model");
const fs = require("fs");
const path = require("path");
const { uploadFromBuffer } = require("../middleware/uploadFile.middleware");

const getType = (type) => {
  const ext = type.split("/").pop();

  if (ext === "x-msdownload") return "application/exe";

  return type;
};

const createFile = async (req, res) => {
  try {
    const file = req.file;
    // Upload file to Cloudinary
    const result = await uploadFromBuffer(file.buffer, file.originalname);

    const payload = {
      filename: file.originalname,
      url: result.secure_url, // public Cloudinary URL
      type: getType(file.mimetype),
      size: file.size,
      user: req.user.id, // if AuthMiddleware adds user info
    };

    const newFile = await FileModel.create(payload);
    res.status(200).json(newFile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const fetchFiles = async (req, res) => {
  try {
    const { limit } = req.query;
    const files = await FileModel.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(limit);
    res.status(200).json(files);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteFile = async (req, res) => {
  try {
    const { id } = req.params;
    const file = await FileModel.findByIdAndDelete(id);

    if (!file) return res.status(404).json({ message: "File not found" });

    fs.unlinkSync(file.path);
    res.status(200).json(file);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const downloadFile = async (req, res) => {
  try {
    const { id } = req.params;
    const file = await FileModel.findById(id);
    const ext = file.type.split("/").pop();

    if (!file) return res.status(404).json({ message: "File not found" });

    const root = process.cwd();
    const filePath = path.join(root, file.path);

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${file.filename}.${ext}"`
    );

    res.sendFile(filePath, (err) => {
      if (err) res.status(404).json({ message: "File not found" });
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createFile,
  fetchFiles,
  deleteFile,
  downloadFile,
};
