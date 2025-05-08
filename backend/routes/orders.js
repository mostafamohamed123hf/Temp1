const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const {
  getOrders,
  getOrder,
  createOrder,
  updateOrder,
  deleteOrder,
} = require("../controllers/orders");

// Middleware imports
const { protect, authorize } = require("../middleware/auth");

// @route   GET /api/orders
// @desc    Get all orders
// @access  Private (staff, admin)
router.get("/", protect, getOrders);

// @route   GET /api/orders/:id
// @desc    Get single order
// @access  Private
router.get("/:id", protect, getOrder);

// @route   POST /api/orders
// @desc    Create a new order
// @access  Public (any customer can place an order)
router.post(
  "/",
  [
    check("items", "Items are required").isArray({ min: 1 }),
    check("items.*.productId", "Product ID is required for each item")
      .not()
      .isEmpty(),
    check("items.*.quantity", "Quantity must be a positive number").isInt({
      min: 1,
    }),
  ],
  createOrder
);

// @route   PUT /api/orders/:id
// @desc    Update order status
// @access  Private (staff, admin)
router.put("/:id", protect, updateOrder);

// @route   DELETE /api/orders/:id
// @desc    Delete an order
// @access  Private (admin only)
router.delete("/:id", protect, authorize("admin"), deleteOrder);

module.exports = router;
