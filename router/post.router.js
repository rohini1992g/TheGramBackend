import express from "express";
import upload from "../middleware/multer.js";
import {
  addComment,
  addNewPost,
  deletePost,
  likePost,
  dislikePost,
  getAllPosts,
  getCommentofPost,
  getUserPost,
} from "../controllers/post.js";
import isAuth from "../middleware/isAuth.js";

const router = express.Router();

router.route("/addpost").post(isAuth, upload.single("image"), addNewPost);
router.route("/all").get(isAuth, getAllPosts);
router.route("/userpost/all").get(isAuth, getUserPost);
router.route("/like").post(isAuth, likePost);
router.route("/dislike").post(isAuth, dislikePost);
router.route("/:id/comment").post(isAuth, addComment);
router.route("/:id/comment/all").post(isAuth, getCommentofPost);
router.route("/delete/:id").delete(isAuth, deletePost);

export default router;
