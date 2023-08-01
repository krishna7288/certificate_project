const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

// Load environment variables from .env file
require('dotenv').config();

const connectDB = () => {
  const mongodbUri = process.env.MONGODB_URI;
  if (!mongodbUri) {
    console.error('MONGODB_URI environment variable is not defined.');
    return;
  }

  mongoose
    .connect(mongodbUri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
      console.log('Connected to MongoDB');
    })
    .catch((error) => {
      console.error('Failed to connect to MongoDB:', error);
    });
};

module.exports = connectDB;
