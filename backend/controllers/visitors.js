const Visitor = require('../models/Visitor');

// @desc    Get all visitors with filtering
// @route   GET /api/visitors
// @access  Private (Admin/Stats Permission)
exports.getVisitors = async (req, res) => {
  try {
    // Add pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Add filtering
    const filter = {};
    if (req.query.deviceType) {
      filter.deviceType = req.query.deviceType;
    }
    if (req.query.browser) {
      filter.browser = { $regex: req.query.browser, $options: 'i' };
    }
    if (req.query.country) {
      filter.country = { $regex: req.query.country, $options: 'i' };
    }
    
    // Add date range filtering
    if (req.query.fromDate && req.query.toDate) {
      filter.timestamp = {
        $gte: new Date(req.query.fromDate),
        $lte: new Date(req.query.toDate)
      };
    } else if (req.query.fromDate) {
      filter.timestamp = { $gte: new Date(req.query.fromDate) };
    } else if (req.query.toDate) {
      filter.timestamp = { $lte: new Date(req.query.toDate) };
    }
    
    // Add search
    if (req.query.search) {
      filter.$or = [
        { ipAddress: { $regex: req.query.search, $options: 'i' } },
        { browser: { $regex: req.query.search, $options: 'i' } },
        { entryPage: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    // Execute query
    const visitors = await Visitor.find(filter)
      .skip(startIndex)
      .limit(limit)
      .sort({ timestamp: -1 });
    
    // Get total count for pagination
    const total = await Visitor.countDocuments(filter);
    
    // Pagination result
    const pagination = {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    };
    
    res.status(200).json({
      success: true,
      pagination,
      data: visitors
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Get visitor statistics
// @route   GET /api/visitors/stats
// @access  Private (Admin/Stats Permission)
exports.getVisitorStats = async (req, res) => {
  try {
    // Get time period filter
    const period = req.query.period || 'all';
    
    let dateFilter = {};
    const now = new Date();
    
    if (period === 'today') {
      const today = new Date(now.setHours(0, 0, 0, 0));
      dateFilter = { timestamp: { $gte: today } };
    } else if (period === 'week') {
      const lastWeek = new Date(now);
      lastWeek.setDate(lastWeek.getDate() - 7);
      dateFilter = { timestamp: { $gte: lastWeek } };
    } else if (period === 'month') {
      const lastMonth = new Date(now);
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      dateFilter = { timestamp: { $gte: lastMonth } };
    }
    
    // Get total visitors count
    const totalVisitors = await Visitor.countDocuments(dateFilter);
    
    // Get device type breakdown
    const deviceStats = await Visitor.aggregate([
      { $match: dateFilter },
      { $group: {
          _id: '$deviceType',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Format device stats
    const deviceCounts = {
      mobile: 0,
      desktop: 0,
      tablet: 0,
      unknown: 0
    };
    
    deviceStats.forEach(item => {
      deviceCounts[item._id] = item.count;
    });
    
    // Get browser breakdown
    const browserStats = await Visitor.aggregate([
      { $match: dateFilter },
      { $group: {
          _id: '$browser',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    // Get entry page breakdown
    const pageStats = await Visitor.aggregate([
      { $match: dateFilter },
      { $group: {
          _id: '$entryPage',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    // Get visitor trends (daily for a month)
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const dailyTrends = await Visitor.aggregate([
      { 
        $match: { 
          timestamp: { $gte: thirtyDaysAgo } 
        } 
      },
      {
        $group: {
          _id: { 
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } 
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        totalVisitors,
        deviceCounts,
        browserStats,
        pageStats,
        dailyTrends
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Record a new visitor
// @route   POST /api/visitors
// @access  Public
exports.recordVisit = async (req, res) => {
  try {
    const { 
      ipAddress, 
      deviceType, 
      browser, 
      entryPage, 
      userAgent, 
      referrer 
    } = req.body;
    
    // Get IP from request if not provided
    const ip = ipAddress || req.ip || 
               req.headers['x-forwarded-for'] || 
               req.connection.remoteAddress;
    
    // Check if it's a recent visit from same IP to avoid duplicates
    // Only count new visits if they are more than 30 minutes apart
    const thirtyMinutesAgo = new Date();
    thirtyMinutesAgo.setMinutes(thirtyMinutesAgo.getMinutes() - 30);
    
    const recentVisit = await Visitor.findOne({
      ipAddress: ip,
      timestamp: { $gte: thirtyMinutesAgo }
    });
    
    if (recentVisit) {
      return res.status(200).json({
        success: true,
        message: 'Recent visit already recorded',
        data: recentVisit
      });
    }
    
    // Create new visitor record
    const visitor = await Visitor.create({
      ipAddress: ip,
      deviceType: deviceType || 'unknown',
      browser: browser || 'Unknown',
      entryPage: entryPage || '/',
      userAgent,
      referrer,
      timestamp: Date.now()
    });
    
    res.status(201).json({
      success: true,
      data: visitor
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
}; 