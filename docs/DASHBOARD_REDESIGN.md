# Dashboard Redesign — Sendroli Group

This document describes the proposed design and implementation plan for a modern, scalable, and high-performance Dashboard for the Sendroli Group MERN application.

## 1. Layout Structure

- Header / TopBar — compact header with quick switcher & global actions
- Sidebar — collapsible with role-aware navigation
- Main Content area composed using a Bento-Grid layout:
  - Row 1: KPI Cards (4–6) — responsive, scrollable on mobile
  - Row 2: Large Area Detail Card (timeseries / revenue line chart) + status breakdown
  - Row 3: Secondary cards: Recent Orders, Low stock, Top Clients, Quick Actions
  - Row 4: Activity/Logs and smaller insights cards

Grid logic:
- Use CSS Grid for row/column layouts and breakpoints for mobile/tablet/desktop
- On desktop: Grid with multiple columns (3–6) fitting value-driven cards
- On tablet and below: switch to 1–2 column layout for content stacks

## 2. Component Breakdown & Responsibilities

Overview: adopt a component-driven approach with small composable components.

- Layout
  - `Sidebar`, `TopHeader`, `MainLayout` — layout components used globally
- At the Dashboard level
  - `DashboardGrid` — bento grid abstraction with breakpoints and slotting
  - `WidgetCard` — generic card component providing header/footer/actions
  - `KpiCard` — reusable KPI component (icon, label, primary value, deltas)
  - `MetricRow` — 1-row lists of cards (like quick-actions)
  - `DataTable` — reusable table with sorting/filtering/pagination
  - `ActivityLog` — streaming log list with mark-as-read/filters
- Charts (Domain-specific)
  - `RevenueLineChart`, `OrdersBarChart`, `StatusPieChart`, `ClientBreakdown` — chart wrappers around ChartJS
- UI Utilities
  - `SkeletonLoader`, `ErrorCard`, `Placeholder`, `EmptyState` — standardized states
  - `Badge`, `StatusDot`, `Avatar` — small presentation elements

State management:
- Global user and auth state: `AuthContext` (already present)
- Domain caches & data: `Zustand` or `Redux-toolkit` recommended; for MVP `Context + useQuery` pattern (React Query) is fine
- Consider mixing: React Query for server state + Zustand for UI state (filters, sorts, small UX caching)

## 3. Design System & UI Guidelines

- Visual tokens — use CSS variables (already in `styles/designSystem.css`) and add dark-mode variables
- Spacing & Typography — consistent scale using the tokens from `designSystem.css`
- Light & Dark mode — preferred approach using CSS variables and a theme-switcher
- Elevation & Rounding — 8–16px for main surfaces, 12px default radius for cards
- Interaction — subtle hover elevation, focus states, accessible color contrast
- Accessibility — keyboard navigation, aria labels and roles for all major components

## 4. Performance & UX Best Practices

- Lazy load non-critical components (e.g., charts via React.lazy + Suspense)
- Avoid redundant re-renders: use React.memo, useCallback, and useMemo
- Server state via React Query or caching middleware (Redis on server + Node Cache fallback)
- Keep API payloads minimal — only return data needed by widgets
- Skeleton loaders for async data (improves perceived performance)
- Use virtualization for long lists (Activity Log or tables) to limit DOM cost
- Use `select` or `projection` in Mongo queries to reduce payload size

## 5. Backend API & Real-Time

API Endpoints:
- `GET /api/dashboard/summary` — aggregated KPIs for quick card fill
- `GET /api/orders/stats/timeseries` — (already present) returns revenue timeseries
- `GET /api/orders/stats/financial` — overall stats (already present)
- `GET /api/notifications/recent` — activity stream and notifications
- `GET /api/clients/stats` — client-specific insights (existing endpoints may suffice)

Real-time
- Socket.io or WebSockets for 
  - KPI & small updates push
  - New activity items stream (notifications) 
- Provide both optional polling and socket subscription to reduce coupling

Caching & Indexing
- Add indexes for fields used in aggregations (e.g., `createdAt`, `client`, `orderState`)
- Use Redis as long-lived cache for aggregated endpoints (timeseries, heavy joins)

## 6. Security & Roles

- Minimal user data in public calls
- Protect endpoints using existing middleware `protect` and `authorize`.
- Enforce field-level authorization on update routes (already present)

## 7. Scalability Considerations

- Feature-based folder structure (already used) for modularity
- Use micro-services architecture potential in the future
- Use message queues for heavy jobs (PDF generation, bulk imports)
- Use horizontal scaling of backend processes behind load balancer

## 8. Minimal Frontend Implementation Plan & Deliverables

- Add `KpiCard`, `DashboardGrid`, `WidgetCard`, `SkeletonLoader`, and `DashboardService`.
- Add `GET /api/dashboard/summary` backend route.
- Make the `EnhancedDashboard` rely on the centralized summary API and lazy-loaded charts.
- Add dark-mode variables and lightweight theme toggle.
 - Add optional Socket.io support for real-time updates. To enable: set `ENABLE_SOCKET=true` (backend) and `VITE_ENABLE_SOCKET=true` (frontend) and install `socket.io` (backend) and `socket.io-client` (frontend).

## 9. Deployment & CI Considerations

- Keep deployment scripts and environment variables locked (they exist in repo). Update `README` with new endpoints + how to seed the demo data.
- Use test coverage & lint in CI before deployment

### Quick deployment notes
- Ensure `ENABLE_SOCKET=true` in the backend `.env` and `VITE_ENABLE_SOCKET=true` in `frontend/.env` if you want realtime.
- Run `npm install` in `backend` and `frontend` after you've updated package.json to ensure `socket.io` packages are installed.
- Deploy as usual with existing `deploy` scripts or `docker-compose`.

---

This doc is a reference and will be added with code changes in the repo. The next step is to add a small set of files that implement the new components, the dashboard API, and service call, together with small integration into the dashboard page.