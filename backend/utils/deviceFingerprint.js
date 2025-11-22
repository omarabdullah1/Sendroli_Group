const crypto = require('crypto');

/**
 * Generate a device fingerprint from IP address and User Agent
 * This helps identify unique device/browser combinations
 */
const generateDeviceFingerprint = (ipAddress, userAgent) => {
  // Combine IP and User Agent to create a unique fingerprint
  const deviceData = `${ipAddress}:${userAgent}`;
  
  // Create a hash of the device data
  const fingerprint = crypto
    .createHash('sha256')
    .update(deviceData)
    .digest('hex')
    .substring(0, 16); // Use first 16 characters for simplicity
    
  return fingerprint;
};

/**
 * Extract real IP address from request, considering proxies
 */
const getClientIP = (req) => {
  // Check for various proxy headers in order of reliability
  const forwardedFor = req.headers['x-forwarded-for'];
  const realIP = req.headers['x-real-ip'];
  const cfConnectingIP = req.headers['cf-connecting-ip']; // Cloudflare
  
  let clientIP;
  
  if (forwardedFor) {
    // X-Forwarded-For can contain multiple IPs, get the first one
    clientIP = forwardedFor.split(',')[0].trim();
  } else if (realIP) {
    clientIP = realIP;
  } else if (cfConnectingIP) {
    clientIP = cfConnectingIP;
  } else {
    // Fallback to connection IP
    clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
  }
  
  // Clean up IPv6 mapped IPv4 addresses
  if (clientIP && clientIP.substr(0, 7) === '::ffff:') {
    clientIP = clientIP.substr(7);
  }
  
  return clientIP || 'unknown';
};

/**
 * Determine device type from user agent
 */
const getDeviceType = (userAgent) => {
  if (!userAgent) return 'Unknown Device';
  
  const ua = userAgent.toLowerCase();
  
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return 'Mobile Device';
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    return 'Tablet Device';
  } else if (ua.includes('chrome')) {
    return 'Chrome Browser';
  } else if (ua.includes('firefox')) {
    return 'Firefox Browser';
  } else if (ua.includes('safari') && !ua.includes('chrome')) {
    return 'Safari Browser';
  } else if (ua.includes('edge')) {
    return 'Edge Browser';
  } else {
    return 'Desktop Browser';
  }
};

module.exports = {
  generateDeviceFingerprint,
  getClientIP,
  getDeviceType
};