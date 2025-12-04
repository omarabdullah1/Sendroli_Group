# ✅ UI Testing Guide - Session Management

## 🌐 Production URLs (Updated Dec 2, 2024)

**Frontend:** https://frontend-2n42e68pl-oos-projects-e7124c64.vercel.app  
**Backend API:** https://backend-j5j55w1xg-oos-projects-e7124c64.vercel.app/api

---

## ✅ What Was Updated

### Frontend Changes:
1. ✅ **Login.jsx** now handles **`ACTIVE_SESSION`** error code (409 status)
2. ✅ **.env.production** updated with new backend URL
3. ✅ **Backward compatible** with old DEVICE_CONFLICT code
4. ✅ **Maps sessionInfo** to conflictInfo for UI display

### Backend Status:
- ✅ Returns 409 with ACTIVE_SESSION code
- ✅ Force login works with `force: true` parameter
- ✅ Session validation in middleware

---

## 🧪 Test Scenarios

### Test 1: Normal Login (First Device)

**Steps:**
1. Go to: https://frontend-2n42e68pl-oos-projects-e7124c64.vercel.app/login
2. Enter username: `admin`
3. Enter password: `admin123`
4. Click **Login**

**Expected Result:**
- ✅ Login succeeds
- ✅ Redirected to dashboard
- ✅ Token stored in localStorage

---

### Test 2: Login from Second Device (Session Conflict)

**Steps:**
1. **DON'T LOGOUT** from first device
2. Open a **new incognito window** or **different browser**
3. Go to: https://frontend-2n42e68pl-oos-projects-e7124c64.vercel.app/login
4. Enter username: `admin`
5. Enter password: `admin123`
6. Click **Login**

**Expected Result:**
- ⚠️ **Device conflict alert appears**
- ℹ️ Shows existing session info:
  - Device name (e.g., "Chrome Browser")
  - IP address
  - Login time
  - Last activity time
- 🔘 **"Force Login Here"** button appears

**UI Should Show:**
```
⚠️ Another Device Active
Active session detected

Existing session:
Device: Chrome Browser
IP: 197.120.119.89
Login Time: 12/1/2025, 10:02:23 AM

[Force Login Here]
```

---

### Test 3: Force Login

**Steps:**
1. After seeing device conflict (Test 2)
2. Click **"Force Login Here"** button

**Expected Result:**
- ✅ Previous session terminated
- ✅ New login succeeds
- ✅ Redirected to dashboard
- ✅ New token stored

**Backend Behavior:**
- Previous device's token becomes invalid
- If first device tries to use API, gets 401 TOKEN_INVALIDATED

---

### Test 4: Verify Old Session Invalidated

**Steps:**
1. After force login (Test 3)
2. Go back to **first device/browser**
3. Try to navigate or refresh dashboard

**Expected Result:**
- ❌ Token is now invalid
- ⚠️ Gets 401 error
- 🔄 Redirected to login page
- ℹ️ May see message: "Session terminated. Please login again."

---

### Test 5: Normal Logout

**Steps:**
1. From logged-in device
2. Click logout button

**Expected Result:**
- ✅ Session cleared on server
- ✅ Token removed from localStorage
- ✅ Redirected to login
- ✅ Can login again without conflict

---

## 🔍 Browser Console Debugging

Open browser console (F12) to see detailed logs:

### Login Attempt:
```
🚀 Frontend: Attempting login with: {username: "admin", password: "***", force: false}
🌐 API URL: https://backend-j5j55w1xg-oos-projects-e7124c64.vercel.app/api
📤 Frontend: Sending request to /auth/login
```

### Session Conflict (409):
```
❌ Frontend: Login error response: {
  success: false,
  code: "ACTIVE_SESSION",
  message: "Active session detected",
  sessionInfo: { deviceName: "Chrome Browser", ... }
}
```

### Force Login Success:
```
✅ Force login response: {
  success: true,
  token: "eyJhbGciOi...",
  message: "Previous session terminated. New session created."
}
```

### Token Invalidated (old session):
```
❌ 401 Error: {
  code: "TOKEN_INVALIDATED",
  message: "Session has been invalidated. Please login again."
}
```

---

## 📱 Multi-Device Testing Tips

**Easy Way to Test:**
1. Use **Chrome** for first login
2. Use **Chrome Incognito** or **Firefox** for second login
3. Or use **phone + computer**
4. Or use **two different computers**

**What to Check:**
- ✅ Session conflict appears on second device
- ✅ Session info shows correct device name
- ✅ Force login terminates first session
- ✅ First device can't use old token anymore

---

## 🐛 Troubleshooting

### Issue: Not seeing device conflict alert

**Check:**
1. Browser console for errors
2. Network tab → check response from /auth/login
3. Status should be 409, not 200 or 403
4. Response should have `code: "ACTIVE_SESSION"`

**Fix:**
- Clear browser cache
- Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- Try incognito window

---

### Issue: Force login not working

**Check:**
1. Console logs show "Calling login with force=true"
2. Network tab shows request has `force: true` in body
3. Response status should be 200

**Fix:**
- Check backend is the new URL
- Verify .env.production has correct backend URL
- Try redeploying frontend

---

### Issue: Old session not getting invalidated

**Check:**
1. After force login, token should be different
2. Old device should get 401 on next API call
3. Error code should be TOKEN_INVALIDATED

**Fix:**
- Check middleware is running (backend logs)
- Verify activeToken is updated in database
- Clear localStorage and re-test

---

## 📊 Expected API Responses

### Login (No Conflict) - 200 OK
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "_id": "692c3e247095d4fb773ff266",
    "username": "admin",
    "role": "admin"
  },
  "sessionInfo": {
    "loginTime": "2025-12-02T14:42:49.848Z",
    "deviceName": "Desktop Browser",
    "ipAddress": "154.239.190.102"
  }
}
```

### Login (Conflict) - 409 Conflict
```json
{
  "success": false,
  "message": "Active session detected",
  "code": "ACTIVE_SESSION",
  "sessionInfo": {
    "deviceName": "Chrome Browser",
    "deviceType": "Chrome Browser",
    "loginTime": "2025-12-01T10:02:23.381Z",
    "lastActivity": "2025-12-01T10:05:29.129Z",
    "ipAddress": "197.120.119.89"
  }
}
```

### Force Login - 200 OK
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "message": "Previous session terminated. New session created.",
  "previousSession": {
    "deviceName": "Chrome Browser",
    "loginTime": "2025-12-01T10:02:23.381Z",
    "lastActivity": "2025-12-01T10:05:29.129Z"
  }
}
```

---

## ✅ Testing Checklist

- [ ] First login succeeds and shows dashboard
- [ ] Second login shows device conflict alert with details
- [ ] Device conflict shows correct device name and IP
- [ ] Force login button appears and is clickable
- [ ] Force login succeeds and redirects to dashboard
- [ ] First device's session becomes invalid
- [ ] First device redirected to login on next action
- [ ] Console logs show correct API URL
- [ ] Network tab shows 409 status for conflict
- [ ] Network tab shows 200 status for force login

---

## 🎯 Success Criteria

**The UI is working correctly if:**

✅ You can login on first device  
✅ Second login attempt shows conflict alert  
✅ Conflict alert displays session information  
✅ Force login button works  
✅ Old session becomes invalid after force login  
✅ No DEVICE_CONFLICT errors (should be ACTIVE_SESSION)  
✅ No 403 errors (should be 409 for conflicts)  

---

**Frontend:** https://frontend-2n42e68pl-oos-projects-e7124c64.vercel.app  
**Status:** ✅ Ready to test!  
**Updated:** December 2, 2024
