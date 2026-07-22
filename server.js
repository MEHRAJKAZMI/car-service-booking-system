const express = require('express');

const app = express();

require('dotenv').config();
const PORT = process.env.PORT || 5000;




app.get('/', (req, res) => {
  res.send('Car Service Booking System API is running v2');
});
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
