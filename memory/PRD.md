# KORKMAN2 - Kørselsrapport System

## Original Problem Statement
1. PDF indirirken tamamlanmış turların detayları gösterilmiyordu
2. Pause seçenekleri sadece 45 dk idi - 15/30/45 dk olmalı
3. Mail parsing'de aynı facility'deki turlar gruplanmıyordu
4. Driver seçilince plads otomatik seçilmiyordu
5. Aynı adresdeki turlar görsel olarak gruplanmalı
6. Admin'de yeni genbrugsplads eklenebilmeli
7. Geçmiş raporlar görüntülenebilmeli
8. Plads filtreleme çalışmıyordu
9. "Slet alt" butonu çalışmıyordu
10. Admin'de günlük planlama ve şoförlere mail gönderme
11. PDF sadece özet istatistikler içermeli (tablo değil)
12. Ağırlık input'u her tuşta değil, Enter veya blur'da güncellemeli

## Architecture
- **Frontend**: React.js with Tailwind CSS
- **Backend**: FastAPI (Python)
- **Database**: MongoDB

## Core Features
1. Driver management (add, edit, delete with email)
2. Tour management (manual add, mail parsing)
3. PDF report generation (summary only format)
4. Admin panel with statistics
5. Message system between admin and drivers
6. Pause options (15/30/45 min)
7. Automatic plads selection based on driver's area
8. Facility-based tour grouping
9. Same-address tour visual grouping (red border)
10. Admin Genbrugsplads management
11. Report history view (last 30 days)
12. Plads-based tour filtering
13. Daily scheduling (Planlægning) with email notifications
14. FRI (day off) option for drivers
15. mailto: integration for driver notifications
16. Weekly planning calendar

## What's Been Implemented
- [2026-03-13] Bug fix: initReport function now checks for existing day's report
- [2026-03-13] Feature: Pause buttons (15/30/45 min)
- [2026-03-13] Feature: Auto plads selection when driver selected
- [2026-03-13] Feature: Tours sorted by facility (same facility together)
- [2026-03-13] Feature: Same-address tours marked with red left border
- [2026-03-13] Feature: Admin panel with 4 tabs (Planlægning, Chauffører, Genbrugsplads, Historik)
- [2026-03-13] Feature: Dynamic plads management in admin
- [2026-03-13] Feature: Report history view (last 30 days)
- [2026-03-13] Bug fix: Plads filtering now shows only tours belonging to selected plads
- [2026-03-13] Bug fix: "Slet alt" button now properly deletes all tours
- [2026-03-13] Feature: Planlægning tab with daily scheduling
- [2026-03-13] Feature: FRI (day off) option with visual indicator
- [2026-03-13] Feature: Send individual/all driver emails via mailto:
- [2026-03-13] Feature: Email column in Chauffører tab with edit capability
- [2026-03-13] Feature: Weekly planning calendar with Daglig/Ugentlig toggle
- [2026-03-13] Feature: Week navigation (prev/next arrows)
- [2026-03-13] Feature: Gem uge (save week) functionality
- [2026-03-13] Feature: Send ugeplan (send weekly plan) via email
- [2026-03-13] Feature: Daily summary in weekly view (working/FRI count per day)
- [2026-03-15] Bug fix: PDF generation - removed broken jspdf-autotable dependency
- [2026-03-15] Bug fix: PDF format changed to summary-only (no detailed tour table) matching user's example
- [2026-03-15] Bug fix: Weight input only updates on Enter or blur, not every keystroke

## Database Collections
- drivers: Chauffør data with email
- tours: Daily tour records
- reports: Daily reports
- messages: Admin-driver messages
- plads: Genbrugsplads locations
- schedules: Weekly schedule entries (driver_id, date, plads)

## API Endpoints
- POST /api/seed: Seeds initial data
- GET, POST /api/tours: Manage tours
- DELETE /api/tours/report/{report_id}: Delete all tours for a report
- GET, POST, PUT /api/drivers: Manage drivers
- GET, POST, DELETE /api/plads: Manage sites
- GET /api/reports/history: Historical report data
- GET, POST /api/schedule: Manage weekly schedules
- POST /api/admin/login: Admin login

## Known Issues / Backlog
### P0 (Critical) - ALL RESOLVED

### P1 (High) - ALL RESOLVED

### P2 (Medium/Future)
- Excel/CSV export for reports
- Driver performance analytics dashboard
- Refactor App.js into smaller components

## Next Tasks
1. Excel/CSV export for reports
2. Driver performance metrics visualization
3. Code refactoring (break App.js into smaller components)
