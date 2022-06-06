const express = require('express');

const router = express.Router();

// middleware
import { requireSignin } from '../middlewares';

import {
  register,
  login,
  logout,
  currentUser,
  sendEmail,
  forgotPassword,
  resetPassword,
} from '../controllers/auth';

router.post('/register', register);
router.post('/login', login);
router.get('/logout', logout);
router.get('/current-user', requireSignin, currentUser);
// router.get('/send-email', sendEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
