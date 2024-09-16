import bcryptjs from 'bcryptjs';
import User from "../models/user.model.js";
import { errorHandler } from "../utils/error.js";

// Test API endpoint
export const test = (req, res) => {
    res.json({ messages: 'API is working!' });
};

// Update User
export const updateUser = async (req, res, next) => {
    if (req.user.id !== req.params.userId) {
        return next(errorHandler(403, 'You are not allowed to update this user'));
    }
    
    if (req.body.password) {
        if (req.body.password.length < 6) {
            return next(errorHandler(400, "Password must be at least 6 characters"));
        }
        req.body.password = bcryptjs.hashSync(req.body.password, 10);
    }

    if (req.body.username) {
        if (req.body.username.length < 7 || req.body.username.length > 20) {
            return next(errorHandler(400, "Username must be between 7 and 20 characters"));
        }
        if (req.body.username.includes(' ')) {
            return next(errorHandler(400, 'Username cannot contain spaces'));
        }
        if (req.body.username !== req.body.username.toLowerCase()) {
            return next(errorHandler(400, 'Username must be lowercase'));
        }
        if (!req.body.username.match(/^[a-zA-Z0-9]+$/)) {
            return next(errorHandler(400, "Username can only contain letters and numbers"));
        }
    }

    try {
        const updatedUser = await User.findByIdAndUpdate(
            req.params.userId,
            {
                $set: {
                    username: req.body.username,
                    email: req.body.email,
                    profilePicture: req.body.profilePicture,
                    password: req.body.password,
                },
            },
            { new: true }
        );

        const { password, ...rest } = updatedUser._doc;
        res.status(200).json(rest);

    } catch (error) {
        next(error);
    }
};

// Delete User
export const deleteUser = async (req, res, next) => {
    if (!req.user.isAdmin && req.user.id !== req.params.userId) {
        return next(errorHandler(403, "You are not allowed to delete this user"));
    }
    try {
        await User.findByIdAndDelete(req.params.userId);
        res.status(200).json("User has been deleted");
    } catch (error) {
        next(error);
    }
};

// Signout
export const signout = (req, res, next) => {
    try {
        res.clearCookie('access_token').status(200).json("User has been signed out");
    } catch (error) {
        next(error);
    }
};

export const getUsers = async (req, res, next) => {
 
  try {
    const startIndex = parseInt(req.query.startIndex) || 0;
    const limit = parseInt(req.query.limit) || 9;
    const sortDirection = req.query.sort === 'asc' ? 1 : -1;

    const users = await User.find()
      .sort({ createdAt: sortDirection })
      .skip(startIndex)
      .limit(limit);

    const usersWithoutPassword = users.map((user) => {
      const { password, ...rest } = user._doc;
      return rest;
    });

    const totalUsers = await User.countDocuments();

    const now = new Date();

    const oneMonthAgo = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      now.getDate()
    );
    const lastMonthUsers = await User.countDocuments({
      createdAt: { $gte: oneMonthAgo },
    });

    res.status(200).json({
      users: usersWithoutPassword,
      totalUsers,
      lastMonthUsers,
    });
  } catch (error) {
    next(error);
  }
};// Example server-side implementation// Example server-side implementation
// Example server-side implementation
export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return next(errorHandler(404, 'User not found'));
    }

    const isFollowing = req.user && req.user.following.includes(user._id.toString());

    res.json({
      username: user.username,
      profilePicture: user.profilePicture,
      followersCount: user.followers.length,
      followingCount: user.following.length,
      isFollowing: isFollowing, // Correctly determine if the logged-in user is following
    });
  } catch (error) {
    next(error);
  }
};


  // In your backend controller (e.g., user.controller.js)
export const searchUsers = async (req, res) => {
  const { query } = req.query;
  try {
    const users = await User.find({
      username: { $regex: query, $options: 'i' } // Case-insensitive search
    }).limit(10); // Limit the results if needed
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
// Controller function to follow a user// Controller function to follow a user// Controller function to follow a user
// Controller function to follow a user
// Controller function to follow a user
export const followUser = async (req, res) => {
  const { userId } = req.body;
  const currentUserId = req.user.id;

  if (userId === currentUserId) {
    return res.status(400).json({ message: 'You cannot follow yourself' });
  }

  try {
    const userToFollow = await User.findById(userId);
    const currentUser = await User.findById(currentUserId);

    if (!userToFollow || !currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // if (currentUser.following.includes(userId)) {
    //   return res.status(400).json({ message: 'Already following this user' });
    // }

    userToFollow.followers.push(currentUserId);
    currentUser.following.push(userId);

    await userToFollow.save();
    await currentUser.save();

    res.status(200).json({ message: 'Followed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Controller function to unfollow a user
export const unfollowUser = async (req, res) => {
  const { userId } = req.body;
  const currentUserId = req.user.id;

  if (userId === currentUserId) {
    return res.status(400).json({ message: 'You cannot unfollow yourself' });
  }

  try {
    const userToUnfollow = await User.findById(userId);
    const currentUser = await User.findById(currentUserId);

    if (!userToUnfollow || !currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!currentUser.following.includes(userId)) {
      return res.status(400).json({ message: 'Not following this user' });
    }

    userToUnfollow.followers = userToUnfollow.followers.filter(id => id.toString() !== currentUserId.toString());
    currentUser.following = currentUser.following.filter(id => id.toString() !== userId.toString());

    await userToUnfollow.save();
    await currentUser.save();

    res.status(200).json({ message: 'Unfollowed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getFollowers = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate('followers', 'username profilePicture');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ followers: user.followers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Controller function to get following of a user
export const getFollowing = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate('following', 'username profilePicture');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ following: user.following });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};