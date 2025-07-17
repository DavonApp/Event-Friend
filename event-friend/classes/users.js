const Preferences = require('./preferences');

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

  getProfile() {
    return {
      userId: this.userId,
      name: this.name,
      email: this.email,
      bio: this.bio,
      city: this.city,
      profilePhoto: this.profilePhoto,
      interests: this.interests,
      preferences: this.preferences
    };
  }

  updateProfile({ name, email, password, bio, city, profilePhoto, interests }) {
    if (name) this.name = name;
    if (email) this.email = email;
    if (password) this.password = password;
    if (bio) this.bio = bio;
    if (city) this.city = city;
    if (profilePhoto) this.profilePhoto = profilePhoto;
    if (interests) this.interests = interests;
  }
}

module.exports = User;
