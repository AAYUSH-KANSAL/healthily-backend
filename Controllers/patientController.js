const express = require("express");
const mongoose = require("mongoose");
const patientModel = require("../Models/Patient.js");

const getAllPatients = async (req, res) => {
  try {
    const patients = await patientModel.find();
    res.status(200).json(patients);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

module.exports = {
  getAllPatients,
};
