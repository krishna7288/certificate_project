const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const connectDB = () => {
  mongoose
    .connect("mongodb+srv://alliswellya23:LFaVJdsm5MIKxhUu@cluster0.fg8dloe.mongodb.net/mydatabase?retryWrites=true&w=majority", { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
      console.log('Connected to MongoDB');
    })
    .catch((error) => {
      console.error('Failed to connect to MongoDB:', error);
    });
};

module.exports = connectDB;
