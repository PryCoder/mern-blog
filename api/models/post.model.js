import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Reference to User model
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
      unique: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    image: {
      type: String,
      default: 'https://www.hostinger.com/tutorials/wp-content/uploads/sites/2/2021/09/how-to-write-a-blog-post.png',
    },
    category: {
      type: String,
      default: 'uncategorized',
    },
    likes: {
      type: Array,
      default: [], // Store user IDs who liked the post
    },
    numberOfLikes: {
      type: Number,
      default: 0, // Number of likes
    },
  },
  { timestamps: true } // Automatically manage createdAt and updatedAt fields
);

const Post = mongoose.model('Post', postSchema);

export default Post;
