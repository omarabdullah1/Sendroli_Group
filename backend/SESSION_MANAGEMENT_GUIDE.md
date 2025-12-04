# 🔐 Enhanced Session Management System

## Overview

This document describes the enhanced session management system implemented in the Sendroli Group Factory Management System. The system provides secure session handling with forced login capabilities and comprehensive token validation.

## Features

### 1. Session Conflict Detection
- Returns **409 Conflict** when attempting to login with an existing active session
- Provides detailed information about the current session
- Prevents accidental session termination

### 2. Forced Login
- Allows users to forcefully terminate existing sessions
- Creates a new session and invalidates all previous tokens
- Useful for scenarios where users are locked out or need to force logout from another device

### 3. Active Token Validation
- Middleware validates that incoming JWT matches the stored `activeToken` in the database
- Prevents stolen or old tokens from being used after a new login
- Ensures only one valid session per user at any time

### 4. Session State Tracking
- Tracks `sessionInfo.isValid` flag for server-side session revocation
- Stores device information, IP address, login time, and last activity
- Supports session version tracking to invalidate old sessions

---

## API Endpoints

### Login (POST /api/auth/login)

#### Normal Login (Session Check)

**Request:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response (Success - First Login):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "user_id",
    "username": "admin",
    "role": "admin",
    "fullName": "Admin User",
    "email": "admin@factory.com"
  },
  "sessionInfo": {
    "loginTime": "2024-01-15T10:30:00.000Z",
    "deviceName": "Chrome on Windows",
    "ipAddress": "192.168.1.100"
  }
}
```

**Response (409 Conflict - Active Session Exists):**
```json
{
  "success": false,
  "message": "Active session detected",
  "code": "ACTIVE_SESSION",
  "sessionInfo": {
    "deviceName": "Safari on macOS",
    "deviceType": "desktop",
    "loginTime": "2024-01-15T09:00:00.000Z",
    "lastActivity": "2024-01-15T10:25:00.000Z",
    "ipAddress": "192.168.1.50"
  }
}
```

#### Forced Login (Override Existing Session)

**Request:**
```json
{
  "username": "admin",
  "password": "admin123",
  "force": true
}
```

**Response (Success):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "user_id",
    "username": "admin",
    "role": "admin",
    "fullName": "Admin User",
    "email": "admin@factory.com"
  },
  "sessionInfo": {
    "loginTime": "2024-01-15T10:30:00.000Z",
    "deviceName": "Chrome on Windows",
    "ipAddress": "192.168.1.100"
  },
  "message": "Previous session terminated. New session created.",
  "previousSession": {
    "deviceName": "Safari on macOS",
    "loginTime": "2024-01-15T09:00:00.000Z",
    "lastActivity": "2024-01-15T10:25:00.000Z"
  }
}
```

---

## Middleware Protection

### Enhanced `protect` Middleware

The middleware performs the following checks:

1. **Token Exists**: Verifies Authorization header contains Bearer token
2. **Token Valid**: Verifies JWT signature and expiration
3. **User Exists**: Confirms user exists in database
4. **Account Active**: Checks `user.isActive === true`
5. **Token Matches**: Validates `user.activeToken === incoming_token` ⚡ **CRITICAL**
6. **Session Valid**: Confirms `user.sessionInfo.isValid === true` ⚡ **CRITICAL**
7. **Session Timeout**: Checks for inactivity (7 days default)
8. **Activity Update**: Updates `lastActivity` timestamp (debounced to 5 minutes)

### Error Codes

The middleware returns specific error codes for different failure scenarios:

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `NO_TOKEN` | 401 | No authorization token provided |
| `USER_NOT_FOUND` | 401 | User ID from token doesn't exist |
| `ACCOUNT_INACTIVE` | 401 | User account is deactivated |
| `TOKEN_INVALIDATED` | 401 | Token doesn't match stored activeToken |
| `SESSION_INVALID` | 401 | Session marked as invalid in database |
| `SESSION_EXPIRED` | 401 | Session timeout due to inactivity |
| `TOKEN_EXPIRED` | 401 | JWT token has expired |
| `INVALID_TOKEN` | 401 | JWT signature is invalid |
| `AUTH_ERROR` | 401 | Other authentication error |

**Example Error Response:**
```json
{
  "success": false,
  "message": "Session has been invalidated. Please login again.",
  "code": "TOKEN_INVALIDATED"
}
```

---

## Database Schema

### User Model - Session Fields

```javascript
{
  activeToken: {
    type: String,
    default: null,
    select: false // Excluded from normal queries for security
  },
  
  sessionInfo: {
    ipAddress: String,
    userAgent: String,
    deviceFingerprint: String,
    loginTime: Date,
    lastActivity: Date,
    isValid: Boolean,        // ⚡ Used to invalidate sessions
    sessionVersion: Number   // Incremented on each login
  },
  
  deviceInfo: {
    userAgent: String,
    deviceName: String,
    loginTime: Date,
    ipAddress: String
  }
}
```

---

## Security Benefits

### 1. Prevents Token Reuse
- Old tokens are immediately invalidated when a new login occurs
- Even if an attacker steals a token, it becomes useless after the user logs in again

### 2. Server-Side Session Control
- Sessions can be invalidated server-side by setting `sessionInfo.isValid = false`
- Provides centralized control over all user sessions

### 3. Single Active Session
- Only one active session per user at any time
- Prevents session proliferation and reduces security attack surface

### 4. Device Tracking
- Tracks which device and IP address each session originates from
- Provides audit trail for security investigations

### 5. Session Timeout
- Automatic session invalidation after 7 days of inactivity
- Reduces risk from abandoned sessions

---

## Frontend Implementation Guide

### Login Flow

