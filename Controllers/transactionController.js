const express = require("express");
const mongoose = require("mongoose");

const qrPaymentModel = require("../Models/QrPayment.js");
const dotenv = require("dotenv");
dotenv.config();

const reachPaymentTest = async (req, res) => {
  try {
    res.json({
      message: "Payement route is reached",
    });
  } catch (error) {
    res.status(500).json({ message: "unable to get to payments route" });
    console.log(error);
  }
};

const saveQrPaymentDetials = async (req, res) => {
  console.log(req.body);
  const { phoneNumber, transactionId } = req.body;

  // Check if all required fields are present
  if (!phoneNumber || !transactionId) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const qrPayment = new qrPaymentModel({
    phoneNumber: phoneNumber,
    transactionId: transactionId,
  });

  try {
    // Save the payment details to the database
    const result = await qrPayment.save();
    return res
      .status(200)
      .json({ message: "Payment details saved successfully" });
  } catch (err) {
    // Handle any errors that occur during the save
    console.error("Error during saving payment details:", err);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

module.exports = {
  reachPaymentTest,
  saveQrPaymentDetials,
};