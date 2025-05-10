const express = require("express");
const mongoose = require("mongoose");
const appointmentModel = require("../Models/Appointments.js");

const getDoctorAppointmentsById = async (req, res) => {
  const { id } = req.params;
  try {
    const appointments = await appointmentModel.find({ doctorId: id });
    res.status(200).json(appointments);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};
const getDoctorAppointmentsByDoctorEmail = async (req, res) => {
  const { email } = req.params;
  try {
    const appointments = await appointmentModel.find({ doctorEmail: email });
    res.status(200).json(appointments);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};
const getAllAppointments = async (req, res) => {
  try {
    const appointments = await appointmentModel.find();
    res.status(200).json(appointments);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

module.exports = {
  getDoctorAppointmentsById,
  getAllAppointments,
  getDoctorAppointmentsByDoctorEmail,
};