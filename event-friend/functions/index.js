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

// Middleware: parse JSON bodies (important for POST requests)
app.use(express.json());

// Middleware: allows requests from frontend, allow all origins for now
app.use(cors({ origin: true }));

// Security middleware
app.use(helmet());

// Get /events
app.get("/events", (req, res) => {
  const category = req.query.category; // Get ?category=something from the URL

  // Mock events
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
      image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80"
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
      image: "https://sportsradioamerica.com/wp-content/uploads/1200x628.png"
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
      image: "https://images.unsplash.com/photo-1543269865-cbf427effbad?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80"
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
      image: "https://www.ajc.com/resizer/v2/5A3I2CM7YWU475BEVGPMYYXBE4.jpg?auth=32ad4d049ce9a861fe8e29b77e65bf11b6ea5bbe184b9e01ceaa067f1d453eee&width=1600&height=900&smart=true"
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
    res.status(201).json({ id: docRef.id });
  } catch (error) {
    console.error("Error adding event:", error);
    res.status(500).send("Error adding event");
  }
});

// GET event by ID
app.get("/events/:id", async (req, res) => {
  try {
    const eventId = req.params.id;
    const doc = await db.collection("events").doc(eventId).get();

    if (!doc.exists) {
      return res.status(404).send("Event not found");
    }
    res.status(200).json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error("Error finding event:", error);
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
    console.error("Error fetching user's interested events:", error);
    res.status(500).send("Error fetching user's interested events");
  }
});

// POST /users (create new profile after signup)
app.post("/users", async (req, res) => {
  try {
    const { uid, username, email, bio, interests = [] } = req.body;
    await db.collection("users").doc(uid).set({
      username, email, bio, interests,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    res.status(201).json({ message: "User profile created." });
  } catch (error) {
    console.error("Error creating user profile:", error);
    res.status(500).send("Error creating user profile");
  }
});

// GET /users/:uid — serve user info from Firebase Auth only, no Firestore needed
app.get("/users/:uid", async (req, res) => {
  try {
    const uid = req.params.uid;
    const userRecord = await auth.getUser(uid); // get user info from Firebase Auth

    res.json({
      username: userRecord.displayName || "", // or empty string if none
      email: userRecord.email || "",
      city: "",     // no city stored in Auth, so empty
      bio: "",      // no bio stored in Auth
      interests: [],// no interests stored
    });
  } catch (error) {
    console.error("Error fetching user from Firebase Auth:", error);
    res.status(404).json({ error: "User not found" });
  }
});


// PUT update user profile
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
    console.error("Error updating preferences:", error);
    res.status(500).send("Error updating preferences");
  }
});

// POST /events/:eventId/interest   { uid: "abc123", interested: true|false }
app.post("/events/:eventId/interest", async (req, res) => {
  try {
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
  } catch (error) {
    console.error("Error updating event interest:", error);
    res.status(500).send("Error updating event interest");
  }
});

// POST /connections  { uidA, uidB, eventId }
app.post("/connections", async (req, res) => {
  try {
    const { uidA, uidB, eventId } = req.body;
    const connId = [uidA, uidB].sort().join("_") + "_" + eventId;
    await db.collection("connections").doc(connId).set({
      users: [uidA, uidB],
      eventId,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    res.status(201).json({ connectionId: connId });
  } catch (error) {
    console.error("Error creating connection:", error);
    res.status(500).send("Error creating connection");
  }
});

// POST /connections/:connId/messages   { fromUid, text }
app.post("/connections/:connId/messages", async (req, res) => {
  try {
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
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).send("Error sending message");
  }
});

// GET /connections/:connId/messages
app.get("/connections/:connId/messages", async (req, res) => {
  try {
    const snap = await db.collection("connections")
                         .doc(req.params.connId)
                         .collection("messages")
                         .orderBy("sentAt","asc")
                         .get();
    res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch (error) {
    console.error("Error getting messages:", error);
    res.status(500).send("Error getting messages");
  }
});

// Export Express app as a Firebase HTTPS Cloud Function
export const api = functions.https.onRequest(app);

// Export Firestore database for use in other files
export { db };
