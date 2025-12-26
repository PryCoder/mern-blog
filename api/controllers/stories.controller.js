import Story from '../models/stories.model.js';
import User from '../models/user.model.js';
import { errorHandler } from '../utils/error.js';

// Create a new story
export const createStory = async (req, res, next) => {
    try {
        const { mediaType, mediaUrl, caption, duration, location, mentions, hashtags } = req.body;
        const userId = req.user.id;

        // Validate required fields
        if (!mediaType || !mediaUrl) {
            return next(errorHandler(400, 'Media type and URL are required'));
        }

        // Validate media type
        if (!['image', 'video'].includes(mediaType)) {
            return next(errorHandler(400, 'Invalid media type'));
        }

        // Set expiration (24 hours from now)
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        const newStory = new Story({
            userId,
            mediaType,
            mediaUrl,
            caption: caption || '',
            duration: duration || (mediaType === 'image' ? 5 : 15),
            location: location || '',
            mentions: mentions || [],
            hashtags: hashtags || [],
            expiresAt,
            views: [],
            reactions: [],
            replies: []
        });

        await newStory.save();

        // Populate user data
        const populatedStory = await Story.findById(newStory._id)
            .populate('userId', 'username profilePicture')
            .populate('mentions', 'username profilePicture');

        res.status(201).json({
            success: true,
            story: populatedStory,
            message: 'Story created successfully'
        });
    } catch (error) {
        next(error);
    }
};

// Get stories from users that current user follows
export const getFollowingStories = async (req, res, next) => {
    try {
        const currentUserId = req.user.id;
        const currentUser = await User.findById(currentUserId);

        if (!currentUser) {
            return next(errorHandler(404, 'User not found'));
        }

        // Get following users' IDs
        const followingIds = currentUser.following;
        followingIds.push(currentUserId); // Include current user's own stories

        // Get active stories from following users
        const stories = await Story.find({
            userId: { $in: followingIds },
            expiresAt: { $gt: new Date() }, // Only non-expired stories
            isArchived: false
        })
        .populate('userId', 'username profilePicture')
        .sort({ createdAt: -1 });

        // Group stories by user
        const groupedStories = stories.reduce((acc, story) => {
            const userId = story.userId._id.toString();
            if (!acc[userId]) {
                acc[userId] = {
                    user: story.userId,
                    stories: [],
                    hasUnviewed: false
                };
            }
            
            // Check if current user has viewed this story
            const hasViewed = story.views.some(view => 
                view.userId.toString() === currentUserId
            );
            
            if (!hasViewed) {
                acc[userId].hasUnviewed = true;
            }
            
            acc[userId].stories.push({
                _id: story._id,
                mediaType: story.mediaType,
                mediaUrl: story.mediaUrl,
                caption: story.caption,
                duration: story.duration,
                viewsCount: story.views.length,
                reactionsCount: story.reactions.length,
                createdAt: story.createdAt,
                expiresAt: story.expiresAt,
                hasViewed: hasViewed
            });
            
            return acc;
        }, {});

        res.status(200).json({
            success: true,
            stories: Object.values(groupedStories)
        });
    } catch (error) {
        next(error);
    }
};

// Get a specific story with details
export const getStory = async (req, res, next) => {
    try {
        const { storyId } = req.params;
        const currentUserId = req.user.id;

        const story = await Story.findById(storyId)
            .populate('userId', 'username profilePicture')
            .populate('views.userId', 'username profilePicture')
            .populate('reactions.userId', 'username profilePicture')
            .populate('replies.userId', 'username profilePicture')
            .populate('mentions', 'username profilePicture');

        if (!story) {
            return next(errorHandler(404, 'Story not found'));
        }

        // Check if story is expired
        if (story.expiresAt < new Date()) {
            return next(errorHandler(410, 'Story has expired'));
        }

        // Check if current user has already viewed this story
        const hasViewed = story.views.some(view => 
            view.userId._id.toString() === currentUserId
        );

        res.status(200).json({
            success: true,
            story: {
                ...story.toObject(),
                hasViewed,
                canReply: true // You can add logic to control who can reply
            }
        });
    } catch (error) {
        next(error);
    }
};

// Mark story as viewed
export const viewStory = async (req, res, next) => {
    try {
        const { storyId } = req.params;
        const currentUserId = req.user.id;

        const story = await Story.findById(storyId);
        
        if (!story) {
            return next(errorHandler(404, 'Story not found'));
        }

        // Check if story is expired
        if (story.expiresAt < new Date()) {
            return next(errorHandler(410, 'Story has expired'));
        }

        // Check if user has already viewed this story
        const alreadyViewed = story.views.some(view => 
            view.userId.toString() === currentUserId
        );

        if (!alreadyViewed) {
            story.views.push({
                userId: currentUserId,
                viewedAt: new Date()
            });
            
            await story.save();
        }

        res.status(200).json({
            success: true,
            message: 'Story marked as viewed',
            viewsCount: story.views.length
        });
    } catch (error) {
        next(error);
    }
};

