const Order = require("../models/Order");
const Product = require("../models/Product");
const { validationResult } = require("express-validator");

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private
exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (err) {
    console.error("Error fetching order:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Public
exports.createOrder = async (req, res) => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: errors.array(),
    });
  }

  try {
    const { items, tableNumber, notes, customer } = req.body;

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order must include at least one item",
      });
    }

    // Calculate total amount and fetch product details
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      if (!item.productId || !item.quantity) {
        return res.status(400).json({
          success: false,
          message: "Each item must have a productId and quantity",
        });
      }

      // Find product in database
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product with ID ${item.productId} not found`,
        });
      }

      // Calculate item total
      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      // Add to order items
      orderItems.push({
        product: product._id,
        productDetails: {
          name: product.name,
          price: product.price,
          image: product.image,
        },
        quantity: item.quantity,
        notes: item.notes || "",
      });
    }

    // Create new order
    const order = new Order({
      items: orderItems,
      totalAmount,
      tableNumber,
      notes,
      customer,
    });

    await order.save();

    // Notify all connected clients about the new order
    if (global.notifyClients) {
      global.notifyClients("new_order", {
        orderId: order._id,
        orderNumber: order.orderNumber,
        items: order.items.length,
        timestamp: order.createdAt,
      });
    }

    res.status(201).json({
      success: true,
      data: order,
    });
  } catch (err) {
    console.error("Error creating order:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id
// @access  Private
exports.updateOrder = async (req, res) => {
  try {
    const { status, paymentStatus, notes } = req.body;

    // Find order
    let order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Update fields
    if (status) order.status = status;
    if (paymentStatus) order.paymentStatus = paymentStatus;
    if (notes) order.notes = notes;

    order.updatedAt = Date.now();

    await order.save();

    // Notify all connected clients about the order update
    if (global.notifyClients) {
      global.notifyClients("order_updated", {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        updatedAt: order.updatedAt,
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (err) {
    console.error("Error updating order:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

// @desc    Delete order
// @route   DELETE /api/orders/:id
// @access  Private
exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Use deleteOne instead of deprecated remove method
    await Order.deleteOne({ _id: order._id });

    // Notify all connected clients about the order deletion
    if (global.notifyClients) {
      global.notifyClients("order_deleted", {
        orderId: order._id,
        orderNumber: order.orderNumber,
      });
    }

    res.status(200).json({
      success: true,
      data: {},
      message: "Order deleted",
    });
  } catch (err) {
    console.error("Error deleting order:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};
