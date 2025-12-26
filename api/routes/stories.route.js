import express from 'express';
import {
    createStory,
    getFollowingStories,
    getStory,
    viewStory,
    reactToStory,
    replyToStory,
    deleteStory,
    archiveStory,
    getUserHighlights,
    getStoryViewers,
    getStoriesCount
} from '../controllers/stories.controller.js';
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

router.post('/create', verifyToken, createStory);
router.get('/following', verifyToken, getFollowingStories);
router.get('/:storyId', verifyToken, getStory);
router.post('/:storyId/view', verifyToken, viewStory);
router.post('/:storyId/react', verifyToken, reactToStory);
router.post('/:storyId/reply', verifyToken, replyToStory);
router.delete('/:storyId', verifyToken, deleteStory);
router.put('/:storyId/archive', verifyToken, archiveStory);
router.get('/user/:userId/highlights', verifyToken, getUserHighlights);
router.get('/:storyId/viewers', verifyToken, getStoryViewers);
router.get('/user/:userId/count', verifyToken, getStoriesCount);

export default router;