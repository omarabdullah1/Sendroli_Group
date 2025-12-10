import { useState, useRef } from 'react';
import authService from '../services/authService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginMode, setLoginMode] = useState('username');
  const [passwordRequired, setPasswordRequired] = useState(true);
  const [phoneLookup, setPhoneLookup] = useState(null);
  const phoneCheckTimer = useRef(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const detectLoginType = (value) => {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    const trimmed = value.trim();
    if (phoneRegex.test(trimmed) && trimmed.length > 0) {
      setLoginMode('phone');
      setPasswordRequired(false);
      setPassword('');
    } else if (value.includes('@')) {
      setLoginMode('email');
      setPasswordRequired(true);
    } else {
      setLoginMode('username');
      setPasswordRequired(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const passwordToSend = loginMode === 'phone' ? null : password;
    if (loginMode === 'phone') setPassword('');
    const result = await login(username, passwordToSend);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.loginBox}>
        <h1 style={styles.title}>Factory Management System</h1>
        <h2 style={styles.subtitle}>Login</h2>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => {
                const val = e.target.value;
                setUsername(val);
                const phoneQuickRegex = /^[\d\s\-\+\(\)]+$/;
                if (phoneQuickRegex.test(val.trim()) && val.trim().length > 0) {
                  setPassword('');
                  setPasswordRequired(false);
                }
                if (phoneCheckTimer.current) clearTimeout(phoneCheckTimer.current);
                  phoneCheckTimer.current = setTimeout(() => {
                    detectLoginType(val);
                    const phoneQuickRegex = /^[\d\s\-\+\(\)]+$/;
                    if (val && phoneQuickRegex.test(val.trim())) {
                      authService
                        .checkPhone(val.trim())
                        .then((res) => setPhoneLookup(res))
                        .catch(() => setPhoneLookup(null));
                    } else {
                      setPhoneLookup(null);
                    }
                  }, 200);
              }}
              required
              style={styles.input}
              placeholder="Enter your username"
            />
                    {loginMode === 'phone' && phoneLookup && !phoneLookup.exists && (
                      <div style={{ marginTop: '0.5rem', color: '#ff5c5c' }}>
                        No account found for this phone number. If you are a staff or admin, use username or email and your password.
                      </div>
                    )}
          </div>

          {passwordRequired && (
            <div style={styles.formGroup}>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                  {passwordRequired && (
                style={styles.input}
                placeholder="Enter your password"
              />
            </div>
          )}

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div style={styles.hint}>
                  )}
          <p>Default credentials (for testing):</p>
          <p>Admin: admin / admin123</p>
          <p>Receptionist: receptionist / recep123</p>
          <p>Designer: designer / design123</p>
          <p>Financial: financial / finance123</p>
          <p>Worker: worker / worker123</p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ecf0f1',
  },
  loginBox: {
    backgroundColor: '#fff',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '400px',
  },
  title: {
    textAlign: 'center',
    color: '#2c3e50',
    marginBottom: '0.5rem',
    fontSize: '1.5rem',
  },
  subtitle: {
    textAlign: 'center',
    color: '#34495e',
    marginBottom: '2rem',
    fontSize: '1.2rem',
  },
  error: {
    backgroundColor: '#e74c3c',
    color: '#fff',
    padding: '0.75rem',
    borderRadius: '4px',
    marginBottom: '1rem',
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    marginBottom: '0.5rem',
    color: '#2c3e50',
    fontWeight: '500',
  },
  input: {
    padding: '0.75rem',
    border: '1px solid #bdc3c7',
    borderRadius: '4px',
    fontSize: '1rem',
  },
  button: {
    backgroundColor: '#3498db',
    color: '#fff',
    padding: '0.75rem',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    cursor: 'pointer',
    marginTop: '1rem',
  },
  hint: {
    marginTop: '2rem',
    padding: '1rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
    fontSize: '0.85rem',
    color: '#7f8c8d',
  },
};

export default Login;
