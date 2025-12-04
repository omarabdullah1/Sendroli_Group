# 🔐 Session Management Flow Diagrams

## 📊 Visual Guide to Enhanced Session Management

---

## 1️⃣ Normal Login Flow (No Existing Session)

```
┌─────────────┐
│   Client    │
│  (Browser)  │
└──────┬──────┘
       │
       │ POST /api/auth/login
       │ { username, password }
       │
       ▼
┌─────────────────────────────────────────┐
│         Backend (Express)                │
│                                          │
│  1. Validate credentials ✓              │
│  2. Check existing session               │
│     → activeToken: null                  │
│     → sessionInfo.isValid: false         │
│  3. NO active session found ✓           │
│                                          │
│  4. Generate new JWT token               │
│  5. Update MongoDB:                      │
│     • activeToken = new_token            │
│     • sessionInfo.isValid = true         │
│     • sessionInfo.loginTime = now        │
│     • sessionInfo.sessionVersion++       │
│     • deviceInfo = current_device        │
│                                          │
└──────────────┬──────────────────────────┘
               │
               │ 200 OK
               │ { success: true, token, user, sessionInfo }
               │
               ▼
┌─────────────────────────────────────────┐
│   Client (Browser)                       │
│                                          │
│  • Store token in localStorage           │
│  • Store user data                       │
│  • Redirect to dashboard                 │
│                                          │
└──────────────────────────────────────────┘
```

---

## 2️⃣ Login with Active Session (Conflict)

```
┌─────────────┐
│   Client    │
│  Device B   │
└──────┬──────┘
       │
       │ POST /api/auth/login
       │ { username, password }
       │ (force: NOT provided)
       │
       ▼
┌─────────────────────────────────────────┐
│         Backend (Express)                │
│                                          │
│  1. Validate credentials ✓              │
│  2. Check existing session               │
│     → activeToken: "eyJhbGc..."          │
│     → sessionInfo.isValid: true          │
│  3. ⚠️  ACTIVE SESSION FOUND on Device A │
│  4. force flag: false                    │
│                                          │
│  ❌ STOP - Return Conflict               │
│                                          │
└──────────────┬──────────────────────────┘
               │
               │ 409 CONFLICT
               │ {
               │   success: false,
               │   code: "ACTIVE_SESSION",
               │   sessionInfo: {
               │     deviceName: "Device A",
               │     loginTime: "...",
               │     lastActivity: "...",
               │     ipAddress: "..."
               │   }
               │ }
               │
               ▼
┌─────────────────────────────────────────┐
│   Client (Device B)                      │
│                                          │
│  🚨 Show Conflict Dialog:                │
│                                          │
│  ┌─────────────────────────────────┐   │
│  │ ⚠️  Active Session Detected      │   │
│  │                                  │   │
│  │ You have an active session on:   │   │
│  │ • Device: Device A               │   │
│  │ • Last Activity: 5 minutes ago   │   │
│  │ • IP: 192.168.1.50              │   │
│  │                                  │   │
│  │ [Force Login] [Cancel]           │   │
│  └─────────────────────────────────┘   │
│                                          │
└──────────────────────────────────────────┘
```

---

## 3️⃣ Force Login Flow (Override Session)

