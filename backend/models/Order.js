import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },       // snapshot — survives the product being edited/deleted later
    image: { type: String, default: "" },
    price: { type: Number, required: true },       // price AT THE TIME of purchase, never re-read from Product afterward
    quantity: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true },
  },
  { _id: false }
);

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    line: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    province: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderGroupId: { type: String, required: true, index: true }, // ties sibling seller-orders from one checkout together
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    items: { type: [orderItemSchema], required: true, validate: (v) => v.length > 0 },
    shippingAddress: { type: shippingAddressSchema, required: true },
    subtotal: { type: Number, required: true },
    status: { type: String, enum: ["pending", "processing", "shipped", "delivered", "cancelled"], default: "pending" },
    paymentStatus: { type: String, enum: ["unpaid", "paid", "refunded"], default: "unpaid" }, // Phase 3's webhook flips this
  },
  { timestamps: true }
);

export const Order = mongoose.model("Order", orderSchema);