// Add reaction to story
export const reactToStory = async (req, res, next) => {
    try {
        const { storyId } = req.params;
        const { emoji } = req.body;
        const currentUserId = req.user.id;

        const story = await Story.findById(storyId);
        
        if (!story) {
            return next(errorHandler(404, 'Story not found'));
        }

        // Remove existing reaction from same user
        story.reactions = story.reactions.filter(reaction => 
            reaction.userId.toString() !== currentUserId
        );

        // Add new reaction
        story.reactions.push({
            userId: currentUserId,
            emoji: emoji || '❤️',
            reactedAt: new Date()
        });

        await story.save();

        res.status(200).json({
            success: true,
            message: 'Reaction added',
            reactionsCount: story.reactions.length
        });
    } catch (error) {
        next(error);
    }
};

// Reply to story
export const replyToStory = async (req, res, next) => {
    try {
        const { storyId } = req.params;
        const { text } = req.body;
        const currentUserId = req.user.id;

        if (!text || text.trim() === '') {
            return next(errorHandler(400, 'Reply text is required'));
        }

        const story = await Story.findById(storyId)
            .populate('userId', 'username');
        
        if (!story) {
            return next(errorHandler(404, 'Story not found'));
        }

        // Check if user can reply (you can add more conditions here)
        // For example, only allow replies from followers
        const storyOwner = await User.findById(story.userId);
        const canReply = storyOwner.followers.includes(currentUserId) || 
                        story.userId.toString() === currentUserId;

        if (!canReply) {
            return next(errorHandler(403, 'You cannot reply to this story'));
        }

        story.replies.push({
            userId: currentUserId,
            text: text.trim(),
            repliedAt: new Date()
        });

        await story.save();

        // You can add notification logic here
        // notifyStoryReply(story.userId, currentUserId, storyId);

        res.status(201).json({
            success: true,
            message: 'Reply added successfully',
            repliesCount: story.replies.length
        });
    } catch (error) {
        next(error);
    }
};

// Delete a story
export const deleteStory = async (req, res, next) => {
    try {
        const { storyId } = req.params;
        const currentUserId = req.user.id;

        const story = await Story.findById(storyId);
        
        if (!story) {
            return next(errorHandler(404, 'Story not found'));
        }

        // Check if user owns the story or is admin
        if (story.userId.toString() !== currentUserId && !req.user.isAdmin) {
            return next(errorHandler(403, 'You can only delete your own stories'));
        }

        await Story.findByIdAndDelete(storyId);

        res.status(200).json({
            success: true,
            message: 'Story deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

// Archive a story (save to highlights)
export const archiveStory = async (req, res, next) => {
    try {
        const { storyId } = req.params;
        const { highlightAlbum } = req.body;
        const currentUserId = req.user.id;

        const story = await Story.findById(storyId);
        
        if (!story) {
            return next(errorHandler(404, 'Story not found'));
        }

        if (story.userId.toString() !== currentUserId) {
            return next(errorHandler(403, 'You can only archive your own stories'));
        }

        story.isArchived = true;
        story.isHighlighted = !!highlightAlbum;
        story.highlightAlbum = highlightAlbum || '';

        await story.save();

        res.status(200).json({
            success: true,
            message: 'Story archived successfully',
            isHighlighted: story.isHighlighted,
            highlightAlbum: story.highlightAlbum
        });
    } catch (error) {
        next(error);
    }
};

// Get user's archived stories/highlights
export const getUserHighlights = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user.id;

        const user = await User.findById(userId);
        if (!user) {
            return next(errorHandler(404, 'User not found'));
        }

        // Check if current user follows this user (optional, for privacy)
        const isFollowing = user.followers.includes(currentUserId);
        if (userId !== currentUserId && !isFollowing && !user.isPublic) {
            return next(errorHandler(403, 'You cannot view this user\'s highlights'));
        }

        const highlights = await Story.find({
            userId,
            isArchived: true,
            isHighlighted: true
        })
        .populate('userId', 'username profilePicture')
        .sort({ createdAt: -1 });

        // Group by album
        const groupedHighlights = highlights.reduce((acc, story) => {
            const album = story.highlightAlbum || 'Highlights';
            if (!acc[album]) {
                acc[album] = {
                    albumName: album,
                    coverImage: story.mediaUrl,
                    stories: []
                };
            }
            acc[album].stories.push(story);
            return acc;
        }, {});

        res.status(200).json({
            success: true,
            highlights: Object.values(groupedHighlights)
        });
    } catch (error) {
        next(error);
    }
};

// Get story viewers list
export const getStoryViewers = async (req, res, next) => {
    try {
        const { storyId } = req.params;
        const currentUserId = req.user.id;

        const story = await Story.findById(storyId)
            .populate('views.userId', 'username profilePicture');
        
        if (!story) {
            return next(errorHandler(404, 'Story not found'));
        }

        // Check if user owns the story or is admin
        if (story.userId.toString() !== currentUserId && !req.user.isAdmin) {
            return next(errorHandler(403, 'You can only view viewers of your own stories'));
        }

        res.status(200).json({
            success: true,
            viewers: story.views.map(view => ({
                user: view.userId,
                viewedAt: view.viewedAt
            })),
            totalViews: story.views.length
        });
    } catch (error) {
        next(error);
    }
};

// Get user's active stories count
export const getStoriesCount = async (req, res, next) => {
    try {
        const { userId } = req.params;
        
        const activeStoriesCount = await Story.countDocuments({
            userId,
            expiresAt: { $gt: new Date() },
            isArchived: false
        });

        res.status(200).json({
            success: true,
            activeStoriesCount,
            hasActiveStories: activeStoriesCount > 0
        });
    } catch (error) {
        next(error);
    }
};