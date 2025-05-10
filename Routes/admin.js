const express = require("express");
const router = express.Router();
const {
  getDoctorAppointmentsById,
  getAllAppointments,
  getDoctorAppointmentsByDoctorEmail,
} = require("../Controllers/appointmentController.js");

router.get("/:id", getDoctorAppointmentsById);
router.get("/", getAllAppointments);
router.get("/doctor/:email", getDoctorAppointmentsByDoctorEmail);

module.exports = router;