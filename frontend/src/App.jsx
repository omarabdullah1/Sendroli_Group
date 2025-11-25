// Sendroli Factory Management System - Main App Component
import { Navigate, Route, BrowserRouter as Router, Routes, useLocation } from 'react-router-dom';
import './App.css';
import DeviceConflictNotification from './components/Auth/DeviceConflictNotification.jsx';
import PrivateRoute from './components/PrivateRoute.jsx';
import Sidebar from './components/Sidebar/Sidebar.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import Clients from './pages/Clients.jsx';
import FinancialStats from './pages/FinancialStats.jsx';
import Home from './pages/Home.jsx';
import Inventory from './pages/Inventory.jsx';
import Invoices from './pages/Invoices.jsx';
import Login from './pages/Login.jsx';
import Materials from './pages/Materials.jsx';
import Orders from './pages/Orders.jsx';
import Purchases from './pages/Purchases.jsx';
import Suppliers from './pages/Suppliers.jsx';
import Unauthorized from './pages/Unauthorized.jsx';
import Users from './pages/Users.jsx';
import './styles/designSystem.css';

// Layout component to conditionally show sidebar
const Layout = ({ children }) => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/unauthorized';

  return (
    <div className="app-container">
      {!isAuthPage && <Sidebar />}
      <main className={`main-content ${!isAuthPage ? 'with-sidebar' : ''}`}>
        <DeviceConflictNotification />
        {children}
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}>
        <Layout>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            <Route
              path="/"
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
                <PrivateRoute roles={['designer', 'worker', 'financial', 'admin']}>
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
              path="/users"
              element={
                <PrivateRoute roles={['admin']}>
                  <Users />
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
                <PrivateRoute roles={['admin']}>
                  <Inventory />
                </PrivateRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;
