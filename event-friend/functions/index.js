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

// Get /events
app.get("/events", (req, res) => {
    const mockEvents = [
        {
            id: "1",
            name: "Basketball Tournament",
            start: "2025-08-12T18:00:00",
            url: "https://example.com/events/1",
            image: "https://via.placeholder.com/300x150.png?text=Sports+Event",
            venue: "Mercedes Benz Stadium",
            city: "Atlanta",
            is_free: true,
            category: "sports"
        },
        {
            id: "2",
            name: "Live Music Festival",
            start: "2025-08-15T20:00:00",
            url: "https://example.com/events/2",
            image: "https://via.placeholder.com/300x150.png?text=Music+Festival",
            venue: "Piedmont Park",
            city: "Atlanta",
            is_free: false,
            category: "music"
        }
    ];
        res.json({ events: mockEvents, pagination: {page_number: 1, page_count: 1}});
    });

// Export Express app as a Firebase HTTPS Cloud Function
export const api = functions.https.onRequest(app);