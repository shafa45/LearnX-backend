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
  removeLesson,
  updateLesson,
  publishCourse,
  unpublishCourse,
  courses,
  checkEnrollment,
  freeEnrollment,
  paidEnrollment,
  stripeSuccess
} from '../controllers/course';

router.get('/courses', courses);

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

// publish unpublish
router.put('/course/publish/:courseId', requireSignin, publishCourse);
router.put('/course/unpublish/:courseId', requireSignin, unpublishCourse);

// /api/course/lesson/${slug}/${course.instructor._id}
router.post('/course/lesson/:slug/:instructorId', requireSignin, addLesson);
router.put('/course/lesson/:slug/:instructorId', requireSignin, updateLesson);
router.put('/course/:slug/:lessonId', requireSignin, removeLesson);

router.get('/check-enrollment/:courseId', requireSignin, checkEnrollment);

router.post('/free-enrollment/:courseId', requireSignin, freeEnrollment);
router.post('/paid-enrollment/:courseId', requireSignin, paidEnrollment);
router.get('/stripe-success/:courseId', requireSignin, stripeSuccess);

module.exports = router;
