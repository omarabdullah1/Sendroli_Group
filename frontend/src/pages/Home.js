import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { user } = useAuth();

  const getRoleFeatures = () => {
    switch (user.role) {
      case 'receptionist':
        return [
          { title: 'Client Management', description: 'Add, view, edit, and delete client records', link: '/clients' },
        ];
      case 'designer':
        return [
          { title: 'Order Management', description: 'View and update order status', link: '/orders' },
        ];
      case 'financial':
        return [
          { title: 'Order Management', description: 'Manage payments and deposits', link: '/orders' },
          { title: 'Financial Statistics', description: 'View financial reports and summaries', link: '/financial-stats' },
        ];
      case 'admin':
        return [
          { title: 'Client Management', description: 'Full control over client records', link: '/clients' },
          { title: 'Order Management', description: 'Complete order management', link: '/orders' },
          { title: 'User Management', description: 'Manage system users', link: '/users' },
          { title: 'Financial Statistics', description: 'View financial reports', link: '/financial-stats' },
        ];
      default:
        return [];
    }
  };

  const features = getRoleFeatures();

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.title}>Welcome, {user.fullName}!</h1>
        <p style={styles.subtitle}>Role: {user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>

        <div style={styles.features}>
          <h2 style={styles.featuresTitle}>Your Features</h2>
          <div style={styles.featureGrid}>
            {features.map((feature, index) => (
              <Link to={feature.link} key={index} style={styles.featureCard}>
                <h3 style={styles.featureTitle}>{feature.title}</h3>
                <p style={styles.featureDescription}>{feature.description}</p>
              </Link>
            ))}
          </div>
        </div>

        <div style={styles.info}>
          <h3 style={styles.infoTitle}>System Information</h3>
          <ul style={styles.infoList}>
            <li>Your access is limited to the features shown above</li>
            <li>All actions are logged for security purposes</li>
            <li>Contact your administrator if you need additional access</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: 'calc(100vh - 80px)',
    backgroundColor: '#ecf0f1',
    padding: '2rem',
  },
  content: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  title: {
    fontSize: '2.5rem',
    color: '#2c3e50',
    marginBottom: '0.5rem',
  },
  subtitle: {
    fontSize: '1.2rem',
    color: '#7f8c8d',
    marginBottom: '3rem',
  },
  features: {
    marginBottom: '3rem',
  },
  featuresTitle: {
    fontSize: '1.8rem',
    color: '#2c3e50',
    marginBottom: '1.5rem',
  },
  featureGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.5rem',
  },
  featureCard: {
    backgroundColor: '#fff',
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    textDecoration: 'none',
    transition: 'transform 0.2s, box-shadow 0.2s',
    cursor: 'pointer',
  },
  featureTitle: {
    fontSize: '1.3rem',
    color: '#3498db',
    marginBottom: '0.5rem',
  },
  featureDescription: {
    color: '#7f8c8d',
    lineHeight: '1.6',
  },
  info: {
    backgroundColor: '#fff',
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  infoTitle: {
    fontSize: '1.3rem',
    color: '#2c3e50',
    marginBottom: '1rem',
  },
  infoList: {
    color: '#7f8c8d',
    lineHeight: '1.8',
    paddingLeft: '1.5rem',
  },
};

export default Home;
