import React from 'react';
import { Link } from 'react-router-dom';

const Unauthorized = () => {
  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.title}>403</h1>
        <h2 style={styles.subtitle}>Access Denied</h2>
        <p style={styles.message}>
          You don't have permission to access this page.
        </p>
        <Link to="/" style={styles.link}>
          Go to Home
        </Link>
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
  content: {
    textAlign: 'center',
  },
  title: {
    fontSize: '6rem',
    color: '#e74c3c',
    margin: '0',
  },
  subtitle: {
    fontSize: '2rem',
    color: '#2c3e50',
    marginBottom: '1rem',
  },
  message: {
    fontSize: '1.2rem',
    color: '#7f8c8d',
    marginBottom: '2rem',
  },
  link: {
    backgroundColor: '#3498db',
    color: '#fff',
    padding: '0.75rem 1.5rem',
    textDecoration: 'none',
    borderRadius: '4px',
    display: 'inline-block',
  },
};

export default Unauthorized;
