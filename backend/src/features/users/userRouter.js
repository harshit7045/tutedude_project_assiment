import express from 'express';
import userController from './controllers/usercontroller.js';
import authMiddleware from '../../middelwares/auth.middleware.js';

const userRouter = express.Router();
userRouter.post('/signup',userController.createUser);
userRouter.post('/login',userController.signinUser);
userRouter.get('/user',userController.getUser);
userRouter.post('/updateUserViewVideo', authMiddleware, userController.updateUserViewVideo);
userRouter.post('/getUserViewedSegments', authMiddleware, userController.getUserViewedSegments);
userRouter.post('/getlastWatchedTime', authMiddleware, userController.getlastWatchedTime);

export default userRouter;
