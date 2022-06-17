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
} from '../controllers/course';

// Image
router.post('/courses/upload-image', uploadImage);
router.post('/courses/remove-image', removeImage);

// Course
router.post('/course', requireSignin, isInstructor, create);
router.get('/course/:slug', read);
router.post('/course/video-upload', requireSignin, formidable(), uploadVideo);

module.exports = router;
