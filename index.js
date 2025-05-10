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
//     "http://localhost:3001",
//     "https://healthily-backend.vercel.app",
//     "https://healthily-backend-git-main-dhruvgangals-projects.vercel.app"  
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
//       "http://localhost:3000", 
//       "http://localhost:3001",
//     "https://healthily-backend.vercel.app",
//     "https://healthily-backend-git-main-dhruvgangals-projects.vercel.app"
      
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

const express = require("express");
require("dotenv").config();
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const cors = require("cors");
const bodyParser = require("body-parser");

// Redis Adapter
const { createClient } = require("redis");
const { createAdapter } = require("@socket.io/redis-adapter");

// Routes
const doctorRoutes = require("./Routes/doctors.js");
const paymentRoutes = require("./Routes/payment.js");
const prescriptionRoutes = require("./Routes/prescription.js");
const adminRoutes = require("./Routes/admin.js");

// Model
const Appointment = require('./Models/Appointments.js'); // Ensure this path is correct

const app = express();

// --- CORS Configuration ---
const baseAllowedOrigins = [
  process.env.FRONTEND_URL_1, // http://localhost:3000
  process.env.FRONTEND_URL_2, // http://localhost:3001
  process.env.PRODUCTION_BACKEND_URL, // Your main Vercel backend URL (can also be frontend URL if they are separate)
  // process.env.NEXT_PUBLIC_FRONTEND_URL // Your deployed frontend URL
].filter(Boolean); // Remove any undefined entries if env vars are not set

