const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  // The customer who owns this vehicle
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  make: {
    type: String,
    required: true,
    trim: true
  },
  model: {
    type: String,
    required: true,
    trim: true
  },
  year: {
    type: Number,
    required: true
  },
  plateNumber: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  color: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

module.exports = Vehicle;