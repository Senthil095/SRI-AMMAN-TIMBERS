const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Import Routes
const createOrderRoute = require('./routes/createOrder');
const verifyPaymentRoute = require('./routes/verifyPayment');

// Use Routes
app.use('/api', createOrderRoute);
app.use('/api', verifyPaymentRoute);

// Basic health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Backend is running' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
