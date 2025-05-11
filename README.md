# Healthily Backend

This is the backend server for the Healthily platform, an application designed to connect patients with healthcare professionals. It manages data for doctors, patients, appointments, prescriptions, and teleconsultation bookings, providing APIs for the frontend application and handling real-time communication via Socket.IO.

## Overview

The Healthily Backend is a Node.js application built with Express.js and MongoDB (using Mongoose). It serves as the central hub for all data operations and real-time interactions required by the Healthily user-facing applications (both patient and potentially admin/doctor dashboards).

## Key Features

*   **Doctor Management:**
    *   Register new doctors and partners.
    *   Retrieve doctor profiles by ID, specialization, or location.
    *   Update doctor information.
    *   Verify doctor existence and retrieve unique MGood IDs.
*   **Appointment Management:**
    *   Save in-clinic appointment details.
    *   Retrieve appointments by doctor ID, doctor email, or all appointments.
*   **Patient Data Management:**
    *   Save patient details submitted during teleconsultation booking.
    *   Retrieve a list of all patients.
*   **Prescription Management:**
    *   Save new prescriptions with associated URLs.
    *   Retrieve all prescriptions.
*   **Teleconsultation (TC) Booking Flow:**
    *   Handles QR payment detail submissions (simulation).
    *   Manages a real-time queue of pending teleconsultation requests using Socket.IO.
    *   Allows admins/doctors to accept or decline TC requests in real-time.
    *   Notifies patients and admins about the status of TC requests.
    *   Handles TC appointment expiration if not acted upon within a time limit.
*   **Webhook Integration:**
    *   Receives updates from an external teleconsultation service via a secured webhook.
*   **Real-time Notifications:**
    *   Uses Socket.IO to broadcast updates about new TC bookings, status changes, and webhook events.

## Tech Stack

*   **Runtime:** Node.js
*   **Framework:** Express.js
*   **Database:** MongoDB with Mongoose (ODM)
*   **Real-time Communication:** Socket.IO
*   **Environment Variables:** `dotenv`
*   **Middleware:**
    *   `cors` (Cross-Origin Resource Sharing)
    *   `body-parser` (Request body parsing)
*   **Development:** `nodemon` (for auto-restarting server during development)

## Project Structure

```
├── Controllers/        # Request handlers (business logic)
│   ├── appointmentController.js
│   ├── doctorController.js
│   ├── patientController.js
│   ├── prescriptionController.js
│   └── transactionController.js
├── Models/             # Mongoose schemas and models
│   ├── Appointments.js
│   ├── Doctor.js
│   ├── Patient.js
│   ├── Prescriptions.js
│   └── QrPayment.js
├── Routes/             # API route definitions
│   ├── admin.js
│   ├── doctors.js
│   ├── payment.js
│   └── prescription.js
├── .env                # (Example, should be in .gitignore) Environment variables
├── .gitignore
├── index.js            # Main server entry point, Socket.IO setup
├── package.json
├── package-lock.json
├── README.md           # This file
└── vercel.json         # Vercel deployment configuration
```

## API Endpoints

The server exposes the following main groups of API endpoints:

### Doctor & Patient APIs (`/api`)

*   **`POST /api`**: Add a new doctor.
*   **`GET /api`**: Get all doctors.
*   **`GET /api/:id`**: Get a doctor by their ID.
*   **`GET /api/location/:place`**: Get doctors by location.
*   **`GET /api/specialization/:specialization`**: Get doctors by specialization.
*   **`POST /api/appointment`**: Save a new (in-clinic) appointment.
*   **`POST /api/patient`**: Save patient details (typically used during TC booking).
*   **`PATCH /api/:id`**: Update doctor details.
*   **`POST /api/checkRole`**: Check if a doctor exists by email.
*   **`POST /api/getMgoodId`**: Get MGood ID by doctor's email.

### Admin/Appointment APIs (`/admin`)

*   **`GET /admin/:id`**: Get appointments for a specific doctor ID.
*   **`GET /admin`**: Get all appointments.
*   **`GET /admin/doctor/:email`**: Get appointments for a specific doctor email.

### Payment APIs (`/payment`)

*   **`POST /payment/qr`**: Save QR payment details submitted by a patient.
*   **`GET /payment`**: Test route to check if payment endpoints are reachable.

### Prescription APIs (`/prescription`)

