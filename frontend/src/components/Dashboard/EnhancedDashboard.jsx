import {
  faBox,
  faChartLine,
  faChartPie,
  faCheckCircle,
  faClock,
  faDollarSign,
  faExclamationTriangle,
  faPalette,
  faRotate,
  faUsers
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { Suspense, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import clientService from '../../services/clientService';
import dashboardService from '../../services/dashboardService';
import { materialService } from '../../services/materialService';
import orderService from '../../services/orderService';
import Loading from '../Loading';
import PageLoader from '../PageLoader';
import DashboardCard from './DashboardCard';
import SkeletonLoader from './SkeletonLoader';
import StatCard from './StatCard';
// import './Dashboard.css'; // Removed legacy CSS
// import './EnhancedDashboard.css'; // Removed legacy CSS
import RealtimeListener from './RealtimeListener';

const RevenueLineChart = React.lazy(() => import('./Charts').then((m) => ({ default: m.RevenueLineChart })));
const StatusPieChart = React.lazy(() => import('./Charts').then((m) => ({ default: m.StatusPieChart })));
const OrdersBarChart = React.lazy(() => import('./Charts').then((m) => ({ default: m.OrdersBarChart })));
const ClientsBarChart = React.lazy(() => import('./Charts').then((m) => ({ default: m.ClientsBarChart })));

const EnhancedDashboard = () => {
  console.log('🏁 ENHANCED DASHBOARD RENDERING');

  const { user } = useAuth();
  console.log('👤 EnhancedDashboard - User:', user);

  const [loading, setLoading] = useState(true);
  const [timeseriesInterval, setTimeseriesInterval] = useState('day');

  const computeIsoWeekLabel = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    // move to Thursday in current week to calculate ISO week number
    const tmp = new Date(d);
    tmp.setDate(tmp.getDate() + 3 - ((tmp.getDay() + 6) % 7));
    const firstThursday = new Date(tmp.getFullYear(), 0, 4);
    const diff = Math.round((tmp - firstThursday) / 86400000);
    const week = Math.floor(diff / 7) + 1;
    return `${tmp.getFullYear()}-W${String(week).padStart(2, '0')}`;
  };
  const [clientStats, setClientStats] = useState(null);
  const [revenueChartLoading, setRevenueChartLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalOrders: 0,
      totalRevenue: 0,
      totalClients: 0,
      totalMaterials: 0,
      pendingOrders: 0,
      activeOrders: 0,
      completedOrders: 0,
    },
    recentOrders: [],
    statusBreakdown: [],
    lowStockMaterials: [],
    recentActivity: [],
  });

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  // Separate effect for revenue chart interval changes
  useEffect(() => {
    // Only load revenue data if dashboard data (specifically totalOrders) has been loaded
    // to ensure 'ordersArr' is available or can be fetched.
    if (user && ['designer', 'worker', 'financial', 'admin'].includes(user?.role)) {
      loadRevenueData();
    }
  }, [timeseriesInterval, user]); // Add user to dependencies to ensure it runs on initial load if role matches

  const loadRevenueData = async () => {
    if (!user || !['designer', 'worker', 'financial', 'admin'].includes(user?.role)) {
      return; // Only load if user has access
    }

    setRevenueChartLoading(true);
    try {
      let ordersArr = []; // Always fetch full orders for accurate timeseries fallback
      if (ordersArr.length === 0) {
        // If no recent orders from summary, fetch all orders to build timeseries
        const ordersResponse = await orderService.getOrders({ limit: 10000 });
        ordersArr = Array.isArray(ordersResponse)
          ? ordersResponse
          : ordersResponse?.data || ordersResponse?.orders || [];
      }

      // Fetch revenue timeseries from server (configurable interval)
      let periodVal = 30;
      if (timeseriesInterval === 'week') periodVal = 12;
      if (timeseriesInterval === 'month') periodVal = 12;
      const timeseriesResp = await orderService.getRevenueTimeseries(periodVal, timeseriesInterval).catch((tsError) => {
        console.error('Error fetching timeseries from server:', tsError);
        return null;
      });

      setDashboardData(prevData => {
        const newData = { ...prevData };
        if (timeseriesResp) {
          newData.revenueLabels = timeseriesResp?.data?.labels || [];
          newData.revenueData = timeseriesResp?.data?.data || [];
        } else {
          // Fallback: build locally depending on interval
          const fallbackMap = {};
          const fallbackLabels = [];
          if (timeseriesInterval === 'day') {
            const days = periodVal;
            for (let i = days - 1; i >= 0; i--) {
              const date = new Date();
              date.setDate(date.getDate() - i);
              const key = date.toISOString().slice(0, 10);
              fallbackLabels.push(key);
              fallbackMap[key] = 0;
            }
            (ordersArr || []).forEach((order) => {
              const dateKey = order.createdAt ? new Date(order.createdAt).toISOString().slice(0, 10) : null;
              if (!dateKey) return;
              if (fallbackMap[dateKey] === undefined) fallbackMap[dateKey] = 0;
              fallbackMap[dateKey] += Number(order.totalPrice) || Number(order.price) || 0;
            });
            newData.revenueLabels = fallbackLabels;
            newData.revenueData = fallbackLabels.map((l) => fallbackMap[l] || 0);
          } else if (timeseriesInterval === 'week') {
            // fallback for week: group by ISO week-year
            const periodWeeks = periodVal;
            // compute week starts
            const now = new Date();
            const dow = (now.getDay() + 6) % 7; // Monday=0
            const currentMonday = new Date(now);
            currentMonday.setDate(now.getDate() - dow);
            currentMonday.setHours(0, 0, 0, 0);
            const weekStart = new Date(currentMonday);
            weekStart.setDate(weekStart.getDate() - (periodWeeks - 1) * 7);
            const weeks = [];
            for (let i = 0; i < periodWeeks; i++) {
              const label = computeIsoWeekLabel(weekStart);
              // fallback: compute a simple label as YYYY-W
              weeks.push(label);
              fallbackMap[label] = 0;
              weekStart.setDate(weekStart.getDate() + 7);
            }
            (ordersArr || []).forEach((order) => {
              if (!order.createdAt) return;
              const label = computeIsoWeekLabel(order.createdAt);
              if (fallbackMap[label] === undefined) fallbackMap[label] = 0;
              fallbackMap[label] += Number(order.totalPrice) || Number(order.price) || 0;
            });
            newData.revenueLabels = weeks;
            newData.revenueData = weeks.map((l) => fallbackMap[l] || 0);
          } else if (timeseriesInterval === 'month') {
            const months = periodVal;
            const now = new Date();
            const mStart = new Date(now.getFullYear(), now.getMonth(), 1);
            mStart.setMonth(mStart.getMonth() - (months - 1));
            const monthLabels = [];
            for (let i = 0; i < months; i++) {
              const l = `${mStart.getFullYear()}-${String(mStart.getMonth() + 1).padStart(2, '0')}`;
              monthLabels.push(l);
              fallbackMap[l] = 0;
              mStart.setMonth(mStart.getMonth() + 1);
            }
            (ordersArr || []).forEach((order) => {
              if (!order.createdAt) return;
              const dt = new Date(order.createdAt);
              const label = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
              if (fallbackMap[label] === undefined) fallbackMap[label] = 0;
              fallbackMap[label] += Number(order.totalPrice) || Number(order.price) || 0;
            });
            newData.revenueLabels = monthLabels;
            newData.revenueData = monthLabels.map((l) => fallbackMap[l] || 0);
          }
        }
        return newData;
      });
    } catch (error) {
      console.error('Error loading revenue data:', error);
    } finally {
      setRevenueChartLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = {
        stats: {
          totalOrders: 0,
          totalRevenue: 0,
          totalClients: 0,
          totalMaterials: 0,
          pendingOrders: 0,
          activeOrders: 0,
          completedOrders: 0,
        },
        recentOrders: [],
        statusBreakdown: [],
        lowStockMaterials: [],
      };

      // Centralized dashboard summary (if available)
      try {
        const summaryResp = await dashboardService.getSummary();
        if (summaryResp?.data?.success && summaryResp?.data?.data) {
          const summary = summaryResp.data.data;
          if (summary.overall) data.stats = { ...data.stats, ...summary.overall };
          data.recentOrders = summary.recentOrders || data.recentOrders;
          data.statusBreakdown = summary.statusBreakdown || data.statusBreakdown;
          data.lowStockMaterials = summary.lowStock || data.lowStockMaterials;
          data.recentActivity = summary.recentNotifications || data.recentActivity;
        }
      } catch (summaryErr) {
        console.debug('Dashboard summary API not available or failed:', summaryErr?.message || summaryErr);
      }

      // Load order stats for roles that can access them (only if not full summary)
      if (['designer', 'worker', 'financial', 'admin'].includes(user?.role)) {
        try {
          const orderStats = await orderService.getFinancialStats();
          data.stats.totalOrders = orderStats.data?.overall?.totalOrders || 0;
          data.stats.totalRevenue = orderStats.data?.overall?.totalRevenue || 0;
          data.statusBreakdown = orderStats.data?.byState || [];

          // Calculate status counts
          data.statusBreakdown.forEach((status) => {
            if (status._id === 'pending') data.stats.pendingOrders = status.count;
            if (status._id === 'active') data.stats.activeOrders = status.count;
            if (status._id === 'done' || status._id === 'delivered') {
              data.stats.completedOrders += status.count;
            }
          });

          // Get recent orders
          // If recentOrders not returned by summary, fallback to existing fetch
          let ordersResponse = null;
          let ordersArr = [];
          if (!data.recentOrders || data.recentOrders.length === 0) {
            ordersResponse = await orderService.getOrders({ limit: 10000 });
            ordersArr = Array.isArray(ordersResponse)
              ? ordersResponse
              : ordersResponse?.data || ordersResponse?.orders || ordersResponse?.orders || [];
            data.recentOrders = (ordersArr || []).slice(0, 5);
          } else {
            // If we already have recentOrders from summary, ensure it's an array
            ordersArr = data.recentOrders || [];
          }

          // Fetch revenue timeseries from server (configurable interval)
          let periodVal = 30;
          if (timeseriesInterval === 'week') periodVal = 12;
          if (timeseriesInterval === 'month') periodVal = 12;
          const timeseriesResp = await orderService.getRevenueTimeseries(periodVal, timeseriesInterval).catch((tsError) => {
            console.error('Error fetching timeseries from server:', tsError);
            return null;
          });
          if (timeseriesResp) {
            data.revenueLabels = timeseriesResp?.data?.labels || [];
            data.revenueData = timeseriesResp?.data?.data || [];
          } else {
            // Fallback: build locally depending on interval
            const fallbackMap = {};
            const fallbackLabels = [];
            if (timeseriesInterval === 'day') {
              const days = periodVal;
              for (let i = days - 1; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const key = date.toISOString().slice(0, 10);
                fallbackLabels.push(key);
                fallbackMap[key] = 0;
              }
              (ordersArr || []).forEach((order) => {
                const dateKey = order.createdAt ? new Date(order.createdAt).toISOString().slice(0, 10) : null;
                if (!dateKey) return;
                if (fallbackMap[dateKey] === undefined) fallbackMap[dateKey] = 0;
                fallbackMap[dateKey] += Number(order.totalPrice) || Number(order.price) || 0;
              });
              data.revenueLabels = fallbackLabels;
              data.revenueData = fallbackLabels.map((l) => fallbackMap[l] || 0);
            } else if (timeseriesInterval === 'week') {
              // fallback for week: group by ISO week-year
              const periodWeeks = periodVal;
              // compute week starts
              const now = new Date();
              const dow = (now.getDay() + 6) % 7; // Monday=0
              const currentMonday = new Date(now);
              currentMonday.setDate(now.getDate() - dow);
              currentMonday.setHours(0, 0, 0, 0);
              const weekStart = new Date(currentMonday);
              weekStart.setDate(weekStart.getDate() - (periodWeeks - 1) * 7);
              const weeks = [];
              for (let i = 0; i < periodWeeks; i++) {
                const label = computeIsoWeekLabel(weekStart);
                // fallback: compute a simple label as YYYY-W
                weeks.push(label);
                fallbackMap[label] = 0;
                weekStart.setDate(weekStart.getDate() + 7);
              }
              (ordersArr || []).forEach((order) => {
                if (!order.createdAt) return;
                const label = computeIsoWeekLabel(order.createdAt);
                if (fallbackMap[label] === undefined) fallbackMap[label] = 0;
                fallbackMap[label] += Number(order.totalPrice) || Number(order.price) || 0;
              });
              data.revenueLabels = weeks;
              data.revenueData = weeks.map((l) => fallbackMap[l] || 0);
            } else if (timeseriesInterval === 'month') {
              const months = periodVal;
              const now = new Date();
              const mStart = new Date(now.getFullYear(), now.getMonth(), 1);
              mStart.setMonth(mStart.getMonth() - (months - 1));
              const monthLabels = [];
              for (let i = 0; i < months; i++) {
                const l = `${mStart.getFullYear()}-${String(mStart.getMonth() + 1).padStart(2, '0')}`;
                monthLabels.push(l);
                fallbackMap[l] = 0;
                mStart.setMonth(mStart.getMonth() + 1);
              }
              (ordersArr || []).forEach((order) => {
                if (!order.createdAt) return;
                const dt = new Date(order.createdAt);
                const label = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
                if (fallbackMap[label] === undefined) fallbackMap[label] = 0;
                fallbackMap[label] += Number(order.totalPrice) || Number(order.price) || 0;
              });
              data.revenueLabels = monthLabels;
              data.revenueData = monthLabels.map((l) => fallbackMap[l] || 0);
            }
          }
        } catch (error) {
          console.error('Error loading order stats:', error);
        }
      }

      // Load client count for receptionist and admin
      if (['receptionist', 'admin'].includes(user?.role)) {
        try {
          const clients = await clientService.getClients();
          data.stats.totalClients = Array.isArray(clients) ? clients.length : clients.data?.length || 0;
        } catch (error) {
          console.error('Error loading clients:', error);
        }
      }

      // Load materials and inventory for admin
      if (user?.role === 'admin') {
        try {
          const materialsResponse = await materialService.getAll({ limit: 10000 });
          const materials = materialsResponse.data.data.materials || [];
          data.stats.totalMaterials = materials.length || 0;

          // Find low stock materials
          data.lowStockMaterials = materials
            .filter((material) => material.currentStock <= material.minStockLevel)
            .slice(0, 5);
          // Materials distribution by category (for chart)
          const catMap = {};
          materials.forEach((m) => {
            const cat = m.category || 'other';
            if (!catMap[cat]) catMap[cat] = 0;
            catMap[cat] += Number(m.currentStock || 0);
          });
          data.materialCategoryLabels = Object.keys(catMap);
          data.materialCategoryData = Object.values(catMap);
        } catch (error) {
          console.error('Error loading materials:', error);
        }
      }

      // Load client statistics for financial, admin, and receptionist
      if (['financial', 'admin', 'receptionist'].includes(user?.role)) {
        console.log('✅ Loading client statistics for role:', user?.role);
        try {
          const clientStatsResponse = await clientService.getClientsStatistics();
          console.log('📊 Client stats response:', clientStatsResponse);

          if (clientStatsResponse?.success && clientStatsResponse?.data) {
            setClientStats(clientStatsResponse.data);
            // derive top clients by revenue (if not provided) - fallback
            const topClients = clientStatsResponse.data.overallStats?.topPayingClients || (clientStatsResponse.data.clients || []).slice(0, 5);
            data.topClientsLabels = (topClients || []).map(c => c.name || c.fullName);
            data.topClientsData = (topClients || []).map(c => c.totalValue || (c.statistics && c.statistics.totalValue) || 0);
            console.log('✨ Client stats set successfully:', clientStatsResponse.data);
          } else {
            console.error('❌ Invalid client stats response:', clientStatsResponse);
          }
        } catch (error) {
          console.error('❌ Error loading client statistics:', error);
        }
      }

      setDashboardData(data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRealtimeOrderCreated = (order) => {
    setDashboardData((prev) => ({ ...prev, recentOrders: [order, ...(prev.recentOrders || [])].slice(0, 5) }));
  };

  const handleRealtimeOrderUpdated = (order) => {
    // Update order in recentOrders if present
    setDashboardData((prev) => {
      if (!prev.recentOrders || prev.recentOrders.length === 0) return prev;
      const updated = prev.recentOrders.map((o) => (o._id === order._id ? order : o));
      return { ...prev, recentOrders: updated };
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      active: 'info',
      done: 'success',
      delivered: 'success',
    };
    return colors[status] || 'info';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  // Helper function to render KPI icon (supports both image and Font Awesome icon)
  const renderKPIIcon = (icon, image, gradient) => {
    if (image) {
      return (
        <div className="kpi-icon" style={{ background: gradient }}>
          <img src={image} alt="KPI" className="kpi-image" />
        </div>
      );
    }
    return (
      <div className="kpi-icon" style={{ background: gradient }}>
        <FontAwesomeIcon icon={icon} className="kpi-fa-icon" />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <Loading message="Loading dashboard..." size="large" />
      </div>
    );
  }
  return (
    <PageLoader
      loading={loading}
      loadingMessage="Loading dashboard data..."
      onLoadComplete={() => console.log('Dashboard loaded')}
    >
      <div className="enhanced-dashboard p-6 md:p-8">
        <RealtimeListener
          enabled={import.meta.env.VITE_ENABLE_SOCKET === 'true'}
          onOrderCreated={handleRealtimeOrderCreated}
          onOrderUpdated={handleRealtimeOrderUpdated}
        />
        {/* Welcome Header */}
        <DashboardCard className="mb-10 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-blue-500 dark:bg-blue-600 rounded-full shadow-lg">
              <FontAwesomeIcon icon={faUsers} className="text-3xl text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                Welcome back, {user?.fullName || user?.username}
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-lg">Track and manage your operations.</p>
            </div>
          </div>
        </DashboardCard>

        {/* KPI Cards */}
        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-10 py-6">
          {['designer', 'worker', 'financial', 'admin'].includes(user?.role) && (
            <>
              <Link to="/orders">
                <StatCard
                  title="Total Orders"
                  value={dashboardData.stats.totalOrders}
                  icon={faChartLine}
                  trend="up"
                  trendValue="20%"
                  color="blue"
                />
              </Link>

              <Link to="/orders?state=pending">
                <StatCard
                  title="Pending Orders"
                  value={dashboardData.stats.pendingOrders}
                  icon={faClock}
                  trendValue="Awaiting"
                  color="yellow"
                />
              </Link>

              <Link to="/orders?state=active">
                <StatCard
                  title="Active Orders"
                  value={dashboardData.stats.activeOrders}
                  icon={faRotate}
                  trend="up"
                  trendValue="vs last week"
                  color="cyan"
                />
              </Link>

              <Link to="/orders?state=done">
                <StatCard
                  title="Completed"
                  value={dashboardData.stats.completedOrders}
                  icon={faCheckCircle}
                  trend="up"
                  trendValue="Delivered"
                  color="green"
                />
              </Link>
            </>
          )}

          {['financial', 'admin'].includes(user?.role) && (
            <Link to="/financial-stats">
              <StatCard
                title="Total Revenue"
                value={`${dashboardData.stats.totalRevenue.toFixed(2)} EGP`}
                icon={faDollarSign}
                trend="up"
                trendValue="Overall"
                color="indigo"
              />
            </Link>
          )}

          {['receptionist', 'admin'].includes(user?.role) && (
            <Link to="/clients">
              <StatCard
                title="Total Clients"
                value={dashboardData.stats.totalClients}
                icon={faUsers}
                trend="up"
                trendValue="+5"
                color="purple"
              />
            </Link>
          )}

          {user?.role === 'admin' && (
            <Link to="/materials">
              <StatCard
                title="Materials"
                value={dashboardData.stats.totalMaterials}
                icon={faPalette}
                trendValue="In Stock"
                color="pink"
              />
            </Link>
          )}
        </div>
        {/* Main Content Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>

          {/* Recent Orders */}
          {dashboardData.recentOrders.length > 0 && (
            <DashboardCard>
              {/* Gradient accent */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-70 rounded-t-2xl"></div>

              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-extrabold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent flex items-center gap-3">
                  <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30">
                    <FontAwesomeIcon icon={faBox} className="text-sm" />
                  </span>
                  Recent Orders
                </h2>
                <Link to="/orders" className="text-sm font-bold text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text hover:from-blue-700 hover:to-indigo-700 transition-all">
                  View All →
                </Link>
              </div>
              <div className="space-y-3">
                <div className="orders-list space-y-3">
                  {dashboardData.recentOrders.map((order) => (
                    <div key={order._id} className="flex justify-between items-center p-4 bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-700/30 dark:to-gray-800/30 rounded-xl hover:shadow-md hover:scale-[1.01] transition-all duration-300 border border-gray-200/50 dark:border-gray-600/30">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900 dark:text-gray-100">{order.client?.name || order.clientName || 'N/A'}</span>
                        <span className="text-xs text-gray-500">{order.type || 'General Order'}</span>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`!inline-flex !items-center !justify-center !px-4 !py-1.5 !rounded-md !text-[11px] !font-bold !uppercase !tracking-wider ${order.orderState === 'done' ? '!bg-green-100 !text-green-700' :
                          order.orderState === 'active' ? '!bg-blue-100 !text-blue-700' :
                            '!bg-yellow-100 !text-yellow-700'
                          }`}>
                          {order.orderState}
                        </span>
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{order.totalPrice?.toFixed(2) || 0} EGP</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </DashboardCard>
          )}

          {/* Order Status Breakdown + Revenue Trends - Horizontal Group */}
          {dashboardData.statusBreakdown.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Order Status Breakdown */}
              <DashboardCard className="h-full">
                {/* Gradient accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 opacity-70 rounded-t-2xl"></div>

                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-extrabold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent flex items-center gap-3">
                    <FontAwesomeIcon icon={faChartPie} className="text-3xl text-emerald-500" />
                    Order Status Breakdown
                  </h2>
                </div>
                <div className="space-y-4">
                  {dashboardData.statusBreakdown.map((status) => {
                    const percentage = (status.count / dashboardData.stats.totalOrders) * 100;
                    return (
                      <div key={status._id} className="w-full">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-gray-700 dark:text-gray-300 capitalize">{status._id}</span>
                          <span className="text-gray-500">{status.count} orders</span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-5 overflow-hidden shadow-inner">
                          <div
                            className={`h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white transition-all duration-1000 ${status._id === 'done' ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                              status._id === 'active' ? 'bg-gradient-to-r from-blue-500 to-indigo-500' :
                                status._id === 'pending' ? 'bg-gradient-to-r from-yellow-400 to-orange-500' : 'bg-gray-500'
                              }`}
                            style={{ width: `${percentage}%` }}
                          >
                            {percentage > 10 && `${percentage.toFixed(0)}%`}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </DashboardCard>

              {/* Revenue Trends Chart */}
              <DashboardCard className="h-full">
                {/* Gradient accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 opacity-70 rounded-t-2xl"></div>

                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-extrabold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent flex items-center gap-3">
                    <FontAwesomeIcon icon={faChartLine} className="text-3xl text-purple-500" />
                    Revenue Trends
                  </h2>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">View:</span>
                    <div className="flex bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-800 rounded-xl p-1.5 shadow-inner gap-2 relative z-10">
                      {['day', 'week', 'month'].map((interval) => (
                        <button
                          key={interval}
                          className={`!inline-flex !items-center !justify-center !px-6 !py-2 !text-xs !font-bold !rounded-lg !transition-all !duration-300 !cursor-pointer !relative !z-20 ${timeseriesInterval === interval
                            ? '!bg-gradient-to-r !from-purple-500 !to-pink-500 !text-white !shadow-lg !shadow-purple-500/30 !scale-105'
                            : '!text-gray-600 dark:!text-gray-400 hover:!text-gray-900 dark:hover:!text-white hover:!bg-white/60 dark:hover:!bg-gray-600/60'
                            }`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setTimeseriesInterval(interval);
                          }}
                        >
                          {interval.charAt(0).toUpperCase() + interval.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <Suspense fallback={<SkeletonLoader height={250} />}>
                  <RevenueLineChart
                    labels={dashboardData?.revenueLabels || []}
                    data={dashboardData?.revenueData || []}
                    height={250}
                    currentInterval={timeseriesInterval}
                    isLoading={revenueChartLoading}
                  />
                </Suspense>
              </DashboardCard>
            </div>
          )}

          {/* Low Stock Alert */}
          {user?.role === 'admin' && dashboardData.lowStockMaterials.length > 0 && (
            <DashboardCard>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500" />
                  Low Stock Alert
                </h2>
                <Link to="/inventory" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Manage →
                </Link>
              </div>
              <div className="space-y-3">
                <div className="stock-list space-y-3">
                  {dashboardData.lowStockMaterials.map((material) => (
                    <div key={material._id} className="flex justify-between items-center !p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-lg">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900 dark:text-gray-100">{material.name}</span>
                        <span className="text-xs text-red-600 dark:text-red-400">
                          Current: {material.currentStock} {material.unit} | Min: {material.minStockLevel} {material.unit}
                        </span>
                      </div>
                      <span className="!inline-flex !items-center !justify-center !px-4 !py-1.5 !rounded-md !text-[11px] !font-bold !uppercase !tracking-wider bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">Low Stock</span>
                    </div>
                  ))}
                </div>
              </div>
            </DashboardCard>
          )}

          {/* Order Status Pie + Orders Overview - Horizontal Group */}
          {dashboardData.statusBreakdown.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
              {/* Order Status Pie Chart - 40% (2/5) */}
              <DashboardCard aria-label="Order status pie chart" className="lg:col-span-2 h-full">
                {/* Gradient accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 opacity-70 rounded-t-2xl"></div>

                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-extrabold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">Order Status</h3>
                  <Link to="/orders" className="text-sm font-bold text-transparent bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text hover:from-blue-700 hover:to-cyan-700 transition-all">View</Link>
                </div>
                <Suspense fallback={<SkeletonLoader height={300} className="w-full h-60 bg-gray-100 rounded-lg" />}>
                  <StatusPieChart
                    labels={dashboardData.statusBreakdown.map(s => s._id)}
                    data={dashboardData.statusBreakdown.map(s => s.count)}
                    height={300}
                    ariaLabel="Order status distribution chart"
                  />
                </Suspense>
              </DashboardCard>

              {/* Orders Overview Bar Chart - 60% (3/5) */}
              <DashboardCard aria-label="Orders overview bar chart" className="lg:col-span-3 h-full">
                {/* Gradient accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-70 rounded-t-2xl"></div>

                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-extrabold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">Orders Overview</h3>
                  <Link to="/orders" className="text-sm font-bold text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text hover:from-indigo-700 hover:to-purple-700 transition-all">View</Link>
                </div>
                <Suspense fallback={<SkeletonLoader height={300} className="w-full h-60 bg-gray-100 rounded-lg" />}>
                  <OrdersBarChart labels={dashboardData.statusBreakdown.map(s => s._id)} data={dashboardData.statusBreakdown.map(s => s.count)} height={300} ariaLabel="Orders status bar chart" />
                </Suspense>
              </DashboardCard>
            </div>
          )}

          {/* Materials Pie + Top Clients Bar - Horizontal Group */}
          {dashboardData.materialCategoryLabels && dashboardData.materialCategoryLabels.length > 0 && dashboardData.topClientsLabels && dashboardData.topClientsLabels.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
              {/* Materials Pie Chart - 40% (2/5) */}
              <DashboardCard aria-label="Materials by category" className="lg:col-span-2 h-full">
                {/* Gradient accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 opacity-70 rounded-t-2xl"></div>

                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-extrabold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">Materials by Category</h3>
                  <Link to="/materials" className="text-sm font-bold text-transparent bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text hover:from-orange-700 hover:to-amber-700 transition-all">View</Link>
                </div>
                <Suspense fallback={<SkeletonLoader height={300} className="w-full h-60 bg-gray-100 rounded-lg" />}>
                  <StatusPieChart
                    labels={dashboardData.materialCategoryLabels}
                    data={dashboardData.materialCategoryData}
                    height={300}
                    ariaLabel="Materials by category chart"
                  />
                </Suspense>
              </DashboardCard>

              {/* Top Clients Bar Chart - 60% (3/5) */}
              <DashboardCard aria-label="Top clients by revenue" className="lg:col-span-3 h-full">
                {/* Gradient accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 opacity-70 rounded-t-2xl"></div>

                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-extrabold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">Top Clients by Revenue</h3>
                  <Link to="/reports/client-analytics" className="text-sm font-bold text-transparent bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text hover:from-green-700 hover:to-teal-700 transition-all">View</Link>
                </div>
                <Suspense fallback={<SkeletonLoader height={300} className="w-full h-60 bg-gray-100 rounded-lg" />}>
                  <ClientsBarChart labels={dashboardData.topClientsLabels} data={dashboardData.topClientsData} height={300} label="Top Clients" ariaLabel="Top clients bar chart" />
                </Suspense>
              </DashboardCard>
            </div>
          )}

          {/* Client Analytics Cards - NEW! */}
          {['financial', 'admin', 'receptionist'].includes(user?.role) && clientStats && (
            <DashboardCard>
              {/* Gradient accent */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-500 opacity-70 rounded-t-2xl"></div>

              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-extrabold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent flex items-center gap-3">
                  <FontAwesomeIcon icon={faUsers} className="text-3xl text-rose-500" />
                  Client Analytics Overview
                </h2>
                <Link to="/reports/client-analytics" className="text-sm font-bold text-transparent bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text hover:from-rose-700 hover:to-pink-700 transition-all">
                  View Full Report →
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                {/* MVP Client - Highest Paying */}
                {clientStats.overallStats?.topPayingClients?.length > 0 && (
                  <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10 border border-yellow-100 dark:border-yellow-900/30 rounded-xl p-6 relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="absolute top-4 right-4 text-3xl opacity-20 group-hover:opacity-40 transition-opacity">👑</div>
                    <h4 className="text-yellow-700 dark:text-yellow-500 font-bold mb-3 uppercase text-xs tracking-wider">MVP Client</h4>
                    <div className="space-y-2">
                      <p className="text-lg font-bold text-gray-900 dark:text-white truncate">{clientStats.overallStats.topPayingClients[0].name}</p>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Total Revenue:</span>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(clientStats.overallStats.topPayingClients[0].totalValue)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Loyal Client - Best Loyalty Score */}
                {clientStats.overallStats?.mostLoyalClient && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl p-6 relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="absolute top-4 right-4 text-3xl opacity-20 group-hover:opacity-40 transition-opacity">⭐</div>
                    <h4 className="text-blue-700 dark:text-blue-500 font-bold mb-3 uppercase text-xs tracking-wider">Loyal Client</h4>
                    <div className="space-y-2">
                      <p className="text-lg font-bold text-gray-900 dark:text-white truncate">{clientStats.overallStats.mostLoyalClient.name}</p>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Loyalty Tier:</span>
                        <span className="font-semibold text-blue-600 dark:text-blue-400 capitalize">{clientStats.overallStats.mostLoyalClient.loyaltyTier}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Score:</span>
                        <span className="font-mono font-bold">{clientStats.overallStats.mostLoyalClient.loyaltyScore}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Most Purchasing Client - Highest Order Count */}
                {clientStats.clients?.length > 0 && (() => {
                  const mostPurchasingClient = clientStats.clients.reduce((prev, current) =>
                    (current.statistics.totalOrders > prev.statistics.totalOrders) ? current : prev
                    , clientStats.clients[0]);

                  return (
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 border border-green-100 dark:border-green-900/30 rounded-xl p-6 relative overflow-hidden group hover:shadow-md transition-all">
                      <div className="absolute top-4 right-4 text-3xl opacity-20 group-hover:opacity-40 transition-opacity">🛒</div>
                      <h4 className="text-green-700 dark:text-green-500 font-bold mb-3 uppercase text-xs tracking-wider">Top Buyer</h4>
                      <div className="space-y-2">
                        <p className="text-lg font-bold text-gray-900 dark:text-white truncate">{mostPurchasingClient.name}</p>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500">Total Orders:</span>
                          <span className="font-semibold text-gray-900 dark:text-gray-100">{mostPurchasingClient.statistics.totalOrders}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </DashboardCard>
          )}

          {/* Quick Actions */}
          <DashboardCard>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">⚡ Quick Actions</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {user?.role === 'admin' && (
                <>
                  <Link to="/invoices/new" className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-center font-medium text-gray-700 dark:text-gray-200">
                    <span className="text-sm">New Invoice</span>
                  </Link>
                  <Link to="/clients/new" className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-center font-medium text-gray-700 dark:text-gray-200">
                    <span className="text-sm">Add Client</span>
                  </Link>
                  <Link to="/materials" className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-center font-medium text-gray-700 dark:text-gray-200">
                    <span className="text-sm">Materials</span>
                  </Link>
                  <Link to="/purchases/new" className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-center font-medium text-gray-700 dark:text-gray-200">
                    <span className="text-sm">New Purchase</span>
                  </Link>
                </>
              )}
              {user?.role === 'receptionist' && (
                <>
                  <Link to="/clients/new" className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-center font-medium text-gray-700 dark:text-gray-200">
                    <span className="text-sm">Add Client</span>
                  </Link>
                  <Link to="/clients" className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-center font-medium text-gray-700 dark:text-gray-200">
                    <span className="text-sm">View Clients</span>
                  </Link>
                </>
              )}
              {['designer', 'worker'].includes(user?.role) && (
                <>
                  <Link to="/invoices" className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-center font-medium text-gray-700 dark:text-gray-200">
                    <span className="text-sm">View Invoices</span>
                  </Link>
                  <Link to="/orders" className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-center font-medium text-gray-700 dark:text-gray-200">
                    <span className="text-sm">View Orders</span>
                  </Link>
                </>
              )}
              {user?.role === 'financial' && (
                <>
                  <Link to="/invoices" className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-center font-medium text-gray-700 dark:text-gray-200">
                    <span className="text-sm">View Invoices</span>
                  </Link>
                  <Link to="/financial-stats" className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-center font-medium text-gray-700 dark:text-gray-200">
                    <span className="text-sm">Financial Reports</span>
                  </Link>
                </>
              )}
            </div>
          </DashboardCard>
        </div>
      </div>
    </PageLoader>
  );
};

export default EnhancedDashboard;
