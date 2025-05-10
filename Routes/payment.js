const express = require("express");
const router = express.Router();

const {

  reachPaymentTest,
  saveQrPaymentDetials
} = require("../Controllers/transactionController.js");


router.post("/qr", saveQrPaymentDetials);
router.get("/", reachPaymentTest);



module.exports = router;
