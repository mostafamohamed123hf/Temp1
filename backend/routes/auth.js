const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const { 
  register, 
  login, 
  getMe, 
  logout, 
  updatePassword 
} = require('../controllers/auth');
const { protect } = require('../middleware/auth');

// Register user
router.post(
  '/register',
  [
    check('displayName', 'Display name is required').not().isEmpty(),
    check('username', 'Username is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
  ],
  register
);

// Login user
router.post('/login', login);

// Get current logged in user
router.get('/me', protect, getMe);

// Logout user
router.get('/logout', protect, logout);

// Update password
router.put('/updatepassword', protect, updatePassword);

module.exports = router; 