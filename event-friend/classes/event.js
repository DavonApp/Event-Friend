// event.js
class Event {
  constructor({ eventId, title, description, location, dateTime, category }) {
    this.eventId = eventId;
    this.title = title;
    this.description = description;
    this.location = location;
    this.dateTime = dateTime;
    this.category = category;
  }

  toFirestoreObject() {
    return {
      title: this.title,
      description: this.description,
      location: this.location,
      dateTime: this.dateTime,
      category: this.category
    };
  }
}

module.exports = Event;
