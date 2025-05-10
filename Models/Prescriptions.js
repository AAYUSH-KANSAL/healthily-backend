const mongoose = require("mongoose");

const PrescriptionSchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now,
  },
  name : {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true, 
  },
});

module.exports = mongoose.model("Prescription", PrescriptionSchema);
