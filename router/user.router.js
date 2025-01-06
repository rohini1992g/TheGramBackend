import express from "express";
import {
  editProfile,
  followOrUnfollow,
  getProfile,
  getSuggestedUsers,
  login,
  logout,
  register,
} from "../controllers/user.js";
import upload from "../middleware/multer.js";
import isAuth from "../middleware/isAuth.js";

const router = express.Router();

router.route("/register").post(register);
router.route("/login").post(login);
router.route("/logout").get(logout);
router.route("/:id/profile").get(isAuth, getProfile);

// router
//   .route("/profile/edit")
//   .post(isAuth, upload.single("profilePicture"), editProfile);
router
  .route("/profile/edit")
  .post(isAuth, upload.single("profilePicture"), (req, res) => {
    console.log(req.file);
    res.send("Ffile ");
  });
router.route("/suggested").get(isAuth, getSuggestedUsers);
router.route("/followorunfollow/:id").post(isAuth, followOrUnfollow);
export default router;
