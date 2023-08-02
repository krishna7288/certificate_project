const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const UserSchema = new Schema({
  student_name: { type: String, required: true },
  dob: { type: Date, required: true },
  course_name: { type: String, required: true },
  duration: { type: String, required: true },
  mobile_number: { type: Number, required: true },
  certificate_number: { type: String, required: true },
  certificate_file: { type: String }, // Remove required constraint if it's optional
});

const UserModel = model('User', UserSchema);

module.exports = UserModel;
