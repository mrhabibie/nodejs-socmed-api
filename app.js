const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const path = require("path");
const cors = require("cors");
const config = require("./config");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

mongoose.connect(config.mongodb.uri);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const postSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: true },
  image: { type: String },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  comments: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      content: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);
const Post = mongoose.model("Post", postSchema);

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  jwt.verify(token, config.jwt.secret, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid token" });
    }
    req.user = user;
    next();
  });
};

app.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username,
      email,
      password: hashedPassword,
    });

    await user.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = jwt.sign({ userId: user._id }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });
    res.json({ token, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/posts", authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find()
      .populate("userId", "username")
      .populate("comments.userId", "username")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments();
    const totalPages = Math.ceil(total / limit);

    res.json({
      posts,
      currentPage: page,
      totalPages,
      totalPosts: total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post(
  "/posts",
  authenticateToken,
  upload.single("image"),
  async (req, res) => {
    try {
      const { content } = req.body;
      let post = new Post({
        userId: req.user.userId,
        content,
        image: req.file ? `/uploads/${req.file.filename}` : null,
      });
      await post.save();

      post = await Post.findOne({ _id: post._id })
        .populate("userId", "username")
        .populate("comments.userId", "username");

      res.status(201).json(post);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

app.get("/posts/:id", authenticateToken, async (req, res) => {
  try {
    const post = await Post.findOne({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!post) {
      return res
        .status(404)
        .json({ message: "Post not found or unauthorized" });
    }

    res.json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put(
  "/posts/:id",
  authenticateToken,
  upload.single("image"),
  async (req, res) => {
    try {
      const post = await Post.findOne({
        _id: req.params.id,
        userId: req.user.userId,
      });

      if (!post) {
        return res
          .status(404)
          .json({ message: "Post not found or unauthorized" });
      }

      post.content = req.body.content || post.content;
      if (req.file) {
        post.image = `/uploads/${req.file.filename}`;
      }

      await post.save();
      res.json(post);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

app.delete("/posts/:id", authenticateToken, async (req, res) => {
  try {
    const result = await Post.deleteOne({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ message: "Post not found or unauthorized" });
    }

    res.json({ message: "Post deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/posts/:id/like", authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const likeIndex = post.likes.indexOf(req.user.userId);
    if (likeIndex === -1) {
      post.likes.push(req.user.userId);
    } else {
      post.likes.splice(likeIndex, 1);
    }

    await post.save();
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/posts/:id/comments", authenticateToken, async (req, res) => {
  try {
    let post = await Post.findById(req.params.id)
      .populate("userId", "username")
      .populate("comments.userId", "username");

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    post.comments.push({
      userId: req.user.userId,
      content: req.body.content,
    });

    await post.save();

    post = await Post.findById(req.params.id)
      .populate("userId", "username")
      .populate("comments.userId", "username");

    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

if (!fs.existsSync("./uploads/")) {
  fs.mkdirSync("./uploads/");
}
const PORT = config.server.port;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
