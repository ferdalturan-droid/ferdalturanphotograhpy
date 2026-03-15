# KORKMAN2 - Kørselsrapport System

## Original Problem Statement
Logistics/driving report application for ILK Company ApS.

## Architecture
- **Frontend**: React.js with Tailwind CSS
- **Backend**: FastAPI (Python)
- **Database**: MongoDB

## Core Features
1. **Driver Setup Flow**: Name (localStorage) → Plate dropdown → Main app
2. **Plads Dropdown**: Single city selection, filters tours to that city only
3. **Plate Dropdown**: Shows all registered plates from drivers DB + manual input
4. **Time Recording**: Click-to-record buttons for start/end time (single click captures current time)
5. Admin tour management by genbrugsplads (mail parse)
6. Tour workflow: På vej (yellow/top) → weight → OK (green/bottom)
7. PDF report generation (summary + completed tours sorted by time)
8. Auto-refresh tours every 10 seconds
9. Admin panel: Ture, Planlægning, Chauffører, Genbrugsplads, Historik
10. Daily/weekly scheduling with mailto: notifications

## What's Been Implemented
- [2026-03-13] All initial features
- [2026-03-15] PDF generation fix + completed tours sorted by time
- [2026-03-15] Admin "Ture" tab
- [2026-03-15] Tour workflow: På vej (yellow), OK (green)
- [2026-03-15] Driver setup flow with localStorage
- [2026-03-15] **Plads dropdown** (replaces buttons)
- [2026-03-15] **Plate dropdown** with all registered plates
- [2026-03-15] **Click-to-record time** buttons (Start/Slut)

## API Endpoints
- POST /api/seed, GET/POST /api/tours, DELETE /api/tours/{id}
- GET/POST/PUT /api/drivers, GET/POST/DELETE /api/plads
- GET /api/reports/history, GET/POST /api/schedule
- POST /api/admin/login (admin/ilkaps)
- POST /api/parse-mail, POST /api/tours/bulk

## Backlog
- Excel/CSV export
- Driver performance analytics
- Refactor App.js into smaller components
