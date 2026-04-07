const mongoose = require('mongoose');
const dns = require('dns').promises;
require('dotenv').config();

async function testConnection() {
  console.log('🔍 Starting MongoDB Diagnostic...\n');

  const MONGODB_URI = process.env.MONGODB_URI;
  console.log('📋 Connection String (masked):');
  console.log(MONGODB_URI.replace(/:[^/]*@/, ':***@'));
  console.log('\n');

  // Extract hostname from connection string
  const hostMatch = MONGODB_URI.match(/@([\w\.-]+)/);
  if (!hostMatch) {
    console.error('❌ Could not parse hostname from connection string');
    return;
  }

  const hostname = hostMatch[1];
  console.log(`🌐 Testing DNS resolution for: ${hostname}`);

  try {
    const addresses = await dns.resolve4(hostname);
    console.log(`✅ DNS resolved: ${addresses.join(', ')}\n`);
  } catch (dnsError) {
    console.error(`❌ DNS resolution failed: ${dnsError.message}`);
    console.error('💡 This could be a network/firewall issue\n');
    return;
  }

  // Test connection with short timeout
  console.log('⏱️ Attempting MongoDB connection (10 second timeout)...');
  const mongooseOptions = {
    family: 4,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 10000,
  };

  try {
    await mongoose.connect(MONGODB_URI, mongooseOptions);
    console.log('✅ MongoDB connected!');
    console.log(`📊 Database: ${mongoose.connection.db.getName()}`);
    process.exit(0);
  } catch (mongoError) {
    console.error(`\n❌ Connection failed: ${mongoError.message}\n`);
    console.error('🔧 Troubleshooting steps:');
    console.error('1. Make sure your IP address is whitelisted in MongoDB Atlas');
    console.error('2. Try adding 0.0.0.0/0 (allows all IPs) temporarily');
    console.error('3. Check if connection string credentials are correct');
    console.error('4. If on a network (school/university), ask IT if MongoDB is blocked');
    console.error('5. Try from a different network (mobile hotspot) to test');
    process.exit(1);
  }
}

testConnection();
