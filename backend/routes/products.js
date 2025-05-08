const express = require("express");
const router = express.Router();
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  createDefaultProducts,
} = require("../controllers/productController");

// GET all products and POST new product
router.route("/").get(getProducts).post(createProduct);

// GET, PUT, DELETE single product
router.route("/:id").get(getProduct).put(updateProduct).delete(deleteProduct);

// Create default products
router.route("/default/create").post(createDefaultProducts);

// Debug route to test WebSocket notifications
router.route("/debug/notify").post((req, res) => {
  try {
    // Check if the notification system is available
    if (!global.notifyClients) {
      return res.status(500).json({
        success: false,
        message: "WebSocket notification system not available",
      });
    }

    // Get notification type and data from request body
    const { type, data } = req.body;

    if (!type) {
      return res.status(400).json({
        success: false,
        message: "Notification type is required",
      });
    }

    // Send notification to all connected clients
    global.notifyClients(type, data || {});

    return res.status(200).json({
      success: true,
      message: "Notification sent successfully",
    });
  } catch (err) {
    console.error("Error sending test notification:", err);
    return res.status(500).json({
      success: false,
      message: "Error sending notification",
      error: err.message,
    });
  }
});

module.exports = router;
