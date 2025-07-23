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

    let filteredEvents = mockEvents;
    if (category) {
      filteredEvents = mockEvents.filter(e => e.category === category);
    }

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