*   **`GET /prescription/get`**: Get all prescriptions.
*   **`POST /prescription`**: Save a new prescription.

### Webhook (`/webhook`)

*   **`POST /webhook/tc-update`**: Endpoint for receiving teleconsultation status updates from an external service. Requires `mgood-api-id` and `mgood-api-secret` headers for authentication.

## Real-time Events (Socket.IO)

The server uses Socket.IO for real-time communication, primarily for the teleconsultation booking workflow.

**Events Emitted by Client, Handled by Server:**

*   `connection`: When a client connects.
*   `disconnect`: When a client disconnects.
*   `request-initial-pending-appointments`: Client (e.g., admin dashboard) requests the list of current pending teleconsultation appointments.
*   `appointment-booked`: Client (patient booking form) submits a teleconsultation booking request.
    *   *Payload:* `{ data: { name, age, gender, phone, specialization, place } }`
*   `update-appointment-status`: Client (admin dashboard) sends a status update (accept/decline) for a pending teleconsultation.
    *   *Payload:* `{ appointmentId: string, status: "accepted" | "declined", userId: string }`

**Events Emitted by Server, Handled by Client:**

*   `initial-pending-appointments`: Server sends the current list of pending TC appointments to a newly connected admin client.
    *   *Payload:* `Array<AppointmentData>` (where `AppointmentData` includes patient details and status "pending")
*   `notify-admin`: Server notifies all connected admin clients about a new pending teleconsultation appointment.
    *   *Payload:* `{ data: AppointmentData }`
*   `booking-error`: Server informs a patient client if their teleconsultation booking request failed.
    *   *Payload:* `{ message: string }`
*   `appointment-status-updated`: Server broadcasts an update about an appointment's status change (e.g., accepted, declined).
    *   *Payload:* `{ appointmentId: string, status: string, userId: string, appointmentData: object }`
*   `appointment-error`: Server informs an admin client if their attempt to update an appointment status failed.
    *   *Payload:* `{ message: string, appointmentId: string, currentStatus?: string, acceptedBy?: string }`
*   `appointment-expired`: Server informs relevant clients that a pending teleconsultation appointment has expired due to no action.
    *   *Payload:* `{ appointmentId: string, message: string }`
*   `update`: Server broadcasts general updates received from the `/webhook/tc-update` endpoint.
    *   *Payload:* `{ triggered_action: string, name: string, custom_order_id: string }`

## Environment Variables

Create a `.env` file in the root directory of the project and add the following variables:

```env
MONGO_URI=your_mongodb_connection_string
PORT=8000 # Or any port you prefer

# Webhook Authentication Credentials (used for /webhook/tc-update endpoint)
NEXT_PUBLIC_WEBHOOK_API_ID=your_webhook_api_id
NEXT_PUBLIC_WEBHOOK_API_SECRET=your_webhook_api_secret
```

*   **`MONGO_URI`**: Your MongoDB connection string.
*   **`PORT`**: The port on which the server will run.
*   **`NEXT_PUBLIC_WEBHOOK_API_ID` / `NEXT_PUBLIC_WEBHOOK_API_SECRET`**: Credentials used to authenticate incoming webhook requests.
    *Note: While prefixed with `NEXT_PUBLIC_`, these are used server-side for webhook authentication.*

## Getting Started

### Prerequisites

*   Node.js (v14 or later recommended)
*   npm or yarn
*   MongoDB instance (local or cloud-hosted like MongoDB Atlas)

### Setup

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd healthily-backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Create and configure the `.env` file:**
    Copy the example variables from the "Environment Variables" section above into a new file named `.env` in the project root, and fill in your actual credentials.

4.  **Run the server:**
    For development with auto-reloading:
    ```bash
    npm run dev
    ```
    This will typically start the server on the port specified in your `.env` file (defaulting to 8000).

The server will connect to MongoDB and start listening for API requests and Socket.IO connections.

## Important Notes

*   **CORS Configuration:** The current Socket.IO CORS configuration (`origin: "*"`) is very permissive and suitable for development. For production, you should restrict this to the specific domains of your frontend applications.
*   **Webhook Security:** The webhook endpoint uses custom headers (`mgood-api-id`, `mgood-api-secret`) for basic authentication. Ensure these secrets are kept confidential and are strong.
*   **Error Handling:** The application includes basic error handling, but further enhancements can be made for more robust production logging and error reporting.
