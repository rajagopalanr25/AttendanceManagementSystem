const mongoose = require('mongoose');

let mongod = null;

const connectDB = async () => {
  let mongoUri = process.env.MONGODB_URI;

  // If remote Atlas URI is provided (e.g. mongodb+srv://), connect directly to it
  if (mongoUri && !mongoUri.includes('127.0.0.1') && !mongoUri.includes('localhost')) {
    try {
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
      console.log('Connected to Remote MongoDB Atlas successfully.');
      return;
    } catch (err) {
      console.error('Remote MongoDB Atlas connection failed:', err.message);
      console.log('Falling back to local development database...');
    }
  }

  // If local URI, try to connect to local mongod service first
  if (mongoUri && (mongoUri.includes('127.0.0.1') || mongoUri.includes('localhost'))) {
    try {
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 1500 });
      console.log(`Connected to local MongoDB service: ${mongoUri}`);
      return;
    } catch (err) {
      console.log('Local MongoDB service not running. Starting embedded MongoMemoryServer for instant zero-config operation...');
    }
  }

  // Embedded MongoMemoryServer fallback for development & zero-dependency execution
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongod = await MongoMemoryServer.create();
    const memoryUri = mongod.getUri();
    await mongoose.connect(memoryUri);
    console.log(`Connected to embedded MongoMemoryServer at ${memoryUri}`);
  } catch (error) {
    console.error('Failed to initialize MongoDB database:', error.message);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
};

module.exports = { connectDB, disconnectDB };
