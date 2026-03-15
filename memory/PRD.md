# KORKMAN2 - Kørselsrapport System

## Original Problem Statement
Logistics/driving report application for ILK Company ApS.

## Architecture
- **Frontend**: React.js with Tailwind CSS
- **Backend**: FastAPI (Python)
- **Database**: MongoDB

## Core Features
1. **Driver Setup Flow**: Name entry (saved permanently to localStorage) → Plate entry (editable daily) → Main app
2. Admin tour management by genbrugsplads (mail parse)
3. Tour workflow: På vej (yellow/top) → weight → OK (green/bottom)
4. PDF report generation (summary + completed tours sorted by time)
5. Auto-refresh tours every 10 seconds
6. Admin panel: Ture, Planlægning, Chauffører, Genbrugsplads, Historik
7. Daily/weekly scheduling with mailto: notifications
8. Mobile-responsive design

## What's Been Implemented
- [2026-03-13] All initial features
- [2026-03-15] PDF generation fix + completed tours sorted by time
- [2026-03-15] Admin "Ture" tab with genbrugsplads tour management
- [2026-03-15] Tour workflow: På vej (yellow), OK (green)
- [2026-03-15] Auto-refresh tours every 10 seconds
- [2026-03-15] **Driver setup flow**: Name (localStorage), plate, date/time
- [2026-03-15] Driver logout function
- [2026-03-15] PDF line spacing improvement

## API Endpoints
- POST /api/seed, GET/POST /api/tours, DELETE /api/tours/{id}
- GET/POST/PUT /api/drivers, GET/POST/DELETE /api/plads
- GET /api/reports/history, GET/POST /api/schedule
- POST /api/admin/login (admin/ilkaps)
- POST /api/parse-mail, POST /api/tours/bulk

## Known Issues / Backlog
### P0 - ALL RESOLVED
### P2 (Future)
- Excel/CSV export
- Driver performance analytics
- Refactor App.js into smaller components
