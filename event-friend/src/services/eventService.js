const db = require('functions/index')
const Event = require('../classes/event')

class EventService {
  static async fetchEvents() {
    const snapshot = await db.collection('events').get();
    return snapshot.docs.map(doc => {
      return new Event({ eventId: doc.id, ...doc.data() });
    });
  }

  static async getEventById(id) {
    const doc = await db.collection('events').doc(id).get();
    if (!doc.exists) return null;
    return new Event({ eventId: doc.id, ...doc.data() });
  }

  static async addEvent(eventData) {
    const event = new Event(eventData);
    const ref = await db.collection('events').add(event.toFirestoreObject());
    return { eventId: ref.id, ...eventData };
  }

  static async markUserInterest(userId, eventId) {
    const userRef = db.collection('users').doc(userId);
    const event = await this.getEventById(eventId);
    if (!event) throw new Error('Event not found');

    const interestedRef = userRef.collection('interestedEvents').doc(eventId);
    await interestedRef.set(event.toFirestoreObject());

    return event;
  }

  static async getUserInterestedEvents(userId) {
    const snapshot = await db.collection('users').doc(userId).collection('interestedEvents').get();
    return snapshot.docs.map(doc => new Event({ eventId: doc.id, ...doc.data() }));
  }
}

module.exports = EventService;
