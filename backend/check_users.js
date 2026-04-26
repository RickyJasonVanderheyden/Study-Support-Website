const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const users = await User.find({ email: { $in: ['isururangana2002@gmail.com', 'manelmapa2000@gmail.com', 'tikkabanu1998@gmail.com'] } });
  console.log(users.map(u => ({ email: u.email, role: u.role, isActivated: u.isActivated, roleRequest: u.roleRequest })));
  process.exit(0);
});
