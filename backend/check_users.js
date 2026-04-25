const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function checkAdmins() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const admins = await User.find({ role: { $in: ['admin', 'super_admin'] } });
    console.log('--- Admin Users ---');
    admins.forEach(u => {
      console.log(`Email: ${u.email} | Role: ${u.role} | Activated: ${u.isActivated} | ID: ${u.registrationNumber}`);
    });
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkAdmins();
