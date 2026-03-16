require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Branch = require('./models/Branch');
const Student = require('./models/Student');
const Teacher = require('./models/Teacher');
const Fee = require('./models/Fee');
const Attendance = require('./models/Attendance');
const Mark = require('./models/Mark');

const cleanup = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB for cleanup...');

        // Collections to clear entirely
        const clearEntirely = [Branch, Student, Teacher, Fee, Attendance, Mark];
        for (const model of clearEntirely) {
            await model.deleteMany({});
            console.log(`✅ Cleared ${model.modelName} collection`);
        }

        // Clear users except admin
        const result = await User.deleteMany({ loginId: { $ne: 'ionodecloud@gmail.com' } });
        console.log(`✅ Deleted ${result.deletedCount} dummy users`);
        
        const admin = await User.findOne({ loginId: 'ionodecloud@gmail.com' });
        if (admin) {
            console.log('👑 Admin user preserved:', admin.loginId);
        } else {
            console.log('⚠️ Admin user not found! You might need to re-seed the admin.');
        }

        console.log('\n🎉 Cleanup complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Cleanup failed:', error);
        process.exit(1);
    }
};

cleanup();
