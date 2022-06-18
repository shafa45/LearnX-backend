import express from 'express';
import formidable from 'express-formidable';

const router = express.Router();

// middleware

import { isInstructor, requireSignin } from '../middlewares';

// controllers
import {
  uploadImage,
  removeImage,
  create,
  read,
  uploadVideo,
  removeVideo,
  addLesson,
  update,
} from '../controllers/course';

// Image
router.post('/courses/upload-image', uploadImage);
router.post('/courses/remove-image', removeImage);

// Course
router.post('/course', requireSignin, isInstructor, create);
router.put('/course/:slug', requireSignin, update);
router.get('/course/:slug', read);
router.post(
  '/course/video-upload/:instructorId',
  requireSignin,
  formidable(),
  uploadVideo
);
router.post('/course/video-remove/:instructorId', requireSignin, removeVideo);

// /api/course/lesson/${slug}/${course.instructor._id}
router.post('/course/lesson/:slug/:instructorId', requireSignin, addLesson);

module.exports = router;
