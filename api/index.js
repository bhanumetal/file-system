const dotenv = require("dotenv");
dotenv.config();

const mongoose = require("mongoose");
mongoose.connect(process.env.DB);

// const root = process.cwd();
const express = require("express");
const serverless = require("serverless-http");
const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({ storage });

const {
  signup,
  login,
   updateImage,
  fetchImage,
} = require("./controller/user.controller");
const {
  createFile,
  fetchFiles,
  deleteFile,
  downloadFile,
} = require("./controller/file.controller");
const { fetchDashboard } = require("./controller/dashboard.controller");
const { verifyToken } = require("./controller/token.controller");
const {
  shareFile,
  fetchShared,
  sendMail,
} = require("./controller/share.controller");
const AuthMiddleware = require("./middleware/auth.middleware");
const app = express();
// app.listen(process.env.PORT || 8080);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Api endpoint

app.get("/api", (req, res) => {
  res.status(200).json({ message: "connet" });
});

app.post("/api/signup", signup);
app.post("/api/login", login);
app.post(
  "/api/profile-picture",
  AuthMiddleware,
  upload.single("picture"),
  updateImage
);
app.get("/api/profile-picture", AuthMiddleware, fetchImage);
app.post("/api/file", AuthMiddleware, upload.single("file"), createFile);
app.get("/api/file", AuthMiddleware, fetchFiles);
app.delete("/api/file/:id", AuthMiddleware, deleteFile);
app.get("/api/file/download/:id", downloadFile);
app.get("/api/dashboard", AuthMiddleware, fetchDashboard);

app.post("/api/send-mail", AuthMiddleware, sendMail);
app.post("/api/token/verify", verifyToken);
app.post("/api/share", AuthMiddleware, shareFile);
app.get("/api/share", AuthMiddleware, fetchShared);

// Not found
app.use((req, res) => {
  res.status(404).json({ message: "Endpoint not found" });
});


// 👇 Export the handler for Vercel
module.exports = app;
module.exports.handler = serverless(app);