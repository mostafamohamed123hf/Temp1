const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const { 
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/users');

const { protect, authorize, checkPermission } = require('../middleware/auth');

// All user routes are protected and require authentication
router.use(protect);

// Routes with users permission checkWs
router.route('/')
  .get(checkPermission('users'), getUsers)
  .post(
    [
      checkPermission('users'),
      check('displayName', 'Display name is required').not().isEmpty(),
      check('username', 'Username is required').not().isEmpty(),
      check('email', 'Please include a valid email').isEmail(),
      check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
    ],
    createUser
  );

router.route('/:id')
  .get(checkPermission('users'), getUser)
  .put(checkPermission('users'), updateUser)
  .delete(authorize('admin'), deleteUser); // Only admin can delete users

module.exports = router; 