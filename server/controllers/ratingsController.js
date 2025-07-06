const Rating = require('../models/Rating');

// En yüksek oy ortalamasına göre sıralama
const getTopRatedSeries = async (req, res) => {
  try {
    const topRated = await Rating.aggregate([
      {
        $group: {
          _id: '$seriesId',
          averageRating: { $avg: '$rating' },
          totalVotes: { $sum: 1 }
        }
      },
      {
        $sort: { averageRating: -1 }
      },
      {
        $limit: 10
      }
    ]);

    res.status(200).json(topRated);
  } catch (err) {
    res.status(500).json({ message: 'Sıralama hatası', error: err.message });
  }
};

module.exports = {
  getTopRatedSeries
};