```
┌─────────────┐
│   Client    │
│  Device B   │
└──────┬──────┘
       │
       │ POST /api/auth/login
       │ { username, password, force: true }
       │
       ▼
┌─────────────────────────────────────────┐
│         Backend (Express)                │
│                                          │
│  1. Validate credentials ✓              │
│  2. Check existing session               │
│     → activeToken: "old_token"           │
│     → sessionInfo.isValid: true          │
│  3. ⚠️  Active session on Device A       │
│  4. force flag: TRUE ✓                  │
│                                          │
│  5. 🔄 INVALIDATE old session:          │
│     • Generate NEW token                 │
│     • activeToken = new_token            │
│       (old token now invalid)            │
│     • sessionInfo.sessionVersion++       │
│     • Update device info to Device B     │
│                                          │
└──────────────┬──────────────────────────┘
               │
               │ 200 OK
               │ {
               │   success: true,
               │   token: "new_token",
               │   message: "Previous session terminated",
               │   previousSession: {
               │     deviceName: "Device A",
               │     loginTime: "...",
               │     lastActivity: "..."
               │   }
               │ }
               │
               ▼
┌─────────────────────────────────────────┐
│   Client (Device B)                      │
│                                          │
│  ✅ Login successful                     │
│  • Store new token                       │
│  • Show success message                  │
│  • Redirect to dashboard                 │
│                                          │
└──────────────────────────────────────────┘

               Meanwhile on Device A...
               
┌─────────────────────────────────────────┐
│   Client (Device A)                      │
│                                          │
│  Next API request with old token:        │
│  GET /api/clients                        │
│  Authorization: Bearer old_token         │
│                                          │
│         ▼                                │
│  ❌ 401 TOKEN_INVALIDATED                │
│                                          │
│  • Token doesn't match activeToken       │
│  • Force logout                          │
│  • Redirect to login                     │
│  • Show: "Session invalidated on        │
│           another device"                │
│                                          │
└──────────────────────────────────────────┘
```

---

## 4️⃣ Middleware Validation Flow

```
┌─────────────┐
│   Client    │
│  (Any API   │
│   Request)  │
└──────┬──────┘
       │
       │ GET /api/clients
       │ Authorization: Bearer <token>
       │
       ▼
┌─────────────────────────────────────────┐
│    Middleware (protect)                  │
│                                          │
│  ┌─────────────────────────────────┐   │
│  │ 1. ✓ Token exists?              │   │
│  │    ├─ Yes → Continue             │   │
│  │    └─ No → 401 NO_TOKEN          │   │
│  └─────────────────────────────────┘   │
│                                          │
│  ┌─────────────────────────────────┐   │
│  │ 2. ✓ JWT valid signature?       │   │
│  │    ├─ Yes → Continue             │   │
│  │    └─ No → 401 INVALID_TOKEN     │   │
│  └─────────────────────────────────┘   │
│                                          │
│  ┌─────────────────────────────────┐   │
│  │ 3. ✓ User exists in DB?         │   │
│  │    ├─ Yes → Continue             │   │
│  │    └─ No → 401 USER_NOT_FOUND    │   │
│  └─────────────────────────────────┘   │
│                                          │
│  ┌─────────────────────────────────┐   │
│  │ 4. ✓ Account active?            │   │
│  │    ├─ Yes → Continue             │   │
│  │    └─ No → 401 ACCOUNT_INACTIVE  │   │
│  └─────────────────────────────────┘   │
│                                          │
│  ┌─────────────────────────────────┐   │
│  │ 5. ⚡ Token matches activeToken? │   │
│  │    ├─ Yes → Continue             │   │
│  │    └─ No → 401 TOKEN_INVALIDATED │   │
│  │                                  │   │
│  │    CRITICAL: This prevents old   │   │
│  │    tokens from working after     │   │
│  │    new login                     │   │
│  └─────────────────────────────────┘   │
│                                          │
│  ┌─────────────────────────────────┐   │
│  │ 6. ⚡ sessionInfo.isValid=true?  │   │
│  │    ├─ Yes → Continue             │   │
│  │    └─ No → 401 SESSION_INVALID   │   │
│  │                                  │   │
│  │    CRITICAL: Allows server-side  │   │
│  │    session revocation            │   │
│  └─────────────────────────────────┘   │
│                                          │
│  ┌─────────────────────────────────┐   │
│  │ 7. ✓ Session not expired?       │   │
│  │    (lastActivity < 7 days)       │   │
│  │    ├─ Yes → Continue             │   │
│  │    └─ No → 401 SESSION_EXPIRED   │   │
│  └─────────────────────────────────┘   │
│                                          │
│  ┌─────────────────────────────────┐   │
│  │ 8. ✓ Update lastActivity        │   │
│  │    (debounced: every 5 min)      │   │
│  └─────────────────────────────────┘   │
│                                          │
│  ✅ ALL CHECKS PASSED                   │
│                                          │
└──────────────┬──────────────────────────┘
               │
               │ Request proceeds to route handler
               │
               ▼
┌─────────────────────────────────────────┐
│    Route Handler                         │
│    (e.g., getClients)                    │
│                                          │
│    Process request and return data       │
│                                          │
└──────────────┬──────────────────────────┘
               │
               │ 200 OK
               │ { success: true, data: [...] }
               │
               ▼
┌─────────────┐
│   Client    │
└─────────────┘
```

