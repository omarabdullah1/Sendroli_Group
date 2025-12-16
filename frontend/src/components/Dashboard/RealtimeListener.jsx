import { useEffect } from 'react';
import { io } from 'socket.io-client';

const RealtimeListener = ({ onOrderCreated, onOrderUpdated, enabled = false }) => {
  useEffect(() => {
    if (!enabled) return;

    const socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000');
    socket.on('connect', () => console.log('Realtime socket connected', socket.id));

    socket.on('order:created', (data) => {
      try { if (onOrderCreated) onOrderCreated(data); } catch (err) { console.error(err); }
    });

    socket.on('order:updated', (data) => {
      try { if (onOrderUpdated) onOrderUpdated(data); } catch (err) { console.error(err); }
    });

    return () => {
      socket.disconnect();
    };
  }, [enabled, onOrderCreated, onOrderUpdated]);

  return null;
};

export default RealtimeListener;
