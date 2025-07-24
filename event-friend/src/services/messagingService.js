const db = require('./firebase');
const Message = require('../classes/message');

class MessagingService {
  static async sendMessage(sender, receiver, content) {
    const message = new Message({
      messageId: null, // let Firestore generate the ID
      senderId: sender.userId,
      receiverId: receiver.userId,
      content,
      timestamp: new Date()
    });

    const ref = await db.collection('messages').add(message.toFirestoreObject());
    message.messageId = ref.id;
    return message;
  }

  static async getMessagesBetween(user1, user2) {
    const snapshot = await db.collection('messages')
      .where('senderId', 'in', [user1.userId, user2.userId])
      .where('receiverId', 'in', [user1.userId, user2.userId])
      .orderBy('timestamp', 'asc')
      .get();

    return snapshot.docs
      .map(doc => Message.fromFirestore(doc.id, doc.data()))
      .filter(msg =>
        (msg.senderId === user1.userId && msg.receiverId === user2.userId) ||
        (msg.senderId === user2.userId && msg.receiverId === user1.userId)
      );
  }
}

module.exports = MessagingService;