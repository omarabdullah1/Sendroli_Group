import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import { AuthProvider } from './context/AuthContext';
import Clients from './pages/Clients';
import FinancialStats from './pages/FinancialStats';
import Home from './pages/Home';
import Login from './pages/Login';
import Orders from './pages/Orders';
import Unauthorized from './pages/Unauthorized';
import Users from './pages/Users';

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
