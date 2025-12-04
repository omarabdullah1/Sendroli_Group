# 🚀 Session Management - Quick Reference

## Production Backend URL
```
https://backend-j5j55w1xg-oos-projects-e7124c64.vercel.app/api
```

---

## 🔑 Login Endpoints

### 1. Normal Login (Returns 409 if session exists)
```bash
POST /auth/login
{
  "username": "admin",
  "password": "admin123"
}

# Response if NO active session (200 OK):
{
  "success": true,
  "token": "jwt_token...",
  "user": { ... }
}

# Response if ACTIVE session (409 Conflict):
{
  "success": false,
  "code": "ACTIVE_SESSION",
  "message": "Active session detected",
  "sessionInfo": {
    "deviceName": "Chrome Browser",
    "loginTime": "2025-12-01T10:02:23.381Z",
    "lastActivity": "2025-12-01T10:05:29.129Z",
    "ipAddress": "197.120.119.89"
  }
}
```

---

### 2. Force Login (Invalidates previous session)
```bash
POST /auth/login
{
  "username": "admin",
  "password": "admin123",
  "force": true  # ← Add this to override
}

# Response (200 OK):
{
  "success": true,
  "token": "new_jwt_token...",
  "user": { ... },
  "message": "Previous session terminated. New session created.",
  "previousSession": {
    "deviceName": "Chrome Browser",
    "loginTime": "...",
    "lastActivity": "..."
  }
}
```

---

## 🛡️ Protected Routes Validation

Middleware checks on every protected request:

| Check | Error Code | Status |
|-------|------------|--------|
| No token | `NO_TOKEN` | 401 |
| Invalid token | `INVALID_TOKEN` | 401 |
| Token expired | `TOKEN_EXPIRED` | 401 |
| User not found | `USER_NOT_FOUND` | 401 |
| Account inactive | `ACCOUNT_INACTIVE` | 401 |
| **Token ≠ activeToken** | **`TOKEN_INVALIDATED`** | **401** |
| **sessionInfo.isValid ≠ true** | **`SESSION_INVALID`** | **401** |
| Session timeout (7 days) | `SESSION_EXPIRED` | 401 |

---

## 📱 Frontend Integration

```javascript
// API configuration
const API_URL = 'https://backend-j5j55w1xg-oos-projects-e7124c64.vercel.app/api';

// Login with session conflict handling
async function login(username, password) {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    if (response.status === 409) {
      // Active session detected
      const data = await response.json();
      const session = data.sessionInfo;
      
      // Show force login dialog
      const shouldForce = confirm(
        `Active session from ${session.deviceName}\n` +
        `Last activity: ${new Date(session.lastActivity).toLocaleString()}\n\n` +
        `Terminate that session and login here?`
      );
      
      if (shouldForce) {
        // Retry with force flag
        return login(username, password, true);
      }
      
      return { success: false, message: 'Login cancelled' };
    }
    
    const data = await response.json();
    if (data.success) {
      localStorage.setItem('token', data.token);
      return { success: true, user: data.user };
    }
    
    return { success: false, message: data.message };
    
  } catch (error) {
    return { success: false, message: 'Network error' };
  }
}

// Login with force parameter
async function login(username, password, force = false) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, force })
  });
  
  // ... handle response
}

// Make authenticated request
async function apiRequest(endpoint) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (response.status === 401) {
    const data = await response.json();
    
    if (data.code === 'TOKEN_INVALIDATED' || data.code === 'SESSION_INVALID') {
      // Another device logged in
      alert('Your session has been terminated. Please login again.');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
  }
  
  return response;
}
```

---

## 🧪 Quick Test Commands

```bash
# Test 1: Login (will return 409 if session exists)
curl -X POST https://backend-j5j55w1xg-oos-projects-e7124c64.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Test 2: Force login (will succeed)
curl -X POST https://backend-j5j55w1xg-oos-projects-e7124c64.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123","force":true}'

# Test 3: Use token (replace TOKEN)
curl https://backend-j5j55w1xg-oos-projects-e7124c64.vercel.app/api/auth/me \
  -H "Authorization: Bearer TOKEN"
```

---

## 🔄 Redeploy Commands

```bash
# Force backend redeploy (clears cache)
cd /Users/root1/Sendroli_Group/backend
vercel --prod --force

# Force frontend redeploy (clears cache)
cd /Users/root1/Sendroli_Group/frontend
vercel --prod --force
```

---

## 📊 Status Codes Reference

| Status | Code | Meaning |
|--------|------|---------|
| 200 | - | Login success |
| 401 | Various | Authentication failed |
| 409 | `ACTIVE_SESSION` | **Active session exists** |
| 500 | - | Server error |

---

## 📝 Session Behavior

| Scenario | Result |
|----------|--------|
| First login | ✅ Creates new session |
| Login while active session | ⚠️ Returns 409 with session info |
| Login with `force: true` | ✅ Terminates old session, creates new |
| Use old token after force login | ❌ Returns 401 TOKEN_INVALIDATED |
| Session inactive 7+ days | ❌ Returns 401 SESSION_EXPIRED |

---

## 🎯 User Schema Fields

```javascript
{
  activeToken: String,        // Current valid JWT
  sessionInfo: {
    ipAddress: String,
    userAgent: String,
    deviceFingerprint: String,
    loginTime: Date,
    lastActivity: Date,       // Updated on API calls
    isValid: Boolean,         // Server-side session control
    sessionVersion: Number    // Incremented on new login
  }
}
```

---

**Last Updated:** December 2, 2024  
**Status:** ✅ Working in Production  
**Documentation:** See `SESSION_MANAGEMENT_VERIFIED.md` for details
