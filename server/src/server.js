require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/db');
const User = require('./models/User');
const seedData = require('./seed/seed');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    // Check if database is empty; if so, seed automatically
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('No user records detected in database. Auto-populating initial sample data...');
      await seedData();
    }

    app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      console.log(`Health endpoint: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
