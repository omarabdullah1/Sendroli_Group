# Dashboard Components — Overview

This folder contains the reusable dashboard components and charts.

Key components:
- `KPICard.jsx` — KPI card with optional `to` (link) and `onClick` props for navigation, keyboard accessible.
 - `KPICard.jsx` — KPI card with optional `to` (link) and `onClick` props for navigation, keyboard accessible. Use `to` to navigate: `<KPICard to="/orders" ... />`.
- `WidgetCard.jsx` — Generic card wrapper for dashboard widgets; supports `to`, `onClick`, and keyboard access.
  Example: `<WidgetCard to="/orders" title="Recent Orders"> ... </WidgetCard>`
- `DashboardGrid.jsx` — Grid layout for dashboard using CSS Grid
a nd responsive breakpoints.
- `Charts.jsx` — Wrapper around `react-chartjs-2` charts with `ariaLabel` support.
- `SkeletonLoader.jsx` — Visual placeholder for lazy-loaded charts.
- `RealtimeListener.jsx` — Optional socket.io listener for realtime events.

Props Summary:
- `KPICard`:
  - `label`, `value`, `icon`, `image`, `gradient` — visual props
  - `to` — optional router path, clicking or key Enter/Space navigates to path
  - `onClick` — optional click handler
  - `ariaLabel` — label for screen readers
- `WidgetCard`:
  - `title`, `subtitle`, `actions` — header props
  - `to` — optional router path, clicking or key Enter navigates
  - `onClick` — optional click handler
  - `ariaLabel` — label for screen readers

Accessibility:
- Both components use `role="button"` and `tabIndex` when clickable.
- Keyboard handlers capture Enter and Space keys for activation.
- Charts are rendered with `aria-label` on the canvas via `canvasProps`.

Usage examples are in `EnhancedDashboard.jsx`.
