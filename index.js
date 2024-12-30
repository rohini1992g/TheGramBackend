const express = require("express");
const app = express();

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const helmet = require("helmet");
const morgan = require("morgan");
const userRoute = require("./routes/users");
const authRoute = require("./routes/auth");
const postsRoute = require("./routes/posts");
const conversationRoute = require("./routes/conversation");
const messageRoute = require("./routes/message");
const cookieParser = require("cookie-parser");
const path = require("path");
const cors = require("cors");
const multer = require("multer");
const { verifyToken } = require("./routes/verifyToken");

// Allow all origins
// app.use(
//   cors({
//     origin: ["http://localhost:3000"],
//     methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"],

//     credentials: true,
//   })
// );
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(cookieParser());

// app.use((req, res, next) => {
//   res.header("Access-Control-Allow-Origin", true);
//   next();
// });
dotenv.config();
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use("/images", express.static(path.join(__dirname, "public/images")));

//middleware

app.use(express.json());
app.use(helmet());
app.use(morgan("common"));

//uploading
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/images");
  },
  filename: (req, file, cb) => {
    cb(null, req.body.name);
  },
});

const upload = multer({ storage: storage });
app.post("/api/upload", upload.single("file"), (req, res) => {
  try {
    return res.status(200).json("File uploded successfully");
  } catch (error) {
    console.error(error);
  }
});

app.post("/api/updateprofile/:id", upload.single("file"), async (req, res) => {
  try {
    // Ensure the userId matches the ID in the URL
    if (req.params.userId !== req.params.id) {
      return res
        .status(403)
        .json({ error: "You can update only your profile" });
    }

    // Validate if a file was uploaded
    if (!req.body.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    // Update the user's profile picture
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { profilePicture: req.file.filename },
      { new: true } // Return the updated document
    );
    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json({
      message: "Profile has been updated",
      user: updatedUser,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.use("/api/users", verifyToken, userRoute);
app.use("/api/auth", authRoute);
app.use("/api/posts", verifyToken, postsRoute);
app.use("/api/conversation", verifyToken, conversationRoute);
app.use("/api/messages", verifyToken, messageRoute);

app.listen(8000, () => {
  console.log("backend server is running");
});
