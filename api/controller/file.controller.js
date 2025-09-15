const FileModel = require("../model/file.model");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const { uploadFromBuffer } = require("../middleware/uploadFile.middleware");
const cloudinary = require("../utils/cloudinary");

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
      public_id: result.public_id,
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
    const { id, public_id } = req.query;
    // Delete from DB first
    const file = await FileModel.findByIdAndDelete(id);

    if (!file) {
      return res
        .status(404)
        .json({ success: false, message: "File not found in database" });
    }

    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(public_id);

    if (result.result === "not found") {
      return res
        .status(404)
        .json({ success: false, message: "File not found on Cloudinary" });
    }

    if (result.result !== "ok") {
      return res.status(500).json({
        success: false,
        message: "Failed to delete from Cloudinary",
        cloudinary: result,
      });
    }

    return res.status(200).json({
      success: true,
      message: "File deleted successfully",
      cloudinary: result,
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

const downloadFile = async (req, res) => {
  try {
    const { id } = req.params;
    // const file = await FileModel.findById(id);

    // if (!file) return res.status(404).json({ message: "File not found" });
    // return res.redirect(302, file.url);

    if (!id || id === "undefined") {
      return res.status(400).json({ message: "Missing id parameter" });
    }

    // ensure id is a valid ObjectId before calling Mongoose
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid id format" });
    }

    const file = await FileModel.findById(id).lean();
    if (!file) return res.status(404).json({ message: "File not found" });

    return res.redirect(302, file.url);
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
