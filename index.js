const express = require("express");
require("dotenv").config();
const mongoose = require("mongoose");
const doctorRoutes = require("./Routes/doctors.js"); // Ensure these paths are correct
const paymentRoutes = require("./Routes/payment.js");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const { Server } = require("socket.io");
const prescriptionRoutes = require("./Routes/prescription.js");
const adminRoutes = require("./Routes/admin.js");


app.use(cors({
  origin: [ 
    "http://localhost:3000", 
    "http://localhost:3001",
    "https://healthily-backend.vercel.app",
    "https://healthily-backend-git-main-dhruvgangals-projects.vercel.app"  
  ],
  methods: ["GET", "POST"],
  credentials: true
}));
app.options("*", cors());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

const activeAppointments = new Map(); 


app.use("/api", doctorRoutes);
app.use("/admin", adminRoutes);
app.use("/payment", paymentRoutes);
app.use("/prescription", prescriptionRoutes);


const apiCredentials = {
  apiId: process.env.NEXT_PUBLIC_WEBHOOK_API_ID,
  apiSecret: process.env.NEXT_PUBLIC_WEBHOOK_API_SECRET,
};

app.post("/webhook/tc-update", (req, res) => {
  const receivedApiId = req.headers["mgood-api-id"];
  const receivedApiSecret = req.headers["mgood-api-secret"];

  if (!receivedApiId || !receivedApiSecret) {
    return res.status(401).send({ message: "Missing API ID or Secret" });
  }
  if (receivedApiId !== apiCredentials.apiId || receivedApiSecret !== apiCredentials.apiSecret) {
    return res.status(403).send({ message: "Invalid API credentials" });
  }

  const { triggered_action, name, custom_order_id } = req.body;
  console.log("Webhook Received:", req.body);
  io.emit("update", { triggered_action, name, custom_order_id });
  res.status(200).send({ message: "Webhook processed successfully" });
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB Connection Error:", err.message, err.stack));

const server = app.listen(process.env.PORT || 8000, () => {
  console.log(`Server is running on port ${process.env.PORT || 8000}`);
});

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000", 
      "http://localhost:3001",
    "https://healthily-backend.vercel.app",
    "https://healthily-backend-git-main-dhruvgangals-projects.vercel.app"
      
    ],
    methods: ["GET", "POST"],
    credentials: true
  },
});


setInterval(() => {
  const now = Date.now();
  activeAppointments.forEach((appointment, id) => {
    if (appointment.status === "pending" && (now - appointment.createdAt > 300000)) { // 5 minutes
      activeAppointments.delete(id);
      io.emit("appointment-expired", { appointmentId: id, message: "Appointment expired due to no action." });
      console.log(`Server: Appointment ${id} expired and removed from active list.`);
    }
  });
}, 60000);

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

 
  socket.on("request-initial-pending-appointments", () => {
    const pendingAppointmentsList = [];
    activeAppointments.forEach(app => {
      if (app.status === "pending") {
        pendingAppointmentsList.push(app); 
      }
    });
    if (pendingAppointmentsList.length > 0) {
      socket.emit("initial-pending-appointments", pendingAppointmentsList);
      console.log(`Server: Sent ${pendingAppointmentsList.length} initial pending appointments to ${socket.id}`);
    } else {
      socket.emit("initial-pending-appointments", []); 
      console.log(`Server: No initial pending appointments to send to ${socket.id}`);
    }
  });

  socket.on("appointment-booked", (appointmentBooking) => {
    const patientData = appointmentBooking.data;
    console.log("Server: 'appointment-booked' received with data:", patientData);

    const appointmentId = patientData.phone;

    if (!appointmentId) {
        console.error("Server: Cannot book appointment, patient phone number is missing from data:", patientData);
        socket.emit("booking-error", { message: "Patient phone number is required." });
        return;
    }

    const existingAppointment = activeAppointments.get(appointmentId);

    
    const newOrUpdatedPendingAppointment = {
        ...patientData,
        id: appointmentId, 
        status: "pending",
        
        createdAt: (existingAppointment && existingAppointment.status === 'pending')
                     ? existingAppointment.createdAt
                     : Date.now(),
        updatedAt: Date.now(), 
    };
    
    delete newOrUpdatedPendingAppointment.acceptedBy;

    activeAppointments.set(appointmentId, newOrUpdatedPendingAppointment);
    console.log("Server: Stored/Updated appointment to PENDING:", newOrUpdatedPendingAppointment);


    io.emit("notify-admin", { data: newOrUpdatedPendingAppointment });
    console.log("Server: Emitted 'notify-admin' for PENDING state with data:", { data: newOrUpdatedPendingAppointment });
  });

  socket.on("update-appointment-status", async ({ appointmentId, status, userId }) => {
    console.log(`Server: 'update-appointment-status' for ${appointmentId} to ${status} by ${userId}`);
    const appointment = activeAppointments.get(appointmentId);

    if (!appointment) {
      console.log(`Server: Appointment ${appointmentId} not found.`);
      socket.emit("appointment-error", { message: "Appointment not found", appointmentId });
      return;
    }

   
    if (appointment.status !== "pending" && (status === "accepted" || status === "declined")) {
      console.log(`Server: Appointment ${appointmentId} is no longer pending (current: ${appointment.status}). Update to '${status}' rejected.`);
      socket.emit("appointment-error", {
        message: `Appointment is already ${appointment.status}.`,
        appointmentId,
        currentStatus: appointment.status,
        acceptedBy: appointment.acceptedBy 
      });
      return;
    }

    appointment.status = status;
    if (status === "accepted" || status === "declined") {
        appointment.acceptedBy = userId; 
    }
    appointment.updatedAt = Date.now();
    activeAppointments.set(appointmentId, appointment);

    console.log(`Server: Appointment ${appointmentId} status updated to ${status}. AcceptedBy: ${userId}.`);
    io.emit("appointment-status-updated", {
      appointmentId,
      status,
      userId, 
      appointmentData: appointment 
    });
    console.log("Server: Emitted 'appointment-status-updated' for", appointmentId);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

