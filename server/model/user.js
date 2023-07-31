const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const UserSchema = new Schema({
  student_name: { type: String},
  dob: { type: Date },
  course_name: { type: String },
  duration: { type: String },
  mobile_number: { type: Number },
  certificate_number: { type: String },
  certificate_file: { type: String }, // Remove required constraint if it's optional
});

const UserModel = model('User', UserSchema);

module.exports = UserModel;