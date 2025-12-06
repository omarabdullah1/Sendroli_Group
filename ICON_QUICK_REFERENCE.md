# 🎨 Font Awesome Icon Quick Reference

## 📋 Quick Start

### Import Font Awesome Icons

```javascript
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faIconName } from '@fortawesome/free-solid-svg-icons';
```

### Use Font Awesome Icons

```javascript
<FontAwesomeIcon icon={faIconName} />
```

---

## 📦 Common Icons Used in Project

### Dashboard & Analytics
```javascript
import {
  faChartLine,      // 📊 Line charts, analytics
  faChartBar,       // 📈 Bar charts
  faDollarSign,     // 💰 Money, revenue, financial
  faClipboard,      // 📋 Reports, documents
} from '@fortawesome/free-solid-svg-icons';
```

### Status & Time
```javascript
import {
  faClock,          // ⏳ Pending, waiting
  faRotate,         // 🔄 Active, processing, refresh
  faCheckCircle,    // ✅ Completed, success, verified
  faExclamationTriangle, // ⚠️ Warning, alert, attention
} from '@fortawesome/free-solid-svg-icons';
```

### People & Users
```javascript
import {
  faUsers,          // 👥 Multiple users, clients, team
  faUser,           // 👤 Single user, profile
} from '@fortawesome/free-solid-svg-icons';
```

### Objects & Inventory
```javascript
import {
  faBox,            // 📦 Package, order, item
  faWarehouse,      // 🏭 Warehouse, storage, inventory
  faPalette,        // 🎨 Materials, colors, design
  faShoppingCart,   // 🛒 Cart, purchases
  faShoppingBag,    // 🛍️ Shopping, purchases
} from '@fortawesome/free-solid-svg-icons';
```

### Actions & Navigation
```javascript
import {
  faArrowUp,        // ⬆️ Upload, increase, withdrawal
  faCog,            // ⚙️ Settings, configuration
  faChevronDown,    // ▼ Expand, dropdown
  faBell,           // 🔔 Notifications, alerts
} from '@fortawesome/free-solid-svg-icons';
```

### Business Operations
```javascript
import {
  faFileInvoice,    // 📄 Invoice, document
  faIndustry,       // 🏭 Factory, supplier, manufacturing
  faTruck,          // 🚚 Delivery, shipping, transport
  faPrint,          // 🖨️ Printing, print services
} from '@fortawesome/free-solid-svg-icons';
```

### Quality & Achievement
```javascript
import {
  faAward,          // 🏆 Achievement, excellence
  faCertificate,    // 🎖️ Certification, quality
  faShieldAlt,      // 🛡️ Security, protection, quality assurance
  faStar,           // ⭐ Favorite, rating, featured
} from '@fortawesome/free-solid-svg-icons';
```

### Speed & Performance
```javascript
import {
  faBolt,           // ⚡ Fast, speed, energy
  faBullseye,       // 🎯 Target, precision, accuracy
  faHandshake,      // 🤝 Partnership, customer service
} from '@fortawesome/free-solid-svg-icons';
```

### Communication
```javascript
import {
  faPhone,          // 📞 Phone, call
  faEnvelope,       // ✉️ Email, message
  faGlobe,          // 🌐 Website, internet, global
} from '@fortawesome/free-solid-svg-icons';
```

---

## 🔄 Emoji to Font Awesome Mapping

Quick reference for converting emojis to Font Awesome:

| Emoji | Font Awesome | Icon Name | Usage |
|-------|--------------|-----------|-------|
| 📊 | `faChartLine` | Chart Line | Analytics, reports |
| 📈 | `faChartBar` | Chart Bar | Statistics, growth |
| 🔔 | `faBell` | Bell | Notifications, alerts |
| 💰 | `faDollarSign` | Dollar Sign | Revenue, money, financial |
| 👥 | `faUsers` | Users | Clients, team, multiple users |
| 🎨 | `faPalette` | Palette | Materials, colors, design |
| 📦 | `faBox` or `faWarehouse` | Box/Warehouse | Orders, packages, inventory |
| ⚠️ | `faExclamationTriangle` | Exclamation Triangle | Warning, alert |
| ⏳ | `faClock` | Clock | Pending, waiting, time |
| 🔄 | `faRotate` | Rotate | Active, processing, refresh |
| ✅ | `faCheckCircle` | Check Circle | Completed, success |
| 🖨️ | `faPrint` | Print | Printing services |
| ⚙️ | `faCog` | Cog | Settings, configuration |
| ⚡ | `faBolt` | Bolt | Fast, speed, energy |
| 🎯 | `faBullseye` | Bullseye | Target, precision |
| 🤝 | `faHandshake` | Handshake | Partnership, customer service |
| 🛒 | `faShoppingCart` | Shopping Cart | Cart, purchases |
| 📄 | `faFileInvoice` | File Invoice | Invoice, document |
| 🏭 | `faIndustry` | Industry | Factory, manufacturing |
| 🚚 | `faTruck` | Truck | Delivery, shipping |
| 🏆 | `faAward` | Award | Achievement, excellence |
| 🎖️ | `faCertificate` | Certificate | Certification, quality |
| 🛡️ | `faShieldAlt` | Shield Alt | Security, protection |
| ⭐ | `faStar` | Star | Favorite, rating |
| 👤 | `faUser` | User | Single user, profile |
| 🌐 | `faGlobe` | Globe | Website, global |
| 📋 | `faClipboard` | Clipboard | Reports, documents |
| ⬆️ | `faArrowUp` | Arrow Up | Upload, increase |
| 🛍️ | `faShoppingBag` | Shopping Bag | Shopping, purchases |
| ▼ | `faChevronDown` | Chevron Down | Expand, dropdown |
| 📞 | `faPhone` | Phone | Phone, call |
| ✉️ | `faEnvelope` | Envelope | Email, message |

