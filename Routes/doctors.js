const express = require("express");
const router = express.Router();
const {
  getAllDoctors,
  getDoctorsByLocation,
  getDoctorsBySpecialization,
  addDoctor,
  updateDoctor,
  getDoctorById,
  saveAppointment,
  savePatientDetails,
  getDoctorByValue,
  getMgoodIdByEmail,
  
} = require("../Controllers/doctorController.js");

router.get("/", getAllDoctors);
router.get("/:id", getDoctorById);
router.get("/location/:place", getDoctorsByLocation);
router.get("/specialization/:specialization", getDoctorsBySpecialization);
router.post("/", addDoctor);
router.post("/appointment", saveAppointment);
router.post("/patient", savePatientDetails);
router.patch("/:id", updateDoctor);
router.post("/checkRole", getDoctorByValue);
router.post("/getMgoodId", getMgoodIdByEmail);


module.exports = router;
