const express = require("express");
const prescriptionModel = require("../Models/Prescriptions.js");

const getAllPrescriptions = async (req, res) => {
    try {
        const prescriptions = await prescriptionModel.find();
        res.status(200).json(prescriptions);
    }
    catch (err) {
        res.status(404).json({ message: err.message });
    }
};

const savePrescription = async (req, res) => {
    const prescription = req.body;
    const newPrescription = new prescriptionModel(prescription);
    try {
        await newPrescription.save();
        res.status(201).json(newPrescription);
    }
    catch (err) {
        res.status(409).json({ message: err.message });
    }
};

module.exports = {
  getAllPrescriptions,
  savePrescription,
};
