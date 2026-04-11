import  express  from "express";
import {verifyToken} from '../utils/verifyUser.js';
import { createComment, deleteComment, editComment, getPostComments, getcomments, likeComment, reportComment, getReportedComments } from "../controllers/comment.controller.js";

const router = express.Router();


router.post('/create', verifyToken, createComment);
router.get('/getPostComments/:postId', getPostComments);
router.put('/likeComment/:commentId',verifyToken,likeComment);
router.put('/editComment/:commentId',verifyToken, editComment);
router.delete('/deleteComment/:commentId',verifyToken,deleteComment);
router.get('/getcomments',verifyToken , getcomments)
router.put('/reportComment/:commentId', verifyToken, reportComment);
router.get('/getReportedComments', verifyToken, getReportedComments);

export default router;