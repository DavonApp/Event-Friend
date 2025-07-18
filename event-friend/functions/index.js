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
        },
        {
            id: "3",
            name: "Firework Fest Atlanta",
            start: "2025-09-12T16:00:00",
            url: "https://example.com/events/3",
            image: "https://via.placeholder.com/300x150.png?text=Firework+Fest",
            venue: "Lenox Square",
            city: "Atlanta",
            is_free: true,
            category: "entertainment"
        },
        {
            id: "4",
            name: "AI & Tech Networking Atlanta",
            start: "2025-10-15T15:00:00",
            url: "https://example.com/events/4",
            image: "https://via.placeholder.com/300x150.png?text=AI+Tech+Networking",
            venue: "Kennesaw State University Kennesaw Campus",
            city: "Kennesaw",
            is_free: true,
            category: "social"
        },
        {
            id: "5",
            name: "Film & Music Dinner",
            start: "2025-07-3T14:00:00",
            url: "https://example.com/events/5",
            image: "https://via.placeholder.com/300x150.png?text=Film+Music+Dinner",
            venue: "Fox Theatre",
            city: "Atlanta",
            is_free: false,
            category: "social"
        },
        {
            id: "6",
            name: "Annual Soccer Event",
            start: "2025-07-14T12:00:00",
            url: "https://example.com/events/6",
            image: "https://via.placeholder.com/300x150.png?text=Annual+Soccer",
            venue: "Kennesaw State University Kennesaw Campus",
            city: "Kennesaw",
            is_free: true,
            category: "sport"
        }
    ];
        res.json({ events: mockEvents, pagination: {page_number: 1, page_count: 1}});
    });
    // POST /users (create new profile after signup)
app.post("/users", async (req, res) => {
  const { uid, username, email, bio, interests = [] } = req.body;
  await db.collection("users").doc(uid).set({
    username, email, bio, interests,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
  res.status(201).json({ message: "User profile created." });
});

// GET /users/:uid  (read profile)
app.get("/users/:uid", async (req, res) => {
  const snap = await db.collection("users").doc(req.params.uid).get();
  if (!snap.exists) return res.status(404).json({ error: "User not found" });
  res.json(snap.data());
});
// POST /events/:eventId/interest   { uid: "abc123", interested: true|false }
app.post("/events/:eventId/interest", async (req, res) => {
  const { uid, interested } = req.body;
  const evRef = db.collection("events").doc(req.params.eventId);

  await db.runTransaction(async t => {
    const evSnap = await t.get(evRef);
    const data = evSnap.exists ? evSnap.data() : {};
    const list = new Set(data.interestedUserIds || []);
    interested ? list.add(uid) : list.delete(uid);
    t.set(evRef, { ...data, interestedUserIds: [...list] }, { merge: true });
  });
  res.json({ message: interested ? "Marked interested" : "Interest removed" });
});
// POST /connections  { uidA, uidB, eventId }
app.post("/connections", async (req, res) => {
  const { uidA, uidB, eventId } = req.body;
  const connId = [uidA, uidB].sort().join("_") + "_" + eventId;
  await db.collection("connections").doc(connId).set({
    users: [uidA, uidB],
    eventId,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
  res.status(201).json({ connectionId: connId });
});
// POST /connections/:connId/messages   { fromUid, text }
app.post("/connections/:connId/messages", async (req, res) => {
  const { fromUid, text } = req.body;
  const msgRef = db.collection("connections")
                   .doc(req.params.connId)
                   .collection("messages")
                   .doc();
  await msgRef.set({
    fromUid,
    text,
    sentAt: admin.firestore.FieldValue.serverTimestamp()
  });
  res.status(201).json({ message: "Sent." });
});

// GET /connections/:connId/messages
app.get("/connections/:connId/messages", async (req, res) => {
  const snap = await db.collection("connections")
                       .doc(req.params.connId)
                       .collection("messages")
                       .orderBy("sentAt","asc")
                       .get();
  res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
});
// GET /events?category=music
app.get("/events", (req, res) => {
  const { category } = req.query;
  let events = mockEvents;            // reuse your mock array
  if (category) events = events.filter(e => e.category === category);
  res.json({ events });
});


// Export Express app as a Firebase HTTPS Cloud Function
export const api = functions.https.onRequest(app);

// Allows use of db in other files
module.exports = db;