const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bidcart';

    // Mongoose debug mode disabled for cleaner console

    // Clear any existing connection
    if (mongoose.connection.readyState === 1) {
      console.log('Using existing database connection');
      return mongoose.connection;
    }

    const options = {
      serverSelectionTimeoutMS: 5000, // 5 seconds timeout
      socketTimeoutMS: 10000, // 10 seconds socket timeout
      maxPoolSize: 10,
      retryWrites: true,
      w: 'majority'
    };

    // Set up event listeners before connecting
    mongoose.connection.on('connected', () => {
      // Silent connection success
    });

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    // Connect to MongoDB
    const connection = await mongoose.connect(mongoUri, options);

    // Verify the connection is ready
    if (mongoose.connection.readyState !== 1) {
      await new Promise(resolve => mongoose.connection.once('connected', resolve));
    }

    return connection;

  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;