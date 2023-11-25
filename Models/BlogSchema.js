const mongoose = require("mongoose");

const paragraphSchema = new mongoose.Schema({
  title: {
    type: "string",
    required: true,
  },
  description: {
    type: "string",
    required: true,
  },
  imageUrl: {
    type: "string",
    default: "",
  },
});

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: "string",
      required: true,
    },
    description: {
      type: "string",
      required: true,
    },
    imageUrl: {
      type: "string",
      required: true,
    },
    category : {
        type: "string",
        required: true,
    },
    paragraphs: {
      type: [paragraphSchema],
      default: [],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

const Blog = mongoose.model("Blog", blogSchema);
module.exports = Blog;
