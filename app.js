import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import _ from "lodash";
import dotenv from "dotenv";
import session from "express-session";
import passport from "passport";
import passportLocalMongoose from "passport-local-mongoose";
import { fileURLToPath } from "url";
import { dirname } from "path";
import path from "path";
import User from "./models/user.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const postSchema = {
  title: String,
  content: String,
};

const Post = mongoose.model("Post", postSchema);

app.use(
  session({
    secret: "This is my secret key", // Replace with env var in production
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// ===== Auth Routes =====

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", async (req, res) => {
  try {
    const user = await User.register(
      { username: req.body.username },
      req.body.password
    );
    passport.authenticate("local")(req, res, () => {
      res.redirect("/");
    });
  } catch (err) {
    console.log(err);
    res.redirect("/register");
  }
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
  })
);

app.get("/logout", (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    res.redirect("/");
  });
});

// ===== Home & Compose Routes =====

app.get("/", async (req, res) => {
  try {
    const posts = await Post.find({});
    res.render("home", {
      posts: posts,
      user: req.user,
    });
  } catch (err) {
    console.error(err);
    res.redirect("/login");
  }
});

app.get("/compose", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("compose");
  } else {
    res.redirect("/login");
  }
});

app.post("/compose", async (req, res) => {
  const post = new Post({
    title: req.body.postTitle,
    content: req.body.postBody,
  });

  try {
    await post.save();
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to save post.");
  }
});

app.get("/posts/:postId", async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (post) {
      res.render("post", {
        title: post.title,
        content: post.content,
      });
    } else {
      res.status(404).send("Post not found");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// ===== Edit and Delete Routes =====

app.post("/delete/:id", async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    res.redirect("/");
  } catch (err) {
    res.status(500).send("Delete failed.");
  }
});

app.get("/edit/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    res.render("edit", { post: post });
  } catch (err) {
    console.error(err);
    res.status(404).send("Post not found");
  }
});

app.post("/edit/:id", async (req, res) => {
  try {
    await Post.findByIdAndUpdate(req.params.id, {
      title: req.body.postTitle,
      content: req.body.postBody,
    });
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.status(500).send("Update failed.");
  }
});

// ===== Start Server =====
app.listen(3000, () => {
  console.log("✅ Server started on http://localhost:3000");
});
