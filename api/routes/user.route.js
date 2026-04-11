import express from 'express';
import {deleteUser,  followUser, toggleAdmin, getFollowers,getFollowingForMessaging,  getFollowing,  getUser, getUsers, searchUsers, signout, test,unfollowUser,updateUser} from '../controllers/user.controller.js';
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

router.get('/test', test);
router.put('/update/:userId',verifyToken,updateUser);
router.delete('/delete/:userId',verifyToken,deleteUser);
router.post('/signout',signout);
router.get('/getusers', verifyToken, getUsers);
router.get('/search', verifyToken, searchUsers);
router.get('/:userId',getUser);
router.post('/follow', verifyToken, followUser);
router.post('/unfollow', verifyToken, unfollowUser);
router.get('/:userId/followers', verifyToken, getFollowers);
router.get('/:userId/following', verifyToken, getFollowing);
router.get('/following/messaging', verifyToken, getFollowingForMessaging);
router.put('/toggle-admin/:userId', verifyToken, toggleAdmin);

export default router;