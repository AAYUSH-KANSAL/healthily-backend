// const express = require("express");
// require("dotenv").config();
// const mongoose = require("mongoose");
// const doctorRoutes = require("./Routes/doctors.js"); // Ensure these paths are correct
// const paymentRoutes = require("./Routes/payment.js");
// const app = express();
// const cors = require("cors");
// const bodyParser = require("body-parser");
// const { Server } = require("socket.io");
// const prescriptionRoutes = require("./Routes/prescription.js");
// const adminRoutes = require("./Routes/admin.js");


// app.use(cors({
//   origin: [ 
//     "http://localhost:3000", 
//     "http://localhost:3001"  
//   ],
//   methods: ["GET", "POST"],
//   credentials: true
// }));
// app.options("*", cors());

// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(express.json());

// const activeAppointments = new Map(); 


// app.use("/api", doctorRoutes);
// app.use("/admin", adminRoutes);
// app.use("/payment", paymentRoutes);
// app.use("/prescription", prescriptionRoutes);


// const apiCredentials = {
//   apiId: process.env.NEXT_PUBLIC_WEBHOOK_API_ID,
//   apiSecret: process.env.NEXT_PUBLIC_WEBHOOK_API_SECRET,
// };

// app.post("/webhook/tc-update", (req, res) => {
//   const receivedApiId = req.headers["mgood-api-id"];
//   const receivedApiSecret = req.headers["mgood-api-secret"];

//   if (!receivedApiId || !receivedApiSecret) {
//     return res.status(401).send({ message: "Missing API ID or Secret" });
//   }
//   if (receivedApiId !== apiCredentials.apiId || receivedApiSecret !== apiCredentials.apiSecret) {
//     return res.status(403).send({ message: "Invalid API credentials" });
//   }

//   const { triggered_action, name, custom_order_id } = req.body;
//   console.log("Webhook Received:", req.body);
//   io.emit("update", { triggered_action, name, custom_order_id });
//   res.status(200).send({ message: "Webhook processed successfully" });
// });

// mongoose.connect(process.env.MONGO_URI)
//   .then(() => console.log("Connected to MongoDB"))
//   .catch((err) => console.error("MongoDB Connection Error:", err.message, err.stack));

// const server = app.listen(process.env.PORT || 8000, () => {
//   console.log(`Server is running on port ${process.env.PORT || 8000}`);
// });

// const io = new Server(server, {
//   cors: {
//     origin: [
//       "http://localhost:3000", "http://localhost:3001",
//       "https://healthily-backend-git-main-dhruvgangals-projects.vercel.app"
//     ],
//     methods: ["GET", "POST"],
//     credentials: true
//   },
// });


// setInterval(() => {
//   const now = Date.now();
//   activeAppointments.forEach((appointment, id) => {
//     if (appointment.status === "pending" && (now - appointment.createdAt > 300000)) { // 5 minutes
//       activeAppointments.delete(id);
//       io.emit("appointment-expired", { appointmentId: id, message: "Appointment expired due to no action." });
//       console.log(`Server: Appointment ${id} expired and removed from active list.`);
//     }
//   });
// }, 60000);

// io.on("connection", (socket) => {
//   console.log("A user connected:", socket.id);

 
//   socket.on("request-initial-pending-appointments", () => {
//     const pendingAppointmentsList = [];
//     activeAppointments.forEach(app => {
//       if (app.status === "pending") {
//         pendingAppointmentsList.push(app); 
//       }
//     });
//     if (pendingAppointmentsList.length > 0) {
//       socket.emit("initial-pending-appointments", pendingAppointmentsList);
//       console.log(`Server: Sent ${pendingAppointmentsList.length} initial pending appointments to ${socket.id}`);
//     } else {
//       socket.emit("initial-pending-appointments", []); 
//       console.log(`Server: No initial pending appointments to send to ${socket.id}`);
//     }
//   });

//   socket.on("appointment-booked", (appointmentBooking) => {
//     const patientData = appointmentBooking.data;
//     console.log("Server: 'appointment-booked' received with data:", patientData);

//     const appointmentId = patientData.phone;

//     if (!appointmentId) {
//         console.error("Server: Cannot book appointment, patient phone number is missing from data:", patientData);
//         socket.emit("booking-error", { message: "Patient phone number is required." });
//         return;
//     }

//     const existingAppointment = activeAppointments.get(appointmentId);

    
//     const newOrUpdatedPendingAppointment = {
//         ...patientData,
//         id: appointmentId, 
//         status: "pending",
        
