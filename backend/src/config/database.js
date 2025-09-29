const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URL || 'mongodb://admin:password123@localhost:27017/nordicos_awards?authSource=admin';
    
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 5
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    await createAdminUser();
    
    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const createAdminUser = async () => {
  try {
    const User = require('../models/User');
    
    const adminExists = await User.findOne({ 
      $or: [
        { username: process.env.ADMIN_USERNAME || 'admin' },
        { email: process.env.ADMIN_EMAIL || 'admin@nordicosawards.com' }
      ]
    });

    if (adminExists) {
      if (!adminExists.password) {
        console.log('⚠️  Admin user exists but has no password, recreating...');
        await User.deleteOne({ _id: adminExists._id });
      } else {
        console.log('ℹ️  Admin user already exists with password');
        return;
      }
    }

    const adminUser = new User({
      username: process.env.ADMIN_USERNAME || 'admin',
      email: process.env.ADMIN_EMAIL || 'admin@nordicosawards.com',
      fullName: 'Administrator',
      password: process.env.ADMIN_PASSWORD || 'admin123',
      role: 'admin'
    });

    await adminUser.save();
    console.log('✅ Admin user created successfully');
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('🔌 MongoDB disconnected');
  } catch (error) {
    console.error('❌ Error disconnecting from MongoDB:', error.message);
  }
};

module.exports = {
  connectDB,
  disconnectDB
};