import express from 'express';

const router = express.Router();

// middleware

import { isInstructor, requireSignin } from '../middlewares';

// controllers
import { uploadImage, removeImage, create } from '../controllers/course';

// Image
router.post('/courses/upload-image', uploadImage);
router.post('/courses/remove-image', removeImage);

// Course
router.post('/course', requireSignin, isInstructor, create);

module.exports = router;