---

## 5️⃣ Token Lifecycle

```
Timeline View:
═══════════════════════════════════════════════════════════════

T0: User logs in (Device A)
    ├─ Generate Token_A
    ├─ Store in DB: activeToken = Token_A
    ├─ sessionInfo.isValid = true
    └─ Token_A is VALID ✅

T1: User makes API requests (Device A)
    ├─ Token_A used
    ├─ Middleware checks: activeToken === Token_A ✅
    ├─ sessionInfo.isValid === true ✅
    └─ Requests succeed ✅

T2: User logs in from Device B
    ├─ First attempt: Get 409 Conflict ⚠️
    ├─ User clicks "Force Login"
    ├─ Generate Token_B
    ├─ Update DB: activeToken = Token_B
    ├─ sessionInfo.sessionVersion++
    └─ Token_B is VALID ✅
        Token_A is now INVALID ❌

T3: Device A tries to make API request
    ├─ Uses old Token_A
    ├─ Middleware checks: activeToken === Token_A? ❌
    │  (activeToken is now Token_B)
    ├─ Return 401 TOKEN_INVALIDATED
    ├─ Frontend intercepts error
    ├─ Clear localStorage
    └─ Redirect to login

T4: Device B continues working
    ├─ Uses Token_B
    ├─ Middleware checks: activeToken === Token_B ✅
    ├─ sessionInfo.isValid === true ✅
    └─ Requests succeed ✅

═══════════════════════════════════════════════════════════════
```

---

## 6️⃣ Database State Changes

```
MongoDB User Document State Changes:

INITIAL STATE (No Session)
─────────────────────────────────────────
{
  _id: "user123",
  username: "admin",
  activeToken: null,
  sessionInfo: {
    isValid: false,
    sessionVersion: 0
  }
}

↓ User logs in from Device A

AFTER FIRST LOGIN
─────────────────────────────────────────
{
  _id: "user123",
  username: "admin",
  activeToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InVzZXIxMjMiLCJpYXQiOjE3MDU...",
  sessionInfo: {
    ipAddress: "192.168.1.50",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
    loginTime: "2024-01-15T10:00:00.000Z",
    lastActivity: "2024-01-15T10:00:00.000Z",
    isValid: true,              // ✅ Session active
    sessionVersion: 1           // Incremented
  },
  deviceInfo: {
    deviceName: "Chrome on Windows",
    ipAddress: "192.168.1.50"
  }
}

↓ User force-logs in from Device B

AFTER FORCE LOGIN
─────────────────────────────────────────
{
  _id: "user123",
  username: "admin",
  activeToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InVzZXIxMjMiLCJpYXQiOjE3MDU...",
                 ▲ NEW TOKEN (old token now invalid)
  sessionInfo: {
    ipAddress: "192.168.1.100",     // ← Device B IP
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/537.36",
    loginTime: "2024-01-15T11:00:00.000Z",      // ← New login time
    lastActivity: "2024-01-15T11:00:00.000Z",   // ← New activity
    isValid: true,
    sessionVersion: 2               // ← Incremented again
  },
  deviceInfo: {
    deviceName: "Safari on macOS",  // ← Device B info
    ipAddress: "192.168.1.100"
  }
}

↓ Admin manually revokes session

AFTER MANUAL REVOCATION
─────────────────────────────────────────
{
  _id: "user123",
  username: "admin",
  activeToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InVzZXIxMjMiLCJpYXQiOjE3MDU...",
  sessionInfo: {
    ipAddress: "192.168.1.100",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/537.36",
    loginTime: "2024-01-15T11:00:00.000Z",
    lastActivity: "2024-01-15T12:00:00.000Z",
    isValid: false,             // ❌ Manually set to false
    sessionVersion: 2
  },
  deviceInfo: {
    deviceName: "Safari on macOS",
    ipAddress: "192.168.1.100"
  }
}
// Next API request will fail with SESSION_INVALID

↓ User logs out

AFTER LOGOUT
─────────────────────────────────────────
{
  _id: "user123",
  username: "admin",
  activeToken: null,            // ← Cleared
  sessionInfo: {
    ipAddress: null,
    userAgent: null,
    loginTime: null,
    lastActivity: null,
    isValid: false,             // ← Set to false
    sessionVersion: 0           // ← Reset
  },
  deviceInfo: {
    deviceName: null,
    ipAddress: null
  }
}
```

