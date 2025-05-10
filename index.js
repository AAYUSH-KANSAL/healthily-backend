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
require("dotenv").config(); // Loads .env file for local dev, ignored on Vercel if vars are set in dashboard
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const cors = require("cors");
const bodyParser = require("body-parser");

// For Socket.IO Redis Adapter
const Redis = require("ioredis");
const { createAdapter } = require("@socket.io/redis-adapter");

// Your Route Files (ensure these paths are correct and files exist)
const doctorRoutes = require("./Routes/doctors.js");
const paymentRoutes = require("./Routes/payment.js");
const prescriptionRoutes = require("./Routes/prescription.js");
const adminRoutes = require("./Routes/admin.js");

const app = express();

// --- Environment-dependent URLs ---
const VERCEL_SYSTEM_URL = process.env.VERCEL_URL; // Provided by Vercel, e.g., my-project-hash.vercel.app
const VERCEL_DEPLOYED_BACKEND_URL = VERCEL_SYSTEM_URL ? `https://${VERCEL_SYSTEM_URL}` : "http://localhost:8000"; // Fallback for local

const FRONTEND_URL_LOCALHOST_3000 = "http://localhost:3000";
const FRONTEND_URL_LOCALHOST_3001 = "http://localhost:3001";
// IMPORTANT: Set FRONTEND_PRODUCTION_URL in your Vercel Environment Variables for your deployed frontend
const FRONTEND_PRODUCTION_URL = process.env.FRONTEND_PRODUCTION_URL;

const allowedOrigins = [
  FRONTEND_URL_LOCALHOST_3000,
  FRONTEND_URL_LOCALHOST_3001,
  FRONTEND_PRODUCTION_URL,
  // VERCEL_DEPLOYED_BACKEND_URL, // Usually not needed for Express CORS unless backend calls itself
].filter(Boolean); // Removes any undefined/empty strings

console.log("Allowed Express CORS Origins:", allowedOrigins);
console.log("Current Vercel Backend URL (for reference/SocketIO CORS):", VERCEL_DEPLOYED_BACKEND_URL);


app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      console.warn("CORS Blocked Origin:", origin);
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Add other methods if needed
  credentials: true
}));
// Explicitly handle preflight requests for all routes
app.options("*", cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(new Error("CORS policy rejection"), false);
    }
    return callback(null, true);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// --- MongoDB Connection and Schema ---
if (!process.env.MONGO_URI) {
    console.error("FATAL ERROR: MONGO_URI is not defined. Application cannot start.");
    // In a real serverless function, you might not be able to process.exit gracefully.
    // The function will likely fail on its own if mongoose.connect is called with undefined.
    // For local development, this helps.
    if (process.env.NODE_ENV !== 'production') process.exit(1);
}

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Successfully connected to MongoDB"))
  .catch((err) => {
    console.error("MongoDB Connection Error:", err.message);
    console.error("Stack:", err.stack);
    // Consider if the app should try to operate without DB or exit/fail.
    // On Vercel, a function invocation will likely fail if DB isn't available and needed.
  });

const appointmentSchema = new mongoose.Schema({
    name: String,
    phone: { type: String, required: true, index: true }, // Assuming phone is primary contact
    age: String,
    gender: String,
    problem: String,
    id: { type: String, unique: true, required: true }, // This should be a unique identifier, could be patientData.phone or a generated UUID
    status: { type: String, enum: ['pending', 'accepted', 'declined', 'expired', 'completed'], default: 'pending' },
    createdAt: { type: Date, default: Date.now, index: true },
    updatedAt: { type: Date, default: Date.now },
    acceptedBy: { type: String, default: null }, // Admin/Doctor User ID who accepted/declined
    // Include all other fields you expect from patientData directly in the schema
    // Example:
    // someOtherPatientField: String,
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
  res.send("Hello from Healthily Backend! Express app is running. Vercel URL: " + VERCEL_DEPLOYED_BACKEND_URL);
});

