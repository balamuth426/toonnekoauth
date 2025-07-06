const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../config');

// Kayıt
exports.register = async (req, res) => {
  try {
    const { email, username, password } = req.body;
    if (!email || !username || !password) {
      return res.status(400).json({ message: 'Email, username ve password zorunludur.' });
    }
    const existingEmail = await User.findOne({ email });
    if (existingEmail) return res.status(400).json({ message: 'Email already taken' });
    const existingUsername = await User.findOne({ username });
    if (existingUsername) return res.status(400).json({ message: 'Username already taken' });
    const hashedPassword = await bcrypt.hash(password, 10);
    // Avatarlar dizisi - sadece dosya adları
    const avatars = [
      'bunnygirl.png',
      'catboy.png',
      'foxboy.png',
      'mangagirl.png',
      'witchelf.png',
      'wizardboy.png'
    ];
    const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];
    const newUser = new User({ email, username, password: hashedPassword, avatar: randomAvatar });
    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Giriş
exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier: email veya username
    if (!identifier || !password) {
      return res.status(400).json({ message: 'Email/username ve password zorunludur.' });
    }
    // Önce email ile, yoksa username ile ara
    let user = await User.findOne({ email: identifier });
    if (!user) {
      user = await User.findOne({ username: identifier });
    }
    if (!user) return res.status(400).json({ message: 'User not found' });
    
    // Engelli kullanıcı kontrolü
    if (user.isBlocked) {
      return res.status(403).json({ message: 'Hesabınız engellenmiş. Lütfen yönetici ile iletişime geçin.' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid password' });
    
    // Son giriş tarihini güncelle
    await User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });
    
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1d' });
    res.status(200).json({ 
      token, 
      user: {
        username: user.username,
        email: user.email,
        id: user._id,
        avatar: user.avatar,
        isAdmin: user.isAdmin
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