//         createdAt: (existingAppointment && existingAppointment.status === 'pending')
//                      ? existingAppointment.createdAt
//                      : Date.now(),
//         updatedAt: Date.now(), 
//     };
    
//     delete newOrUpdatedPendingAppointment.acceptedBy;

//     activeAppointments.set(appointmentId, newOrUpdatedPendingAppointment);
//     console.log("Server: Stored/Updated appointment to PENDING:", newOrUpdatedPendingAppointment);


//     io.emit("notify-admin", { data: newOrUpdatedPendingAppointment });
//     console.log("Server: Emitted 'notify-admin' for PENDING state with data:", { data: newOrUpdatedPendingAppointment });
//   });

//   socket.on("update-appointment-status", async ({ appointmentId, status, userId }) => {
//     console.log(`Server: 'update-appointment-status' for ${appointmentId} to ${status} by ${userId}`);
//     const appointment = activeAppointments.get(appointmentId);

//     if (!appointment) {
//       console.log(`Server: Appointment ${appointmentId} not found.`);
//       socket.emit("appointment-error", { message: "Appointment not found", appointmentId });
//       return;
//     }

   
//     if (appointment.status !== "pending" && (status === "accepted" || status === "declined")) {
//       console.log(`Server: Appointment ${appointmentId} is no longer pending (current: ${appointment.status}). Update to '${status}' rejected.`);
//       socket.emit("appointment-error", {
//         message: `Appointment is already ${appointment.status}.`,
//         appointmentId,
//         currentStatus: appointment.status,
//         acceptedBy: appointment.acceptedBy 
//       });
//       return;
//     }

//     appointment.status = status;
//     if (status === "accepted" || status === "declined") {
//         appointment.acceptedBy = userId; 
//     }
//     appointment.updatedAt = Date.now();
//     activeAppointments.set(appointmentId, appointment);

//     console.log(`Server: Appointment ${appointmentId} status updated to ${status}. AcceptedBy: ${userId}.`);
//     io.emit("appointment-status-updated", {
//       appointmentId,
//       status,
//       userId, 
//       appointmentData: appointment 
//     });
//     console.log("Server: Emitted 'appointment-status-updated' for", appointmentId);
//   });

//   socket.on("disconnect", () => {
//     console.log("User disconnected:", socket.id);
//   });
// });




console.log("--- Application starting ---"); // For Vercel log debugging

const express = require("express");
require("dotenv").config();
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const cors = require("cors");
const bodyParser = require("body-parser");

const doctorRoutes = require("./Routes/doctors.js");
const paymentRoutes = require("./Routes/payment.js");
const prescriptionRoutes = require("./Routes/prescription.js");
const adminRoutes = require("./Routes/admin.js");

const app = express();

// --- Environment-dependent URLs (Best Practice) ---
// Set these in your Vercel Environment Variables
const VERCEL_DEPLOYED_BACKEND_URL = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://healthily-backend-git-main-dhruvgangals-projects.vercel.app"; // Your Vercel backend URL
const FRONTEND_URL_LOCALHOST_3000 = "http://localhost:3000";
const FRONTEND_URL_LOCALHOST_3001 = "http://localhost:3001";
const VERCEL_DEPLOYED_FRONTEND_URL = process.env.FRONTEND_URL; // e.g., https://your-frontend.vercel.app

const allowedOrigins = [
  FRONTEND_URL_LOCALHOST_3000,
  FRONTEND_URL_LOCALHOST_3001,
  VERCEL_DEPLOYED_FRONTEND_URL, // Your deployed frontend on Vercel
  VERCEL_DEPLOYED_BACKEND_URL   // Sometimes useful if backend calls itself or for certain setups
].filter(Boolean); // Removes any undefined/empty strings if env vars are not set

console.log("Allowed CORS Origins:", allowedOrigins);

