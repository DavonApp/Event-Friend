class Preferences {
  constructor(eventTypes = [], ageRange = '', distance = 0) {
    this.eventTypes = eventTypes; // List<String>
    this.ageRange = ageRange;     // String
    this.distance = distance;     // int
  }

  updatePreferences({ eventTypes, ageRange, distance }) {
    if (eventTypes) this.eventTypes = eventTypes;
    if (ageRange) this.ageRange = ageRange;
    if (distance) this.distance = distance;
  }
}

module.exports = Preferences;
