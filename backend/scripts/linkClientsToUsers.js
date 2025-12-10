const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Client = require('../models/Client');
const User = require('../models/User');

dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to DB');

    const clients = await Client.find({ $or: [{ user: { $exists: false } }, { user: null }] }).lean();
    console.log(`Found ${clients.length} clients without linked user`);

    let created = 0, linked = 0;
    for (const c of clients) {
      const sq = String(c.phone || '').trim();
      const normalized = sq.replace(/\D/g, '');
      if (!sq) {
        console.log(`Skipping client ${c._id} with empty phone`);
        continue;
      }

      const existingUser = await User.findOne({ $or: [{ phone: sq }, { normalizedPhone: normalized }] });
      if (existingUser) {
        await Client.findByIdAndUpdate(c._id, { user: existingUser._id });
        linked++;
        console.log(`Linked client ${c._id} to existing user ${existingUser._id}`);
        continue;
      }

      let usernameBase = `client_${normalized}`;
      let username = usernameBase;
      let i = 1;
      while (await User.findOne({ username })) {
        username = `${usernameBase}_${i++}`;
      }

      const userData = {
        username,
        role: 'client',
        fullName: c.name || 'Client',
        email: '',
        phone: sq,
        normalizedPhone: normalized,
        isActive: true,
      };

      const newUser = await User.create(userData);
      await Client.findByIdAndUpdate(c._id, { user: newUser._id });
      created++;
      console.log(`Created user ${newUser._id} for client ${c._id}`);
    }

    console.log(`Completed: created=${created}, linked=${linked}`);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

run();
