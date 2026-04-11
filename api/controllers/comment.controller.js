import Comment from '../models/comment.model.js';
import { errorHandler } from '../utils/error.js';
import Post from '../models/post.model.js';
import Notification from '../models/notification.model.js';
import { emitToUser } from '../utils/socketEmit.js';

export const createComment = async (req, res, next) => {
  try {
    const { content, postId, userId } = req.body;

    if (userId !== req.user.id) {
      return next(
        errorHandler(403, 'You are not allowed to create this comment')
      );
    }

    const newComment = new Comment({
      content,
      postId,
      userId,
    });
    await newComment.save();

    // Notify the post owner (if different from commenter)
    const post = await Post.findById(postId).select('userId slug title');
    if (post && post.userId?.toString() !== req.user.id) {
      const notification = await Notification.create({
        userId: post.userId,
        actorId: req.user.id,
        type: 'comment',
        title: 'New comment',
        body: 'Someone commented on your post',
        data: {
          postId: post._id.toString(),
          postSlug: post.slug,
          commentId: newComment._id.toString(),
        },
      });

      emitToUser(post.userId.toString(), 'notificationCreated', {
        notification,
        timestamp: new Date(),
      });
    }

    res.status(200).json(newComment);
  } catch (error) {
    next(error);
  }
};
export const getPostComments = async (req, res, next) => {
    try {
      const comments = await Comment.find({ postId: req.params.postId }).sort({
        createdAt: -1,
      });
      res.status(200).json(comments);
    } catch (error) {
      next(error);
    }
  };

  export const likeComment = async(req, res, next) => {
    try {
        const comment = await Comment.findById(req.params.commentId);
        if(!comment) {
        return next(errorHandler(404, 'Comment not found'));
        }
        const userIndex = comment.likes.indexOf(req.user.id);
        if (userIndex === -1) {
            comment.numberOfLikes +=1;
            comment.likes.push(req.user.id);
        } else {
            comment.numberOfLikes -=1;
            comment.likes.splice(userIndex,1);
        }
        await comment.save();
        res.status(200).json(comment);
    } catch (error) {
        next(error);
    }
  }

export const editComment = async (req, res,next) => {
try {
const comment = await Comment.findById(req.params.commentId);
if(!comment) {
 return next(errorHandler(404, 'Comment not found'));
 }
 if(comment.userId !== req.user.id && !req.user.isAdmin) {
 return next(errorHAndler(403, 'You are not allowed to edit this comment'));
 }
 const editedComment = await Comment.findByIdAndUpdate(
 req.params.commentId,
 {
  content: req.body.content,
  },
  { new : true}
  );
  res.status(200).json(editedComment);

 }
 catch(error) {
 next(error);
 }
 }

 export const deleteComment = async(req, res, next) => {
  try {
     const comment= await Comment.findById(req.params.commentId);
     if(!comment) {
     return next(errorHandler(403, 'You are not allowed to delete this comment'));
     }
     await Comment.findByIdAndDelete(req.params.commentId);
     res.status(200).json('Comment has been deleted');


  } catch (error) {
    next(error);
  }
 
 }

 export const getcomments = async (req, res, next) => {
  if(!req.user.isAdmin) return next(errorHandler(403, 'You are not allowed to get all comments'));
  try {
    const startIndex = parseInt(req.query.startIndex) || 0;
    const limit = parseInt(req.query.limit) || 9;
    const sortDirection = req.query.sort === 'desc' ? -1 : 1;
    const comments = await Comment.find()
    .sort({ createdAt : sortDirection })
    .skip(startIndex)
    .limit(limit);

    const totalComments = await Comment.countDocuments();
    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth()-1, now.getDate());
    const lastMonthComments = await Comment.countDocuments({ createdAt: { $gte: oneMonthAgo } });
    res.status(200).json({ comments, totalComments ,lastMonthComments });
        




  } catch (error) {
    next(error);
  }
 };

export const reportComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return next(errorHandler(404, 'Comment not found'));
    }
    
    // Extract reason from request body
    const { reason } = req.body;
    
    const userIndex = comment.reports.indexOf(req.user.id);
    if (userIndex === -1) {
      // Add report
      comment.numberOfReports += 1;
      comment.reports.push(req.user.id);
      comment.reportDetails.push({ userId: req.user.id, reason: reason || 'Other' });
    } else {
      // Remove report (un-report)
      comment.numberOfReports -= 1;
      comment.reports.splice(userIndex, 1);
      // Remove user's report detail
      comment.reportDetails = comment.reportDetails.filter(r => r.userId !== req.user.id);
    }
    await comment.save();
    res.status(200).json(comment);
  } catch (error) {
    next(error);
  }
};

export const getReportedComments = async (req, res, next) => {
  if (!req.user.isAdmin) {
    return next(errorHandler(403, 'You are not allowed to view reported comments'));
  }
  try {
    const comments = await Comment.find({ numberOfReports: { $gt: 0 } })
      .sort({ numberOfReports: -1 });
    res.status(200).json(comments);
  } catch (error) {
    next(error);
  }
};