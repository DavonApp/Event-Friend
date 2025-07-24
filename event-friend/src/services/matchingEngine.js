const db = require('./firebase');
const Match = require('../classes/match');
const User = require('./user');     
const Event = require('../classes/event'); 

class MatchingEngine {
  static async calculateMatchScore(user1, user2) {
    // Mock logic for counting shared interests 
    const interests1 = new Set(user1.interests || []);
    const interests2 = new Set(user2.interests || []);
    const shared = [...interests1].filter(i => interests2.has(i));
    return shared.length / (interests1.size + interests2.size - shared.length); // Jaccard similarity
  }

  static async findMatchesForUser(user, eventId) {
    const allUsersSnapshot = await db.collection('users').get();
    const matches = [];

    for (const doc of allUsersSnapshot.docs) {
      const otherUserId = doc.id;
      if (otherUserId === user.userId) continue;

      const otherUser = await User.get(otherUserId);
      const matchScore = await this.calculateMatchScore(user, otherUser);

      const matchRef = await db.collection('matches').add({
        user1Id: user.userId,
        user2Id: otherUserId,
        eventId,
        matchScore,
        status: 'pending'
      });

      matches.push(new Match({
        matchId: matchRef.id,
        user1Id: user.userId,
        user2Id: otherUserId,
        eventId,
        matchScore,
        status: 'pending'
      }));
    }

    return matches;
  }
}

module.exports = MatchingEngine;