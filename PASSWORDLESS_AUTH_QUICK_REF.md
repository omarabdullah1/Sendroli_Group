# 🚀 Passwordless Authentication - Quick Reference

## 📞 For Testing

### Test Phone-Only Registration
```bash
# Navigate to: https://sendroli.com/register-client
# Fill in:
Phone: 01234567890
Full Name: Test Client
# Leave password empty
# Click Register
```

### Test Phone-Only Login
```bash
# Navigate to: https://sendroli.com/login
# Enter: 01234567890
# Leave password empty
# Click Login
```

### Test Email/Username Login
```bash
# Navigate to: https://sendroli.com/login
# Enter: admin@sendroli.com (or username)
# Enter password
# Click Login
```

---

## 🔑 Key Features

| Feature | Description |
|---------|-------------|
| **Passwordless for Clients** | Register and login with phone only |
| **Multi-Mode Detection** | Auto-detects phone/email/username |
| **Smart UI** | Dynamic labels and hints |
| **Backward Compatible** | Existing users unaffected |
| **Secure** | JWT tokens, phone validation |

---

## 📱 Login Types

### 1. Phone Login (Clients Only)
- **Input**: `01234567890`
- **Password**: Not required
- **Label**: "Phone Number"
- **Hint**: "📱 Phone-only login - no password needed for clients"

### 2. Email Login
- **Input**: `user@example.com`
- **Password**: Required
- **Label**: "Email Address"

### 3. Username Login
- **Input**: `admin`
- **Password**: Required
- **Label**: "Username / Email / Phone"

---

## 🔒 Security Notes

- Phone must be unique (validated on backend)
- Phone format: digits, spaces, dashes, parentheses, +
- Passwords hashed with bcrypt (10 rounds)
- JWT tokens expire after 7 days
- Role-based access unchanged

---

## 📁 Modified Files

**Backend:**
- `backend/models/User.js` - Phone field, optional password
- `backend/controllers/authController.js` - Multi-mode login

**Frontend:**
- `frontend/src/pages/Website/ClientRegister.jsx` - NEW
- `frontend/src/pages/Website/WebsiteLogin.jsx` - Auto-detection
- `frontend/src/services/authService.js` - Optional password
- `frontend/src/pages/Website/WebsiteLogin.css` - Info boxes

---

## 🌐 Production URLs

- **Login**: https://sendroli.com/login
- **Client Register**: https://sendroli.com/register-client
- **API**: https://sendroli.com/api

---

## 🐛 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| Phone already exists | Use different phone or update existing user |
| Password required for phone | Ensure user role is 'client' |
| Auto-detection not working | Check phone format (digits only with allowed symbols) |
| Login fails | Verify backend allows passwordless for client role |

---

## 🧪 Test Commands

### Test Backend API Directly
```bash
# Register client (passwordless)
curl -X POST https://sendroli.com/api/auth/register-client \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "01234567890",
    "fullName": "Test Client",
    "email": "test@example.com"
  }'

# Login with phone (no password)
curl -X POST https://sendroli.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "01234567890"
  }'

# Login with email + password
curl -X POST https://sendroli.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin@sendroli.com",
    "password": "admin123"
  }'
```

---

## ✅ Deployment Status

- [x] Backend deployed
- [x] Frontend built
- [x] Files copied to server
- [x] Container restarted
- [x] Live on https://sendroli.com

---

## 📊 User Flow Diagrams

### Phone Registration
```
Visit /register-client → Enter phone + details → Submit (no password) → JWT token → Dashboard
```

### Phone Login
```
Visit /login → Enter phone → Auto-detect → Skip password → Login → Dashboard
```

### Email/Username Login
```
Visit /login → Enter email/username → Enter password → Login → Dashboard
```

---

## 🎯 Next Steps for Testing

1. **Test phone registration**: Visit `/register-client`, use phone only
2. **Test phone login**: Visit `/login`, enter phone without password
3. **Test existing users**: Verify email/username login still works
4. **Test validation**: Try duplicate phone, invalid formats
5. **Monitor logs**: Check backend and frontend console logs

---

## 📝 Remember

- Phone format: `01234567890`, `+20 123 456 7890`, `(012) 345-6789`
- Password optional only for client role with phone login
- All existing authentication methods still work
- JWT tokens remain same (7-day expiration)
- Role-based permissions unchanged

---

**For detailed documentation, see**: [PASSWORDLESS_AUTH_COMPLETE.md](./PASSWORDLESS_AUTH_COMPLETE.md)
