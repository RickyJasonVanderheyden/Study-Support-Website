const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const User = require('../backend/models/User');

const identifier = process.argv[2];

if (!identifier) {
    console.error('Please provide an email or IT Number as an argument.');
    process.exit(1);
}

const promoteToAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const user = await User.findOne({
            $or: [
                { email: identifier },
                { registrationNumber: identifier }
            ]
        });

        if (!user) {
            console.error(`User with identifier ${identifier} not found.`);
            process.exit(1);
        }

        user.role = 'admin';
        await user.save();

        console.log(`Successfully promoted ${user.name} (${user.registrationNumber || user.email}) to admin.`);
    } catch (err) {
        console.error('Error promoting user:', err);
    } finally {
        await mongoose.disconnect();
    }
};

promoteToAdmin();
