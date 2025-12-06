# 👁️ Password Visibility Toggle - Testing Guide

## 🎯 Overview

This guide helps you test the password visibility toggle feature on the **landing page login**.

**Test URL:** https://frontend-hpfhx6bgj-oos-projects-e7124c64.vercel.app/website/login

---

## 🧪 Test Scenarios

### ✅ Test 1: Default State
**Expected Behavior:**
- Password field shows dots/asterisks (••••••)
- Eye icon (👁️) visible on the right side of password field
- Icon color: Gray (#666)

**Steps:**
1. Navigate to `/website/login`
2. Look at password field
3. Verify eye icon is visible on the right

**Pass Criteria:**
- [ ] Eye icon visible
- [ ] Password is hidden (shows dots)
- [ ] Icon is inside the password field (right side)

---

### ✅ Test 2: Show Password
**Expected Behavior:**
- Click eye icon → password becomes visible as plain text
- Icon changes to eye-slash (👁️‍🗨️)
- Password text is readable

**Steps:**
1. Type a password (e.g., "TestPassword123")
2. Click the eye icon
3. Observe changes

**Pass Criteria:**
- [ ] Password text becomes visible ("TestPassword123")
- [ ] Icon changes from eye to eye-slash
- [ ] Icon remains clickable

**Visual Example:**
```
Before: ••••••••••••••• [👁️]
After:  TestPassword123 [👁️‍🗨️]
```

---

### ✅ Test 3: Hide Password
**Expected Behavior:**
- Click eye-slash icon → password returns to hidden
- Icon changes back to eye (👁️)
- Password shows dots again

**Steps:**
1. With password visible (from Test 2)
2. Click the eye-slash icon
3. Observe changes

**Pass Criteria:**
- [ ] Password text becomes hidden (dots/asterisks)
- [ ] Icon changes from eye-slash to eye
- [ ] Password value is retained (not cleared)

**Visual Example:**
```
Before: TestPassword123 [👁️‍🗨️]
After:  ••••••••••••••• [👁️]
```

---

### ✅ Test 4: Hover Effect
**Expected Behavior:**
- Hovering over eye icon changes color to cyan (#00CED1)
- Cursor changes to pointer
- Transition is smooth

**Steps:**
1. Move mouse over eye icon
2. Observe color change
3. Move mouse away

**Pass Criteria:**
- [ ] Icon color changes to cyan on hover
- [ ] Cursor shows as pointer (hand icon)
- [ ] Color transition is smooth (not instant)
- [ ] Color returns to gray when mouse leaves

---

### ✅ Test 5: Multiple Toggles
**Expected Behavior:**
- Can toggle password visibility multiple times
- Each toggle works consistently
- No visual glitches

**Steps:**
1. Click eye icon (show password)
2. Click again (hide password)
3. Click again (show password)
4. Click again (hide password)
5. Repeat 3-4 times

**Pass Criteria:**
- [ ] Each toggle works correctly
- [ ] No delays or lag
- [ ] No visual glitches
- [ ] Icon always matches password state

---

### ✅ Test 6: Login with Visible Password
**Expected Behavior:**
- Can submit login form with password visible
- Login works normally
- Authentication succeeds

**Steps:**
1. Enter username
2. Enter password
3. Click eye icon (show password)
4. Click "Login" button
5. Observe login result

**Pass Criteria:**
- [ ] Login form submits successfully
- [ ] Authentication works correctly
- [ ] Redirects to dashboard on success
- [ ] Error shows if credentials invalid

---

### ✅ Test 7: Login with Hidden Password
**Expected Behavior:**
- Can submit login form with password hidden
- Login works normally (default behavior)

**Steps:**
1. Enter username
2. Enter password (keep it hidden)
3. Click "Login" button
4. Observe login result

**Pass Criteria:**
- [ ] Login form submits successfully
- [ ] Authentication works correctly
- [ ] No difference from visible password login

---

### ✅ Test 8: Keyboard Navigation
**Expected Behavior:**
- Can tab to password field
- Can tab to eye icon button
- Enter/Space key activates toggle

**Steps:**
1. Navigate to login page
2. Press Tab key until password field is focused
3. Type a password
4. Press Tab key again (should focus eye button)
5. Press Space or Enter
6. Observe password visibility toggle

**Pass Criteria:**
- [ ] Can reach eye button with Tab key
- [ ] Focus indicator visible on button
- [ ] Space/Enter toggles password visibility
- [ ] Can tab away from button normally

---

### ✅ Test 9: Mobile Touch Interaction
**Expected Behavior:**
- Eye icon is easily tappable on mobile
- Touch interaction works smoothly
- No accidental form submission

**Steps:**
1. Open login page on mobile device
2. Tap on password field
3. Type password using on-screen keyboard
4. Tap eye icon
5. Observe password visibility change

**Pass Criteria:**
- [ ] Eye icon is large enough to tap (not too small)
- [ ] Single tap toggles password visibility
- [ ] No double-tap required
- [ ] Doesn't accidentally submit form

**Devices to Test:**
- [ ] iPhone (Safari)
- [ ] Android phone (Chrome)
- [ ] iPad (Safari)
- [ ] Android tablet (Chrome)

---

### ✅ Test 10: Password Copy-Paste
**Expected Behavior:**
- Can copy-paste password with both visible and hidden states
- Copy works correctly in both states

**Steps:**
1. Paste a password into the field
2. Toggle visibility to show password
3. Select password text and copy it
4. Clear field and paste again
5. Toggle visibility to hide password
6. Try to copy password (will copy dots)

**Pass Criteria:**
- [ ] Can paste password in both states
- [ ] Can copy visible password text
- [ ] Hidden password copies as dots (expected)
- [ ] Pasted password works for login

---

## 📱 Cross-Browser Testing

### Desktop Browsers

#### Chrome
```
URL: chrome://version
Test Steps:
1. Open login page in Chrome
2. Run Tests 1-8
3. Verify all pass criteria
```
Status: [ ] Pass / [ ] Fail

#### Firefox
```
URL: about:support
Test Steps:
1. Open login page in Firefox
2. Run Tests 1-8
3. Verify all pass criteria
```
Status: [ ] Pass / [ ] Fail

#### Safari (macOS)
```
Version: Safari > About Safari
Test Steps:
1. Open login page in Safari
2. Run Tests 1-8
3. Verify all pass criteria
```
Status: [ ] Pass / [ ] Fail

#### Edge
```
URL: edge://version
Test Steps:
1. Open login page in Edge
2. Run Tests 1-8
3. Verify all pass criteria
```
Status: [ ] Pass / [ ] Fail

### Mobile Browsers

#### iOS Safari
```
Device: iPhone [model]
iOS Version: [version]
Test Steps:
1. Open login page
2. Run Tests 1-7, 9
3. Verify touch interaction
```
Status: [ ] Pass / [ ] Fail

#### Android Chrome
```
Device: [model]
Android Version: [version]
Test Steps:
1. Open login page
2. Run Tests 1-7, 9
3. Verify touch interaction
```
Status: [ ] Pass / [ ] Fail

---

## 🔍 Visual Inspection Checklist

### Layout & Positioning
- [ ] Eye icon aligned properly inside password field
- [ ] Icon doesn't overlap with password text
- [ ] Icon positioned on the right side
- [ ] Adequate padding between text and icon
- [ ] Icon stays in position when toggling

### Styling & Appearance
- [ ] Icon size is appropriate (not too large or small)
- [ ] Icon color matches design (gray default, cyan on hover)
- [ ] SVG icons render clearly (not pixelated)
- [ ] Button has no visible border or background
- [ ] Focus outline visible when button is focused

### Responsive Design
- [ ] Works on desktop (1920x1080)
- [ ] Works on laptop (1366x768)
- [ ] Works on tablet portrait (768x1024)
- [ ] Works on tablet landscape (1024x768)
- [ ] Works on mobile (375x667)
- [ ] Works on small mobile (320x568)

---

## 🐛 Known Issues & Edge Cases

### Potential Issues to Watch For

#### Issue 1: Icon Not Visible
**Symptoms:** Eye icon doesn't appear at all
**Check:**
- Browser console for JavaScript errors
- Network tab for failed CSS loads
- SVG rendering in browser DevTools

#### Issue 2: Toggle Not Working
**Symptoms:** Clicking icon doesn't change password visibility
**Check:**
- JavaScript console for errors
- Event listener attached correctly
- showPassword state updating in React DevTools

#### Issue 3: Icon Overlaps Text
**Symptoms:** Long passwords get cut off or overlap icon
**Check:**
- Password field padding-right
- Icon position (should be absolute)
- Container width and overflow settings

#### Issue 4: Mobile Tap Not Registering
**Symptoms:** Need to tap multiple times on mobile
**Check:**
- Icon touch target size (should be at least 44x44px)
- z-index positioning
- Touch event handlers

---

## 📊 Test Results Template

### Test Session Information
```
Date: _________________
Tester: _________________
Browser: _________________
Device: _________________
Screen Size: _________________
```

### Test Results
| Test # | Test Name | Status | Notes |
|--------|-----------|--------|-------|
| 1 | Default State | ☐ Pass ☐ Fail | |
| 2 | Show Password | ☐ Pass ☐ Fail | |
| 3 | Hide Password | ☐ Pass ☐ Fail | |
| 4 | Hover Effect | ☐ Pass ☐ Fail | |
| 5 | Multiple Toggles | ☐ Pass ☐ Fail | |
| 6 | Login with Visible | ☐ Pass ☐ Fail | |
| 7 | Login with Hidden | ☐ Pass ☐ Fail | |
| 8 | Keyboard Nav | ☐ Pass ☐ Fail | |
| 9 | Mobile Touch | ☐ Pass ☐ Fail | |
| 10 | Copy-Paste | ☐ Pass ☐ Fail | |

### Overall Result
```
Total Tests: 10
Passed: _____ / 10
Failed: _____ / 10
Success Rate: _____%
```

### Issues Found
```
1. _________________________________________________
2. _________________________________________________
3. _________________________________________________
```

### Recommendations
```
_________________________________________________
_________________________________________________
_________________________________________________
```

---

## 🎯 Acceptance Criteria

### Must Pass (Critical)
- [ ] Eye icon visible on password field
- [ ] Clicking icon toggles password visibility
- [ ] Icon changes between eye and eye-slash
- [ ] Login works in both visible and hidden states
- [ ] No JavaScript errors in console

### Should Pass (Important)
- [ ] Hover effect works (color change)
- [ ] Keyboard navigation works
- [ ] Mobile touch interaction works
- [ ] Works on major browsers (Chrome, Firefox, Safari)
- [ ] Focus indicator visible

### Nice to Have (Optional)
- [ ] Smooth transitions
- [ ] Works on older browsers (IE11, etc.)
- [ ] Works with password managers
- [ ] Supports high contrast mode

---

## 🚀 Quick Test Command

For developers, you can test locally:

```bash
# Start frontend dev server
cd frontend
npm run dev

# Open in browser
open http://localhost:3000/website/login

# Test with production build
npm run build
npm run preview
open http://localhost:4173/website/login
```

---

## 📞 Reporting Issues

### If You Find a Bug

**What to Include:**
1. Test scenario number (e.g., "Test 2: Show Password")
2. Browser and version
3. Device and screen size
4. Steps to reproduce
5. Expected vs actual behavior
6. Screenshot or screen recording if possible

**Where to Report:**
- GitHub Issues
- Direct message to development team
- Project management board

---

*Testing Guide Version 1.0 - December 6, 2024*
*Comprehensive test coverage for password visibility toggle feature*
