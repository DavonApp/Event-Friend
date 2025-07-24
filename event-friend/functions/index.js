// functions/index.js

import express from "express";               // Backend web server framework
import cors from "cors";                     // Enables CORS for frontend requests
import helmet from "helmet";                 // Security middleware for HTTP headers
import admin from "firebase-admin";          // Firebase Admin SDK for Firestore and Auth
import functions from "firebase-functions"; // Firebase Functions SDK

// Initialize Firebase Admin SDK
admin.initializeApp();

// Firestore and Auth instances
const db = admin.firestore();
const auth = admin.auth();

// Express app instance
const app = express();

// Middleware setup
app.use(express.json());          // Parse JSON bodies for POST/PUT
app.use(cors({ origin: true })); // Allow all origins (adjust for production)
app.use(helmet());               // Add security headers

// --- Routes ---

// GET /events - return mock or real events, optionally filtered by category
app.get("/events", (req, res) => {
  const category = req.query.category;

  // Mock events list
  const mockEvents = [
    {
      id: "1",
      name: "Indie Music Fest",
      description: "Great music here!",
      category: "Music",
      date: "2025-07-15",
      location: "Piedmont Park",
      start: "2025-07-15T12:00:00",
      city: "Atlanta",
      venue: "Piedmont Park",
      image:
        "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?ixlib=rb-4.0.3&auto=format&fit=crop&w=1074&q=80",
    },
    {
      id: "2",
      name: "Atlanta Hawks vs. Celtics",
      description: "Basketball Game Atlanta Hawks vs. Celtics",
      category: "Sports",
      date: "2025-07-18",
      location: "State Farm Arena",
      start: "2025-07-18T18:00:00",
      city: "Atlanta",
      venue: "State Farm Arena",
      image: "https://sportsradioamerica.com/wp-content/uploads/1200x628.png",
    },
    {
      id: "3",
      name: "Tech Meetup & Networking",
      description: "Networking and Socializing with great people",
      category: "Networking",
      date: "2025-08-21",
      location: "KSU Marietta Campus",
      start: "2025-08-21T20:00:00",
      city: "Marietta",
      venue: "KSU Marietta Campus",
      image:
        "https://images.unsplash.com/photo-1543269865-cbf427effbad?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80",
    },
    {
      id: "4",
      name: "Modern Art Exhibit",
      description: "See amazing artwork.",
      category: "Art",
      date: "2025-08-24",
      location: "High Museum of Art",
      start: "2025-08-20T10:00:00",
      city: "Atlanta",
      venue: "High Museum of Art",
      image:
        "https://www.ajc.com/resizer/v2/5A3I2CM7YWU475BEVGPMYYXBE4.jpg?auth=32ad4d049ce9a861fe8e29b77e65bf11b6ea5bbe184b9e01ceaa067f1d453eee&width=1600&height=900&smart=true",
    },
  ];

  // Filter by category if provided
  let filteredEvents = mockEvents;
  if (category) {
    filteredEvents = mockEvents.filter(
      (e) => e.category.toLowerCase() === category.toLowerCase()
    );
  }

  res.json({
    events: filteredEvents,
    pagination: { page_number: 1, page_count: 1 },
  });
});

// POST /events - create a new event in Firestore
app.post("/events", async (req, res) => {
  try {
    const event = req.body;
    const docRef = await db.collection("events").add(event);
    res.status(201).json({ id: docRef.id });
  } catch (error) {
    console.error("Error adding event:", error);
    res.status(500).send("Error adding event");
  }
});

// GET /events/:id - get event by ID from Firestore
app.get("/events/:id", async (req, res) => {
  try {
    const eventId = req.params.id;
    const doc = await db.collection("events").doc(eventId).get();

    if (!doc.exists) return res.status(404).send("Event not found");

    res.status(200).json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error("Error finding event:", error);
    res.status(500).send("Error finding event");
  }
});

// GET /users/:uid/interested - get user's interested event IDs
app.get("/users/:uid/interested", async (req, res) => {
  try {
    const { uid } = req.params;
    const snapshot = await db
      .collection("users")
      .doc(uid)
      .collection("interestedEvents")
      .get();

    const eventIds = snapshot.docs.map((doc) => doc.id);
    res.status(200).json({ interestedEventIds: eventIds });
  } catch (error) {
    console.error("Error fetching user's interested events:", error);
    res.status(500).send("Error fetching user's interested events");
  }
});

