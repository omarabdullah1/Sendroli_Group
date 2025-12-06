# 🎯 Client Loyalty System - Quick Reference Card

---

## 🔗 Production URLs

### Current Deployment (January 2025)

**Frontend:** https://frontend-91l1sinim-oos-projects-e7124c64.vercel.app  
**Backend:** https://backend-65h8lei9o-oos-projects-e7124c64.vercel.app

---

## 🏆 Loyalty Scoring Formula

**Total Score: 0-100 points**

| Factor | Weight | Calculation | Max Points |
|--------|--------|-------------|------------|
| **Volume** | 30% | `totalTransactions × 3` | 30 |
| **Payment** | 30% | `(totalPaid / totalValue) × 30` | 30 |
| **Longevity** | 20% | `clientAgeDays / 10` | 20 |
| **Frequency** | 15% | `ordersPerMonth × 5` | 15 |
| **Consistency** | 5% | Bonus for regular ordering | 5 |

---

## 🎖️ Loyalty Tiers

| Tier | Score Range | Badge Color |
|------|-------------|-------------|
| 🥇 **Platinum** | 80-100 | Purple-Pink Gradient |
| 🥈 **Gold** | 60-79 | Gold-Yellow Gradient |
| 🥉 **Silver** | 40-59 | Silver-Gray Gradient |
| 🏅 **Bronze** | 0-39 | Bronze-Orange Gradient |

---

## 📍 Navigation Path

```
Login → Client Analytics → View Most Loyal Client
```

**Direct URL:**
```
https://frontend-91l1sinim-oos-projects-e7124c64.vercel.app/clients/analytics
```

---

## 🔑 Access Control

| Role | Can View Analytics? | Can View Loyalty? |
|------|---------------------|-------------------|
| Admin | ✅ Yes | ✅ Yes |
| Receptionist | ✅ Yes | ✅ Yes |
| Designer | ❌ No | ❌ No |
| Worker | ❌ No | ❌ No |
| Financial | ✅ Yes | ✅ Yes |

---

## 🛠️ API Endpoint

**Endpoint:** `GET /api/clients/statistics`

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response Structure:**
```json
{
  "success": true,
  "data": {
    "overallStats": {
      "totalClients": 50,
      "totalRevenue": 250000,
      "mostLoyalClient": {
        "id": "...",
        "name": "Client Name",
        "loyaltyScore": 85,
        "tier": "Platinum"
      }
    },
    "topClients": [...],
    "clients": [...]
  }
}
```

---

## 📱 UI Components

### Most Loyal Client Card
- 🏆 Animated trophy icon
- ⭕ Circular progress indicator (SVG)
- 🎨 Gradient tier badge
- 📊 Loyalty score display
- 📈 Client details

### Client Table
- 🔤 Sortable columns (including loyalty)
- 🏷️ Tier badges for each client
- 🔍 Search functionality
- 📄 Pagination
- 📊 Score display (0-100)

---

## 🚀 Quick Redeploy

**Backend:**
```bash
cd backend && vercel --prod
```

**Frontend:**
```bash
cd frontend && vercel --prod
```

**After Redeploy:** Update URLs in configuration files!

---

## 🐛 Quick Troubleshooting

### Issue: "Cannot connect to backend"
**Solution:** Check `.env` files point to current backend URL

### Issue: "CORS error"
**Solution:** Verify frontend URL in backend `server.js` CORS array

### Issue: "No loyalty scores showing"
**Solution:** Ensure clients have orders/invoices for calculation

### Issue: "Authentication failed"
**Solution:** Clear localStorage and login again

---

## 📋 Configuration Files to Update

When redeploying:

1. `frontend/.env` → Update `VITE_API_URL`
2. `frontend/src/services/api.js` → Update fallback URL
3. `frontend/src/services/authService.js` → Update console log URL
4. `frontend/src/pages/WebsiteSettings.jsx` → Update image upload URL
5. `backend/server.js` → Update CORS `allowedOrigins` array

---

## ✅ Verification Checklist

- [ ] Login works in production
- [ ] Client Analytics page loads
- [ ] Most Loyal Client card displays
- [ ] Loyalty scores visible in table
- [ ] Sorting works on loyalty column
- [ ] Tier badges show correct colors
- [ ] Search/filter functionality works
- [ ] No console errors

---

## 📚 Full Documentation

- **Complete System Docs:** `CLIENT_LOYALTY_SYSTEM.md`
- **Deployment Guide:** `CLIENT_LOYALTY_DEPLOYMENT.md`
- **Quick Reference:** This file

---

## 🎨 Tier Badge Colors

```css
/* Platinum */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* Gold */
background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);

/* Silver */
background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);

/* Bronze */
background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
```

---

**Last Updated:** January 2025  
**Status:** ✅ Production Ready  
**Version:** 2.0
