const mongoose = require('mongoose');
const User = require('../models/User');
const config = require('../config');

const avatars = [
  'images/avatars/avatar1.png',
  'images/avatars/avatar2.png',
  'images/avatars/avatar3.png',
  'images/avatars/avatar4.png',
  'images/avatars/avatar5.png',
  'images/avatars/avatar6.png'
];

async function assignAvatars() {
  await mongoose.connect(config.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const users = await User.find({});
  for (const user of users) {
    if (!user.avatar) {
      const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];
      user.avatar = randomAvatar;
      await user.save();
      console.log(`Avatar assigned to user: ${user.username}`);
    }
  }
  await mongoose.disconnect();
  console.log('Avatar assignment complete.');
}

assignAvatars().catch(console.error);
