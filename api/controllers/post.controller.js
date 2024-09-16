import Post from '../models/post.model.js';
import { errorHandler } from '../utils/error.js';
export const create = async (req, res, next) => {
  // Check if user is authenticated
  // if (!user) {
  //    console.log('User is not authenticated. Redirecting to sign in.');
  //   return next(errorHandler(500, 'Please sign in to create a post'));
  // }
  
  // Check if required fields are provided
  if (!req.body.title || !req.body.content) {
    return next(errorHandler(400, 'Please provide all required fields'));
  }
  
  // Generate a slug from the title
  const slug = req.body.title
    .split(' ')
    .join('-')
    .toLowerCase()
    .replace(/[^a-zA-Z0-9-]/g, '');
  
  // Create a new post object
  const newPost = new Post({
    ...req.body,
    slug,
    userId: req.user.id,
  });

  try {
    const savedPost = await newPost.save();
    res.status(201).json(savedPost);
  } catch (error) {
    next(error);
  }
};

export const getposts = async (req, res, next) => {
  try {
    const startIndex = parseInt(req.query.startIndex) || 0;
    const limit = parseInt(req.query.limit) || 9;
    const sortDirection = req.query.order === 'asc' ? 1 : -1;

    // Find posts based on the query parameters
  const posts = await Post.find({
  ...(req.query.userId && { userId: req.query.userId }),
  ...(req.query.category && { category: req.query.category }),
  ...(req.query.slug && { slug: req.query.slug }),
  ...(req.query.postId && { _id: req.query.postId }),
  ...(req.query.searchTerm && {
    $or: [
      { title: { $regex: req.query.searchTerm, $options: 'i' } },
      { content: { $regex: req.query.searchTerm, $options: 'i' } },
    ],
  }),
})
  .sort({ updatedAt: sortDirection })
  .skip(startIndex)
  .limit(limit)
  .populate('userId', 'username profilePicture'); // Populate username and profilePicture fields from User model
 // Populate user data from User model

    const totalPosts = await Post.countDocuments();

    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const lastMonthPosts = await Post.countDocuments({
      createdAt: { $gte: oneMonthAgo },
    });

    res.status(200).json({
      posts,
      totalPosts,
      lastMonthPosts,
    });
  } catch (error) {
    next(error);
  }
};
export const deletepost = async (req, res, next) => {
     
     if(!req.user.isAdmin || req.user.id !== req.params.userId) {
     return next(errorHandler(403, 'You are allowed to delete tbis post'));

     }
     try {
     await Post.findByIdAndDelete(req.params.postId);
      res.status(200).json("The post has been deleted");
      }catch(error) {
      next(error);
      }

      };

      export const updatepost= async(req, res, next) => {
      if(!req.user.isAdmin || req.user.id !== req.params.userId) {
       return next(errorHandler(403, "You are not allowed to update this post"));
       }
       try {
       const updatePost = await Post.findByIdAndUpdate(
       req.params.postId,
       {
        $set: {
        title: req.body.title,
        content: req.body.content,
        category: req.body.category,
        image: req.body.image,
        }}, {new: true});
         res.status(200).json(updatePost);
         }catch(error) {
         next(error);
         }
        }

export const likePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return next(errorHandler(404, 'Post not found'));
    }

    const userIndex = post.likes.indexOf(req.user.id);
    if (userIndex === -1) {
      // Like the post
      post.numberOfLikes += 1;
      post.likes.push(req.user.id);
    } else {
      // Unlike the post
      post.numberOfLikes -= 1;
      post.likes.splice(userIndex, 1);
    }

    await post.save();
    res.status(200).json(post);
  } catch (error) {
    next(error);
  }
};