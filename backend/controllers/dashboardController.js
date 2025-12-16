const Order = require('../models/Order');
const Client = require('../models/Client');
const Material = require('../models/Material');
const Notification = require('../models/Notification');
const cache = require('../utils/cache');

// @desc Get dashboard summary
// @route GET /api/dashboard/summary
// @access Private
exports.getSummary = async (req, res, next) => {
  try {
    const cacheKey = `dashboard_summary_${req.user?.id || 'public'}_${req.user?.role || 'anon'}`;
    const ttl = Number(process.env.DASHBOARD_CACHE_TTL || process.env.TIMESERIES_CACHE_TTL || 60);

    // Try returning a cached result if available
    try {
      const cached = await cache.get(cacheKey);
      if (cached) {
        console.log('✅ Dashboard summary served from cache for', cacheKey);
        return res.status(200).json({ success: true, data: cached });
      }
    } catch (err) {
      // Non-fatal cache read failure - continue to compute
      console.warn('⚠️ Cache read failed for dashboard summary:', err?.message || err);
    }
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const totalOrdersPromise = Order.countDocuments({});
    const totalRevenuePromise = Order.aggregate([
      { $group: { _id: null, total: { $sum: { $ifNull: ['$totalPrice', 0] } } } }
    ]);

    // Monthly revenue for the current month
    const monthRevenuePromise = Order.aggregate([
      { $match: { createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: { $ifNull: ['$totalPrice', 0] } } } }
    ]);
    const recentOrdersPromise = Order.find({}).sort({ createdAt: -1 }).limit(5).lean();
    const statusBreakdownPromise = Order.aggregate([
      { $group: { _id: '$orderState', count: { $sum: 1 }, totalValue: { $sum: { $ifNull: ['$totalPrice', 0] } } } }
    ]);
    const totalClientsPromise = Client.countDocuments({});
    // Use $expr to compare fields directly inside a query
    const lowStockPromise = Material.find({
      $expr: { $lte: ['$currentStock', { $ifNull: ['$minStockLevel', 0] }] }
    }).limit(10).lean();
    const recentNotificationsPromise = Notification.find({ ...(req.user.role !== 'admin' ? { user: req.user.id } : {}) }).sort({ createdAt: -1 }).limit(10).lean();

    const [totalOrders, totalRevenueAgg, monthRevenueAgg, recentOrders, statusBreakdown, totalClients, lowStock, recentNotifications] =
      await Promise.all([
        totalOrdersPromise,
        totalRevenuePromise,
        monthRevenuePromise,
        recentOrdersPromise,
        statusBreakdownPromise,
        totalClientsPromise,
        lowStockPromise,
        recentNotificationsPromise,
      ]);

    const totalRevenue = totalRevenueAgg && totalRevenueAgg[0] ? totalRevenueAgg[0].total : 0;
    const monthlyRevenue = monthRevenueAgg && monthRevenueAgg[0] ? monthRevenueAgg[0].total : 0;

    const responseData = {
      overall: {
        totalOrders,
        totalRevenue,
        totalClients,
        monthlyRevenue,
      },
      statusBreakdown,
      recentOrders,
      lowStock,
      recentNotifications,
    };

    // Cache the result for a short period to reduce DB load
    try {
      await cache.set(cacheKey, responseData, ttl);
      console.log(`ℹ️ Dashboard summary cached under ${cacheKey} (ttl: ${ttl}s)`);
    } catch (err) {
      console.warn('⚠️ Cache set failed for dashboard summary:', err?.message || err);
    }

    res.status(200).json({ success: true, data: responseData });
  } catch (error) {
    next(error);
  }
};