---

## 7️⃣ Error Code Decision Tree

```
                    API Request Received
                            │
                            ▼
                    [protect middleware]
                            │
            ┌───────────────┴───────────────┐
            │                               │
         No Token                      Token Exists
            │                               │
            ▼                               ▼
     401 NO_TOKEN                    Verify JWT Signature
                                             │
                            ┌────────────────┴────────────────┐
                            │                                 │
                      Invalid/Expired                     Valid JWT
                            │                                 │
                ┌───────────┴───────────┐                    ▼
                │                       │              Get User from DB
         Invalid Signature        JWT Expired                 │
                │                       │            ┌────────┴────────┐
                ▼                       ▼            │                 │
      401 INVALID_TOKEN        401 TOKEN_EXPIRED  User Found      User Not Found
                                                     │                 │
                                                     ▼                 ▼
                                              Account Active?   401 USER_NOT_FOUND
                                                     │
                                        ┌────────────┴────────────┐
                                        │                         │
                                      Yes                        No
                                        │                         │
                                        ▼                         ▼
                              activeToken == token?    401 ACCOUNT_INACTIVE
                                        │
                            ┌───────────┴───────────┐
                            │                       │
                          Match                  No Match
                            │                       │
                            ▼                       ▼
                  sessionInfo.isValid?   401 TOKEN_INVALIDATED
                            │
                    ┌───────┴───────┐
                    │               │
                  true            false
                    │               │
                    ▼               ▼
            Check Activity    401 SESSION_INVALID
                    │
        ┌───────────┴───────────┐
        │                       │
  < 7 days old            > 7 days old
        │                       │
        ▼                       ▼
  ✅ ALLOW              401 SESSION_EXPIRED
  Update lastActivity
  Proceed to handler
```

---

## 📋 Legend

```
✅ Success / Valid / Allowed
❌ Failed / Invalid / Blocked
⚠️  Warning / Conflict
⚡ Critical Security Check
🔄 Update / Change
🚨 Alert / Notification
```

---

## 🎯 Key Takeaways

1. **409 Conflict Response**
   - Returned when active session exists
   - Provides session details for informed decision
   - Requires explicit user action (force: true)

2. **Critical Middleware Checks**
   - `activeToken === incoming_token` - Prevents token reuse
   - `sessionInfo.isValid === true` - Enables server-side revocation

3. **Single Active Session**
   - Only one token valid per user at any time
   - New login invalidates all previous tokens
   - Provides strong security guarantees

4. **Graceful Degradation**
   - Clear error codes for different scenarios
   - Informative messages guide user actions
   - Frontend can handle each case appropriately

---

**Created:** December 2024  
**Purpose:** Visual guide for enhanced session management implementation
