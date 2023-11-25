const express = require("express");
const router = express.Router();
const Blog = require("../Models/BlogSchema");
const User = require("../Models/UserSchema");
const authTokenHandler = require("../Middlewares/checkAuthToken");
const jwt = require("jsonwebtoken");

const createdResponse = (ok, message, data) => {
  return {
    ok,
    message,
    data,
  };
};

const checkBlogOwnership = async (req, res, next) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json(createdResponse(false, "Blog not found"));
    }
    if (blog.owner.toString() !== req.userId) {
      return res
        .status(403)
        .json(createdResponse(false, "permission denied, not allowed"));
    }
    req.blog = blog;
    next();
  } catch (err) {
    res.status(500).json(createdResponse(false, err.message));
  }
};
// c r u d  search

router.get("/test", authTokenHandler, async (req, res) => {
  res.json(createdResponse(true, "Test api working for blog"));
});

//create a new blog
router.post("/", authTokenHandler, async (req, res) => {
  try {
    const { title, description, imageUrl, paragraphs, category } = req.body;
    console.log(title, description, imageUrl, paragraphs, category);
    const blog = new Blog({
      title,
      description,
      imageUrl,
      paragraphs,
      owner: req.userId,
      category,
      owner: req.userId,
    });
    await blog.save();

    //add the blog post to the user's blog array.
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json(createdResponse(false, "User not found"));
    }
    user.blogs.push(blog._id);
    await user.save();

    res
      .status(201)
      .json(createdResponse(true, "Blog post created successfully", { blog }));
  } catch (err) {
    res.status(500).json(createdResponse(false, err.message));
  }
});

router.get("/:id", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json(createdResponse(false, "blog not found"));
    }
    res
      .status(200)
      .json(createdResponse(true, "Blog fetched successfully", { blog }));
  } catch (err) {
    res.status(500).json(createdResponse(false, err.message));
  }
});

router.put("/:id", authTokenHandler, checkBlogOwnership, async (req, res) => {
  try {
    const { title, description, imageUrl, paragraphs, category } = req.body;
    const updatedBlog = await Blog.findByIdAndUpdate(
      req.params.id,
      { title, description, imageUrl, paragraphs, category },
      { new: true }
    );

    if (!updatedBlog) {
      return res.status(404).json(createdResponse(flase, "Blog not found"));
    }

    res
      .status(200)
      .json(createdResponse(true, "blog post updated", { updatedBlog }));
  } catch (err) {
    res.status(500).json(createdResponse(false, err.message));
  }
});

router.delete(
  "/:id",
  authTokenHandler,
  checkBlogOwnership,
  async (req, res) => {
    try {
      const deletedBlog = await Blog.findByIdAndRemove(req.params.id);
      if (!deletedBlog) {
        return res
          .status(404)
          .json(createdResponse(false, "blog post not found"));
      }

      const user = await User.findById(req.userId);
      if (!user) {
        return res.status(404).json(createdResponse(false, "Use not found"));
      }

      const blogIndex = user.blogs.indexOf(req.params.id);
      if (blogIndex !== -1) {
        user.blogs.splice(blogIndex, 1);
        await user.save();
      }

      res
        .status(200)
        .json(createResponse(true, "Blog post deleted successfully"));
    } catch (err) {
      res.status(500).json(createdResponse(false, err.message));
    }
  }
);

// search || get all blog post
router.get("/", async (req, res) => {
  try {
    const search = req.body.search || ""; // Default to an empty string if 'search' is not provided
    const page = parseInt(req.body.page) || 1; // Default to page 1 if 'page' is not provided or is invalid
    const perPage = 10; // Number of blogs per page

    // Build the search query using regular expressions for case-insensitive search
    const searchQuery = new RegExp(search, "i");

    // Count the total number of blogs that match the search query
    const totalBlogs = await Blog.countDocuments({ title: searchQuery });

    // Calculate the total number of pages
    const totalPages = Math.ceil(totalBlogs / perPage);

    // Ensure 'page' is within valid range
    if (page < 1 || page > totalPages) {
      return res
        .status(400)
        .json(createdResponse(false, "Invalid page number"));
    }

    // Calculate the number of blogs to skip
    const skip = (page - 1) * perPage;

    // Fetch the blogs that match the search query for the specified page
    const blogs = await Blog.find({ title: searchQuery })
      .sort({ createdAt: -1 }) // Sort by the latest blogs
      .skip(skip)
      .limit(perPage);

    res
      .status(200)
      .json(
        createdResponse(true, "Blogs fetched successfully", {
          blogs,
          totalPages,
          currentPage: page,
        })
      );
  } catch (err) {
    res.status(500).json(createdResponse(false, err.message));
  }
});

module.exports = router;
