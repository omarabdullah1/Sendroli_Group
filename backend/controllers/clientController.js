const Client = require('../models/Client');
const User = require('../models/User');
const cache = require('../utils/cache');
const { createNotification } = require('./notificationController');

// @desc    Get all clients
// @route   GET /api/clients
// @access  Private (Receptionist, Admin)
exports.getClients = async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;

    let query = {};

    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { factoryName: { $regex: search, $options: 'i' } },
      ];
    }

    const clients = await Client.find(query)
      .populate('createdBy', 'username fullName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Client.countDocuments(query);

    res.status(200).json({
      success: true,
      data: clients,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single client
// @route   GET /api/clients/:id
// @access  Private
exports.getClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id).populate('createdBy', 'username fullName');

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found',
      });
    }

    // Check ownership or admin role for read access
    const userRole = req.user.role;
    const isOwner = client.createdBy._id.toString() === req.user._id.toString();
    const isAdmin = userRole === 'admin';
    
    // Only owner, admin, or users with client access can view
    if (!isOwner && !isAdmin && !['receptionist'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this client',
      });
    }

    res.status(200).json({
      success: true,
      data: client,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create new client
// @route   POST /api/clients
// @access  Private (Receptionist, Admin)
exports.createClient = async (req, res) => {
  try {
    const { name, phone, factoryName, address, notes } = req.body;

    const client = await Client.create({
      name,
      phone,
      factoryName,
      address,
      notes,
      createdBy: req.user._id,
    });

    // Notify admins and receptionists about new client
    try {
      console.log('🔍 ===== CLIENT CREATE NOTIFICATION START =====');
      console.log('🔍 Client ID:', client._id.toString());
      console.log('🔍 Client name:', name);
      console.log('🔍 Current user:', {
        id: req.user._id.toString(),
        username: req.user.username,
        role: req.user.role
      });
      
      // Find all admin and receptionist users (including current user for testing)
      const allUsers = await User.find({
        role: { $in: ['admin', 'receptionist'] },
        isActive: true,
      }).select('_id username role email isActive');
      
      console.log(`📧 Total admin/receptionist users in database: ${allUsers.length}`);
      allUsers.forEach(u => {
        console.log(`  - ${u.username} (${u.role}) - ID: ${u._id.toString()} - Active: ${u.isActive} - ${u._id.toString() === req.user._id.toString() ? '(YOU)' : ''}`);
      });
      
      let notificationCount = 0;
      for (const user of allUsers) {
        console.log(`\n📤 Attempting to create notification for user: ${user.username} (${user._id.toString()})`);
        try {
          const notificationData = {
            title: 'New Client Added',
            message: `Client "${name}" (${phone}) added by ${req.user.username}${factoryName ? ' - ' + factoryName : ''}`,
            icon: 'fa-user-plus',
            type: 'client',
            relatedId: client._id,
            relatedType: 'client',
            actionUrl: `/clients/${client._id}`,
          };
          console.log('📦 Notification data:', JSON.stringify(notificationData, null, 2));
          
          const notification = await createNotification(user._id, notificationData);
          notificationCount++;
          console.log(`✅ SUCCESS - Notification created with ID: ${notification._id.toString()}`);
          console.log(`   For user: ${user.username} (${user._id.toString()})`);
        } catch (userNotifError) {
          console.error(`❌ FAILED for user ${user.username}:`, userNotifError.message);
          console.error(`   Stack:`, userNotifError.stack);
        }
      }
      console.log(`\n✅ ===== NOTIFICATION COMPLETE: ${notificationCount}/${allUsers.length} created =====\n`);
    } catch (notifError) {
      console.error('❌ ===== CRITICAL ERROR IN NOTIFICATION PROCESS =====');
      console.error('❌ Error:', notifError.message);
      console.error('❌ Stack:', notifError.stack);
      console.error('❌ ===== END ERROR =====\n');
    }

    // Invalidate dashboard cache when clients change
    try {
      await cache.delPattern('dashboard_summary_*');
      console.log('ℹ️ Cleared dashboard cache after client creation');
    } catch (err) {
      console.warn('⚠️ Failed to clear dashboard cache after client creation:', err?.message || err);
    }

    res.status(201).json({
      success: true,
      data: client,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update client
// @route   PUT /api/clients/:id
// @access  Private (Receptionist, Admin)
exports.updateClient = async (req, res) => {
  try {
    const { name, phone, factoryName, address, notes } = req.body;

    let client = await Client.findById(req.params.id);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found',
      });
    }

    // Check ownership or admin role for update access
    const userRole = req.user.role;
    const isOwner = client.createdBy.toString() === req.user._id.toString();
    const isAdmin = userRole === 'admin';
    const isReceptionist = userRole === 'receptionist';
    
    // Only owner (if receptionist/admin), admin, or receptionist can modify
    if (!isAdmin && !isReceptionist && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this client',
      });
    }

    // Log the modification for audit trail
    console.log(`Client ${req.params.id} updated by user ${req.user._id} (${req.user.username})`);

    client = await Client.findByIdAndUpdate(
      req.params.id,
      { 
        name, 
        phone, 
        factoryName, 
        address, 
        notes,
        updatedBy: req.user._id,
        updatedAt: new Date()
      },
      {
        new: true,
        runValidators: true,
      }
    );

    // Notify admins and receptionists about client update
    try {
      console.log('🔍 ===== CLIENT UPDATE NOTIFICATION START =====');
      console.log('🔍 Client ID:', client._id.toString());
      console.log('🔍 Client name:', client.name);
      console.log('🔍 Current user:', {
        id: req.user._id.toString(),
        username: req.user.username,
        role: req.user.role
      });
      
      // Find all admin and receptionist users (including current user for testing)
      const allUsers = await User.find({
        role: { $in: ['admin', 'receptionist'] },
        isActive: true,
      }).select('_id username role email isActive');
      
      console.log(`📧 Total admin/receptionist users in database: ${allUsers.length}`);
      allUsers.forEach(u => {
        console.log(`  - ${u.username} (${u.role}) - ID: ${u._id.toString()} - Active: ${u.isActive} - ${u._id.toString() === req.user._id.toString() ? '(YOU)' : ''}`);
      });
      
      let notificationCount = 0;
      for (const user of allUsers) {
        console.log(`\n📤 Attempting to create notification for user: ${user.username} (${user._id.toString()})`);
        try {
          const notificationData = {
            title: 'Client Updated',
            message: `Client "${client.name}" (${client.phone}) updated by ${req.user.username}${client.factoryName ? ' - ' + client.factoryName : ''}`,
            icon: 'fa-user-edit',
            type: 'client',
            relatedId: client._id,
            relatedType: 'client',
            actionUrl: `/clients/${client._id}`,
          };
          console.log('📦 Notification data:', JSON.stringify(notificationData, null, 2));
          
          const notification = await createNotification(user._id, notificationData);
          notificationCount++;
          console.log(`✅ SUCCESS - Notification created with ID: ${notification._id.toString()}`);
          console.log(`   For user: ${user.username} (${user._id.toString()})`);
        } catch (userNotifError) {
          console.error(`❌ FAILED for user ${user.username}:`, userNotifError.message);
          console.error(`   Stack:`, userNotifError.stack);
        }
      }
      console.log(`\n✅ ===== NOTIFICATION COMPLETE: ${notificationCount}/${allUsers.length} created =====\n`);
    } catch (notifError) {
      console.error('❌ ===== CRITICAL ERROR IN NOTIFICATION PROCESS =====');
      console.error('❌ Error:', notifError.message);
      console.error('❌ Stack:', notifError.stack);
      console.error('❌ ===== END ERROR =====\n');
    }

    // Clear dashboard cache when client updated
    try {
      await cache.delPattern('dashboard_summary_*');
      console.log('ℹ️ Cleared dashboard cache after client update');
    } catch (err) {
      console.warn('⚠️ Failed to clear dashboard cache after client update:', err?.message || err);
    }

    res.status(200).json({
      success: true,
      data: client,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete client
// @route   DELETE /api/clients/:id
// @access  Private (Receptionist, Admin)
exports.deleteClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found',
      });
    }

    // Check ownership or admin role for delete access
    const userRole = req.user.role;
    const isOwner = client.createdBy.toString() === req.user._id.toString();
    const isAdmin = userRole === 'admin';
    const isReceptionist = userRole === 'receptionist';
    
    // Only admin or receptionist who created the client can delete
    if (!isAdmin && !(isReceptionist && isOwner)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this client',
      });
    }

    // Check if client has associated orders before deletion
    const Order = require('../models/Order');
    const associatedOrders = await Order.countDocuments({ client: req.params.id });
    
    if (associatedOrders > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete client. ${associatedOrders} order(s) are associated with this client.`,
      });
    }

    // Log the deletion for audit trail
    console.log(`Client ${req.params.id} (${client.name}) deleted by user ${req.user._id} (${req.user.username})`);

    // Store client details before deletion
    const clientName = client.name;
    const clientPhone = client.phone;
    const clientFactory = client.factoryName;

    await client.deleteOne();

    // Clear dashboard cache when client deleted
    try {
      await cache.delPattern('dashboard_summary_*');
      console.log('ℹ️ Cleared dashboard cache after client deletion');
    } catch (err) {
      console.warn('⚠️ Failed to clear dashboard cache after client deletion:', err?.message || err);
    }
    
    // Notify relevant users about client deletion
    try {
      console.log('🔍 ===== CLIENT DELETE NOTIFICATION START =====');
      console.log('🔍 Client name:', clientName);
      console.log('🔍 Current user:', {
        id: req.user._id.toString(),
        username: req.user.username,
        role: req.user.role
      });
      
      // Find all admin and receptionist users (including current user for testing)
      const allUsers = await User.find({
        role: { $in: ['admin', 'receptionist'] },
        isActive: true,
      }).select('_id username role email isActive');
      
      console.log(`📧 Total admin/receptionist users in database: ${allUsers.length}`);
      allUsers.forEach(u => {
        console.log(`  - ${u.username} (${u.role}) - ID: ${u._id.toString()} - Active: ${u.isActive} - ${u._id.toString() === req.user._id.toString() ? '(YOU)' : ''}`);
      });
      
      let notificationCount = 0;
      for (const user of allUsers) {
        console.log(`\n📤 Attempting to create notification for user: ${user.username} (${user._id.toString()})`);
        try {
          const notificationData = {
            title: 'Client Deleted',
            message: `Client "${clientName}" (${clientPhone})${clientFactory ? ' - ' + clientFactory : ''} was deleted by ${req.user.username}`,
            icon: 'fa-user-xmark',
            type: 'client',
            relatedId: null,
            relatedType: 'client',
            actionUrl: '/clients',
          };
          console.log('📦 Notification data:', JSON.stringify(notificationData, null, 2));
          
          const notification = await createNotification(user._id, notificationData);
          notificationCount++;
          console.log(`✅ SUCCESS - Notification created with ID: ${notification._id.toString()}`);
          console.log(`   For user: ${user.username} (${user._id.toString()})`);
        } catch (userNotifError) {
          console.error(`❌ FAILED for user ${user.username}:`, userNotifError.message);
          console.error(`   Stack:`, userNotifError.stack);
        }
      }
      console.log(`\n✅ ===== NOTIFICATION COMPLETE: ${notificationCount}/${allUsers.length} created =====\n`);
    } catch (notifError) {
      console.error('❌ ===== CRITICAL ERROR IN NOTIFICATION PROCESS =====');
      console.error('❌ Error:', notifError.message);
      console.error('❌ Stack:', notifError.stack);
      console.error('❌ ===== END ERROR =====\n');
    }

    res.status(200).json({
      success: true,
      message: 'Client deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get client financial report (orders, invoices, payments)
// @route   GET /api/clients/:id/report
// @access  Private (Admin, Financial, Receptionist)
// @desc    Get all clients with statistics
// @route   GET /api/clients/statistics
// @access  Private (Admin, Financial, Receptionist)
exports.getClientsStatistics = async (req, res) => {
  try {
    const Order = require('../models/Order');
    const Invoice = require('../models/Invoice');

    // Get all clients
    const clients = await Client.find()
      .populate('createdBy', 'username fullName')
      .sort({ createdAt: -1 });

    // Calculate statistics for each client
    const clientsWithStats = await Promise.all(
      clients.map(async (client) => {
        // Get all orders for this client
        const orders = await Order.find({
          $or: [
            { client: client._id },
            { 'clientSnapshot.name': client.name }
          ]
        }).sort({ createdAt: 1 }); // Sort by creation date for frequency calculation

        // Get all invoices for this client
        const invoices = await Invoice.find({ client: client._id });

        // Calculate totals
        const totalOrders = orders.length;
        const totalInvoices = invoices.length;
        
        const totalOrderAmount = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
        const totalDeposits = orders.reduce((sum, order) => sum + (order.deposit || 0), 0);
        const totalRemaining = orders.reduce((sum, order) => sum + (order.remainingAmount || 0), 0);
        
        const totalInvoiceAmount = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
        const totalInvoicePaid = invoices
          .filter(inv => inv.status === 'paid')
          .reduce((sum, inv) => sum + (inv.total || 0), 0);
        const totalInvoiceRemaining = invoices.reduce((sum, inv) => sum + (inv.totalRemaining || 0), 0);

        const totalPaid = totalDeposits + totalInvoicePaid;
        const totalOwed = totalRemaining + totalInvoiceRemaining;
        const totalValue = totalOrderAmount + totalInvoiceAmount;

        // Orders by status
        const activeOrders = orders.filter(o => o.orderState === 'active').length;
        const pendingOrders = orders.filter(o => o.orderState === 'pending').length;
        const completedOrders = orders.filter(o => ['done', 'delivered'].includes(o.orderState)).length;

        // LOYALTY SCORE CALCULATION
        // Factor 1: Order Volume (30%) - Total orders & invoices
        const totalTransactions = totalOrders + totalInvoices;
        const volumeScore = Math.min(totalTransactions * 3, 30); // Max 30 points

        // Factor 2: Payment Reliability (30%) - Payment rate
        const paymentRate = totalValue > 0 ? (totalPaid / totalValue) * 100 : 0;
        const paymentScore = (paymentRate / 100) * 30; // Max 30 points

        // Factor 3: Client Longevity (20%) - Days since first order
        const clientAge = Math.floor((Date.now() - new Date(client.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        const longevityScore = Math.min(clientAge / 10, 20); // Max 20 points (200+ days)

        // Factor 4: Order Frequency & Consistency (20%) - Orders per month + consistency
        const monthsSinceFirstOrder = Math.max(clientAge / 30, 1);
        const ordersPerMonth = totalTransactions / monthsSinceFirstOrder;
        const frequencyScore = Math.min(ordersPerMonth * 5, 15); // Max 15 points
        
        // Consistency bonus: Regular ordering pattern (5 points)
        let consistencyBonus = 0;
        if (orders.length >= 3) {
          const orderDates = orders.map(o => new Date(o.createdAt).getTime());
          const gaps = [];
          for (let i = 1; i < orderDates.length; i++) {
            gaps.push((orderDates[i] - orderDates[i - 1]) / (1000 * 60 * 60 * 24)); // Days between orders
          }
          const avgGap = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
          const gapVariance = gaps.reduce((sum, gap) => sum + Math.pow(gap - avgGap, 2), 0) / gaps.length;
          const gapStdDev = Math.sqrt(gapVariance);
          
          // Lower standard deviation = more consistent = higher bonus
          if (gapStdDev < avgGap * 0.5) {
            consistencyBonus = 5;
          } else if (gapStdDev < avgGap * 0.75) {
            consistencyBonus = 3;
          } else if (gapStdDev < avgGap) {
            consistencyBonus = 1;
          }
        }

        // Total Loyalty Score (0-100)
        const loyaltyScore = Math.round(
          volumeScore + paymentScore + longevityScore + frequencyScore + consistencyBonus
        );

        // Determine loyalty tier
        let loyaltyTier = 'Bronze';
        if (loyaltyScore >= 80) loyaltyTier = 'Platinum';
        else if (loyaltyScore >= 60) loyaltyTier = 'Gold';
        else if (loyaltyScore >= 40) loyaltyTier = 'Silver';

        return {
          _id: client._id,
          name: client.name,
          phone: client.phone,
          factoryName: client.factoryName,
          address: client.address,
          createdAt: client.createdAt,
          statistics: {
            totalOrders,
            totalInvoices,
            activeOrders,
            pendingOrders,
            completedOrders,
            totalValue,
            totalPaid,
            totalOwed,
            totalOrderAmount,
            totalInvoiceAmount,
            paymentRate: totalValue > 0 ? ((totalPaid / totalValue) * 100).toFixed(2) : 0,
            loyaltyScore,
            loyaltyTier,
            clientAgeDays: clientAge,
            ordersPerMonth: ordersPerMonth.toFixed(2),
          },
        };
      })
    );

    // Sort by total value (highest paying clients first) by default
    clientsWithStats.sort((a, b) => b.statistics.totalValue - a.statistics.totalValue);

    // Find most loyal client
    const mostLoyalClient = clientsWithStats.reduce((prev, current) => 
      (current.statistics.loyaltyScore > prev.statistics.loyaltyScore) ? current : prev
    , clientsWithStats[0]);

    // Calculate overall statistics
    const overallStats = {
      totalClients: clients.length,
      totalOrders: clientsWithStats.reduce((sum, c) => sum + c.statistics.totalOrders, 0),
      totalInvoices: clientsWithStats.reduce((sum, c) => sum + c.statistics.totalInvoices, 0),
      totalRevenue: clientsWithStats.reduce((sum, c) => sum + c.statistics.totalValue, 0),
      totalPaid: clientsWithStats.reduce((sum, c) => sum + c.statistics.totalPaid, 0),
      totalOwed: clientsWithStats.reduce((sum, c) => sum + c.statistics.totalOwed, 0),
      averageOrdersPerClient: clients.length > 0 
        ? (clientsWithStats.reduce((sum, c) => sum + c.statistics.totalOrders, 0) / clients.length).toFixed(2)
        : 0,
      topPayingClients: clientsWithStats.slice(0, 5).map(c => ({
        name: c.name,
        totalValue: c.statistics.totalValue,
        totalPaid: c.statistics.totalPaid,
      })),
      mostLoyalClient: mostLoyalClient ? {
        name: mostLoyalClient.name,
        phone: mostLoyalClient.phone,
        factoryName: mostLoyalClient.factoryName,
        loyaltyScore: mostLoyalClient.statistics.loyaltyScore,
        loyaltyTier: mostLoyalClient.statistics.loyaltyTier,
        totalOrders: mostLoyalClient.statistics.totalOrders,
        totalValue: mostLoyalClient.statistics.totalValue,
        paymentRate: mostLoyalClient.statistics.paymentRate,
        clientAgeDays: mostLoyalClient.statistics.clientAgeDays,
      } : null,
    };

    res.status(200).json({
      success: true,
      data: {
        clients: clientsWithStats,
        overallStats,
      },
    });
  } catch (error) {
    console.error('Get clients statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating clients statistics',
      error: error.message,
    });
  }
};

exports.getClientReport = async (req, res) => {
  try {
    const clientId = req.params.id;
    const Order = require('../models/Order');
    const Invoice = require('../models/Invoice');

    // Get client
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found',
      });
    }

    // Get all orders for this client (both standalone and invoice-based)
    const orders = await Order.find({
      $or: [
        { client: clientId },
        { 'clientSnapshot.name': client.name }
      ]
    })
      .populate('material', 'name')
      .sort({ createdAt: -1 });

    // Get all invoices for this client
    const invoices = await Invoice.find({
      client: clientId
    })
      .populate('orders')
      .sort({ createdAt: -1 });

    // Calculate statistics
    const totalOrders = orders.length;
    const totalInvoices = invoices.length;
    
    // Total from all orders
    const totalOrderAmount = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
    const totalDeposits = orders.reduce((sum, order) => sum + (order.deposit || 0), 0);
    const totalRemaining = orders.reduce((sum, order) => sum + (order.remainingAmount || 0), 0);

    // Total from invoices
    const totalInvoiceAmount = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const totalInvoicePaid = invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + (inv.total || 0), 0);
    const totalInvoiceRemaining = invoices.reduce((sum, inv) => sum + (inv.totalRemaining || 0), 0);

    // Orders by status
    const ordersByStatus = {
      pending: orders.filter(o => o.orderState === 'pending').length,
      active: orders.filter(o => o.orderState === 'active').length,
      done: orders.filter(o => o.orderState === 'done').length,
      delivered: orders.filter(o => o.orderState === 'delivered').length,
    };

    // Invoices by status
    const invoicesByStatus = {
      draft: invoices.filter(inv => inv.status === 'draft').length,
      sent: invoices.filter(inv => inv.status === 'sent').length,
      paid: invoices.filter(inv => inv.status === 'paid').length,
      cancelled: invoices.filter(inv => inv.status === 'cancelled').length,
    };

    res.status(200).json({
      success: true,
      data: {
        client: {
          _id: client._id,
          name: client.name,
          phone: client.phone,
          factoryName: client.factoryName,
          address: client.address,
        },
        summary: {
          totalOrders,
          totalInvoices,
          totalOrderAmount,
          totalDeposits,
          totalRemaining,
          totalInvoiceAmount,
          totalInvoicePaid,
          totalInvoiceRemaining,
          totalPaid: totalDeposits + totalInvoicePaid,
          totalOwed: totalRemaining + totalInvoiceRemaining,
        },
        ordersByStatus,
        invoicesByStatus,
        orders: orders.map(order => ({
          _id: order._id,
          type: order.type,
          material: order.material,
          orderSize: order.orderSize,
          totalPrice: order.totalPrice,
          deposit: order.deposit,
          remainingAmount: order.remainingAmount,
          orderState: order.orderState,
          createdAt: order.createdAt,
          invoice: order.invoice,
          clientName: order.clientName || order.clientSnapshot?.name,
        })),
        invoices: invoices.map(invoice => ({
          _id: invoice._id,
          invoiceDate: invoice.invoiceDate,
          subtotal: invoice.subtotal,
          tax: invoice.tax,
          shipping: invoice.shipping,
          discount: invoice.discount,
          total: invoice.total,
          totalRemaining: invoice.totalRemaining,
          status: invoice.status,
          createdAt: invoice.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('Get client report error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating client report',
      error: error.message,
    });
  }
};
