const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const connectDB = () => {
  mongoose
    .connect("mongodb+srv://dev:xjvcptTN8CZ0G98q@cluster0.ricqecm.mongodb.net/?retryWrites=true&w=majority", { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {     
      console.log('Connected to MongoDB');
    })
    .catch((error) => {
      console.error('Failed to connect to MongoDB:', error);
    });
};

module.exports = connectDB;
