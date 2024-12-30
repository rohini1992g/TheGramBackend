const jwt = require("jsonwebtoken");
const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");

//Register
router.post("/register", async (req, res) => {
  try {
    //generate bcrypt password
    const salt = await bcrypt.genSalt(10);
    const hashedpassword = await bcrypt.hash(req.body.password, salt);

    //create new user

    let newUserName = user_name.toLowerCase().replace(/ /g, "");
    const user_name = await User.findOne({ username: newUserName });
    if (user_name) {
      return res.status(400).json({ msg: "This username is already taken." });
    }
    const user_email = await User.findOne({ email });
    if (user_email) {
      return res.status(400).json({ msg: "This email is already registered." });
    }
    const newuser = new User({
      username: req.body.username,
      email: req.body.email,
      password: hashedpassword,
    });

    const access_token = createAccessToken({ id: newuser._id });
    const refresh_token = createRefreshToken({ id: newuser._id });

    res.cookie("refreshtoken", refresh_token, {
      httpOnly: true,
      path: "/api/refresh_token",
      maxAge: 30 * 24 * 60 * 60 * 1000, //validity of 30 days
    });

    res.json({
      msg: "Registered Successfully!",
      access_token,
      user: {
        ...newuser._doc,
        password: "",
      },
    });
    //save user and respond
    await newuser.save();

    return res.status(200).json({ msg: "registered" });
  } catch (err) {
    return res.status(500).json(err);
  }
});
//Login page
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).populate(
      "followers followings",
      "password"
    );
    if (!user) {
      return res.status(400).json("Invalid credentials");
    }
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json("Invalid credentials");
    }

    const access_token = createAccessToken({ id: user._id });
    const refresh_token = createRefreshToken({ id: user._id });

    res.cookie("refreshtoken", refresh_token, {
      httpOnly: true,
      path: "/api/refresh_token",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000, //validity of 30 days
    });

    res.json({
      msg: "Logged in  Successfully!",
      access_token,
      user: {
        ...user._doc,
        password: "",
      },
    });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
});

//isAdmin Login
adminLogin: async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("fd", password);
    const user = await User.findOne({ email, isAdmin: "admin" });
    console.log("user", user);
    if (!user) {
      return res.status(400).json({ msg: "Email or Password is incorrect." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Email or Password is incorrect." });
    }

    const access_token = createAccessToken({ id: user._id });
    const refresh_token = createRefreshToken({ id: user._id });

    res.cookie("refreshtoken", refresh_token, {
      httpOnly: true,
      path: "/api/refresh_token",
      maxAge: 30 * 24 * 60 * 60 * 1000, //validity of 30 days
    });

    res.json({
      msg: "Logged in  Successfully!",
      access_token,
      user: {
        ...user._doc,
        password: "",
      },
    });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
},
  //Forgot Password

  router.post("/forgotPassword", async (req, res) => {
    const { email } = req.body;
    try {
      const user = await User.findOne({ email: email });
      if (!user) {
        return res.status(400).json("user not found");
      }

      const encodedtoken = jwt.sign({ id: user._id }, process.env.JWT_TOKEN, {
        expiresIn: "5m",
      });

      var transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "rohini.gondane123@gmail.com",
          pass: "cajp xxgc iqxk lomw",
        },
      });

      var mailOptions = {
        from: "rohini.gondane123@gmail.com",
        to: email,
        subject: "Reset Password",
        text: `http://localhost:3000/resetPassword/${encodedtoken}`,
      };

      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          res.status(400).json("Error Sending Mail");
        } else {
          res.status(200).json({ status: true, message: "Email sent" });
        }
      });
    } catch (err) {
      return res.status(500).json(err);
    }
  });

//Reset Password

router.post("/resetPassword/:token", async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_TOKEN);
    const id = decoded.id;
    console.log("id is" + id);
    const hashpassword = await bcrypt.hash(password, 10);
    await User.findByIdAndUpdate({ _id: id }, { password: hashpassword });
    return res.status(200).json("password updated successfully");
  } catch (err) {
    res.status(500).json("Invalid Token");
  }
});

const verifyUser = async (req, res) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.json({ status: false, message: "no token" });
    }
    const decoded = await jwt.verify(token, process.env.JWT_TOKEN);
  } catch (err) {
    return res.status(500).json(err);
  }
};

router.get("/verify", verifyUser, (req, res) => {
  return res.status(200).json("Autherised");
});

//logout the page
router.get("/logout", async (req, res) => {
  await res.clearCookie("token");
  return res.status(200).json({ msg: err.message });
});

//generate Access Token
const generateAccessToken = async (req, res) => {
  try {
    const rf_token = req.cookies.refreshtoken;

    if (!rf_token) {
      return res.status(400).json({ msg: "Please login again." });
    }
    jwt.verify(
      rf_token,
      process.env.REFRESH_TOKEN_SECRET,
      async (err, result) => {
        if (err) {
          return res.status(400).json({ msg: "Please login again." });
        }

        const user = await Users.findById(result.id)
          .select("-password")
          .populate("followers following", "password");
        if (!user) {
          return res.status(400).json({ msg: "User does not exist." });
        }

        const access_token = createAccessToken({ id: result.id });
        res.json({ access_token, user });
      }
    );
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

const createAccessToken = (payload) => {
  return jwt.sign(payload, "AAAA", {
    expiresIn: "1d",
  });
};

const createRefreshToken = (payload) => {
  return jwt.sign(payload, "AAAA", {
    expiresIn: "30d",
  });
};

module.exports = router;