---

## 💡 Usage Patterns

### Pattern 1: Static Icon (Dashboard, Sidebar)

```javascript
// Import the icon
import { faChartLine } from '@fortawesome/free-solid-svg-icons';

// Use directly in JSX
<FontAwesomeIcon icon={faChartLine} />

// With className
<FontAwesomeIcon icon={faChartLine} className="my-icon" />

// In menu item object
const menuItem = {
  label: 'Dashboard',
  icon: faChartLine, // Icon object
  path: '/dashboard'
};
```

### Pattern 2: Dynamic Icon (Landing Page)

```javascript
// Create mapping function
const getIconFromString = (iconString) => {
  const iconMap = {
    '🖨️': faPrint,
    '⚙️': faCog,
    '✅': faCheckCircle,
    // ... more mappings
    'default': faStar
  };
  return iconMap[iconString] || iconMap['default'];
};

// Use with dynamic content
<FontAwesomeIcon icon={getIconFromString(service.icon)} />
```

### Pattern 3: Conditional Icon

```javascript
{item.icon && (
  <span className="nav-icon">
    <FontAwesomeIcon icon={item.icon} />
  </span>
)}
```

---

## 🎨 Styling Font Awesome Icons

### Size
```javascript
<FontAwesomeIcon icon={faChartLine} size="xs" />  // Extra small
<FontAwesomeIcon icon={faChartLine} size="sm" />  // Small
<FontAwesomeIcon icon={faChartLine} size="lg" />  // Large
<FontAwesomeIcon icon={faChartLine} size="2x" />  // 2x
<FontAwesomeIcon icon={faChartLine} size="3x" />  // 3x
```

### CSS Classes
```javascript
<FontAwesomeIcon 
  icon={faChartLine} 
  className="my-custom-icon"
/>
```

```css
.my-custom-icon {
  font-size: 24px;
  color: #1976d2;
}
```

### Inline Styles
```javascript
<FontAwesomeIcon 
  icon={faChartLine}
  style={{ color: '#1976d2', fontSize: '24px' }}
/>
```

---

## 🔧 Common Issues & Solutions

### Issue: Icon not displaying
**Solution:** Check import and make sure package is installed
```bash
npm list @fortawesome/react-fontawesome
npm list @fortawesome/free-solid-svg-icons
```

### Issue: Wrong icon appearing
**Solution:** Verify icon name in Font Awesome documentation
- Visit: https://fontawesome.com/icons
- Search for icon
- Use exact icon name (camelCase)

### Issue: Icon size incorrect
**Solution:** Use `size` prop or CSS
```javascript
<FontAwesomeIcon icon={faChartLine} size="2x" />
// or
<FontAwesomeIcon icon={faChartLine} className="icon-size-24" />
```

---

## 📚 Resources

- **Font Awesome React Docs:** https://fontawesome.com/docs/web/use-with/react
- **Icon Search:** https://fontawesome.com/icons
- **NPM Package:** https://www.npmjs.com/package/@fortawesome/react-fontawesome

---

## 🎯 Project-Specific Notes

### Dashboard Icons
- All KPI cards use Font Awesome icons
- Icons render inside `.kpi-icon` divs with gradient backgrounds
- Use `className="kpi-fa-icon"` for proper styling

### Sidebar Icons
- All menu items use Font Awesome icon objects
- Icons work in both collapsed and expanded states
- Render using `<FontAwesomeIcon icon={item.icon} />`

### Landing Page Icons
- Services and features use dynamic icon mapping
- Emojis from database converted to Font Awesome icons
- Use `getIconFromString()` function for conversion

---

**Last Updated:** 2024-01-15  
**Version:** 1.0.0
