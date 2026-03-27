const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const User = require('../backend/models/User');

const createFirstAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const adminEmail = 'admin@sliit.lk';
        const adminId = 'ADMIN0001';

        // Check if root admin already exists
        const existingAdmin = await User.findOne({ email: adminEmail });

        if (existingAdmin) {
            console.log('⚠️ Root admin already exists!');
            console.log(`Email: ${adminEmail} | ID: ${existingAdmin.registrationNumber}`);
            process.exit(0);
        }

        // Create the root admin
        const hashedPassword = await bcrypt.hash('Admin@123', 10);

        await User.create({
            name: 'System Administrator',
            email: adminEmail,
            password: hashedPassword,
            registrationNumber: adminId,
            role: 'admin',
            isActivated: true // Already activated!
        });

        console.log('🎉 FIRST ADMIN CREATED SUCCESSFULLY!');
        console.log('------------------------------------');
        console.log(`Login Email:  ${adminEmail}`);
        console.log(`Login Pass:   Admin@123`);
        console.log(`Admin ID:     ${adminId}`);
        console.log('------------------------------------');
        console.log('Please login to the site and use the Admin Panel to whitelist other users.');

    } catch (err) {
        console.error('❌ Error creating admin:', err);
    } finally {
        await mongoose.disconnect();
    }
};

createFirstAdmin();