```javascript
async function login(username, password, forceLogin = false) {
  try {
    const response = await axios.post('/api/auth/login', {
      username,
      password,
      force: forceLogin
    });
    
    // Success - store token
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    
    return { success: true, data: response.data };
    
  } catch (error) {
    if (error.response?.status === 409) {
      // Active session detected
      return {
        success: false,
        conflict: true,
        sessionInfo: error.response.data.sessionInfo
      };
    }
    
    return {
      success: false,
      message: error.response?.data?.message || 'Login failed'
    };
  }
}

// Usage Example
const result = await login('admin', 'password123');

if (result.success) {
  // Login successful
  navigateToDashboard();
} else if (result.conflict) {
  // Show dialog to user
  const confirmForce = confirm(
    `You have an active session on ${result.sessionInfo.deviceName}.\n` +
    `Last activity: ${new Date(result.sessionInfo.lastActivity).toLocaleString()}\n\n` +
    `Do you want to logout from that device and login here?`
  );
  
  if (confirmForce) {
    // Retry with force flag
    const forceResult = await login('admin', 'password123', true);
    if (forceResult.success) {
      navigateToDashboard();
    }
  }
} else {
  // Show error message
  showError(result.message);
}
```

### Handling Token Invalidation

```javascript
// Axios interceptor to handle session errors
axios.interceptors.response.use(
  response => response,
  error => {
    const errorCode = error.response?.data?.code;
    
    // Handle session invalidation errors
    if (errorCode === 'TOKEN_INVALIDATED' || 
        errorCode === 'SESSION_INVALID' ||
        errorCode === 'SESSION_EXPIRED') {
      // Clear stored credentials
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Show appropriate message
      showMessage(error.response.data.message);
      
      // Redirect to login
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);
```

---

## Testing

### Run Test Suite

A comprehensive test suite is provided to verify all session management features:

```bash
cd backend
node test_session_management.js
```

The test suite validates:
- ✅ Normal login creates session
- ✅ Second login returns 409 conflict
- ✅ Force login invalidates previous session
- ✅ New token works correctly
- ✅ Old token is rejected
- ✅ Middleware validates activeToken
- ✅ Middleware validates sessionInfo.isValid
- ✅ Logout invalidates session

### Manual Testing with cURL

**1. First Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

**2. Second Login (Should return 409):**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

**3. Force Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123","force":true}'
```

**4. Test with Old Token (Should fail):**
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer OLD_TOKEN_HERE"
```

---

## Configuration

### Session Timeout

The session timeout can be configured in the middleware:

```javascript
// In backend/middleware/auth.js
const SESSION_TIMEOUT_HOURS = 24 * 7; // 7 days (default)
```

### Activity Update Debouncing

To reduce database writes, activity updates are debounced:

```javascript
// In backend/middleware/auth.js
// Only update if more than 5 minutes since last update
if (minutesSinceLastUpdate > 5) {
  await User.findByIdAndUpdate(req.user._id, {
    'sessionInfo.lastActivity': new Date()
  });
}
```

### JWT Token Expiration

JWT expiration is configured in environment variables:

```bash
# .env
JWT_EXPIRE=7d  # 7 days
```

---

## Best Practices

### 1. Use HTTPS in Production
Always use HTTPS to protect tokens in transit.

### 2. Implement Token Refresh
Consider implementing refresh tokens for longer-lived sessions without security compromise.

### 3. Monitor Session Activity
Log and monitor session creation/termination for security analysis.

### 4. Rate Limit Login Attempts
Implement rate limiting to prevent brute force attacks:

```javascript
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts, please try again later'
});

app.post('/api/auth/login', loginLimiter, login);
```

### 5. Notify Users of New Sessions
Consider sending email notifications when new sessions are created from different devices/locations.

---

## Troubleshooting

### Issue: Token works but session should be invalid

**Cause**: Old code path not checking activeToken or sessionInfo.isValid

**Solution**: Ensure all protected routes use the updated `protect` middleware

### Issue: 409 conflicts even after logout

**Cause**: Session not properly cleared during logout

**Solution**: Verify logout endpoint sets `activeToken: null` and `sessionInfo.isValid: false`

### Issue: Users logged out unexpectedly

**Cause**: Session timeout too aggressive or activity not updating

**Solution**: 
- Increase `SESSION_TIMEOUT_HOURS`
- Reduce activity update debounce interval
- Check for clock synchronization issues

---

## Migration Guide

If you had an existing authentication system without this session management:

### 1. Update Database

All existing users need session fields initialized:

```javascript
// Run this migration script
db.users.updateMany(
  {},
  {
    $set: {
      activeToken: null,
      'sessionInfo.isValid': false,
      'sessionInfo.sessionVersion': 0
    }
  }
);
```

### 2. Update Frontend

Update your frontend login logic to handle 409 conflicts and provide force login option.

### 3. Test Thoroughly

Run the test suite and perform manual testing before deploying to production.

---

## Summary

This enhanced session management system provides:
- ✅ Conflict detection for existing sessions
- ✅ Forced login capability
- ✅ Strict token validation in middleware
- ✅ Server-side session revocation
- ✅ Device and activity tracking
- ✅ Automatic session timeout
- ✅ Comprehensive error codes
- ✅ Security best practices

The implementation ensures that:
1. Only one valid session exists per user
2. Old tokens are immediately invalidated on new login
3. Sessions can be revoked server-side
4. All protected routes validate active sessions
5. Users have control over their sessions

---

## Support

For questions or issues with session management:
1. Check this documentation
2. Run the test suite: `node test_session_management.js`
3. Review middleware logs
4. Check MongoDB session data directly

---

**Last Updated**: December 2024  
**Version**: 1.0.0
