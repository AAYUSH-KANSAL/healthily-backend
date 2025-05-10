const mongoose = require("mongoose");

const appointmentShema = new mongoose.Schema({
  patientName: {
    type: String,
    required: true,
  },
  doctorId: {
    type: String,
    required: true,
  },
  doctorName: {
    type: String,
    required: true,
  },
  specialization: {
    type: String,
    required: true,
  },
  patientEmail: {
    type: String,
    required: true,
  },
  doctorEmail: {
    type: String,
    required: true,
  },
  appointmentDate: {
    type: String,
    required: true,
  },
  appointmentTime: {
    type: String,
    required: true,
  },
});
module.exports = mongoose.model("Appointment", appointmentShema);
