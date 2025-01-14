import express from "express";
import {
  editProfile,
  followOrUnfollow,
  forgotPassword,
  getProfile,
  getSuggestedUsers,
  login,
  logout,
  register,
  resetPassword,
  searchName,
  verify,
} from "../controllers/user.js";
import upload from "../middleware/multer.js";
import isAuth from "../middleware/isAuth.js";

const router = express.Router();

router.route("/register").post(register);
router.route("/login").post(login);
router.route("/verify").get(isAuth, verify);
router.route("/forgetPassword").post(forgotPassword);
router.route("/resetPassword/:id/:token").post(resetPassword);
router.route("/logout").get(logout);
router.route("/:id/profile").get(isAuth, getProfile);

router
  .route("/profile/edit")
  .post(isAuth, upload.single("profilePhoto"), editProfile);

router.route("/suggested").get(isAuth, getSuggestedUsers);
router.route("/followorunfollow/:id").post(isAuth, followOrUnfollow);

router.route("/search").get(searchName);
export default router;
