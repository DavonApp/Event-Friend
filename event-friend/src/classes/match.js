class Match {
  constructor({ matchId, user1Id, user2Id, eventId, matchScore = 0, status = 'pending' }) {
    this.matchId = matchId;
    this.user1Id = user1Id;
    this.user2Id = user2Id;
    this.eventId = eventId;
    this.matchScore = matchScore;
    this.status = status;
  }

  toFirestoreObject() {
    return {
      user1Id: this.user1Id,
      user2Id: this.user2Id,
      eventId: this.eventId,
      matchScore: this.matchScore,
      status: this.status
    };
  }

  static fromFirestore(id, data) {
    return new Match({ matchId: id, ...data });
  }
}

module.exports = Match;