const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const UserModel = require("../models/user.model");
const {
  registerUserValidation,
  loginUserValidation,
  sendResetPasswordOtpValidation,
  resetPasswordValidation,
  updateProfileValidation,
  updatePasswordValidation,
} = require("../validations/user.validation");
require("dotenv").config();
const { uploadFileToS3, deleteFileFromS3 } = require("../utils/aws-s3");

const secretKey = process.env.JWT_SECRET;
const nodemailerServiceName = process.env.NODEMAILER_SERVICE_NAME;
const nodemailerAuthUser = process.env.NODEMAILER_AUTH_USER;
const nodemailerAuthPassword = process.env.NODEMAILER_AUTH_PASSWORD;

const registerUser = async (req, res) => {
  try {
    const validated = await registerUserValidation.validateAsync(req.body);

    const userData = validated;
    const existingUser = await UserModel.findOne({ email: userData.email });

    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const newUser = new UserModel({ ...userData, password: hashedPassword });

    const savedUser = await newUser.save();
    res.status(201).json(savedUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const validated = await loginUserValidation.validateAsync(req.body);
    const userData = validated;

    const userToLogin = await UserModel.findOne({ email: userData.email });
    if (!userToLogin) {
      return res.status(401).json({ message: "User doesn't exist!" });
    }

    const passwordMatch = await bcrypt.compare(
      userData.password,
      userToLogin.password
    );
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        id: userToLogin._id,
        username: userToLogin.username,
        email: userToLogin.email,
        role: userToLogin.role,
      },
      secretKey,
      {
        expiresIn: "30d",
      }
    );

    res.status(200).json({ token, user: userToLogin });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const sendResetPasswordOtp = async (req, res) => {
  try {
    const validated = await sendResetPasswordOtpValidation.validateAsync(
      req.body
    );

    const user = await UserModel.findOne({ email: validated.email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiry

    user.resetPassword = { otp, otpExpiry };
    await user.save();

    const transporter = nodemailer.createTransport({
      service: nodemailerServiceName,
      auth: {
        user: nodemailerAuthUser,
        pass: nodemailerAuthPassword,
      },
    });

    await transporter.sendMail({
      from: nodemailerAuthUser,
      to: validated.email,
      subject: "Your OTP for Password Reset",
      text: `Your OTP for password reset is ${otp}. It will expire in 15 minutes.`,
    });

    res.status(200).json({ message: "OTP sent to email" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const resetPasswordWithOtp = async (req, res) => {
  try {
    const validated = await resetPasswordValidation.validateAsync(req.body);

    const user = await UserModel.findOne({ email: validated.email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (
      !user.resetPassword ||
      user.resetPassword.otp !== validated.otp ||
      !user.resetPassword.otpExpiry ||
      user.resetPassword.otpExpiry < new Date()
    ) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.password = await bcrypt.hash(validated.newPassword, 10);
    user.resetPassword = undefined;
    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const validated = await updateProfileValidation.validateAsync(req.body);
    const userId = req.user.id;

    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      {
        ...(validated.username && { username: validated.username }),
        ...(validated.email && { email: validated.email }),
      },
      { new: true }
    );

    res
      .status(200)
      .json({ message: "Profile updated successfully", updatedUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updatePassword = async (req, res) => {
  try {
    const validated = await updatePasswordValidation.validateAsync(req.body);
    const userId = req.user.id;
    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isOldPasswordValid = await bcrypt.compare(
      validated.oldPassword,
      user.password
    );
    if (!isOldPasswordValid) {
      return res.status(400).json({ message: "Old password is incorrect" });
    }

    user.password = await bcrypt.hash(validated.newPassword, 10);
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateProfileImage = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // If user already has a profile picture, attempt to delete it from S3
    if (user.profilePictureUrl) {
      try {
        const profilePictureUrl = user.profilePictureUrl;
        const url = new URL(profilePictureUrl);
        const key = decodeURIComponent(url.pathname.substring(1)); // Remove leading '/'
        await deleteFileFromS3(key);
        console.log("Old profile image deleted from S3");
      } catch (deleteErr) {
        console.error("Error deleting old profile image:", deleteErr);
      }
    }

    const upload = uploadFileToS3("profile-pictures");

    upload.single("profilePicture")(req, res, async (err) => {
      if (err) {
        console.error("Upload Error:", err);
        return res.status(500).json({ error: err.message });
      }

      const file = req.file;
      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      user.profilePictureUrl = file.location;
      await user.save();

      res.status(200).json({
        message: "Profile image updated successfully",
        user,
      });
    });
  } catch (error) {
    console.error("Error in updateProfileImage:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  sendResetPasswordOtp,
  resetPasswordWithOtp,
  updateProfile,
  updatePassword,
  updateProfileImage,
};
