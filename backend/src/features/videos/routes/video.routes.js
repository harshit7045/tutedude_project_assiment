import express from 'express';
import { getVideos, streamVideo, createVideo } from '../controllers/video.controller.js';
import authMiddleware from '../../../middelwares/auth.middleware.js';

const router = express.Router();

router.get('/videos', getVideos);
router.get('/:videoId/stream', streamVideo);
router.post('/createvideo', createVideo);

export default router; 