# FieldForce Admin (Frontend)

React-based **Admin-only** frontend for the FieldForce IoT field operations platform. Built from the FieldForce PRD v1.0 with mock data (no backend required).

## Features (Admin Role)

- **Authentication** — Login, session persistence, protected routes, logout
- **Dashboard** — KPI cards, live ticket monitoring, device health, workload, trends
- **Tickets** — Full lifecycle view, search/filter, detail panel, reassign / escalate / override actions (UI)
- **Devices** — Inventory, health summary, firmware & connectivity
- **SLA Monitor** — At-risk tickets, breach indicators (green / yellow / red)
- **Teams** — Squad management cards with performance metrics
- **Attendance** — Punch in/out, break start/end, GPS capture, live shift timer, attendance history, operational indicators
- **Users** — User list, roles, teams, status
- **RBAC** — Roles, `module.action` permissions matrix
- **Analytics** — Ticket trends, SLA compliance, team & technician metrics
- **Notifications** — Alert center with unread counts

## Tech Stack

- React 18 + Vite
- React Router 6
- Tailwind CSS
- Recharts
- Lucide React icons

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### Demo Login

| Field    | Value                 |
|----------|-----------------------|
| Email    | `superadmin@fieldforce.io` |
| Password | `password123`            |

## Scripts

| Command         | Description        |
|-----------------|--------------------|
| `npm run dev`   | Development server |
| `npm run build` | Production build   |
| `npm run preview` | Preview build    |

## Project Structure

```
src/
  context/AuthContext.jsx   # Mock auth & session
  data/mockData.js          # All demo data
  layouts/AdminLayout.jsx   # Shell + sidebar
  pages/                    # Route pages
  components/               # Shared UI
```

## Notes

- Frontend-only: all actions use mock data
- Operational Manager and Technician roles are out of scope for this build
- Designed for desktop with responsive layouts