// --- Cron Job Endpoint ---
app.post("/api/cron/expire-appointments", async (req, res) => {
    const cronSecret = req.headers['x-cron-secret'];
    if (!process.env.CRON_JOB_SECRET || cronSecret !== process.env.CRON_JOB_SECRET) {
        console.warn("CRON: Unauthorized attempt to run expire-appointments job. Secret mismatch or not set.");
        return res.status(401).send("Unauthorized");
    }

    console.log("CRON: Running expire-appointments job...");
    try {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes
        const result = await Appointment.updateMany(
            { status: "pending", createdAt: { $lt: fiveMinutesAgo } },
            { $set: { status: "expired", updatedAt: Date.now() } }
        );

        if (result.modifiedCount > 0) {
            console.log(`CRON: Expired ${result.modifiedCount} appointments.`);
            if (io) { // Ensure io is initialized
                io.emit("appointments-list-updated", { message: "Some appointments may have expired. Please refresh." });
                console.log("CRON: Emitted 'appointments-list-updated' event via Socket.IO.");
            }
        } else {
            console.log("CRON: No appointments to expire.");
        }
        res.status(200).send({ message: "Cron job executed successfully.", expiredCount: result.modifiedCount });
    } catch (error) {
        console.error("CRON: Error during expire-appointments job:", error);
        res.status(500).send("Error executing cron job");
    }
});

// --- HTTP Server and Socket.IO Setup ---
const server = app.listen(process.env.PORT || 8000, () => {
  console.log(`Server is running on port ${process.env.PORT || 8000}`);
});

const socketAllowedOrigins = [ // Socket.IO specific CORS origins
    FRONTEND_URL_LOCALHOST_3000,
    FRONTEND_URL_LOCALHOST_3001,
    FRONTEND_PRODUCTION_URL
].filter(Boolean);

console.log("Allowed Socket.IO CORS Origins:", socketAllowedOrigins);

const io = new Server(server, {
  path: "/socket.io/",
  cors: {
    origin: socketAllowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  },
  // transports: ['polling', 'websocket'], // Usually default is fine
});
console.log("Socket.IO server initialized (without Redis adapter yet).");

// --- Socket.IO Redis Adapter Setup ---
if (process.env.REDIS_URL) {
    try {
        console.log("Attempting to connect to Redis for Socket.IO adapter using URL:", process.env.REDIS_URL ? '******' : 'NOT SET');
        const pubClient = new Redis(process.env.REDIS_URL, {
            // Recommended options for robustness, especially in serverless
            enableReadyCheck: false,
            maxRetriesPerRequest: null, // Or a small number like 3
            // tls: process.env.REDIS_URL.startsWith('rediss://') ? {} : undefined, // For Redis SSL/TLS if your URL starts with rediss://
        });
        const subClient = pubClient.duplicate();

        // Handling connection events
        let pubConnected = false;
        let subConnected = false;

        const checkAndApplyAdapter = () => {
            if (pubConnected && subConnected) {
                io.adapter(createAdapter(pubClient, subClient));
                console.log("Socket.IO Redis adapter configured successfully.");
            }
        };

        pubClient.on('connect', () => {
            console.log('Redis PubClient connected.');
            pubConnected = true;
            checkAndApplyAdapter();
        });
        subClient.on('connect', () => {
            console.log('Redis SubClient connected.');
            subConnected = true;
            checkAndApplyAdapter();
        });

        pubClient.on('error', (err) => console.error('Redis PubClient Error:', err.message, err.stack));
        subClient.on('error', (err) => console.error('Redis SubClient Error:', err.message, err.stack));

        // Attempt to connect (ioredis v4+ does this automatically, but can be explicit)
        // Forcing connection can be useful for debugging, but ioredis usually handles it.
        // Promise.all([pubClient.connect(), subClient.connect()]) might be too aggressive if ioredis retries internally.

    } catch (error) {
        console.error("Error setting up Redis client for Socket.IO:", error.message, error.stack);
    }
} else {
    console.warn("REDIS_URL not found. Socket.IO will not scale across multiple instances and messages might not be delivered reliably under load on Vercel.");
}

