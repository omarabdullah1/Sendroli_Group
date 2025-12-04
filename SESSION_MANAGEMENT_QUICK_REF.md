# 🔐 Session Management Quick Reference

## 📋 Quick Overview

| Feature | Status | Description |
|---------|--------|-------------|
| Session Conflict Detection | ✅ | Returns 409 when active session exists |
| Force Login | ✅ | `force: true` to override existing sessions |
| Token Validation | ✅ | Middleware checks `activeToken` matches JWT |
| Session State Check | ✅ | Middleware validates `sessionInfo.isValid === true` |
| Device Tracking | ✅ | Stores device info and IP address |
| Auto Session Timeout | ✅ | 7-day inactivity timeout (configurable) |

---

## 🚀 Quick Start

### 1. Login (Normal)
```javascript
POST /api/auth/login
{
  "username": "admin",
  "password": "password123"
}
```

**Returns 409 if session exists:**
```json
{
  "success": false,
  "message": "Active session detected",
  "code": "ACTIVE_SESSION",
  "sessionInfo": { ... }
}
```

### 2. Force Login
```javascript
POST /api/auth/login
{
  "username": "admin",
  "password": "password123",
  "force": true
}
```

**Returns 200 and invalidates previous session**

---

## 🛡️ Security Features

### Middleware Checks (in order):
1. ✅ Token exists in header
2. ✅ JWT signature valid
3. ✅ User exists in database
4. ✅ Account is active
5. ⚡ **Token matches `user.activeToken`** (CRITICAL)
6. ⚡ **Session is valid (`sessionInfo.isValid === true`)** (CRITICAL)
7. ✅ Session not expired (7 days)
8. ✅ Update last activity

---

## 📊 Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| `ACTIVE_SESSION` | Active session exists | Show force login dialog |
| `TOKEN_INVALIDATED` | Token doesn't match activeToken | Force logout |
| `SESSION_INVALID` | Session marked invalid | Force logout |
| `SESSION_EXPIRED` | Inactive for 7 days | Force logout |
| `TOKEN_EXPIRED` | JWT expired | Force logout |

---

## 🧪 Testing

```bash
# Run test suite
cd backend
node test_session_management.js
```

**Tests:**
- ✅ Normal login creates session
- ✅ Second login returns 409
- ✅ Force login works
- ✅ Old token rejected
- ✅ Middleware validation

---

## 💻 Frontend Example

```javascript
// Handle login with conflict detection
const result = await authService.login(username, password);

if (result.success) {
  // Success
  navigate('/dashboard');
} else if (result.conflict) {
  // Show dialog
  if (confirm('Active session detected. Force login?')) {
    const forced = await authService.login(username, password, true);
    if (forced.success) navigate('/dashboard');
  }
}
```

---

## 📝 Key Files

| File | Purpose |
|------|---------|
| `backend/controllers/authController.js` | Login logic with conflict detection |
| `backend/middleware/auth.js` | Token & session validation |
| `backend/models/User.js` | Session fields in schema |
| `backend/test_session_management.js` | Test suite |
| `backend/SESSION_MANAGEMENT_GUIDE.md` | Full documentation |

---

## 🔧 Configuration

### Session Timeout
```javascript
// backend/middleware/auth.js
const SESSION_TIMEOUT_HOURS = 24 * 7; // 7 days
```

### Activity Update Debounce
```javascript
// Only update every 5 minutes
if (minutesSinceLastUpdate > 5) {
  // Update lastActivity
}
```

### JWT Expiration
```bash
# .env
JWT_EXPIRE=7d
```

---

## 🎯 Use Cases

### 1. User locked out on another device
**Solution:** Use force login to terminate old session

### 2. Stolen token
**Solution:** Old token automatically invalidated on new login

### 3. User forgot to logout
**Solution:** Session expires after 7 days of inactivity

### 4. Admin needs to revoke session
**Solution:** Set `sessionInfo.isValid = false` in database

---

## ✅ Implementation Checklist

- [x] User model has `activeToken` and `sessionInfo` fields
- [x] Login returns 409 on conflict
- [x] Login accepts `force: true` parameter
- [x] Middleware checks `activeToken === token`
- [x] Middleware checks `sessionInfo.isValid === true`
- [x] Logout clears session completely
- [x] Frontend handles 409 conflicts
- [x] Frontend shows force login dialog
- [x] Test suite passes

---

## 📞 Common Issues

### Q: Token still works after new login
**A:** Check middleware is comparing `user.activeToken === token`

### Q: Always getting 409 even after logout
**A:** Ensure logout sets `activeToken: null` and `isValid: false`

### Q: Users logged out too frequently
**A:** Increase `SESSION_TIMEOUT_HOURS` or reduce debounce interval

---

## 📚 Documentation

- **Full Guide:** `backend/SESSION_MANAGEMENT_GUIDE.md`
- **Frontend Example:** `frontend/src/examples/SessionManagementExample.js`
- **Test Suite:** `backend/test_session_management.js`
- **API Docs:** `docs/API_DOCUMENTATION.md`

---

**Version:** 1.0.0  
**Last Updated:** December 2024
