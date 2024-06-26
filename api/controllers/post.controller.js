import bcryptjs from 'bcryptjs';
import User from "../models/user.model.js";
import Post from "../models/post.model.js"; // Ensure the Post model is correctly imported
import { errorHandler } from "../utils/error.js";

export const test = (req, res) => {
    res.json({ messages: 'API is working!' });
};

export const create = async (req, res, next) => {
  
    
        if (!req.user.isAdmin) {
            return next(errorHandler(403, "You are not allowed to create a post"));
        }

        if (!req.body.title || !req.body.content) {
            return next(errorHandler(400, "Please provide all required fields"));
        }

        const slug = req.body.title
            .split(' ')
            .join('-')
            .toLowerCase()
            .replace(/[^a-zA-Z0-9-]/g, '-');

        const newPost = new Post({
            ...req.body,
            slug,
            userId: req.user.id
        });
try{
        const savedPost = await newPost.save();
        res.status(201).json(savedPost);
    } catch (error) {
        next(error);
    }
};

export const getposts = async (req, res, next ) => {
 try{
 const startIndex = parseInt(req.query.startIndex) || 0;
 const limit = parseInt(req.query.limit) || 9;
 const sortDirection = req.query.order === 'asc' ? 1 : -1;
 const posts = await Post.find({
 ...(req.query.userId && {userId: req.query.userId}),
 ...(req.query.category && {category: req.query.category }),
 ...(req.query.slug && {category: req.query.slug }),
 ...(req.query.postId && {_id: req.query.postId }),
 ...(req.query.searchTerm && {
 Sor: [
 { title: { $regex: req.query.searchTerm, $options: 'i' } },
   {content: { $regex: req.query.searchTerm, $options: 'i' } },
   ],
   }),
   }).sort({ updatedAt: sortDirection }).skip(startIndex).limit(limit);

   const totalPosts = await Post.countDocuments();

   const now = new Date();

   const oneMonthAgo = new Date(
   now.getFullYear(),
   now.getMonth() - 1,
   now.getDate()
   );

   const lastMonthPosts = await Post.countDocuments({
   createdAt: { $gte: oneMonthAgo },
   });

   res.status(200).json({
   posts,
   totalPosts,
   lastMonthPosts,
   });


 }catch(error) {
 next(error);
 }
}

// export const updateUser = async (req, res, next) => {
//     if (req.user.id !== req.params.userId) {
//         return next(errorHandler(403, 'You are not allowed to update this user'));
//     }

//     if (req.body.password) {
//         if (req.body.password.length < 6) {
//             return next(errorHandler(400, "Password must be at least 6 characters"));
//         }
//         req.body.password = bcryptjs.hashSync(req.body.password, 10);
//     }

//     if (req.body.username) {
//         if (req.body.username.length < 7 || req.body.username.length > 20) {
//             return next(errorHandler(400, "Username must be between 7 and 20 characters"));
//         }
//         if (req.body.username.includes(' ')) {
//             return next(errorHandler(400, 'Username cannot contain spaces'));
//         }
//         if (req.body.username !== req.body.username.toLowerCase()) {
//             return next(errorHandler(400, 'Username must be lowercase'));
//         }
//         if (!req.body.username.match(/^[a-zA-Z0-9]+$/)) {
//             return next(errorHandler(400, "Username can only contain letters and numbers"));
//         }
//     }

//     try {
//         const updatedUser = await User.findByIdAndUpdate(
//             req.params.userId,
//             {
//                 $set: {
//                     username: req.body.username,
//                     email: req.body.email,
//                     profilePicture: req.body.profilePicture,
//                     password: req.body.password,
//                 },
//             },
//             { new: true }
//         );

//         const { password, ...rest } = updatedUser._doc;
//         res.status(200).json(rest);

//     } catch (error) {
//         next(error);
//     }
// };

// export const deleteUser = async(req, res, next) => {
//     if(req.user.id !== req.params.userId) {
//         return next(errorHandler(403, "You are not allowed to delete this user"));
//     }
//     try {
//         await User.findByIdAndDelete(req.params.userId);
//         res.status(200).json("User has been deleted");
//     } catch(error) {
//         next(error);
//     }
// };

// export const signout = (req, res, next ) => {
//     try {
//         res.clearCookie('access_token').status(200).json("User has been signed out");
//     } catch(error) {
//         next(error);
//     }
// };
