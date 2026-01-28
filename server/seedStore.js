require('dotenv').config();
const mongoose = require('mongoose');
const BirdWeapon = require('./models/BirdWeapon');

const weapons = [
  {
    name: "Basic Wooden Bow",
    key: "basic_bow",
    type: "bow",
    damage: 1,
    fireRate: 600,
    accuracy: 0.8,
    price: 0, // Free starter
    perks: { headshotMultiplier: 1.5, windResistance: 0.1 }
  },
  {
    name: "Recurve Hunter",
    key: "recurve_bow",
    type: "bow",
    damage: 1.5,
    fireRate: 500,
    accuracy: 0.9,
    price: 100,
    perks: { headshotMultiplier: 2.0, windResistance: 0.3 }
  },
  {
    name: "Standard Airgun",
    key: "std_airgun",
    type: "airgun",
    damage: 1.2,
    fireRate: 300,
    accuracy: 0.95,
    price: 250,
    perks: { headshotMultiplier: 1.2, windResistance: 0.5 }
  },
  {
    name: "Shadow Sniper (Elite)",
    key: "shadow_sniper",
    type: "airgun",
    damage: 2.5,
    fireRate: 200,
    accuracy: 1.0,
    price: 1000,
    perks: { headshotMultiplier: 3.0, windResistance: 0.9 }
  }
];

const seedStore = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for seeding store...');
    
    for (const w of weapons) {
      await BirdWeapon.findOneAndUpdate({ key: w.key }, w, { upsert: true, new: true });
    }
    
    console.log('✅ Store seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedStore();
