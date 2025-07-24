const db = require('./firebase');
const Event = require('./event');
const Match = require('./match');
const Message = require('./message');

class Dashboard {
  static async getUserEvents(user) {
    const snapshot = await db.collection('users')
      .doc(user.userId)
      .collection('interestedEvents')
      .get();

    return snapshot.docs.map(doc => Event.fromFirestore(doc.id, doc.data()));
  }

  static async getUserMatches(user) {
    const snapshot = await db.collection('matches')
      .where('user1Id', '==', user.userId)
      .get();

    const snapshot2 = await db.collection('matches')
      .where('user2Id', '==', user.userId)
      .get();

    const allMatches = [...snapshot.docs, ...snapshot2.docs];
    return allMatches.map(doc => Match.fromFirestore(doc.id, doc.data()));
  }

  static async getMessages(user) {
    const snapshot = await db.collection('messages')
      .where('senderId', '==', user.userId)
      .get();

    const snapshot2 = await db.collection('messages')
      .where('receiverId', '==', user.userId)
      .get();

    const allMessages = [...snapshot.docs, ...snapshot2.docs];
    const unique = new Map();

    for (const doc of allMessages) {
      if (!unique.has(doc.id)) {
        unique.set(doc.id, Message.fromFirestore(doc.id, doc.data()));
      }
    }

    return [...unique.values()].sort((a, b) => a.timestamp - b.timestamp);
  }
}

module.exports = Dashboard;