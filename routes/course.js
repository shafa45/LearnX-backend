import express from 'express';

const router = express.Router();

// middleware

import { isInstructor, requireSignin } from '../middlewares';

// controllers
import { uploadImage, removeImage, create, read } from '../controllers/course';

// Image
router.post('/courses/upload-image', uploadImage);
router.post('/courses/remove-image', removeImage);

// Course
router.post('/course', requireSignin, isInstructor, create);
router.get('/course/:slug', read);

module.exports = router;
