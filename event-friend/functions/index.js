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

// Get /events
app.get("/events", (req, res) => {
  const category = req.query.category; // Get ?category=something from the URL

  // Mock events
  const mockEvents = [
  {
    id: "1",
    name: "Food Festival",
    description: "A great food event!",
    category: "Food",
    date: "2025-07-25",
    location: "New York City",
    start: "2025-07-25T12:00:00",
    city: "New York",
    venue: "Central Park",
    image: "https://source.unsplash.com/400x300/?food"
  },
  {
    id: "2",
    name: "Tech Meetup",
    description: "Meet fellow developers.",
    category: "Tech",
    date: "2025-07-30",
    location: "San Francisco",
    start: "2025-07-30T18:00:00",
    city: "San Francisco",
    venue: "SF Conference Center",
    image: "https://source.unsplash.com/400x300/?technology"
  },
  {
    id: "3",
    name: "Music Bash",
    description: "Live music from top artists.",
    category: "Music",
    date: "2025-08-10",
    location: "Los Angeles",
    start: "2025-08-10T20:00:00",
    city: "Los Angeles",
    venue: "LA Stadium",
    image: "https://source.unsplash.com/400x300/?concert"
  },
  {
    id: "4",
    name: "Art Show",
    description: "See amazing artwork.",
    category: "Art",
    date: "2025-08-20",
    location: "Chicago",
    start: "2025-08-20T10:00:00",
    city: "Chicago",
    venue: "Art Institute of Chicago",
    image: "https://source.unsplash.com/400x300/?art"
  }
];


  // Filter by category if provided
  let filteredEvents = mockEvents;
  if (category) {
    filteredEvents = mockEvents.filter(e => e.category.toLowerCase() === category.toLowerCase());
  }

  // Send back the mock data
  res.json({
    events: filteredEvents,
    pagination: {
      page_number: 1,
      page_count: 1
    }
  });
});

    // POST new event
    app.post("/events", async (req, res) => {
      try {
        const event = req.body;
        const docRef = await db.collection("events").add(event);
        res.status(201).json({id: docRef.id});
      } catch(error) {
        res.status(500).send("Error adding event")
      }
    });
    // GET event by ID
    app.get("/events/:id", async (req, res) =>{
      try {
        const eventId = req.params.id;
        const doc = await db.collection("events").doc(eventId).get();

        if (!doc.exists) {
          return res.status(404).send("Event not found");
        }
        res.status(200).json({id: doc.id, ...doc.data()});
        } catch (error) {
          res.status(500).send("Error finding event"); 
      }
    });
    // GET user's interested events  
    app.get("/users/:uid/interested", async (req, res) => {
      try {
        const { uid } = req.params;
        const snapshot = await db.collection("users")
          .doc(uid).collection("interestedEvents").get();

        const eventIds = snapshot.docs.map(doc => doc.id);
        res.status(200).json({ interestedEventIds: eventIds });
      } catch (error) {
        res.status(500).send("Error fetching user's interested events");
      }
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
// PUT update user profile
app.put("/users/:uid", async (req, res) => {
  try {
    const { uid } = req.params;
    await db.collection("users").doc(uid).update(req.body);
    res.status(200).send("User updated");
  } catch (error) {
    res.status(500).send("Error updating user");
  }
});
// PUT update user preferences
app.put("/users/:uid/preferences", async (req, res) => {
  try {
    const { uid } = req.params;
    const preferences = req.body;

    await db.collection("users").doc(uid).update({
      preferences: preferences
    });

    res.status(200).send("Preferences updated");
  } catch (error) {
    res.status(500).send("Error updating preferences");
  }
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


// Export Express app as a Firebase HTTPS Cloud Function
export const api = functions.https.onRequest(app);

// Allows use of db in other files
module.exports = db;