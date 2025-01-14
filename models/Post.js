import mongoose from "mongoose";
import { Comment } from "./Comment.js";

const { ObjectId } = mongoose.Schema.Types;
const postSchema = new mongoose.Schema({
  caption: { type: String, default: "" },
  image: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
  location: { type: String, default: "" },
});
export const Post = mongoose.model("Post", postSchema);
