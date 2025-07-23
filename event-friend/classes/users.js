const Preferences = require('./preferences');
const db = require('functions/index')

class User {
  constructor({
    userId,
    name,
    email,
    password,
    bio = '',
    city = '',
    profilePhoto = '',
    interests = [],
    preferences = new Preferences()
  }) {
    this.userId = userId;         // String
    this.name = name;             // String
    this.email = email;           // String
    this.password = password;     // String
    this.bio = bio;               // String
    this.city = city;             // String
    this.profilePhoto = profilePhoto; // String
    this.interests = interests;   // List<String>
    this.preferences = preferences; // Preferences object
  }

  toFirestoreObject() {
    return {
      name: this.name,
      email: this.email,
      password: this.password,
      bio: this.bio,
      city: this.city,
      profilePhoto: this.profilePhoto,
      interests: this.interests
    };
  }

  static async get(userId) {
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) return null;

    const userData = userDoc.data();

    // Get preferences subdoc
    const prefDoc = await db.collection('users').doc(userId).collection('preferences').doc('main').get();
    const preferences = prefDoc.exists ? Preferences.fromFirestore(prefDoc.data()) : null;

    return new User({
      userId,
      ...userData,
      preferences
    });
  }

  async save() {
    await db.collection('users').doc(this.userId).set(this.toFirestoreObject());
    if (this.preferences) {
      await db.collection('users').doc(this.userId).collection('preferences').doc('main').set(this.preferences.toFirestoreObject());
    }
  }

  async updateProfile(data) {
    Object.assign(this, data);
    await db.collection('users').doc(this.userId).update(this.toFirestoreObject());
  }

  async updatePreferences(newPrefs) {
    this.preferences = new Preferences(newPrefs);
    await db.collection('users').doc(this.userId).collection('preferences').doc('main').set(this.preferences.toFirestoreObject());
  }
}

module.exports = User;
