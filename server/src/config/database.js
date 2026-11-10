const mongoose = require('mongoose');
const config = require('./env');

let isConnected = false;

async function connectDB() {
  if (isConnected) {
    return mongoose.connection;
  }

  if (!config.mongoUri) {
    throw new Error('MONGODB_URI is not defined in the environment configuration.');
  }

  try {
    const conn = await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 8000,
      autoIndex: true
    });
    isConnected = true;
    console.log(`[MongoDB] Connected to database: ${conn.connection.name} on host: ${conn.connection.host}`);
    return conn.connection;
  } catch (error) {
    console.error('[MongoDB] Connection error:', error.message);
    throw error;
  }
}

async function closeDB() {
  if (isConnected) {
    await mongoose.connection.close();
    isConnected = false;
    console.log('[MongoDB] Connection closed.');
  }
}

module.exports = {
  connectDB,
  closeDB,
  getConnection: () => mongoose.connection
};

