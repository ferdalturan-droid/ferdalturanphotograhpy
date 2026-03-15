# KORKMAN2 - Kørselsrapport System

## Original Problem Statement
Logistics/driving report application for ILK Company ApS.

## Architecture
- **Frontend**: React.js with Tailwind CSS
- **Backend**: FastAPI (Python)
- **Database**: MongoDB

## Core Features
1. Driver Setup Flow: Name (localStorage) → Plate dropdown (all registered plates) → Main app
2. Plads Dropdown: Single city selection, filters tours to that city only
3. Plate Dropdown: Shows all registered plates from drivers DB + manual input
4. Time Recording: Click-to-record buttons for start/end time
5. Tour workflow: På vej (yellow/top) → weight entry auto-completes → (green/bottom)
6. Admin "Ture" tab: Overblik stats + detailed tour table with Vægt/Tid/Status
7. Admin auto-refresh every 10 seconds
8. PDF: Summary + completed tours sorted by time
9. Admin panel: Ture, Planlægning, Chauffører, Genbrugsplads, Historik
10. Daily/weekly scheduling with mailto:

## Latest Changes [2026-03-15]
- Plate setup: Shows all registered plates as clickable buttons
- Weight entry auto-completes tour (completed=true, time recorded, green, bottom)
- Admin Overblik: 7 stat cards (Total/Færdig/På vej/Venter/Kg/Pauser/Første-Sidste)
- Admin tour table: 8 columns with Vægt, Tid, Status
- Admin tour auto-refresh: 10 seconds

## Backlog
- Excel/CSV export
- Driver performance analytics
- Refactor App.js into smaller components
