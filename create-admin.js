// Admin kullanıcı oluşturma scripti
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User'); // User model'inizi kontrol edin

async function createAdmin() {
    try {
        // MongoDB'ye bağlan
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB bağlantısı başarılı');

        // Mevcut admin kontrol et
        const existingAdmin = await User.findOne({ username: 'balamuth' });
        if (existingAdmin) {
            console.log('Admin kullanıcı zaten mevcut');
            // Admin rolünü güncelle
            existingAdmin.role = 'admin';
            existingAdmin.isActive = true;
            await existingAdmin.save();
            console.log('Admin rolü güncellendi');
        } else {
            // Yeni admin oluştur
            const hashedPassword = await bcrypt.hash('balamuth', 12);
            
            const adminUser = new User({
                username: 'balamuth',
                email: 'admin@toonneko.com',
                password: hashedPassword,
                role: 'admin',
                isActive: true,
                createdAt: new Date()
            });

            await adminUser.save();
            console.log('Admin kullanıcı başarıyla oluşturuldu!');
            console.log('Username: balamuth');
            console.log('Password: balamuth');
        }

        process.exit(0);
    } catch (error) {
        console.error('Hata:', error);
        process.exit(1);
    }
}

createAdmin();
