require('dotenv').config();

const express = require('express');
const authRoutes = require('./routes/authRoutes');
const connectDB = require('./config/db');

connectDB();

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
  res.send('Car Service Booking System API is running v2');
});

app.use('/api/auth', authRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});