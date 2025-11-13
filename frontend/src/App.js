import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Home from './pages/Home';
import Clients from './pages/Clients';
import Orders from './pages/Orders';
import FinancialStats from './pages/FinancialStats';
import Users from './pages/Users';
import Unauthorized from './pages/Unauthorized';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div style={styles.app}>
          <Navbar />
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
                <PrivateRoute roles={['designer', 'financial', 'admin']}>
                  <Orders />
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

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

const styles = {
  app: {
    minHeight: '100vh',
    backgroundColor: '#ecf0f1',
  },
};

export default App;
