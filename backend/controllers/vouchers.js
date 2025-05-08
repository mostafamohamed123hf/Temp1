const Voucher = require("../models/Voucher");
const { validationResult } = require("express-validator");
const ErrorResponse = require("../utils/errorResponse");

// @desc    Get all vouchers
// @route   GET /api/vouchers
// @access  Private (admin)
exports.getVouchers = async (req, res, next) => {
  try {
    const vouchers = await Voucher.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: vouchers.length,
      data: vouchers,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single voucher
// @route   GET /api/vouchers/:id
// @access  Private (admin)
exports.getVoucher = async (req, res, next) => {
  try {
    const voucher = await Voucher.findById(req.params.id);

    if (!voucher) {
      return next(
        new ErrorResponse(`Voucher not found with id of ${req.params.id}`, 404)
      );
    }

    res.status(200).json({
      success: true,
      data: voucher,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new voucher
// @route   POST /api/vouchers
// @access  Private (admin)
exports.createVoucher = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  try {
    // Add user to req.body if available
    if (req.user && req.user.id) {
      req.body.createdBy = req.user.id;
    }

    const voucher = await Voucher.create(req.body);

    // Notify all clients about new voucher
    if (global.notifyClients) {
      global.notifyClients("voucher_created", {
        voucherId: voucher._id,
        code: voucher.code,
        type: voucher.type,
        value: voucher.value,
      });
    }

    res.status(201).json({
      success: true,
      data: voucher,
    });
  } catch (err) {
    // Handle duplicate code error
    if (err.code === 11000) {
      return next(new ErrorResponse("Voucher code already exists", 400));
    }
    next(err);
  }
};

// @desc    Update voucher
// @route   PUT /api/vouchers/:id
// @access  Private (admin)
exports.updateVoucher = async (req, res, next) => {
  try {
    let voucher = await Voucher.findById(req.params.id);

    if (!voucher) {
      return next(
        new ErrorResponse(`Voucher not found with id of ${req.params.id}`, 404)
      );
    }

    // Prevent updating the code if voucher has been used
    if (req.body.code && voucher.usedCount > 0) {
      return next(
        new ErrorResponse(
          "Cannot change code for a voucher that has been used",
          400
        )
      );
    }

    voucher = await Voucher.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    // Notify all clients about updated voucher
    if (global.notifyClients) {
      global.notifyClients("voucher_updated", {
        voucherId: voucher._id,
        code: voucher.code,
        isActive: voucher.isActive,
      });
    }

    res.status(200).json({
      success: true,
      data: voucher,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete voucher
// @route   DELETE /api/vouchers/:id
// @access  Private (admin)
exports.deleteVoucher = async (req, res, next) => {
  try {
    const voucher = await Voucher.findById(req.params.id);

    if (!voucher) {
      return next(
        new ErrorResponse(`Voucher not found with id of ${req.params.id}`, 404)
      );
    }

    // Prevent deleting a voucher that has been used
    if (voucher.usedCount > 0) {
      return next(
        new ErrorResponse(
          "Cannot delete a voucher that has been used. Deactivate it instead.",
          400
        )
      );
    }

    await Voucher.deleteOne({ _id: voucher._id });

    // Notify all clients about deleted voucher
    if (global.notifyClients) {
      global.notifyClients("voucher_deleted", {
        voucherId: voucher._id,
        code: voucher.code,
      });
    }

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Validate voucher code
// @route   POST /api/vouchers/validate
// @access  Public
exports.validateVoucher = async (req, res, next) => {
  try {
    const { code, orderValue } = req.body;

    if (!code) {
      return next(new ErrorResponse("Please provide a voucher code", 400));
    }

    const voucher = await Voucher.findOne({
      code: code.toUpperCase(),
      isActive: true,
    });

    if (!voucher) {
      return next(new ErrorResponse("Invalid voucher code", 404));
    }

    // Check if voucher is valid for this order
    if (!voucher.isValid(orderValue || 0)) {
      let reason = "";
      const now = new Date();

      if (now > voucher.endDate) {
        reason = "expired";
      } else if (now < voucher.startDate) {
        reason = "not started";
      } else if (
        voucher.maxUses !== null &&
        voucher.usedCount >= voucher.maxUses
      ) {
        reason = "maximum usage exceeded";
      } else if (orderValue < voucher.minOrderValue) {
        reason = `minimum order value not met (${voucher.minOrderValue})`;
      }

      return res.status(200).json({
        success: false,
        message: `Voucher cannot be applied: ${reason}`,
        data: {
          isValid: false,
          reason,
          minOrderValue: voucher.minOrderValue,
        },
      });
    }

    // Calculate discount
    const discountAmount = voucher.calculateDiscount(orderValue || 0);

    res.status(200).json({
      success: true,
      data: {
        isValid: true,
        voucherId: voucher._id,
        code: voucher.code,
        type: voucher.type,
        value: voucher.value,
        discountAmount,
        originalValue: orderValue || 0,
        finalValue: (orderValue || 0) - discountAmount,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Apply voucher to order (increment usage count)
// @route   POST /api/vouchers/apply
// @access  Private
exports.applyVoucher = async (req, res, next) => {
  try {
    const { voucherId, orderValue } = req.body;

    if (!voucherId) {
      return next(new ErrorResponse("Please provide a voucher ID", 400));
    }

    const voucher = await Voucher.findById(voucherId);

    if (!voucher) {
      return next(new ErrorResponse("Voucher not found", 404));
    }

    // Check if voucher is valid for this order
    if (!voucher.isValid(orderValue || 0)) {
      return res.status(400).json({
        success: false,
        message: "Voucher is not valid for this order",
        data: { isValid: false },
      });
    }

    // Increment usage count
    voucher.usedCount += 1;
    await voucher.save();

    // Calculate discount
    const discountAmount = voucher.calculateDiscount(orderValue || 0);

    res.status(200).json({
      success: true,
      message: "Voucher applied successfully",
      data: {
        voucherId: voucher._id,
        code: voucher.code,
        type: voucher.type,
        value: voucher.value,
        discountAmount,
        originalValue: orderValue || 0,
        finalValue: (orderValue || 0) - discountAmount,
        usedCount: voucher.usedCount,
      },
    });
  } catch (err) {
    next(err);
  }
};