const apiCredentials = { // Should be defined before use in webhook
  apiId: process.env.NEXT_PUBLIC_WEBHOOK_API_ID,
  apiSecret: process.env.NEXT_PUBLIC_WEBHOOK_API_SECRET,
};
// --- Webhook (Ensure this is after `io` is potentially configured with adapter) ---
app.post("/webhook/tc-update", (req, res) => {
  const receivedApiId = req.headers["mgood-api-id"];
  const receivedApiSecret = req.headers["mgood-api-secret"];

  if (!apiCredentials.apiId || !apiCredentials.apiSecret) {
      console.error("Webhook: API credentials not configured on server-side (NEXT_PUBLIC_WEBHOOK_API_ID or SECRET missing).");
      return res.status(500).send({ message: "Server configuration error." });
  }

  if (!receivedApiId || !receivedApiSecret) {
    console.log("Webhook: Missing API ID or Secret in request headers.");
    return res.status(401).send({ message: "Missing API ID or Secret" });
  }
  if (receivedApiId !== apiCredentials.apiId || receivedApiSecret !== apiCredentials.apiSecret) {
    console.log("Webhook: Invalid API credentials in request.");
    return res.status(403).send({ message: "Invalid API credentials" });
  }

  const { triggered_action, name, custom_order_id } = req.body;
  console.log("Webhook Received:", req.body);
  if (io) {
    io.emit("update", { triggered_action, name, custom_order_id });
    console.log("Webhook: Emitted 'update' via Socket.IO");
  } else {
    console.error("Webhook Error: Socket.IO server (io) is not properly initialized!");
  }
  res.status(200).send({ message: "Webhook processed successfully" });
});


