class Message {
  constructor({ messageId, senderId, receiverId, content, timestamp }) {
    this.messageId = messageId;
    this.senderId = senderId;
    this.receiverId = receiverId;
    this.content = content;
    this.timestamp = timestamp || new Date();
  }

  toFirestoreObject() {
    return {
      senderId: this.senderId,
      receiverId: this.receiverId,
      content: this.content,
      timestamp: this.timestamp
    };
  }

  static fromFirestore(id, data) {
    return new Message({ messageId: id, ...data });
  }
}

module.exports = Message;