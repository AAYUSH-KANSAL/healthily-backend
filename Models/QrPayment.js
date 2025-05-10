const mongoose = require("mongoose");

const QrPaymentSchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now,
  },
  mgoodId: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  transactionId: {
    type: String,
    required: true, 
  },
});

module.exports = mongoose.model("Qrpayment", QrPaymentSchema);