app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST"],
  credentials: true
}));
app.options("*", cors({ // Handle preflight requests for all routes
  origin: allowedOrigins,
  methods: ["GET", "POST"],
  credentials: true
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// --- MongoDB Connection and Schema ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Successfully connected to MongoDB"))
  .catch((err) => console.error("MongoDB Connection Error:", err.message, err.stack));

const appointmentSchema = new mongoose.Schema({
    name: String,
    phone: { type: String, required: true, index: true },
    age: String,
    gender: String,
    problem: String,
    // Appointment specific fields
    id: { type: String, unique: true, required: true }, // Usually same as phone or a generated UUID
    status: { type: String, enum: ['pending', 'accepted', 'declined', 'expired', 'completed'], default: 'pending' },
    createdAt: { type: Date, default: Date.now, index: true },
    updatedAt: { type: Date, default: Date.now },
    acceptedBy: { type: String, default: null },
    // Add any other fields you expect from patientData
});

appointmentSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Appointment = mongoose.model('Appointment', appointmentSchema);

// --- API Routes ---
app.use("/api", doctorRoutes);
app.use("/admin", adminRoutes);
app.use("/payment", paymentRoutes);
app.use("/prescription", prescriptionRoutes);

// Basic root route for testing
app.get("/", (req, res) => {
  console.log("Root path / was hit!");
  res.send("Hello from Healthily Backend! Express app is running.");
});


const apiCredentials = {
  apiId: process.env.NEXT_PUBLIC_WEBHOOK_API_ID,
  apiSecret: process.env.NEXT_PUBLIC_WEBHOOK_API_SECRET,
};

// --- HTTP Server and Socket.IO Setup ---
const server = app.listen(process.env.PORT || 8000, () => {
  console.log(`Server is running on port ${process.env.PORT || 8000}`);
});

const io = new Server(server, {
  path: "/socket.io/", // Explicitly define the path for Socket.IO
  cors: {
    origin: allowedOrigins.filter(url => url !== VERCEL_DEPLOYED_BACKEND_URL), // Sockets usually connect from frontend
    methods: ["GET", "POST"],
    credentials: true
  },
  // Vercel might prefer polling, especially if WebSockets have issues through its proxy
  // transports: ['polling', 'websocket'], // Default is ['polling', 'websocket'] - usually fine
});
console.log("Socket.IO server initialized.");

// --- Webhook (Needs Socket.IO to be initialized) ---
app.post("/webhook/tc-update", (req, res) => {
  const receivedApiId = req.headers["mgood-api-id"];
  const receivedApiSecret = req.headers["mgood-api-secret"];

  if (!receivedApiId || !receivedApiSecret) {
    console.log("Webhook: Missing API ID or Secret");
    return res.status(401).send({ message: "Missing API ID or Secret" });
  }
  if (receivedApiId !== apiCredentials.apiId || receivedApiSecret !== apiCredentials.apiSecret) {
    console.log("Webhook: Invalid API credentials");
    return res.status(403).send({ message: "Invalid API credentials" });
  }

  const { triggered_action, name, custom_order_id } = req.body;
  console.log("Webhook Received:", req.body);
  if (io) { // Ensure io is initialized
    io.emit("update", { triggered_action, name, custom_order_id });
    console.log("Webhook: Emitted 'update' via Socket.IO");
  } else {
    console.error("Webhook: Socket.IO server (io) is not initialized!");
  }
  res.status(200).send({ message: "Webhook processed successfully" });
});


// --- Socket.IO Event Handlers ---
io.on("connection", (socket) => {
  console.log("Socket.IO: A user connected:", socket.id);

  socket.on("request-initial-pending-appointments", async () => {
    console.log(`Socket.IO: '${socket.id}' requested initial pending appointments.`);
    try {
      const pendingAppointmentsList = await Appointment.find({ status: "pending" }).sort({ createdAt: 1 });
      socket.emit("initial-pending-appointments", pendingAppointmentsList);
      console.log(`Socket.IO: Sent ${pendingAppointmentsList.length} initial pending appointments to ${socket.id}`);
    } catch (error) {
      console.error("Socket.IO: Error fetching initial pending appointments:", error);
      socket.emit("initial-pending-appointments", []); // Send empty on error
    }
  });

  socket.on("appointment-booked", async (appointmentBooking) => {
    if (!appointmentBooking || !appointmentBooking.data) {
        console.error("Socket.IO: 'appointment-booked' received with invalid data structure.");
        socket.emit("booking-error", { message: "Invalid appointment data received." });
        return;
    }
    const patientData = appointmentBooking.data;
    console.log("Socket.IO: 'appointment-booked' received with data:", patientData);

    const appointmentId = patientData.phone; // Assuming phone is the unique ID for an appointment

    if (!appointmentId) {
        console.error("Socket.IO: Cannot book appointment, patient phone number (ID) is missing:", patientData);
        socket.emit("booking-error", { message: "Patient phone number (ID) is required." });
        return;
    }

    try {
        let appointment = await Appointment.findOne({ id: appointmentId });
        const newAppointmentData = {
            ...patientData, // Spread all data from client
            id: appointmentId,
            status: "pending",
            acceptedBy: null, // Reset acceptedBy on new booking/re-booking
        };

        if (appointment) {
            // If appointment exists, update it. If it was pending, keep original createdAt.
            // If it was not pending (e.g. accepted/declined), treat as a new booking flow.
            console.log(`Socket.IO: Updating existing appointment ${appointmentId}`);
            appointment = Object.assign(appointment, newAppointmentData, {
                createdAt: (appointment.status === 'pending') ? appointment.createdAt : Date.now(), // Keep original if pending, else new
                updatedAt: Date.now(),
            });
        } else {
            console.log(`Socket.IO: Creating new appointment ${appointmentId}`);
            appointment = new Appointment({
                ...newAppointmentData,
                createdAt: Date.now(), // Set createdAt for new appointment
            });
        }
        
        const savedAppointment = await appointment.save();
        console.log("Socket.IO: Stored/Updated appointment to PENDING in DB:", savedAppointment);

        io.emit("notify-admin", { data: savedAppointment });
        console.log("Socket.IO: Emitted 'notify-admin' for PENDING state with data:", { data: savedAppointment });

    } catch (error) {
        console.error("Socket.IO: Error processing 'appointment-booked':", error);
        socket.emit("booking-error", { message: "Server error while booking appointment." });
    }
  });

  socket.on("update-appointment-status", async ({ appointmentId, status, userId }) => {
    console.log(`Socket.IO: 'update-appointment-status' for ${appointmentId} to ${status} by ${userId}`);
    try {
      const appointment = await Appointment.findOne({ id: appointmentId });

      if (!appointment) {
        console.log(`Socket.IO: Appointment ${appointmentId} not found in DB.`);
        socket.emit("appointment-error", { message: "Appointment not found", appointmentId });
        return;
      }

      if (appointment.status !== "pending" && (status === "accepted" || status === "declined")) {
        console.log(`Socket.IO: Appointment ${appointmentId} is no longer pending (current: ${appointment.status}). Update to '${status}' rejected.`);
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
      const updatedAppointment = await appointment.save();

      console.log(`Socket.IO: Appointment ${appointmentId} status updated to ${status} in DB. AcceptedBy: ${userId}.`);
      io.emit("appointment-status-updated", {
        appointmentId,
        status,
        userId,
        appointmentData: updatedAppointment
      });
      console.log("Socket.IO: Emitted 'appointment-status-updated' for", appointmentId);
    } catch (error) {
        console.error(`Socket.IO: Error updating appointment status for ${appointmentId}:`, error);
        socket.emit("appointment-error", { message: "Server error while updating appointment status.", appointmentId });
    }
  });

  socket.on("disconnect", () => {
    console.log("Socket.IO: User disconnected:", socket.id);
  });
});

/*
// --- APPOINTMENT EXPIRATION LOGIC (NEEDS TO BE A CRON JOB ON VERCEL) ---
// The following setInterval WILL NOT WORK RELIABLY on Vercel's serverless functions
// because instances can be shut down.
//
// TODO:
// 1. Create a new API endpoint (e.g., POST /api/cron/expire-appointments).
//    - This endpoint should be secured (e.g., with a secret key in the header).
//    - Logic inside this endpoint:
//        const fiveMinutesAgo = new Date(Date.now() - 300000); // 5 minutes
//        const expired = await Appointment.updateMany(
//            { status: "pending", createdAt: { $lt: fiveMinutesAgo } },
//            { $set: { status: "expired", updatedAt: Date.now() } }
//        );
//        if (expired.modifiedCount > 0) {
//            console.log(`CRON: Expired ${expired.modifiedCount} appointments.`);
//            // You might want to fetch the actual expired appointments to emit their IDs
//            // For simplicity, you could just emit a general update event to refresh admin dashboards.
//            io.emit("appointments-possibly-expired-refresh-list");
//        }
// 2. Schedule a Vercel Cron Job to call this endpoint (e.g., every minute or every 5 minutes).
//    See Vercel docs for Cron Jobs: https://vercel.com/docs/cron-jobs

console.log("Reminder: Appointment expiration logic (setInterval) is disabled for Vercel. Implement using Vercel Cron Jobs.");
*/

// Export the app for Vercel (though Vercel runs it via `app.listen` if `vercel.json` points to this file)
// module.exports = app; // This line is usually not needed if Vercel runs the script that calls app.listen()