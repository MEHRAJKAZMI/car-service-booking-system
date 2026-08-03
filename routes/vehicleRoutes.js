const express = require('express');
const router = express.Router();
const {
  createVehicle,
  getMyVehicles,
  getVehicleDetails,
  updateVehicle,
  deleteVehicle
} = require('../controllers/vehicleController');
const { protect } = require('../middlewares/authMiddleware');

// Vehicles are personal to the logged-in user - no special permission needed beyond being logged in.
// A customer manages only their own vehicles.
router.post('/', protect, createVehicle);
router.get('/', protect, getMyVehicles);
router.get('/:id', protect, getVehicleDetails);
router.put('/:id', protect, updateVehicle);
router.delete('/:id', protect, deleteVehicle);

module.exports = router;