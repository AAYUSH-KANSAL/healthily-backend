const mongoose = require("mongoose");

const QrPaymentSchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now,
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
