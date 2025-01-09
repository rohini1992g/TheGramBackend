import { User } from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";
import multer from "multer";
import { Post } from "../models/Post.js";
//user registration
export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({
        massage: "Something is missing please check",
        success: false,
      });
    }
    const user = await User.findOne({ email });
    if (user) {
      return res.status(401).json({
        massage: "Try different email",
        success: false,
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({
      username,
      email,
      password: hashedPassword,
    });
    return res.status(200).json({
      massage: "Account created successfully",
      success: true,
    });
  } catch (err) {
    console.log(err);
  }
};

//login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(email, password);
    if (!email || !password) {
      return res.status(401).json({
        message: "Something is missing, please check!",
        success: false,
      });
    }
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        message: "Incorrect email or password",
        success: false,
      });
    }
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        message: "Incorrect email or password",
        success: false,
      });
    }

    const token = await jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: "1d",
      }
    );

    // populate each post if in the posts array
    const populatedPosts = await Promise.all(
      user.posts.map(async (postId) => {
        const post = await Post.findById(postId);
        if (post.author.equals(user._id)) {
          return post;
        }
        return null;
      })
    );
    user = {
      _id: user._id,
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture,
      bio: user.bio,
      followers: user.followers,
      following: user.following,
      posts: populatedPosts,
    };
    return res
      .cookie("token", token, {
        httpOnly: true,
        sameSite: "strict",
        maxAge: 1 * 24 * 60 * 60 * 1000,
      })
      .json({
        message: `Welcome back ${user.username}`,
        success: true,
        user,
      });
  } catch (error) {
    console.log(error);
  }
};
//forget Password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(401).json({
        message: "Incorrect email",
        success: false,
      });
    }
    const forgettoken = await jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: "1d",
      }
    );

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
      text: `http://localhost:5173/resetPassword/${user._id}/${forgettoken}`,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        res.status(400).json("Error Sending Mail");
      } else {
        res.status(200).json({ status: true, message: "Email sent" });
      }
    });
  } catch (error) {
    console.log(error);
  }
};

//logout
export const logout = async (_, res) => {
  try {
    return res.cookie("token", "", { maxAge: 0 }).json({
      massage: "Successfully logout",
      success: true,
    });
  } catch (err) {
    console.log(err);
  }
};

//getProfile

//
export const getProfile = async (req, res) => {
  try {
    const { id: userId } = req.params;
    console.log(userId);
    const user = await User.findById(userId).populate({
      path: "posts",
      options: { sort: { createdAt: -1 } }, // Sorting posts by creation date in descending order
    });
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }
    return res.status(200).json({
      user,
      success: true,
    });
  } catch (err) {
    console.error("Error fetching profile:", err);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

//editprofile
export const editProfile = async (req, res) => {
  try {
    const userId = req.id;
    const { bio, gender } = req.body;
    const profilePicture = req.file;
    let cloudResponse;
    // console.log(req.file, "profile pic");

    if (profilePicture) {
      const fileUri = getDataUri(profilePicture);
      cloudResponse = await cloudinary.uploader.upload(fileUri);
    }

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(401).json({
        message: "Invalid user",
        success: false,
      });
    }
    console.log(cloudResponse);
    if (bio) user.bio = bio;
    if (gender) user.gender = gender;
    if (profilePicture) user.profilePicture = cloudResponse.secure_url;
    await user.save();
    return res.status(200).json({
      message: "Profile Updated",
      success: true,
    });
  } catch (err) {
    console.log(err);
  }
};

export const getSuggestedUsers = async (req, res) => {
  try {
    const suggestedUsers = await User.find({ _id: { $ne: req.id } }).select(
      "-password"
    );
    if (!suggestedUsers) {
      return res.status(400).json({
        message: "Currently do not have any users",
        success: false,
      });
    }
    return res.status(200).json({
      success: true,
      users: suggestedUsers,
    });
  } catch (err) {
    console.log(err);
  }
};

export const followOrUnfollow = async (req, res) => {
  try {
    const followerUser = req.id;
    const followingUser = req.params.id;
    if (followerUser === followingUser) {
      return res.status(400).json({
        message: "you cannot follow userself",
        success: false,
      });
    }
    const user = await User.findById(followerUser);
    const targetUser = await User.findById(followingUser);

    if (!user || !targetUser) {
      return res.status(400).json({
        message: "User not found",
        success: false,
      });
    }
    //follow and unfollow
    const isFollowing = user.following.includes(followingUser);
    if (isFollowing) {
      //unfollow logic here
      await Promise.all([
        User.updateOne(
          { _id: followerUser },
          { $pull: { following: followingUser } }
        ),
        User.updateOne(
          { _id: followingUser },
          { $pull: { followers: followerUser } }
        ),
      ]);
      return res
        .status(200)
        .json({ message: "unfollow successfully", success: true });
    } else {
      //follow logic here
      await Promise.all([
        User.updateOne(
          { _id: followerUser },
          { $push: { following: followingUser } }
        ),
        User.updateOne(
          { _id: followingUser },
          { $push: { followers: followerUser } }
        ),
      ]);
      return res
        .status(200)
        .json({ message: "follow successfully", success: true });
    }
  } catch (err) {
    console.log(err);
  }
};

//search by name
export const searchName = async (req, res) => {
  try {
    const { keyword } = req.query;
    if (!keyword || keyword.trim() === "") {
      return res
        .status(400)
        .json({ message: "Keyword is required and cannot be empty" });
    }
    // Use MongoDB's regex for a case-insensitive search
    const users = await User.find({
      username: { $regex: keyword, $options: "i" },
    }).select("username"); // Select only the username field

    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
