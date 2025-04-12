import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import videoRoutes from './features/videos/routes/video.routes.js';
import path from 'path';
import { fileURLToPath } from 'url';
import courseRoutes from './features/courses/router/router.js';
import userRouter from './features/users/userRouter.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config(); // Load environment variables from .env file

const app = express();
app.use(express.json());

app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
}));

// Auth routes
app.use('/api/auth', userRouter);

// Video routes
app.use('/api/videos', videoRoutes);

// Course routes
app.use('/api/courses', courseRoutes);

export { app };
