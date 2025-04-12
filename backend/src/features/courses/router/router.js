import express from 'express';
import { createCourse, getCoursesByID  } from '../contollers/courseController.js';

const router = express.Router();


router.post('/create', createCourse);
router.get('/:id', getCoursesByID );
export default router;
