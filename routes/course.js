import express from 'express';

const router = express.Router();

// middleware

import { requireSignin } from '../middlewares';

// controllers
import { uploadImage, removeImage } from '../controllers/course';

router.post('/courses/upload-image', uploadImage);
router.post('/courses/remove-image', removeImage);

module.exports = router;
