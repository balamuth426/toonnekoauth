const express = require('express');
const nodemailer = require('nodemailer');
const router = express.Router();

// POST /api/contact
router.post('/', async (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ success: false, message: 'Tüm alanlar zorunludur.' });
  }

  try {
    // Check if Gmail app password is configured
    if (!process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_APP_PASSWORD === 'your_gmail_app_password_here') {
      // Development mode - just log to console
      console.log('📧 İletişim Formu Mesajı (Dev Mode):');
      console.log('👤 Ad Soyad:', name);
      console.log('📨 E-posta:', email);
      console.log('📋 Konu:', subject);
      console.log('💬 Mesaj:', message);
      console.log('⚠️  Gmail App Password yapılandırılmadı - sadece console\'a yazdırıldı');
      
      return res.json({ 
        success: true, 
        message: 'Mesajınız alındı (Development Mode - Console\'a yazdırıldı).' 
      });
    }

    // Production mode - send actual email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'toonnekoinfo@gmail.com',
        pass: process.env.GMAIL_APP_PASSWORD // Uygulama şifresi
      }
    });

    const mailOptions = {
      from: 'toonnekoinfo@gmail.com',
      to: 'toonnekoinfo@gmail.com',
      subject: `[ToonNeko İletişim] ${subject}`,
      text: `ToonNeko Web Sitesinden Yeni Mesaj
      
Gönderen Bilgileri:
━━━━━━━━━━━━━━━━━━━━
👤 Ad Soyad: ${name}
📧 E-posta: ${email}
📋 Konu: ${subject}

Mesaj İçeriği:
━━━━━━━━━━━━━━━━━━━━
💬 ${message}

━━━━━━━━━━━━━━━━━━━━
Bu mesaj ToonNeko web sitesi iletişim formundan gönderilmiştir.
Yanıtlamak için doğrudan bu e-postaya reply yapabilirsiniz.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="color: #333; text-align: center; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
            📬 ToonNeko Web Sitesinden Yeni Mesaj
          </h2>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #495057; margin-top: 0;">Gönderen Bilgileri:</h3>
            <p><strong>👤 Ad Soyad:</strong> ${name}</p>
            <p><strong>📧 E-posta:</strong> <a href="mailto:${email}">${email}</a></p>
            <p><strong>📋 Konu:</strong> ${subject}</p>
          </div>
          
          <div style="background-color: #fff; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0;">
            <h3 style="color: #495057; margin-top: 0;">💬 Mesaj İçeriği:</h3>
            <p style="line-height: 1.6; color: #333;">${message.replace(/\n/g, '<br>')}</p>
          </div>
          
          <div style="text-align: center; padding-top: 20px; border-top: 1px solid #ddd; color: #6c757d; font-size: 12px;">
            Bu mesaj ToonNeko web sitesi iletişim formundan gönderilmiştir.<br>
            Yanıtlamak için doğrudan bu e-postaya reply yapabilirsiniz.
          </div>
        </div>
      `,
      replyTo: email
    };

    await transporter.sendMail(mailOptions);

    res.json({ success: true, message: 'Mesajınız başarıyla gönderildi.' });
  } catch (error) {
    console.error('İletişim formu gönderim hatası:', error);
    res.status(500).json({ success: false, message: 'Mesaj gönderilemedi.' });
  }
});

module.exports = router;
