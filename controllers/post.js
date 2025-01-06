import sharp from "sharp";
import { Post } from "../models/Post.js";
import { User } from "../models/User.js";
export const addNewPost = async (req, res) => {
  try {
    const { caption } = req.body;
    const image = req.file;
    const authorId = req.id;

    if (!image) return res.status(400).json({ massage: "image required" });
    const optimizeImageBuffer = await sharp(image.buffer)
      .resize({
        height: 800,
        width: 800,
        fit: "inside",
      })
      .toFormat("jpeg", { quality: 80 })
      .toBuffer();

    const fileUri = `data:image/jpeg;base64,${optimizeImageBuffer.toString(
      "base64"
    )}`;
    const cloudResponse = await cloudinary.uploader.upload(fileUri);
    const post = await Post.create({
      caption,
      image: cloudResponse.secure_url,
      author: authorId,
    });
    const user = await User.findById(authorId);
    if (user) {
      user.posts.push(post._id);
      await user.save();
    }
    await post.populate({ path: "author", select: "-password" });
    return res.status(200).json({
      message: "New post added",
      post,
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};

//getAllPosts
export const getAllPosts = async (req, res) => {
  try {
    const post = await Post.find()
      .sort({ createdAt: -1 })
      .populate({ path: "author", select: "username,profilePicture" })
      .populate({
        path: "comments",
        sort: { createdAt: -1 },
        populate: {
          path: "author",
          select: "username,profilePicture",
        },
      });
    return res.status(200).json({
      posts,
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};

export const getUserPost = async (req, res) => {
  try {
    const authorId = req.id;
    const posts = await Post.find({ author: authorId })
      .sort({ createdAt: -1 })
      .populate({ path: "author", select: "username,profilePicture" })
      .populate({
        path: "comments",
        sort: { createdAt: -1 },
        populate: {
          path: "author",
          select: "username,profilePicture",
        },
      });
    return res.status(200).json({
      posts,
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};

//like
export const likePost = async (req, res) => {
  try {
    const likeUserId = req.body;
    const postId = req.params.id;
    const post = await Post.findById(postId);
    if (!post)
      return res.status(200).json({
        message: "posts not founds",
        success: false,
      });
    //like logic here
    await post.updateOne({ $addToSet: { likes: likeUserId } });
    await post.save();
    //socket
    return res.status(200).json({
      message: "post liked",
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};
//unliked post
export const unlikePost = async (req, res) => {
  try {
    const likeUserId = req.body;
    const postId = req.params.id;
    const post = await Post.findById(postId);
    if (!post)
      return res.status(200).json({
        message: "posts not founds",
        success: false,
      });
    //like logic here
    await post.updateOne({ $pull: { likes: likeUserId } });
    await post.save();
    //socket
    return res.status(200).json({
      message: "post liked",
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};
//add comment
export const addComment = async (req, res) => {
  try {
    const postId = req.params.id;
    const commentUserId = req.id; //comment karnewalekiuserid
    const { text } = req.body;
    const post = await Post.findById(postId);
    if (!text)
      return res.status(400).json({
        message: "text is required",
        success: false,
      });

    const comment = await Comment.create({
      text,
      author: commentUserId,
      post: postId,
    }).populate({ path: "author", select: "username, profilePicture" });
    post.comments.push(comment._id);
    await post.save();
    return res.status(200).json({
      message: "comment added",
      comment,
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};

//get comment of particular user
export const getCommentofPost = async (req, res) => {
  try {
    const postId = req.params.id;
    const comments = await Comment.find({ post: postId }).populate(
      "author",
      "username,profilePicture"
    );
    if (!comments)
      return res.status(400).json({
        message: "No comment",
        success: false,
      });
    return res.status(200).json({
      success: true,
      comments,
    });
  } catch (error) {
    console.log(error);
  }
};

export const deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const authorId = req.id;
    const post = await Post.findById(postId);
    if (!post)
      return res.status(400).json({
        message: "post not found",
        success: false,
      });
    if (post.author.toString() !== authorId)
      return res.status(401).json({ message: "UnAutherized" });
    //post delete
    await Post.findByIdAndDelete(postId);
    //remove the postId from user post
    let user = await User.findById(authorId);
    user.posts = user.posts.filter((id) => id.toString !== postId); //its a array
    await user.save();
    //delete comment of these post
    await Comment.deleteMany({ post: postId });
    return res.status(200).json({
      massage: "Post deleted",
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};

export const bookmarkPost = async (req, res) => {
  try {
    const postId = req.params.id;
    const authorId = req.id;
    const post = await Post.findById(postId);
    if (!post)
      return res
        .status(404)
        .json({ message: "Post not found", success: false });

    const user = await User.findById(authorId);
    if (user.bookmarks.includes(post._id)) {
      // already bookmarked
      await user.updateOne({ $pull: { bookmarks: post._id } });
      await user.save();
      return res
        .status(200)
        .json({
          type: "unsaved",
          message: "Post removed from bookmark",
          success: true,
        });
    } else {
      // bookmark
      await user.updateOne({ $addToSet: { bookmarks: post._id } });
      await user.save();
      return res
        .status(200)
        .json({ type: "saved", message: "Post bookmarked", success: true });
    }
  } catch (error) {
    console.log(error);
  }
};
