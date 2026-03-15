# KORKMAN2 - Kørselsrapport System

## Original Problem Statement
Logistics/driving report application for ILK Company ApS. Features include driver management, tour management, PDF reports, admin scheduling, and mobile-responsive UI.

## Architecture
- **Frontend**: React.js with Tailwind CSS
- **Backend**: FastAPI (Python)
- **Database**: MongoDB

## Core Features
1. Driver management (add, edit, delete with email)
2. Tour management (admin adds via mail, driver adds manually)
3. PDF report generation (summary + completed tours sorted by time)
4. Admin panel with 5 tabs: Ture, Planlægning, Chauffører, Genbrugsplads, Historik
5. Message system between admin and drivers
6. Pause options (15/30/45 min)
7. Automatic plads selection based on driver's area
8. Facility-based tour grouping
9. Same-address tour visual grouping (red border)
10. Admin Genbrugsplads management
11. Report history view (last 30 days)
12. Plads-based tour filtering
13. Daily and weekly scheduling with email notifications (mailto:)
14. FRI (day off) option for drivers
15. Auto-time recording on tour completion and weight entry
16. Admin tour management by genbrugsplads (mail parse moved to admin)

## What's Been Implemented
- [2026-03-13] Bug fix: initReport function checks for existing day's report
- [2026-03-13] Feature: Pause buttons (15/30/45 min)
- [2026-03-13] Feature: Auto plads selection when driver selected
- [2026-03-13] Feature: Tours sorted by facility
- [2026-03-13] Feature: Same-address tours marked with red left border
- [2026-03-13] Feature: Admin panel with tabs
- [2026-03-13] Feature: Dynamic plads management
- [2026-03-13] Feature: Report history view (last 30 days)
- [2026-03-13] Bug fix: Plads filtering
- [2026-03-13] Bug fix: "Slet alt" button
- [2026-03-13] Feature: Daily/Weekly scheduling with mail
- [2026-03-15] Bug fix: PDF generation (removed broken jspdf-autotable)
- [2026-03-15] Bug fix: PDF format - summary only matching user's example
- [2026-03-15] Bug fix: Weight input only updates on Enter/blur
- [2026-03-15] Feature: PDF includes completed tours sorted by time
- [2026-03-15] Feature: Admin "Ture" tab - tour management by genbrugsplads
- [2026-03-15] Feature: Mail parse moved from driver page to admin page
- [2026-03-15] Feature: Auto-record time on tour completion
- [2026-03-15] Feature: Auto-record time on weight entry
- [2026-03-15] Cleanup: Driver page simplified (mail section removed)

## Database Collections
- drivers, tours, reports, messages, plads, schedules

## API Endpoints
- POST /api/seed, GET/POST /api/tours, DELETE /api/tours/report/{id}
- GET/POST/PUT /api/drivers, GET/POST/DELETE /api/plads
- GET /api/reports/history, GET/POST /api/schedule
- POST /api/admin/login (admin/ilkaps)
- POST /api/parse-mail, POST /api/tours/bulk

## Known Issues / Backlog
### P0 - ALL RESOLVED
### P1 - ALL RESOLVED
### P2 (Future)
- Excel/CSV export for reports
- Driver performance analytics dashboard
- Refactor App.js into smaller components
