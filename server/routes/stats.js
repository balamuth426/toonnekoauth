const express = require('express');
const router = express.Router();
const ReadingStats = require('../models/ReadingStats');

// SeriesId normalization fonksiyonu
function normalizeSeriesId(seriesId) {
  if (!seriesId) return seriesId;
  
  // URL decode
  let normalized = decodeURIComponent(seriesId);
  
  // Küçük harfe çevir
  normalized = normalized.toLowerCase();
  
  // Boşlukları kaldır
  normalized = normalized.replace(/\s+/g, '');
  
  // "chapters" suffix'ini kaldır
  normalized = normalized.replace(/chapters?$/i, '');
  
  // Özel karakter temizleme
  normalized = normalized.replace(/[^a-z0-9]/g, '');
  
  return normalized;
}

// Bölüm okunma sayısını artır
router.post('/track', async (req, res) => {
  try {
    const { seriesId: rawSeriesId, chapterNumber, seriesTitle, chapterTitle } = req.body;
    
    if (!rawSeriesId || !chapterNumber || !seriesTitle) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // SeriesId'yi normalize et
    const seriesId = normalizeSeriesId(rawSeriesId);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(now.getTime() - (now.getDay() * 24 * 60 * 60 * 1000));

    // Mevcut kayıt var mı kontrol et
    let stats = await ReadingStats.findOne({ seriesId, chapterNumber });
    
    if (stats) {
      // Günlük reset kontrolü
      if (stats.dailyResetDate < today) {
        stats.dailyReads = 0;
        stats.dailyResetDate = today;
      }
      
      // Haftalık reset kontrolü
      if (stats.weeklyResetDate < thisWeek) {
        stats.weeklyReads = 0;
        stats.weeklyResetDate = thisWeek;
      }
      
      // Okuma sayılarını artır
      stats.totalReads += 1;
      stats.weeklyReads += 1;
      stats.dailyReads += 1;
      stats.lastRead = now;
      
      // Seri ve bölüm başlığını güncelle (değişmiş olabilir)
      stats.seriesTitle = seriesTitle;
      if (chapterTitle) stats.chapterTitle = chapterTitle;
      
      await stats.save();
    } else {
      // Yeni kayıt oluştur
      stats = new ReadingStats({
        seriesId,
        chapterNumber,
        seriesTitle,
        chapterTitle: chapterTitle || `Bölüm ${chapterNumber}`,
        totalReads: 1,
        weeklyReads: 1,
        dailyReads: 1,
        lastRead: now,
        weeklyResetDate: thisWeek,
        dailyResetDate: today
      });
      
      await stats.save();
    }

    res.json({ 
      success: true, 
      totalReads: stats.totalReads,
      weeklyReads: stats.weeklyReads,
      dailyReads: stats.dailyReads
    });
    
  } catch (error) {
    console.error('Reading tracking error:', error);
    res.status(500).json({ error: 'Failed to track reading' });
  }
});

// Haftalık popüler bölümler (son 7 gün)
router.get('/weekly-popular', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const weeklyPopular = await ReadingStats.find({
      lastRead: { $gte: sevenDaysAgo },
      weeklyReads: { $gt: 0 }
    })
    .sort({ weeklyReads: -1, lastRead: -1 })
    .limit(limit)
    .lean();

    res.json({ success: true, data: weeklyPopular });
    
  } catch (error) {
    console.error('Weekly popular error:', error);
    res.status(500).json({ error: 'Failed to get weekly popular' });
  }
});

// Tüm zamanların en popülerleri
router.get('/all-time-popular', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 15;
    
    const allTimePopular = await ReadingStats.find({
      totalReads: { $gt: 0 }
    })
    .sort({ totalReads: -1, lastRead: -1 })
    .limit(limit)
    .lean();

    res.json({ success: true, data: allTimePopular });
    
  } catch (error) {
    console.error('All time popular error:', error);
    res.status(500).json({ error: 'Failed to get all time popular' });
  }
});