// --- Socket.IO Event Handlers ---
io.on("connection", (socket) => {
  console.log("Socket.IO: A user connected:", socket.id);

  socket.on("request-initial-pending-appointments", async () => {
    console.log(`Socket.IO: '${socket.id}' requested initial pending appointments.`);
    try {
      const pendingAppointmentsList = await Appointment.find({ status: "pending" }).sort({ createdAt: -1 }); // Show newest first
      socket.emit("initial-pending-appointments", pendingAppointmentsList);
      console.log(`Socket.IO: Sent ${pendingAppointmentsList.length} initial pending appointments to ${socket.id}`);
    } catch (error) {
      console.error("Socket.IO: Error fetching initial pending appointments:", error.message, error.stack);
      socket.emit("initial-pending-appointments", []);
      socket.emit("server-error", { message: "Could not fetch appointments."});
    }
  });

  socket.on("appointment-booked", async (appointmentBooking) => {
    if (!appointmentBooking || !appointmentBooking.data || typeof appointmentBooking.data !== 'object') {
        console.error("Socket.IO: 'appointment-booked' received with invalid data structure. Data:", appointmentBooking);
        socket.emit("booking-error", { message: "Invalid appointment data format." });
        return;
    }
    const patientData = appointmentBooking.data;
    console.log("Socket.IO: 'appointment-booked' received with data:", patientData);

    // Use a unique ID from patientData, or generate one if not provided.
    // Assuming patientData.phone is intended to be the unique appointment ID.
    const appointmentId = patientData.phone || patientData.id; // Prefer explicit 'id' if available, fallback to 'phone'

    if (!appointmentId) {
        console.error("Socket.IO: Cannot book appointment, unique ID (phone or id field) is missing from patientData:", patientData);
        socket.emit("booking-error", { message: "Patient phone number or unique ID is required." });
        return;
    }

    try {
        // Prepare data, ensuring only fields defined in schema are used or handled appropriately.
        const appointmentDataForDB = {
            name: patientData.name,
            phone: patientData.phone, // Storing phone number
            age: patientData.age,
            gender: patientData.gender,
            problem: patientData.problem,
            id: appointmentId, // The unique ID for this appointment
            status: "pending",
            acceptedBy: null,
            // Copy any other relevant fields from patientData that are in your schema
        };

        // Check if an appointment with this ID already exists and is pending
        let existingAppointment = await Appointment.findOne({ id: appointmentId });

        if (existingAppointment && existingAppointment.status === 'pending') {
            console.log(`Socket.IO: Re-booking/updating existing PENDING appointment ${appointmentId}`);
            // Update existing pending appointment, keep original createdAt
            Object.assign(existingAppointment, appointmentDataForDB, { updatedAt: Date.now() });
            await existingAppointment.save();
            console.log("Socket.IO: Updated existing PENDING appointment in DB:", existingAppointment);
            io.emit("notify-admin", { data: existingAppointment });
            console.log("Socket.IO: Emitted 'notify-admin' for UPDATED PENDING state:", { data: existingAppointment });
        } else if (existingAppointment) {
            // Appointment exists but is NOT pending (e.g., accepted, declined, expired)
            // Treat as a new booking request. Client might be trying to book again.
            console.log(`Socket.IO: Appointment ${appointmentId} exists with status ${existingAppointment.status}. Treating as new booking.`);
            existingAppointment.set({
                ...appointmentDataForDB,
                status: "pending", // Reset to pending
                createdAt: Date.now(), // New creation time
                updatedAt: Date.now(),
                acceptedBy: null,
            });
            await existingAppointment.save();
            console.log("Socket.IO: Re-set existing appointment to PENDING in DB:", existingAppointment);
            io.emit("notify-admin", { data: existingAppointment });
            console.log("Socket.IO: Emitted 'notify-admin' for RE-SET PENDING state:", { data: existingAppointment });
        }
        else {
            // No appointment with this ID exists, create a new one
            console.log(`Socket.IO: Creating new appointment ${appointmentId}`);
            const newAppointment = new Appointment({
                ...appointmentDataForDB,
                createdAt: Date.now(), // New creation time
            });
            await newAppointment.save();
            console.log("Socket.IO: Created new appointment and stored in DB:", newAppointment);
            io.emit("notify-admin", { data: newAppointment });
            console.log("Socket.IO: Emitted 'notify-admin' for NEW PENDING state:", { data: newAppointment });
        }

    } catch (error) {
        console.error("Socket.IO: Error processing 'appointment-booked':", error.message, error.stack);
        socket.emit("booking-error", { message: "Server error: Could not book appointment." });
    }
  });

  socket.on("update-appointment-status", async ({ appointmentId, status, userId }) => {
    console.log(`Socket.IO: 'update-appointment-status' for ID:${appointmentId} to ${status} by UserID:${userId}`);
    if (!appointmentId || !status || !userId) {
        console.error("Socket.IO: 'update-appointment-status' missing required fields.");
        socket.emit("appointment-error", { message: "Missing data for status update.", appointmentId });
        return;
    }

    try {
      const appointment = await Appointment.findOne({ id: appointmentId });

      if (!appointment) {
        console.log(`Socket.IO: Appointment ${appointmentId} not found in DB for status update.`);
        socket.emit("appointment-error", { message: "Appointment not found.", appointmentId });
        return;
      }

      // Prevent updating if already handled, unless specifically allowed (e.g. moving from accepted to completed)
      if (appointment.status !== "pending" && (status === "accepted" || status === "declined")) {
        console.log(`Socket.IO: Appointment ${appointmentId} is already '${appointment.status}'. Update to '${status}' rejected.`);
        socket.emit("appointment-error", {
          message: `Appointment is already ${appointment.status}. Action rejected.`,
          appointmentId,
          currentStatus: appointment.status,
          acceptedBy: appointment.acceptedBy
        });
        return;
      }

      appointment.status = status;
      if (status === "accepted" || status === "declined") { // Only set acceptedBy for these actions
          appointment.acceptedBy = userId;
      }
      // For other statuses like 'completed' or 'expired' (if manually triggered), acceptedBy might not change
      // or might be set to a system user.

      appointment.updatedAt = Date.now();
      const updatedAppointment = await appointment.save();

      console.log(`Socket.IO: Appointment ${appointmentId} status updated to ${status} in DB. AcceptedBy: ${userId}.`);
      io.emit("appointment-status-updated", { // Broadcast to all clients
        appointmentId,
        status,
        userId,
        appointmentData: updatedAppointment
      });
      console.log("Socket.IO: Emitted 'appointment-status-updated' for", appointmentId);
    } catch (error) {
        console.error(`Socket.IO: Error updating appointment status for ${appointmentId}:`, error.message, error.stack);
        socket.emit("appointment-error", { message: "Server error: Could not update appointment status.", appointmentId });
    }
  });

  socket.on("disconnect", (reason) => {
    console.log("Socket.IO: User disconnected:", socket.id, "Reason:", reason);
  });

  socket.on('error', (error) => {
    console.error('Socket.IO: Socket error for', socket.id, ':', error.message, error.stack);
  });
});

console.log("Reminder: For appointment expiration, ensure Vercel Cron Job is configured for /api/cron/expire-appointments and CRON_JOB_SECRET is set.");

// module.exports = app; // Not strictly necessary for Vercel when app.listen() is used.
// Vercel's @vercel/node build will handle this file.