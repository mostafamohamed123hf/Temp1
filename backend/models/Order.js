const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const OrderSchema = new Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    tableNumber: {
      type: String,
      required: false,
    },
    items: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        productDetails: {
          name: String,
          price: Number,
          image: String,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        notes: String,
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "preparing", "ready", "delivered", "canceled"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "mobile_payment"],
      default: "cash",
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid"],
      default: "unpaid",
    },
    customer: {
      name: String,
      phone: String,
    },
    notes: String,
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Pre-save hook to generate order number if not provided
OrderSchema.pre("save", async function (next) {
  if (!this.orderNumber) {
    const date = new Date();
    const prefix =
      date.getFullYear().toString().substr(-2) +
      (date.getMonth() + 1).toString().padStart(2, "0") +
      date.getDate().toString().padStart(2, "0");

    const lastOrder = await this.constructor.findOne(
      {},
      {},
      { sort: { createdAt: -1 } }
    );
    let counter = 1;

    if (lastOrder && lastOrder.orderNumber) {
      const lastNumber = parseInt(lastOrder.orderNumber.split("-")[1], 10);
      if (!isNaN(lastNumber)) {
        counter = lastNumber + 1;
      }
    }

    this.orderNumber = `${prefix}-${counter.toString().padStart(4, "0")}`;
  }
  next();
});

module.exports = mongoose.model("Order", OrderSchema);
