# Online Voting System

A secure online voting platform with K-Means analytics.

## Tech Stack
- Backend: Django + DRF
- Frontend: React + Vite + Tailwind
- Database: SQLite (Dev) → PostgreSQL (Prod)
- ML: scikit-learn (K-Means)

## Project Structure
online-voting-system/
├── backend/
│ ├── config/ # Django settings
│ ├── accounts/ # User & Citizen models
│ ├── elections/ # Election & Candidate models
│ ├── voting/ # Vote model
│ ├── analytics/ # K-Means logic
│ ├── audit/ # Audit logging
│ └── manage.py
├── frontend/
│ ├── src/
│ ├── public/
│ └── package.json
└── README.md
