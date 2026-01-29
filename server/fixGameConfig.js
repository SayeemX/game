require('dotenv').config();
const mongoose = require('mongoose');
const Game = require('./models/Game');

const fixConfig = async () => {
  try {
    const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    await Game.deleteMany({});
    console.log('✅ Cleared old Game configurations');

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

fixConfig();
