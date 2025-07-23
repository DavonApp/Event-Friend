class Preferences {
  constructor(eventTypes = [], ageRange = '', distance = 0) {
    this.eventTypes = eventTypes; // List<String>
    this.ageRange = ageRange;     // String
    this.distance = distance;     // int
  }

  toFirestoreObject() {
    return {
      eventTypes: this.eventTypes,
      ageRange: this.ageRange,
      distance: this.distance
    };
  }

  // converts the firestore document to a JS object
  static fromFirestore(data) {
    return new Preferences({
      eventTypes: data.eventTypes || [],
      ageRange: data.ageRange || '',
      distance: data.distance || 0
    });
  }
}

module.exports = Preferences;
