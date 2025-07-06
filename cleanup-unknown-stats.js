const mongoose = require('mongoose');

// MongoDB connection
mongoose.connect('mongodb+srv://hanabi261:Maleficent.426@toonnekocluster.1rdsgam.mongodb.net/test?retryWrites=true&w=majority&appName=toonNekoCluster', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// ReadingStats model schema
const readingStatsSchema = new mongoose.Schema({
  userId: String,
  seriesId: String,
  seriesTitle: String,
  chapterNumber: Number,
  totalReads: { type: Number, default: 0 },
  weeklyReads: { type: Number, default: 0 },
  lastRead: { type: Date, default: Date.now }
});

const ReadingStats = mongoose.model('ReadingStats', readingStatsSchema);

async function cleanupUnknownStats() {
  try {
    console.log('🧹 Unknown reading stats temizleniyor...');
    
    // Unknown kayıtlarını bul
    const unknownStats = await ReadingStats.find({
      $or: [
        { seriesId: 'unknown' },
        { seriesTitle: 'Unknown' }
      ]
    });
    
    console.log(`🔍 Bulunan unknown kayıt sayısı: ${unknownStats.length}`);
    
    // Unknown kayıtları sil
    const result = await ReadingStats.deleteMany({
      $or: [
        { seriesId: 'unknown' },
        { seriesTitle: 'Unknown' }
      ]
    });
    
    console.log(`✅ ${result.deletedCount} adet unknown reading stats kaydı silindi`);
    
    // Kalan tüm kayıtları listele
    const allStats = await ReadingStats.find().select('seriesId seriesTitle totalReads');
    console.log('📊 Kalan reading stats:');
    allStats.forEach(stat => {
      console.log(`  - ${stat.seriesId} (${stat.seriesTitle}): ${stat.totalReads} okuma`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Cleanup error:', error);
    process.exit(1);
  }
}

cleanupUnknownStats();