// Seri bazında toplam okuma istatistikleri
router.get('/series-stats', async (req, res) => {
  try {
    const seriesStats = await ReadingStats.aggregate([
      {
        $group: {
          _id: '$seriesId',
          seriesTitle: { $first: '$seriesTitle' },
          totalReads: { $sum: '$totalReads' },
          weeklyReads: { $sum: '$weeklyReads' },
          chapterCount: { $sum: 1 },
          lastRead: { $max: '$lastRead' },
          avgReadsPerChapter: { $avg: '$totalReads' }
        }
      },
      {
        $sort: { totalReads: -1 }
      }
    ]);

    res.json({ success: true, data: seriesStats });
    
  } catch (error) {
    console.error('Series stats error:', error);
    res.status(500).json({ error: 'Failed to get series stats' });
  }
});

// Admin için detaylı istatistikler
router.get('/admin/detailed-stats', async (req, res) => {
  try {
    const seriesId = req.query.seriesId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    let query = {};
    if (seriesId) {
      query.seriesId = seriesId;
    }
    
    const stats = await ReadingStats.find(query)
      .sort({ totalReads: -1, chapterNumber: 1 })
      .limit(limit)
      .skip(skip)
      .lean();
    
    const total = await ReadingStats.countDocuments(query);
    
    res.json({ 
      success: true, 
      data: stats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Admin detailed stats error:', error);
    res.status(500).json({ error: 'Failed to get detailed stats' });
  }
});

// Belirli bir bölümün istatistiklerini getir
router.get('/chapter/:seriesId/:chapterNumber', async (req, res) => {
  try {
    const { seriesId, chapterNumber } = req.params;
    
    const stats = await ReadingStats.findOne({ 
      seriesId, 
      chapterNumber: parseInt(chapterNumber) 
    }).lean();
    
    if (!stats) {
      return res.json({ 
        success: true, 
        data: {
          totalReads: 0,
          weeklyReads: 0,
          dailyReads: 0
        }
      });
    }
    
    res.json({ success: true, data: stats });
    
  } catch (error) {
    console.error('Chapter stats error:', error);
    res.status(500).json({ error: 'Failed to get chapter stats' });
  }
});

// Database temizleme endpoint'i
router.post('/admin/cleanup-titles', async (req, res) => {
  try {
    console.log('🧹 Starting database cleanup...');
    
    // Tüm kayıtları al
    const allStats = await ReadingStats.find({});
    let updatedCount = 0;
    
    // Seri başlık eşleştirme tablosu
    const titleMapping = {
      'Solo%20leveling%20chapters': 'Solo Leveling',
      'solo%20leveling%20chapters': 'Solo Leveling',
      'Solo leveling chapters': 'Solo Leveling',
      'Nanomachine chapters': 'Nanomachine',
      'nanomachine chapters': 'Nanomachine',
      'Omniscient Reader chapters': 'Omniscient Reader',
      'omniscient reader chapters': 'Omniscient Reader',
      'Black Crow chapters': 'Black Crow',
      'blackcrow chapters': 'Black Crow',
      'Damn Reincarnation chapters': 'Damn Reincarnation',
      'damn reincarnation chapters': 'Damn Reincarnation'
    };
    
    for (const stat of allStats) {
      let updated = false;
      let newTitle = stat.seriesTitle;
      
      // URL decode
      newTitle = decodeURIComponent(newTitle);
      
      // Eşleştirme tablosunda var mı kontrol et
      if (titleMapping[newTitle]) {
        newTitle = titleMapping[newTitle];
        updated = true;
      } else {
        // Genel temizleme kuralları
        const originalTitle = newTitle;
        newTitle = newTitle.replace(/\s*chapters?\s*$/i, ''); // "chapters" kaldır
        newTitle = newTitle.replace(/^\w/, c => c.toUpperCase()); // İlk harf büyük
        newTitle = newTitle.replace(/\s+/g, ' ').trim(); // Çoklu boşlukları düzelt
        
        if (originalTitle !== newTitle) {
          updated = true;
        }
      }
      
      if (updated) {
        stat.seriesTitle = newTitle;
        await stat.save();
        updatedCount++;
        console.log(`✅ Updated: "${stat.seriesTitle}" -> "${newTitle}"`);
      }
    }
    
    console.log(`🎉 Cleanup completed! Updated ${updatedCount} records.`);
    res.json({ 
      success: true, 
      message: `Updated ${updatedCount} records`,
      updatedCount 
    });
    
  } catch (error) {
    console.error('❌ Cleanup error:', error);
    res.status(500).json({ error: 'Cleanup failed' });
  }
});

// Duplicate seri kayıtlarını birleştir
router.post('/admin/merge-duplicate-series', async (req, res) => {
  try {
    console.log('🔄 Starting duplicate series merge...');
    
    // Aynı başlığa sahip farklı seriesId'leri bul
    const allStats = await ReadingStats.find({});
    const titleMap = new Map();
    
    // Başlık bazında grupla
    allStats.forEach(stat => {
      const title = stat.seriesTitle;
      if (!titleMap.has(title)) {
        titleMap.set(title, []);
      }
      titleMap.get(title).push(stat);
    });
    
    let mergedCount = 0;
    
    // Aynı başlığa sahip birden fazla seriesId olan kayıtları bul
    for (const [title, records] of titleMap) {
      const uniqueSeriesIds = [...new Set(records.map(r => r.seriesId))];
      
      if (uniqueSeriesIds.length > 1) {
        console.log(`🔍 Found duplicates for "${title}":`, uniqueSeriesIds);
        
        // En temiz/doğru seriesId'yi seç (URL encoded olmayanı tercih et)
        const primarySeriesId = uniqueSeriesIds
          .sort((a, b) => {
            // URL encoded olanları sona koy
            const aEncoded = a.includes('%') || a.includes(' ');
            const bEncoded = b.includes('%') || b.includes(' ');
            if (aEncoded && !bEncoded) return 1;
            if (!aEncoded && bEncoded) return -1;
            return a.localeCompare(b);
          })[0];
        
        console.log(`✅ Primary seriesId for "${title}": "${primarySeriesId}"`);
        
        // Diğer seriesId'leri primary'ye dönüştür
        for (const seriesId of uniqueSeriesIds) {
          if (seriesId !== primarySeriesId) {
            await ReadingStats.updateMany(
              { seriesId: seriesId },
              { $set: { seriesId: primarySeriesId } }
            );
            console.log(`📝 Updated "${seriesId}" -> "${primarySeriesId}"`);
            mergedCount++;
          }
        }
      }
    }
    
    console.log(`🎉 Merge completed! Updated ${mergedCount} records.`);
    res.json({ 
      success: true, 
      message: `Merged ${mergedCount} duplicate records`,
      mergedCount 
    });
    
  } catch (error) {
    console.error('❌ Merge error:', error);
    res.status(500).json({ error: 'Merge failed' });
  }
});

// Belirli seriesId'ye ait tüm kayıtları sil
router.delete('/admin/delete-by-series', async (req, res) => {
  try {
    const { seriesId } = req.body;
    
    if (!seriesId) {
      return res.status(400).json({ error: 'seriesId is required' });
    }

    console.log(`🗑️ Deleting all records for seriesId: ${seriesId}`);
    
    const result = await ReadingStats.deleteMany({ seriesId });
    
    console.log(`🎉 Deleted ${result.deletedCount} records for seriesId: ${seriesId}`);
    res.json({ 
      success: true, 
      message: `Deleted ${result.deletedCount} records`,
      deletedCount: result.deletedCount 
    });
    
  } catch (error) {
    console.error('❌ Delete error:', error);
    res.status(500).json({ error: 'Delete failed' });
  }
});

// Tüm istatistikleri sıfırla (yeni uygulama için)
router.post('/admin/reset-all-stats', async (req, res) => {
  try {
    console.log('🗑️ Tüm istatistikler sıfırlanıyor...');
    
    const result = await ReadingStats.deleteMany({});
    
    console.log(`🎉 Tüm istatistikler sıfırlandı: ${result.deletedCount} kayıt silindi`);
    res.json({ 
      success: true, 
      message: `Tüm istatistikler sıfırlandı: ${result.deletedCount} kayıt silindi`,
      deletedCount: result.deletedCount 
    });
    
  } catch (error) {
    console.error('❌ Reset error:', error);
    res.status(500).json({ error: 'Reset failed' });
  }
});

// Debug endpoint for frontend testing
router.get('/debug/grouped-popular', async (req, res) => {
  try {
    const type = req.query.type || 'weekly'; // 'weekly' or 'all-time'
    const limit = parseInt(req.query.limit) || 8;
    
    let statsData;
    if (type === 'weekly') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      statsData = await ReadingStats.find({
        lastRead: { $gte: sevenDaysAgo },
        weeklyReads: { $gt: 0 }
      })
      .sort({ weeklyReads: -1, lastRead: -1 })
      .limit(limit * 3) // Daha fazla data al gruplama için
      .lean();
    } else {
      statsData = await ReadingStats.find({
        totalReads: { $gt: 0 }
      })
      .sort({ totalReads: -1, lastRead: -1 })
      .limit(limit * 3)
      .lean();
    }
    
    // Frontend'deki aynı gruplama algoritması
    function cleanSeriesTitle(title) {
      if (!title) return title;
      let clean = decodeURIComponent(title);
      clean = clean.replace(/[%]/g, '');
      clean = clean.trim();
      return clean;
    }
    
    const seriesMap = new Map();
    
    statsData.forEach(stat => {
      const cleanTitle = cleanSeriesTitle(stat.seriesTitle);
      
      if (!seriesMap.has(stat.seriesId)) {
        seriesMap.set(stat.seriesId, {
          seriesId: stat.seriesId,
          seriesTitle: cleanTitle,
          totalReads: 0,
          weeklyReads: 0,
          lastRead: stat.lastRead,
          chapterCount: 0,
          chapters: []
        });
      }
      
      const series = seriesMap.get(stat.seriesId);
      series.totalReads += stat.totalReads || 0;
      series.weeklyReads += stat.weeklyReads || 0;
      series.chapterCount += 1;
      series.chapters.push({
        chapterNumber: stat.chapterNumber,
        chapterTitle: stat.chapterTitle,
        totalReads: stat.totalReads,
        weeklyReads: stat.weeklyReads
      });
      
      if (new Date(stat.lastRead) > new Date(series.lastRead)) {
        series.lastRead = stat.lastRead;
      }
    });
    
    const seriesArray = Array.from(seriesMap.values())
      .sort((a, b) => {
        const readsA = type === 'weekly' ? a.weeklyReads : a.totalReads;
        const readsB = type === 'weekly' ? b.weeklyReads : b.totalReads;
        return readsB - readsA;
      })
      .slice(0, limit);
    
    res.json({ 
      success: true, 
      type,
      rawDataCount: statsData.length,
      groupedSeriesCount: seriesArray.length,
      data: seriesArray
    });
    
  } catch (error) {
    console.error('Debug grouped popular error:', error);
    res.status(500).json({ error: 'Failed to get debug grouped popular' });
  }
});

// Normalize edilmiş duplicate cleanup
router.post('/admin/final-cleanup', async (req, res) => {
  try {
    console.log('🧹 Final cleanup başlatılıyor...');
    
    let cleanedCount = 0;
    let mergedCount = 0;
    
    // Tüm kayıtları al
    const allStats = await ReadingStats.find({}).lean();
    
    // SeriesId'ye göre grupla (normalize edilmiş)
    const groupedByNormalized = {};
    
    for (const stat of allStats) {
      const normalizedId = normalizeSeriesId(stat.seriesId);
      
      if (!groupedByNormalized[normalizedId]) {
        groupedByNormalized[normalizedId] = [];
      }
      groupedByNormalized[normalizedId].push(stat);
    }
    
    // Her grup için en iyi kayıtları birleştir
    for (const [normalizedId, stats] of Object.entries(groupedByNormalized)) {
      const uniqueSeriesIds = [...new Set(stats.map(s => s.seriesId))];
      
      if (uniqueSeriesIds.length > 1) {
        console.log(`🔍 Found duplicates for "${normalizedId}":`, uniqueSeriesIds);
        
        // En temiz seriesId'yi seç (en kısa ve en az özel karakter olan)
        const bestSeriesId = uniqueSeriesIds.reduce((best, current) => {
          const currentScore = current.length + (current.match(/[^a-z0-9]/g) || []).length;
          const bestScore = best.length + (best.match(/[^a-z0-9]/g) || []).length;
          return currentScore < bestScore ? current : best;
        });
        
        console.log(`🎯 Best seriesId: "${bestSeriesId}"`);
        
        // Diğer seriesId'leri bu en iyi seriesId'ye merge et
        for (const seriesId of uniqueSeriesIds) {
          if (seriesId !== bestSeriesId) {
            const result = await ReadingStats.updateMany(
              { seriesId: seriesId },
              { $set: { seriesId: bestSeriesId } }
            );
            console.log(`📝 Merged "${seriesId}" -> "${bestSeriesId}": ${result.modifiedCount} records`);
            mergedCount += result.modifiedCount;
          }
        }
      }
    }
    
    // Son kez duplicate chapter kayıtlarını temizle
    const pipeline = [
      {
        $group: {
          _id: { seriesId: '$seriesId', chapterNumber: '$chapterNumber' },
          docs: { $push: '$$ROOT' },
          count: { $sum: 1 }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ];
    
    const duplicates = await ReadingStats.aggregate(pipeline);
    
    for (const duplicate of duplicates) {
      const docs = duplicate.docs;
      // En son güncellenen kayıtı tut, diğerlerini sil
      const keepDoc = docs.reduce((latest, current) => 
        new Date(current.updatedAt) > new Date(latest.updatedAt) ? current : latest
      );
      
      const toDelete = docs.filter(doc => doc._id.toString() !== keepDoc._id.toString());
      
      for (const doc of toDelete) {
        await ReadingStats.deleteOne({ _id: doc._id });
        cleanedCount++;
      }
      
      console.log(`🧽 Cleaned duplicate: ${duplicate._id.seriesId} Ch${duplicate._id.chapterNumber} - removed ${toDelete.length} duplicates`);
    }
    
    console.log(`🎉 Final cleanup completed! Merged: ${mergedCount}, Cleaned: ${cleanedCount}`);
    res.json({ 
      success: true, 
      message: `Final cleanup completed. Merged: ${mergedCount}, Cleaned: ${cleanedCount}`,
      mergedCount,
      cleanedCount
    });
    
  } catch (error) {
    console.error('❌ Final cleanup error:', error);
    res.status(500).json({ error: 'Final cleanup failed' });
  }
});

// Gelişmiş haftalık popüler serileri (daha güvenilir hesaplama)
router.get('/weekly-popular-series', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // MongoDB aggregation pipeline ile seri bazında gruplama ve hesaplama
    const weeklyPopularSeries = await ReadingStats.aggregate([
      // Son 7 gün içindeki kayıtları filtrele ve "unknown" olanları çıkar
      {
        $match: {
          lastRead: { $gte: sevenDaysAgo },
          weeklyReads: { $gt: 0 },
          seriesId: { $ne: 'unknown' }, // unknown serilerini filtrele
          seriesTitle: { $ne: 'Unknown' } // Unknown başlıklı olanları da filtrele
        }
      },
      // Seri bazında grupla
      {
        $group: {
          _id: '$seriesId',
          seriesId: { $first: '$seriesId' },
          // Tüm başlıkları topla
          allTitles: { $addToSet: '$seriesTitle' },
          totalWeeklyReads: { $sum: '$weeklyReads' },
          totalAllTimeReads: { $sum: '$totalReads' },
          chapterCount: { $sum: 1 },
          avgReadsPerChapter: { $avg: '$totalReads' },
          lastReadDate: { $max: '$lastRead' }
        }
      },
      // Haftalık okuma sayısına göre sırala
      {
        $sort: { 
          totalWeeklyReads: -1,
          totalAllTimeReads: -1,
          lastReadDate: -1
        }
      },
      // Limit uygula
      {
        $limit: limit
      },
      // Final formatlama
      {
        $project: {
          _id: 0,
          seriesId: 1,
          allTitles: 1,
          totalWeeklyReads: 1,
          totalAllTimeReads: 1,
          chapterCount: 1,
          avgReadsPerChapter: { $round: ['$avgReadsPerChapter', 1] },
          lastReadDate: 1,
          // Popülerlik skoru hesapla (haftalık + all-time ağırlıklı)
          popularityScore: {
            $add: [
              { $multiply: ['$totalWeeklyReads', 10] }, // Haftalık x10
              { $multiply: ['$totalAllTimeReads', 1] },  // All-time x1
              { $multiply: ['$chapterCount', 2] }        // Bölüm sayısı x2
            ]
          }
        }
      }
    ]);

    console.log(`📊 Weekly popular series aggregation result:`, weeklyPopularSeries);

    res.json({ success: true, data: weeklyPopularSeries });
    
  } catch (error) {
    console.error('Weekly popular series error:', error);
    res.status(500).json({ error: 'Failed to get weekly popular series' });
  }
});

// Gelişmiş tüm zamanların popüler serileri
router.get('/all-time-popular-series', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 15;
    
    const allTimePopularSeries = await ReadingStats.aggregate([
      // Sadece okuma sayısı olan kayıtları al ve "unknown" olanları filtrele
      {
        $match: {
          totalReads: { $gt: 0 },
          seriesId: { $ne: 'unknown' }, // unknown serilerini filtrele
          seriesTitle: { $ne: 'Unknown' } // Unknown başlıklı olanları da filtrele
        }
      },
      // Seri bazında grupla
      {
        $group: {
          _id: '$seriesId',
          seriesId: { $first: '$seriesId' },
          allTitles: { $addToSet: '$seriesTitle' },
          totalAllTimeReads: { $sum: '$totalReads' },
          totalWeeklyReads: { $sum: '$weeklyReads' },
          chapterCount: { $sum: 1 },
          avgReadsPerChapter: { $avg: '$totalReads' },
          lastReadDate: { $max: '$lastRead' }
        }
      },
      // Total okuma sayısına göre sırala
      {
        $sort: { 
          totalAllTimeReads: -1,
          chapterCount: -1,
          lastReadDate: -1
        }
      },
      {
        $limit: limit
      },
      {
        $project: {
          _id: 0,
          seriesId: 1,
          allTitles: 1,
          totalAllTimeReads: 1,
          totalWeeklyReads: 1,
          chapterCount: 1,
          avgReadsPerChapter: { $round: ['$avgReadsPerChapter', 1] },
          lastReadDate: 1,
          popularityScore: {
            $add: [
              { $multiply: ['$totalAllTimeReads', 5] },  // All-time x5
              { $multiply: ['$totalWeeklyReads', 3] },   // Haftalık x3
              { $multiply: ['$chapterCount', 1] }        // Bölüm sayısı x1
            ]
          }
        }
      }
    ]);

    console.log(`📊 All-time popular series aggregation result:`, allTimePopularSeries);

    res.json({ success: true, data: allTimePopularSeries });
    
  } catch (error) {
    console.error('All-time popular series error:', error);
    res.status(500).json({ error: 'Failed to get all-time popular series' });
  }
});

module.exports = router;