// POST /users - create user profile in Firestore after signup
app.post("/users", async (req, res) => {
  try {
    const { uid, username, email, bio, interests = [] } = req.body;
    await db.collection("users").doc(uid).set({
      username,
      email,
      bio,
      interests,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.status(201).json({ message: "User profile created." });
  } catch (error) {
    console.error("Error creating user profile:", error);
    res.status(500).send("Error creating user profile");
  }
});

// GET /users/:uid - get user info from Firebase Auth (no Firestore here)
app.get("/users/:uid", async (req, res) => {
  try {
    const uid = req.params.uid;
    const userRecord = await auth.getUser(uid); // get user from Firebase Auth

    res.json({
      username: userRecord.displayName || "",
      email: userRecord.email || "",
      city: "",
      bio: "",
      interests: [],
    });
  } catch (error) {
    console.error("Error fetching user from Firebase Auth:", error);
    res.status(404).json({ error: "User not found" });
  }
});

// PUT /users/:uid - update user profile in Firestore
app.put("/users/:uid", async (req, res) => {
  try {
    const { uid } = req.params;
    await db.collection("users").doc(uid).update(req.body);
    res.status(200).send("User updated");
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).send("Error updating user");
  }
});

// PUT /users/:uid/preferences - update user preferences in Firestore
app.put("/users/:uid/preferences", async (req, res) => {
  try {
    const { uid } = req.params;
    const preferences = req.body;

    await db.collection("users").doc(uid).update({
      preferences: preferences,
    });

    res.status(200).send("Preferences updated");
  } catch (error) {
    console.error("Error updating preferences:", error);
    res.status(500).send("Error updating preferences");
  }
});

// POST /events/:eventId/interest - toggle user interest in event
// Body: { uid: "userId", interested: true|false }
app.post("/events/:eventId/interest", async (req, res) => {
  try {
    const { uid, interested } = req.body;
    const evRef = db.collection("events").doc(req.params.eventId);

    await db.runTransaction(async (t) => {
      const evSnap = await t.get(evRef);
      const data = evSnap.exists ? evSnap.data() : {};
      const list = new Set(data.interestedUserIds || []);
      interested ? list.add(uid) : list.delete(uid);
      t.set(evRef, { ...data, interestedUserIds: [...list] }, { merge: true });
    });

    res.json({ message: interested ? "Marked interested" : "Interest removed" });
  } catch (error) {
    console.error("Error updating event interest:", error);
    res.status(500).send("Error updating event interest");
  }
});

// POST /connections - create a new connection between users for an event
app.post("/connections", async (req, res) => {
  try {
    const { uidA, uidB, eventId } = req.body;
    const connId = [uidA, uidB].sort().join("_") + "_" + eventId;
    await db.collection("connections").doc(connId).set({
      users: [uidA, uidB],
      eventId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.status(201).json({ connectionId: connId });
  } catch (error) {
    console.error("Error creating connection:", error);
    res.status(500).send("Error creating connection");
  }
});

// POST /connections/:connId/messages - send a message in a connection chat
app.post("/connections/:connId/messages", async (req, res) => {
  try {
    const { fromUid, text } = req.body;
    const msgRef = db
      .collection("connections")
      .doc(req.params.connId)
      .collection("messages")
      .doc();
    await msgRef.set({
      fromUid,
      text,
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.status(201).json({ message: "Sent." });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).send("Error sending message");
  }
});

// GET /connections/:connId/messages - get messages in a connection chat
app.get("/connections/:connId/messages", async (req, res) => {
  try {
    const snap = await db
      .collection("connections")
      .doc(req.params.connId)
      .collection("messages")
      .orderBy("sentAt", "asc")
      .get();
    res.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  } catch (error) {
    console.error("Error getting messages:", error);
    res.status(500).send("Error getting messages");
  }
});

// Export Express app as Firebase HTTPS Cloud Function
export const api = functions.https.onRequest(app);

// Export Firestore instance for other files if needed
export { db };
