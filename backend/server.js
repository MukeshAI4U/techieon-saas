const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Techieon API is running!' });
});

app.use('/api/leads', require('./routes/leads.js'));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
