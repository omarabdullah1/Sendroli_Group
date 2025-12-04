# 🚀 Session Management Quick Reference

## Quick Status Check
```bash
# Run automated tests
node test_complete_flow.js

# Should show:
# ✅ ALL TESTS PASSED!
```

## Error Codes

| Code | Status | Meaning | Action |
|------|--------|---------|--------|
| `ACTIVE_SESSION` | 409 | Session conflict detected | Show force login modal |
| `TOKEN_INVALIDATED` | 401 | Session invalidated elsewhere | Logout and redirect to login |
| `INVALID_TOKEN` | 401 | Token expired/invalid | Logout and redirect to login |

## API Endpoints

### Login
```bash
POST /api/auth/login
Body: {
  "username": "admin",
  "password": "admin123"
}
```

### Force Login
```bash
POST /api/auth/login
Body: {
  "username": "admin",
  "password": "admin123",
  "force": true
}
```

## Response Structure

### Success
```javascript
{
  success: true,
  token: "jwt_token",
  user: {
    _id: "user_id",
    username: "admin",
    role: "admin",
    fullName: "System Administrator",
    email: "admin@sendroli.com"
  },
  sessionInfo: {
    device: "Chrome Browser",
    loginTime: "2025-12-02T15:30:00.000Z",
    sessionVersion: 5
  }
}
```

### Session Conflict (409)
```javascript
{
  success: false,
  code: "ACTIVE_SESSION",
  message: "Active session detected",
  sessionInfo: {
    deviceName: "Chrome Browser",
    loginTime: "2025-12-02T14:57:03.554Z",
    lastActivity: "2025-12-02T14:57:03.554Z",
    ipAddress: "51.159.125.187"
  }
}
```

## Frontend Usage

### Check for Session Conflict
```javascript
try {
  const response = await authService.login(username, password);
  // Success - proceed to dashboard
} catch (error) {
  if (error.response?.status === 409 && 
      error.response?.data?.code === 'ACTIVE_SESSION') {
    // Show force login modal
    setShowForceLoginModal(true);
    setConflictInfo(error.response.data.sessionInfo);
  }
}
```

### Force Login
```javascript
const handleForceLogin = async () => {
  const response = await authService.login(username, password, true); // force: true
  if (response.success) {
    // Redirect to dashboard
  }
};
```

### Extract User Data
```javascript
// Correct way
const userData = response.user || response.data || response;
const role = userData?.role;

// Store in localStorage
localStorage.setItem('user', JSON.stringify(userData));
localStorage.setItem('token', response.token);
```

## Backend Validation

### Middleware Check
```javascript
// In auth middleware
if (user.activeToken !== token) {
  return res.status(401).json({
    code: 'TOKEN_INVALIDATED',
    message: 'Session has been invalidated'
  });
}

if (!user.sessionInfo?.isValid) {
  return res.status(401).json({
    code: 'TOKEN_INVALIDATED',
    message: 'Session has been invalidated'
  });
}
```

## Testing Checklist

- [ ] First device login succeeds
- [ ] Second device gets 409 conflict
- [ ] Force login invalidates first device
- [ ] Old token returns 401
- [ ] New token accesses dashboard
- [ ] Dashboard items visible
- [ ] User role displayed
- [ ] Protected routes work

## Deployment

### Backend
```bash
cd backend
vercel --prod --yes
```

### Frontend
```bash
cd frontend
vercel --prod --yes
```

### Clear Cache
```bash
vercel --prod --force
```

## Troubleshooting

### Dashboard Items Disappearing
✅ Fixed: User extraction from `response.user`

### Role is Undefined
✅ Fixed: Added null checking with `userData?.role`

### Force Login Not Redirecting
✅ Fixed: Check `response.success` not `response.status`

### Old Code Being Served
✅ Fixed: Force redeploy with `vercel --prod --force`

## Production URLs

- Frontend: https://frontend-p0u3mco9w-oos-projects-e7124c64.vercel.app
- Backend: https://backend-j5j55w1xg-oos-projects-e7124c64.vercel.app/api

## Test User

```
Username: admin
Password: admin123
Role: admin
```

---

**Status**: ✅ All Tests Passing | 🚀 Production Ready
