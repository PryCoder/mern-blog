import express from 'express'
import { verifyToken } from '../utils/verifyUser.js';
import { create, deletepost, getposts, likePost, updatepost, getFollowingFeed } from '../controllers/post.controller.js';
import { cacheRoute } from '../middleware/redisCache.js';

const router = express.Router();

router.post('/create', verifyToken, create);
router.get('/getposts', cacheRoute(600), getposts);
router.get('/getfollowingposts', verifyToken, cacheRoute(600), getFollowingFeed);
router.delete('/deletepost/:postId/:userId', verifyToken, deletepost);
router.put('/updatepost/:postId/:userId', verifyToken, updatepost);
router.put('/likePost/:postId', verifyToken, likePost);

export default router;