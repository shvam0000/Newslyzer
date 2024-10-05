// models/User.js
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  auth0Id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  picture: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  savedArticles: [
    {
      id: { type: String, required: true },
      title: { type: String, required: true },
      content: { type: String, required: true },
    },
  ],
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
