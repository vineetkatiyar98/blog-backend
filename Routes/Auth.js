const express = require("express");
const router = express.Router();
const User = require("../Models/UserSchema");
const errorHandler = require("../Middlewares/errorMiddleware");
const authTokenHandler = require("../Middlewares/checkAuthToken");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "vineetkatiyar98@gmail.com",
    pass: "leiz dflg ktjl rpwr",
  },
});

router.get("/test", async (req, resp) => {
  resp.json({ message: "Auth api is working" });
});

const createdResponse = (ok, message, data) => {
  return {
    ok,
    message,
    data,
  };
};

router.post("/sendotp", async (req, res) => {
  const { email } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000);
  try {
    const mailOptions = {
      from: process.env.COMPANY_EMAIL,
      to: email,
      subject: "OTP for verification of blog-mern",
      text: `Your OTP for verification is ${otp}`,
    };

    transporter.sendMail(mailOptions, async (err, info) => {
      if (err) {
        console.log(err);
        res.status(500).json(createdResponse(false, err.message));
      } else {
        // console.log(otp);
        res.json(createdResponse(true, "OPT sent successfully", { otp }));
      }
    });
  } catch (err) {
    console.log(err);
    res.status(500).json(createdResponse(false, err.message));
  }
});

router.post("/register", async (req, resp, next) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      return resp
        .status(409)
        .json(createdResponse(false, "Email already in use"));
    }
    const newUser = new User({
      name,
      password,
      email,
    });

    await newUser.save();
    resp.status(201).json(createdResponse(true, "User created successfully"));
  } catch (err) {
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json(createdResponse(false, "Invalid Credentials"));
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json(createdResponse(false, "Invalid Credentials"));
    }

    //Generate an authentication token with a 10m expiration
    const authToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "10m" }
    );

    ////Generate a refresh token with a 10m expiration
    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_REFRESH_SECRET_KEY,
      { expiresIn: "1d" }
    );

    res.cookie("authToken", authToken, { httpOnly: true });
    res.cookie("refreshToken", refreshToken, { httpOnly: true });
    res.status(200).json(
      createdResponse(true, "Login success", {
        authToken,
        refreshToken,
      })
    );
  } catch (err) {
    next(err);
  }
});

router.use(errorHandler);

router.get("/checklogin", authTokenHandler, async (req, res) => {
  res.json({
    ok: true,
    message: "User authenticated successfully",
  });
});

module.exports = router;
