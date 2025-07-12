// Dependencies
import express from "express";          // For backend web server
import cors from "cors";                // Allows frontend to talk to backend
import helmet from "helmet";            // Security middleware for HTTP headers
import admin from "firebase-admin";     // Firebase admin SDK to interact with Firestore and Auth
import functions from "firebase-functions"; // Firebase functions SDK

// Initialize Firebase Admin SDK 
admin.initializeApp();

// Initialize Firestore database and Auth service from Firebase Admin
const db = admin.firestore();
const auth = admin.auth();

// Express app instance 
const app = express();

// Middleware: allows requests from frontend
app.use(cors());
app.use(helmet());

// Test backend
app.get("/", (req, res) => {
    res.send("Hello from Event Friend backend!");
});

// Export Express app as a Firebase HTTPS Cloud Function
export const api = functions.https.onRequest(app);