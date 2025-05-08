const mongoose = require('mongoose');

const VisitorSchema = new mongoose.Schema({
  ipAddress: {
    type: String,
    required: [true, 'IP address is required']
  },
  deviceType: {
    type: String,
    enum: ['mobile', 'desktop', 'tablet', 'unknown'],
    default: 'unknown'
  },
  browser: {
    type: String,
    default: 'Unknown'
  },
  entryPage: {
    type: String,
    default: '/'
  },
  userAgent: {
    type: String
  },
  country: {
    type: String
  },
  city: {
    type: String
  },
  referrer: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Add Index for improved query performance
VisitorSchema.index({ timestamp: -1 });
VisitorSchema.index({ deviceType: 1 });

module.exports = mongoose.model('Visitor', VisitorSchema); 