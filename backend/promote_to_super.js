const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function promoteAdmins() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const emails = [
      'isururangana2002@gmail.com',
      'manelmapa2000@gmail.com',
      'tikkabanu1998@gmail.com',
      'sonalperera0@gmail.com',
      'dasun@gmail.com'
    ];

    const result = await User.updateMany(
      { email: { $in: emails } },
      { $set: { role: 'super_admin' } }
    );

    console.log(`Successfully promoted ${result.modifiedCount} users to super_admin.`);
    
    const users = await User.find({ email: { $in: emails } });
    users.forEach(u => console.log(`- ${u.email}: ${u.role}`));

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

promoteAdmins();
