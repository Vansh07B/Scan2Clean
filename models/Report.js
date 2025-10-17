const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  location: String,
  date: String,
  time: String,
  description: String,
  image: String, // store image filename
  resolved: { type: Boolean, default: false }, // new field
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Report', reportSchema);
