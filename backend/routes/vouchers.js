const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const {
  getVouchers,
  getVoucher,
  createVoucher,
  updateVoucher,
  deleteVoucher,
  validateVoucher,
  applyVoucher,
} = require("../controllers/vouchers");

// Import middleware
const { protect, authorize } = require("../middleware/auth");
const { voucherLimiter } = require("../middleware/rateLimiter");

// Public routes with rate limiting
router.post(
  "/validate",
  voucherLimiter, // Apply voucher-specific rate limiter
  [
    check("code", "Voucher code is required").not().isEmpty(),
    check("orderValue", "Order value must be a number").isNumeric(),
  ],
  validateVoucher
);

// Protected routes
router.post(
  "/apply",
  protect,
  [
    check("voucherId", "Voucher ID is required").not().isEmpty(),
    check("orderValue", "Order value must be a number").isNumeric(),
  ],
  applyVoucher
);

// Admin only routes
router
  .route("/")
  .get(protect, authorize("admin"), getVouchers)
  .post(
    protect,
    authorize("admin"),
    [
      check("code", "Voucher code is required").not().isEmpty(),
      check("type", "Type must be either percentage or fixed").isIn([
        "percentage",
        "fixed",
      ]),
      check("value", "Value is required and must be a number").isNumeric(),
    ],
    createVoucher
  );

router
  .route("/:id")
  .get(protect, authorize("admin"), getVoucher)
  .put(protect, authorize("admin"), updateVoucher)
  .delete(protect, authorize("admin"), deleteVoucher);

module.exports = router;
