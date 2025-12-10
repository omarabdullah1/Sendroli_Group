const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to DB. Searching users with phone...');

    const users = await User.find({ phone: { $exists: true, $ne: null } }).lean();
    console.log(`Found ${users.length} users with phone.`);

    let updated = 0;
    for (const user of users) {
      const normalized = String(user.phone).replace(/\D/g, '');
      if (!user.normalizedPhone || user.normalizedPhone !== normalized) {
        await User.findByIdAndUpdate(user._id, { normalizedPhone: normalized });
        updated++;
      }
    }

    console.log(`Migration complete. Updated ${updated} user(s).`);
    process.exit(0);
  } catch (e) {
    console.error('Migration failed:', e);
    process.exit(1);
  }
}

migrate();
