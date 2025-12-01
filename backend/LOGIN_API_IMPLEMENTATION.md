# Login API Implementation - Session Management

## Overview

The login API has been updated to automatically detect and clear existing sessions without blocking user login. When a user logs in, any existing active session is automatically invalidated and replaced with a new session.

## Key Features

✅ **No Blocking**: Users can always log in, even if an active session exists  
✅ **Automatic Session Clearing**: Old sessions are automatically cleared when a new login occurs  
✅ **Atomic Updates**: Session updates are atomic, preventing race conditions  
✅ **Security**: Old tokens are invalidated, preventing token reuse  
✅ **Warning Messages**: Users are notified when an old session was cleared  

## Implementation Details

### Login Controller (`backend/controllers/authController.js`)

#### Flow:
1. **Validate Input**: Check that username and password are provided
2. **Find User**: Query user with session fields (`activeToken`, `sessionInfo`, `deviceInfo`)
3. **Verify Credentials**: Check password and user active status
4. **Detect Existing Session**: Check if user has an active session
5. **Generate New Token**: Always generate a fresh JWT token
6. **Atomic Session Update**: Replace old session with new session in a single atomic operation
7. **Return Response**: Send token, user data, and optional warning

#### Security Measures:

1. **Atomic MongoDB Updates**
   - Uses `User.findByIdAndUpdate()` which is atomic at the document level
   - Single operation ensures no race conditions
   - Prevents multiple active sessions

2. **Token Invalidation**
   - Old `activeToken` is overwritten with new token
   - Old token immediately becomes invalid
   - Session version is incremented to invalidate old sessions

3. **Session Replacement**
   - Old `sessionInfo` is completely replaced (not merged)
   - Old `deviceInfo` is completely overwritten
   - All session metadata is regenerated

4. **Fresh Token Generation**
   - New JWT token is generated for every login
   - Prevents token reuse attacks
   - Each session has a unique token

### MongoDB Update Logic

The atomic update operation replaces all session-related fields in a single database call:

```javascript
await User.findByIdAndUpdate(
  user._id,
  {
    activeToken: token,                    // Overwrites old token (invalidates it)
    sessionInfo: {
      ipAddress: clientIP,
      userAgent: userAgent,
      deviceFingerprint: deviceFingerprint,
      loginTime: loginTime,
      lastActivity: loginTime,
      isValid: true,
      sessionVersion: (user.sessionInfo?.sessionVersion || 0) + 1, // Increment version
    },
    deviceInfo: {
      userAgent: userAgent,
      deviceName: deviceType,
      loginTime: loginTime,
      ipAddress: clientIP,
    },
  },
  { 
    new: true, 
    runValidators: true 
  }
);
```

**Why this is secure:**
- Single atomic operation prevents race conditions
- Old token cannot be reused after this update
- Session version increment ensures old sessions are recognized as invalid
- All session data is replaced, not merged

## API Endpoint

### POST `/api/auth/login`

#### Request Body:
```json
{
  "username": "string",
  "password": "string"
}
```

#### Response Format:

**Success (200 OK) - No existing session:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "johndoe",
    "role": "admin",
    "fullName": "John Doe",
    "email": "john@example.com"
  }
}
```

**Success (200 OK) - Existing session cleared:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "johndoe",
    "role": "admin",
    "fullName": "John Doe",
    "email": "john@example.com"
  },
  "warning": "We detected an active session on another device and logged it out for your security."
}
```

**Error (400 Bad Request) - Missing credentials:**
```json
{
  "success": false,
  "message": "Please provide username and password"
}
```

**Error (401 Unauthorized) - Invalid credentials:**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

**Error (401 Unauthorized) - Inactive account:**
```json
{
  "success": false,
  "message": "User account is inactive"
}
```

**Error (500 Internal Server Error):**
```json
{
  "success": false,
  "message": "Server error during login"
}
```

## Response Fields

| Field | Type | Description | Always Present |
|-------|------|-------------|----------------|
| `token` | string | JWT authentication token | Yes |
| `user` | object | User information (excludes password and activeToken) | Yes |
| `warning` | string | Warning message when old session was cleared | No (only if old session existed) |

### User Object Structure:
```typescript
{
  _id: string;           // MongoDB ObjectId
  username: string;      // User's username
  role: string;          // User role (admin, receptionist, etc.)
  fullName: string;      // User's full name
  email: string;         // User's email
}
```

## Security Considerations

### ✅ Race Condition Prevention
- Atomic database operations ensure only one session can be active
- `findByIdAndUpdate()` is atomic at the document level
- No separate read-modify-write operations

### ✅ Token Reuse Prevention
- Old tokens are immediately invalidated when overwritten
- Session version increment ensures middleware can detect old sessions
- Fresh token generated for every login

### ✅ Session Isolation
- Only one active session per user at any time
- Old sessions cannot be reactivated
- Session metadata completely replaced (not merged)

### ✅ No Multiple Sessions
- Database update ensures only one `activeToken` exists
- Previous sessions are overwritten atomically
- Session version tracking prevents old session validation

## Testing Recommendations

1. **Test Sequential Logins**
   - Login from Device A
   - Login from Device B
   - Verify Device A session is invalidated
   - Verify warning message is returned

2. **Test Race Conditions**
   - Simultaneous login requests from different devices
   - Verify only one session remains active
   - Verify both requests complete successfully

3. **Test Token Invalidation**
   - Login and get token
   - Login again to get new token
   - Verify old token is rejected by middleware
   - Verify new token works correctly

4. **Test Response Format**
   - Login without existing session (no warning)
   - Login with existing session (with warning)
   - Verify all required fields are present

## Frontend Integration Notes

The frontend should handle the response format as follows:

```javascript
const response = await api.post('/auth/login', { username, password });

// Response structure:
// {
//   token: "...",
//   user: { ... },
//   warning: "..." // optional
// }

if (response.data.token) {
  // Store token and user data
  localStorage.setItem('token', response.data.token);
  localStorage.setItem('user', JSON.stringify(response.data.user));
  
  // Show warning if present
  if (response.data.warning) {
    // Display warning to user (toast, alert, etc.)
    console.warn(response.data.warning);
  }
}
```

## Migration Notes

**Breaking Changes:**
- Removed `force` parameter from login request
- Changed response format (no longer wrapped in `{ success: true, data: {...} }`)
- Removed `DEVICE_CONFLICT` error code (login is never blocked)

**Backward Compatibility:**
- Frontend code may need updates to handle new response format
- Remove any `force` parameter handling
- Update response parsing to use new structure

## Additional Notes

- All session clearing happens within the login API (no logout API call needed)
- The warning message is always shown when an old session existed, regardless of device
- Session version is incremented to help middleware detect invalid sessions
- Device fingerprinting is still used for tracking but doesn't block login

