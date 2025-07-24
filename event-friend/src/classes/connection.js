class Connection {
  constructor({ connectionId, user1Id, user2Id, status }) {
    this.connectionId = connectionId;
    this.user1Id = user1Id;
    this.user2Id = user2Id;
    this.status = status; // e.g., "pending", "accepted"
  }

  toFirestoreObject() {
    return {
      user1Id: this.user1Id,
      user2Id: this.user2Id,
      status: this.status
    };
  }

  static fromFirestore(id, data) {
    return new Connection({ connectionId: id, ...data });
  }
}

module.exports = Connection;