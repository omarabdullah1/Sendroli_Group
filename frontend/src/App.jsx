import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './utils/ProtectedRoute';
import Layout from './components/Layout/Layout';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/Dashboard/Dashboard';
import ClientList from './components/Clients/ClientList';
import ClientForm from './components/Clients/ClientForm';
import ClientDetail from './components/Clients/ClientDetail';
import OrderList from './components/Orders/OrderList';
import OrderForm from './components/Orders/OrderForm';
import OrderDetail from './components/Orders/OrderDetail';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/clients"
            element={
              <ProtectedRoute>
                <Layout>
                  <ClientList />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/clients/new"
            element={
              <ProtectedRoute>
                <Layout>
                  <ClientForm />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/clients/edit/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <ClientForm />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/clients/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <ClientDetail />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <Layout>
                  <OrderList />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/orders/new"
            element={
              <ProtectedRoute>
                <Layout>
                  <OrderForm />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/orders/edit/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <OrderForm />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/orders/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <OrderDetail />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
