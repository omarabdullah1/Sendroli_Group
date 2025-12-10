// Sendroli Factory Management System - Main App Component
import { Component } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes, useLocation } from 'react-router-dom';
import './App.css';
import ClientRegister from './components/Auth/ClientRegister.jsx';
import DeviceConflictNotification from './components/Auth/DeviceConflictNotification.jsx';
import ClientAnalytics from './components/Clients/ClientAnalytics.jsx';
import NotificationContainer from './components/NotificationContainer.jsx';
import PrivateRoute from './components/PrivateRoute.jsx';
import Sidebar from './components/Sidebar/Sidebar.jsx';
import TopHeader from './components/TopHeader/TopHeader.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { NotificationProvider } from './context/NotificationContext.jsx';
import { SidebarProvider } from './context/SidebarContext';
import ClientPortal from './pages/ClientPortal.jsx';
import ClientReports from './pages/ClientReports.jsx';
import Clients from './pages/Clients.jsx';
import FinancialReport from './pages/FinancialReport.jsx';
import FinancialStats from './pages/FinancialStats.jsx';
import Home from './pages/Home.jsx';
import Inventory from './pages/Inventory.jsx';
import Invoices from './pages/Invoices.jsx';
import Materials from './pages/Materials.jsx';
import MaterialWithdrawal from './pages/MaterialWithdrawal.jsx';
import Notifications from './pages/Notifications.jsx';
import Orders from './pages/Orders.jsx';
import Purchases from './pages/Purchases.jsx';
import Suppliers from './pages/Suppliers.jsx';
import Unauthorized from './pages/Unauthorized.jsx';
import Users from './pages/Users.jsx';
import LandingPage from './pages/Website/LandingPage.jsx';
import WebsiteLogin from './pages/Website/WebsiteLogin.jsx';
import WebsiteSettings from './pages/WebsiteSettings.jsx';
import './styles/designSystem.css';

// Error Boundary Component
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// Layout component to conditionally show sidebar
const Layout = ({ children }) => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/unauthorized';
  // Website pages: root, website routes, client portal
  const isWebsitePage = location.pathname === '/' || 
                        location.pathname.startsWith('/website') || 
                        location.pathname === '/client-portal';
  // ERP pages: dashboard and all other protected routes
  const isERPage = location.pathname.startsWith('/dashboard') || 
                    location.pathname.startsWith('/clients') ||
                    location.pathname.startsWith('/orders') ||
                    location.pathname.startsWith('/invoices') ||
                    location.pathname.startsWith('/financial-stats') ||
                    location.pathname.startsWith('/financial-report') ||
                    location.pathname.startsWith('/client-reports') ||
                    location.pathname.startsWith('/reports') ||
                    location.pathname.startsWith('/users') ||
                    location.pathname.startsWith('/notifications') ||
                    location.pathname.startsWith('/materials') ||
                    location.pathname.startsWith('/suppliers') ||
                    location.pathname.startsWith('/purchases') ||
                    location.pathname.startsWith('/inventory') ||
                    location.pathname.startsWith('/material-withdrawal') ||
                    location.pathname.startsWith('/website-settings');

  return (
    <div className="app-container">
      {!isAuthPage && !isWebsitePage && isERPage && <Sidebar />}
      <main className={`main-content ${!isAuthPage && !isWebsitePage && isERPage ? 'with-sidebar' : ''}`}>
        {!isAuthPage && !isWebsitePage && isERPage && <TopHeader />}
        <div className={`content-wrapper ${!isAuthPage && !isWebsitePage && isERPage ? 'with-header' : ''}`}>
          {!isWebsitePage && <DeviceConflictNotification />}
          <NotificationContainer />
          {children}
        </div>
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <SidebarProvider>
        <Router future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}>
          <Layout>
          <Routes>
            {/* Public Website - Main Page */}
            <Route path="/" element={<LandingPage />} />
            
            {/* Main Login Page - Website Login */}
            <Route path="/login" element={<WebsiteLogin />} />
            <Route path="/register" element={<ClientRegister />} />
            <Route path="/website/login" element={<Navigate to="/login" replace />} />
            
            {/* Client Portal */}
            <Route
              path="/client-portal"
              element={
                <PrivateRoute roles={['client']}>
                  <ClientPortal />
                </PrivateRoute>
              }
            />

            {/* Other Routes */}
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            {/* ERP Dashboard */}
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Home />
                </PrivateRoute>
              }
            />

            <Route
              path="/clients"
              element={
                <PrivateRoute roles={['receptionist', 'admin']}>
                  <Clients />
                </PrivateRoute>
              }
            />

            <Route
              path="/reports/client-analytics"
              element={
                <PrivateRoute roles={['financial', 'admin']}>
                  <ClientAnalytics />
                </PrivateRoute>
              }
            />

            <Route
              path="/orders"
              element={
                <PrivateRoute roles={['designer', 'worker', 'financial', 'admin']}>
                  <Orders />
                </PrivateRoute>
              }
            />

            <Route
              path="/invoices/*"
              element={
                <PrivateRoute roles={['designer', 'financial', 'admin']}>
                  <Invoices />
                </PrivateRoute>
              }
            />

            <Route
              path="/financial-stats"
              element={
                <PrivateRoute roles={['financial', 'admin']}>
                  <FinancialStats />
                </PrivateRoute>
              }
            />

            <Route
              path="/financial-report"
              element={
                <PrivateRoute roles={['financial', 'admin']}>
                  <FinancialReport />
                </PrivateRoute>
              }
            />

            <Route
              path="/client-reports"
              element={
                <PrivateRoute roles={['admin', 'financial']}>
                  <ClientReports />
                </PrivateRoute>
              }
            />

            <Route
              path="/users"
              element={
                <PrivateRoute roles={['admin']}>
                  <Users />
                </PrivateRoute>
              }
            />

            <Route
              path="/notifications"
              element={
                <PrivateRoute>
                  <Notifications />
                </PrivateRoute>
              }
            />

            <Route
              path="/materials"
              element={
                <PrivateRoute roles={['admin']}>
                  <Materials />
                </PrivateRoute>
              }
            />

            <Route
              path="/suppliers"
              element={
                <PrivateRoute roles={['admin']}>
                  <Suppliers />
                </PrivateRoute>
              }
            />

            <Route
              path="/purchases"
              element={
                <PrivateRoute roles={['admin']}>
                  <Purchases />
                </PrivateRoute>
              }
            />

            <Route
              path="/inventory"
              element={
                <PrivateRoute roles={['admin', 'worker']}>
                  <Inventory />
                </PrivateRoute>
              }
            />

            <Route
              path="/material-withdrawal"
              element={
                <PrivateRoute roles={['admin', 'worker']}>
                  <MaterialWithdrawal />
                </PrivateRoute>
              }
            />

            <Route
              path="/website-settings"
              element={
                <PrivateRoute roles={['admin']}>
                  <WebsiteSettings />
                </PrivateRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </Router>
        </SidebarProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
