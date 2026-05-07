require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const apiRoutes = require('./routes/api');
const Category = require('./models/Category');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health Check Routes
app.get('/', (req, res) => res.json({ status: 'Server is running', environment: process.env.NODE_ENV }));
app.get('/api/health', (req, res) => res.json({ status: 'API is healthy' }));

// Security Middleware: Check for API Key
const API_KEY = process.env.APP_API_KEY || 'flous_chhar_secret_2026';
app.use((req, res, next) => {
  const clientKey = req.headers['x-api-key'];
  if (clientKey !== API_KEY) {
    return res.status(401).json({ message: 'Unauthorized: Invalid API Key' });
  }
  next();
});

app.use('/api', apiRoutes);

const connectWithRetry = () => {
  console.log('Attempting MongoDB connection...');
  mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
      console.log('Connected to MongoDB');
      
      // Seed initial categories if empty
      const count = await Category.countDocuments();
      if (count === 0) {
        console.log('Seeding initial categories...');
        const initialCategories = [
          { name: 'Food', icon: 'utensils', color: '#ff6b6b' },
          { name: 'Transport', icon: 'car', color: '#4dabf7' },
          { name: 'Rent', icon: 'home', color: '#51cf66' },
          { name: 'Health', icon: 'heart', color: '#f06595' },
          { name: 'Shopping', icon: 'shopping-bag', color: '#cc5de8' },
          { name: 'Others', icon: 'more-horizontal', color: '#868e96' },
        ];
        await Category.insertMany(initialCategories);
        console.log('Seeding complete.');
      }
    })
    .catch(err => {
      console.error('MongoDB connection error, retrying in 5 seconds...', err);
      setTimeout(connectWithRetry, 5000);
    });
};

connectWithRetry();

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
