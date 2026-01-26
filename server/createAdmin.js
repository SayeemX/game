const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/khelazone';

async function createAdmin() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const username = 'admin';
    const password = 'adminpassword123';

    let user = await User.findOne({ username });
    if (user) {
        user.role = 'admin';
        console.log('User already exists. Promoting to admin...');
    } else {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        user = new User({
            username,
            password: hashedPassword,
            role: 'admin',
            wallet: { mainBalance: 1000, spinCredits: 50 }
        });
        console.log('Creating new admin user...');
    }

    await user.save();
    console.log(`Admin created/updated: ${username}`);
    console.log(`Password: ${password}`);
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

createAdmin();
