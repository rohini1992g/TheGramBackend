const router = require("express").Router();
const bcrypt = require("bcrypt");
const User = require("../models/User");
const { verifyToken } = require("./verifyToken");

//search by name
router.get("/search-users", async (req, res) => {
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
});
//update user

router.put("/:id", async (req, res) => {
  if (req.body.userId === req.params.id || req.body.isAdmin) {
    if (req.body.password) {
      try {
        const salt = await bcrypt.genSalt(10);
        req.body.password = await bcrypt.hash(req.body.password, salt);
      } catch (err) {
        return res.status(500).json(err);
      }
    }
    try {
      const user = await User.findByIdAndUpdate(req.params.id, {
        $set: req.body,
      });
      res.status(200).json("Account has been updated");
    } catch (err) {
      return res.status(500).json(err);
    }
  } else {
    return res.status(403).json("you can update only your account");
  }
});
//delete user

router.delete("/:id", async (req, res) => {
  if (req.body.userId === req.params.id || req.body.isAdmin) {
    try {
      const user = await User.findByIdAndDelete(req.params.id, {
        $set: req.body,
      });
      res.status(200).json("Account has been deleted");
    } catch (err) {
      return res.status(500).json(err);
    }
  } else {
    return res.status(403).json("  you can delete only your account");
  }
});

//get a user
router.get("/", async (req, res) => {
  const userId = req.query.userId;
  const username = req.query.username;

  try {
    const user = userId
      ? await User.findById(userId)
          .select("password")
          .populate("followers followings", "password")
      : await User.findOne({ username: username })
          .select("password")
          .populate("followers followings", "password");

    if (!user) {
      return res.status(400).json({ msg: "requested user does not exist." });
    }

    res.json({ user });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
});

//get number of friends
router.get("/followers/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    const friends = await Promise.all(
      user.followers.map((friendId) => {
        return User.findById(friendId);
      })
    );

    let friendList = [];
    friends.map((friend) => {
      const { _id } = friend;
      friendList.push({ _id });
    });
    res.status(200).json(friendList);
  } catch (err) {
    res.status(500).json(err);
  }
});

//follow friend
router.put("/:id/follow", async (req, res) => {
  if (req.body.userId !== req.params.id) {
    try {
      const user = await User.findById(req.params.id);
      const currentUser = await User.findById(req.body.userId);
      if (!user.followers.includes(req.body.userId)) {
        await user.updateOne({ $push: { followers: req.body.userId } });
        await currentUser.updateOne({ $push: { followings: req.params.id } });
        return res.status(200).json("User has been followed");
      } else {
        return res.status(403).json("You already follow this user");
      }
    } catch (err) {
      return res.status(500).json(err);
    }
  } else {
    return res.status(403).json("You can't follow yourself");
  }
});

//unfollow user

router.put("/:id/unfollow", async (req, res) => {
  if (req.body.userId !== req.params.id) {
    try {
      const user = await User.findById(req.params.id);
      const currentUser = await User.findById(req.body.userId);
      if (user.followers.includes(req.body.userId)) {
        await user.updateOne({ $pull: { followers: req.body.userId } });
        await currentUser.updateOne({ $pull: { followings: req.params.id } });
        return res.status(200).json("User has been unfollowed");
      } else {
        return res.status(403).json("You already unfollow this user");
      }
    } catch (err) {
      return res.status(500).json(err);
    }
  } else {
    return res.status(403).json("You can't unfollow yourself");
  }
});

//update details of user
router.put("/updateProfile", async (req, res) => {
  try {
    const { newBio, newCity, newFrom, newprofilePicture } = req.body;
    if (!username) {
      return res.status(400).json({ msg: "please enter your correct name" });
    }
    await User.findOneAndUpdate(
      { _id: req.user._id },
      {
        newBio,
        newCity,
        newFrom,
        newprofilePicture,
      }
    );
    res.status(200).json({ msg: "Profile  updated Successfully" });
  } catch (err) {}
});
module.exports = router;
