const UserModel = require("../model/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { uploadFromBuffer } = require("../middleware/uploadFile.middleware");

const signup = async (req, res) => {
  try {
    await UserModel.create(req.body);
    res.status(200).json({ message: "Signup success" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await UserModel.findOne({ email: email });

    if (!user) return res.status(404).json({ message: "User doesn`t exist" });

    const isLogin = bcrypt.compareSync(password, user.password);

    if (!isLogin)
      return res.status(401).json({ message: "Incorrect password" });

    const payload = {
      email: user.email,
      mobile: user.mobile,
      fullname: user.fullname,
      id: user._id,
    };

    const token = await jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({
      message: "Login success",
      token: token,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateImage = async (req, res) => {
  try {
    const filename = req.file;
    const result = await uploadFromBuffer(
      filename.buffer,
      filename.originalname
    );

    const user = await UserModel.findByIdAndUpdate(req.user.id, {
      image: result.secure_url,
    });

    if (!user) return res.status(401).json({ message: "Invalid request" });

    res.status(200).json({ image: user.image });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const fetchImage = async (req, res) => {
  try {
    const { image } = await UserModel.findById(req.user.id);

    if (!image) return res.status(404).json({ message: "Image not found" });

    return res.redirect(image);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  signup,
  login,
  updateImage,
  fetchImage,
};
