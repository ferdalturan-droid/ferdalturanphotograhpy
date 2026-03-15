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
5. Pause options (15/30/45 min)
6. Automatic plads selection based on driver's area
7. Tour workflow: På vej (yellow/top) → weight → OK (green/bottom)
8. Admin tour management by genbrugsplads (mail parse)
9. Auto-refresh tours every 10 seconds (driver sees admin-added tours)
10. Auto-time recording on tour completion
11. Daily and weekly scheduling with email notifications (mailto:)

## What's Been Implemented
- [2026-03-13] All initial features (see CHANGELOG.md for details)
- [2026-03-15] Bug fix: PDF generation (removed broken jspdf-autotable)
- [2026-03-15] Feature: PDF includes completed tours sorted by time
- [2026-03-15] Feature: Admin "Ture" tab with genbrugsplads tour management
- [2026-03-15] Feature: Mail parse moved from driver to admin page
- [2026-03-15] Feature: Auto-record time on tour completion
- [2026-03-15] Bug fix: Weight entry no longer auto-completes tour
- [2026-03-15] Bug fix: Tour workflow - På vej (yellow/top), OK (green/bottom)
- [2026-03-15] Feature: Auto-refresh tours every 10 seconds
- [2026-03-15] Fix: TourUpdate model - all fields Optional for partial updates

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
- Excel/CSV export
- Driver performance analytics
- Refactor App.js into smaller components
