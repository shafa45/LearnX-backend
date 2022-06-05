const express = require('express');

const router = express.Router();

import { register } from '../controllers/auth';

router.get('/register', register);

module.exports = router;