app.use(cors({
  origin: function (origin, callback) {
    const isAllowed = baseAllowedOrigins.some(allowedOrigin => origin && origin.startsWith(allowedOrigin));
    const isVercelPreview = process.env.VERCEL_ENV === 'preview' && origin && new RegExp(process.env.PREVIEW_BACKEND_URL_PATTERN).test(origin.split('//')[1]);
    
    if (!origin || isAllowed || isVercelPreview) { // Allow requests with no origin (server-to-server, mobile apps, curl) or if origin matches
      callback(null, true);
    } else {
      console.warn(`CORS: Blocked origin - ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ["GET", "POST"],
  credentials: true
}));
app.options("*", cors()); // Enable pre-flight requests for all routes

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// API Routes
app.use("/api", doctorRoutes);
app.use("/admin", adminRoutes);
app.use("/payment", paymentRoutes);
app.use("/prescription", prescriptionRoutes);

const apiCredentials = {
  apiId: process.env.NEXT_PUBLIC_WEBHOOK_API_ID,
  apiSecret: process.env.NEXT_PUBLIC_WEBHOOK_API_SECRET,
};

// --- Global io instance (will be initialized after server starts) ---
let io;
const APPOINTMENT_EXPIRY_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// --- Webhook Handler ---
app.post("/webhook/tc-update", async (req, res) => {
  const receivedApiId = req.headers["mgood-api-id"];
  const receivedApiSecret = req.headers["mgood-api-secret"];

  if (!receivedApiId || !receivedApiSecret) {
    return res.status(401).send({ message: "Missing API ID or Secret" });
  }
  if (receivedApiId !== apiCredentials.apiId || receivedApiSecret !== apiCredentials.apiSecret) {
    return res.status(403).send({ message: "Invalid API credentials" });
  }

  const { triggered_action, name, custom_order_id } = req.body; // custom_order_id is patient's phone
  console.log("Webhook Received:", req.body);

  if (io) {
    io.emit("update", { triggered_action, name, custom_order_id });
  }

  if (triggered_action === "Completed" && custom_order_id) {
    try {
      const updatedAppointment = await Appointment.findOneAndUpdate(
        { phone: custom_order_id, status: 'accepted' }, // Find an accepted appointment for this phone
        { status: 'completed', updatedAt: Date.now() },
        { new: true }
      ).lean(); // Use .lean() for faster read-only if you don't need mongoose methods

      if (updatedAppointment && io) {
        console.log(`Webhook: Appointment ${updatedAppointment._id} for phone ${custom_order_id} marked as completed.`);
        io.emit("appointment-status-updated", {
          appointmentId: updatedAppointment._id.toString(), // Send MongoDB _id as string
          status: updatedAppointment.status,
          userId: updatedAppointment.acceptedBy, // Who originally accepted it
          appointmentData: { ...updatedAppointment, id: updatedAppointment._id.toString() }
        });
      }
    } catch (error) {
      console.error("Webhook: Error updating appointment to completed:", error);
    }
  }
  res.status(200).send({ message: "Webhook processed successfully" });
});

// --- MongoDB Connection ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB Connection Error:", err.message, err.stack));

// --- Server Initialization and Socket.IO Setup ---
const server = app.listen(process.env.PORT || 8000, () => {
  console.log(`Server is running on port ${process.env.PORT || 8000}`);

  io = new Server(server, {
    cors: {
        origin: function (origin, callback) { // Re-use similar CORS logic for Socket.IO
            const isAllowed = baseAllowedOrigins.some(allowedOrigin => origin && origin.startsWith(allowedOrigin));
            const isVercelPreview = process.env.VERCEL_ENV === 'preview' && origin && new RegExp(process.env.PREVIEW_BACKEND_URL_PATTERN).test(origin.split('//')[1]);
            if (!origin || isAllowed || isVercelPreview) {
              callback(null, true);
            } else {
              console.warn(`Socket CORS: Blocked origin - ${origin}`);
              callback(new Error('Socket.IO not allowed by CORS'));
            }
        },
        methods: ["GET", "POST"],
        credentials: true
    },
  });

  // --- Redis Adapter Setup ---
  if (process.env.REDIS_URL) {
    const pubClient = createClient({ url: process.env.REDIS_URL });
    const subClient = pubClient.duplicate();

    Promise.all([pubClient.connect(), subClient.connect()])
      .then(() => {
        io.adapter(createAdapter(pubClient, subClient));
        console.log("Socket.IO Redis adapter configured.");
      })
      .catch((err) => {
        console.error("Failed to connect to Redis or setup adapter:", err);
      });

    pubClient.on('error', (err) => console.error('Redis PubClient Error:', err));
    subClient.on('error', (err) => console.error('Redis SubClient Error:', err));
  } else {
    console.warn("REDIS_URL not found. Socket.IO will run in single-node mode (not recommended for Vercel scaling).");
  }

  // --- Socket.IO Engine Error Logging ---
  io.engine.on("connection_error", (err) => {
    console.error("SOCKET.IO ENGINE CONNECTION ERROR:");
    console.error("Error Code:", err.code);     // e.g., 1 for "Session ID unknown"
    console.error("Error Message:", err.message);  // e.g., "Session ID unknown"
    console.error("Error Context:", err.context);  // Additional context
  });

  // --- Socket.IO Connection Logic ---
  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}. Transport: ${socket.conn.transport.name}`);

    socket.on("request-initial-pending-appointments", async () => {
      try {
        const now = Date.now();
        // Fetch all potentially pending appointments
        const potentiallyPending = await Appointment.find({ status: 'pending' }).sort({ createdAt: -1 }).lean();
        
        const validPendingAppointments = [];
        const expiredAppointmentsToUpdate = [];

        for (const appt of potentiallyPending) {
          if (now - new Date(appt.createdAt).getTime() > APPOINTMENT_EXPIRY_DURATION) {
            expiredAppointmentsToUpdate.push(appt._id);
          } else {
            validPendingAppointments.push({ ...appt, id: appt._id.toString() });
          }
        }

        // Bulk update expired appointments
        if (expiredAppointmentsToUpdate.length > 0) {
          await Appointment.updateMany(
            { _id: { $in: expiredAppointmentsToUpdate } },
            { $set: { status: 'expired', updatedAt: now } }
          );
          console.log(`Server: Marked ${expiredAppointmentsToUpdate.length} appointments as expired.`);
          // Optionally emit individual expired events, or client can refetch
          expiredAppointmentsToUpdate.forEach(id => 
            io.emit("appointment-expired", { appointmentId: id.toString(), message: "Appointment expired due to no action." })
          );
        }
        
        socket.emit("initial-pending-appointments", validPendingAppointments);
        console.log(`Server: Sent ${validPendingAppointments.length} initial pending appointments to ${socket.id}`);

      } catch (error) {
        console.error("Error fetching initial pending appointments:", error);
        socket.emit("initial-pending-appointments", []); // Send empty on error
      }
    });

    socket.on("appointment-booked", async (appointmentBooking) => {
      if (!appointmentBooking || !appointmentBooking.data) {
        console.error("Server: 'appointment-booked' received invalid data structure:", appointmentBooking);
        socket.emit("booking-error", { message: "Server error: Invalid appointment data." });
        return;
      }
      const patientData = appointmentBooking.data;
      console.log("Server: 'appointment-booked' received with data:", patientData);

      if (!patientData.phone) {
        console.error("Server: Patient phone number missing from booking data:", patientData);
        socket.emit("booking-error", { message: "Patient phone number is required." });
        return;
      }

      try {
        // Check if an active PENDING appointment for this phone already exists
        let existingPendingAppointment = await Appointment.findOne({
          phone: patientData.phone,
          status: 'pending'
        });

        let savedAppointment;

        if (existingPendingAppointment) {
          // If exists and is PENDING, update it (e.g., if patient re-submits form quickly)
          // Or, if policy is only one pending per phone, you might update or just notify admin again
          Object.assign(existingPendingAppointment, {
            ...patientData, // Update with potentially new details
            updatedAt: Date.now(),
            // createdAt remains the same for the original pending request
          });
          savedAppointment = await existingPendingAppointment.save();
          console.log("Server: Updated existing PENDING appointment:", savedAppointment._id);
        } else {
          // Create new appointment if no PENDING one exists for this phone
          const newAppointment = new Appointment({
            ...patientData,
            status: "pending",
            createdAt: Date.now(), // Fresh createdAt
            updatedAt: Date.now()
          });
          savedAppointment = await newAppointment.save();
          console.log("Server: Created new PENDING appointment:", savedAppointment._id);
        }
        
        const appointmentForEmit = { ...savedAppointment.toObject(), id: savedAppointment._id.toString() };
        delete appointmentForEmit.acceptedBy; // Ensure acceptedBy is not set for pending

        io.emit("notify-admin", { data: appointmentForEmit });
        console.log("Server: Emitted 'notify-admin' for PENDING appointment:", appointmentForEmit.id);

      } catch (error) {
        console.error("Error booking appointment:", error);
        socket.emit("booking-error", { message: "Error processing your booking. Please try again." });
      }
    });

    socket.on("update-appointment-status", async ({ appointmentId, status, userId }) => {
      console.log(`Server: 'update-appointment-status' for ${appointmentId} to ${status} by ${userId}`);
      if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
          console.error(`Server: Invalid appointmentId format: ${appointmentId}`);
          socket.emit("appointment-error", { message: "Invalid appointment ID format.", appointmentId });
          return;
      }

      try {
        const appointment = await Appointment.findById(appointmentId);

        if (!appointment) {
          console.log(`Server: Appointment ${appointmentId} not found.`);
          socket.emit("appointment-error", { message: "Appointment not found.", appointmentId });
          return;
        }

        // Check for expiry before status update if it's currently pending
        if (appointment.status === 'pending' && (Date.now() - new Date(appointment.createdAt).getTime() > APPOINTMENT_EXPIRY_DURATION)) {
            appointment.status = 'expired';
            appointment.updatedAt = Date.now();
            await appointment.save();
            console.log(`Server: Appointment ${appointmentId} was PENDING but found expired before update to ${status}.`);
            io.emit("appointment-expired", { appointmentId: appointment._id.toString(), message: "Appointment expired before action." });
            socket.emit("appointment-error", {
                message: "This appointment has expired.",
                appointmentId: appointment._id.toString(),
                currentStatus: 'expired'
            });
            return;
        }

        if (appointment.status !== "pending" && (status === "accepted" || status === "declined")) {
          console.log(`Server: Appointment ${appointmentId} no longer pending (current: ${appointment.status}). Update to '${status}' rejected.`);
          socket.emit("appointment-error", {
            message: `Appointment is already ${appointment.status}.`,
            appointmentId: appointment._id.toString(),
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
        
        const appointmentForEmit = { ...updatedAppointment.toObject(), id: updatedAppointment._id.toString() };

        console.log(`Server: Appointment ${appointmentId} status updated to ${status}. AcceptedBy: ${userId}.`);
        io.emit("appointment-status-updated", {
          appointmentId: appointmentForEmit.id,
          status: appointmentForEmit.status,
          userId: appointmentForEmit.acceptedBy,
          appointmentData: appointmentForEmit
        });
        console.log("Server: Emitted 'appointment-status-updated' for", appointmentForEmit.id);

      } catch (error) {
        console.error(`Error updating appointment status for ${appointmentId}:`, error);
        socket.emit("appointment-error", { message: "Error updating appointment status.", appointmentId });
      }
    });

    socket.on("disconnect", (reason) => {
      console.log(`Socket disconnected: ${socket.id}. Reason: ${reason}`);
    });

    socket.on("error", (error) => {
      console.error(`Socket error for ${socket.id}:`, error);
    });
  });
});

// Graceful shutdown for Vercel (optional but good practice)
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server')
  server.close(() => {
    console.log('HTTP server closed')
    mongoose.connection.close(false).then(() => {
        console.log('MongoDB connection closed');
        process.exit(0);
    });
  })
});