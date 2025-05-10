const express = require("express");
const router = express.Router();

const {
  getAllPrescriptions,
    savePrescription,
} = require("../Controllers/prescriptionController.js");

router.get("/get", getAllPrescriptions);
router.post("/", savePrescription);

module.exports = router;
