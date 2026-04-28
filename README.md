# DineBot 🍽️

A fully rule-based multi-merchant restaurant chatbot built with Node.js + Express (backend) and Angular 19 (frontend).

## Features
- Business type selector (Restaurant / Salon / Grocery)
- 5 Canadian restaurant cards with branded UI
- Step-by-step customer info collection
- Menu browsing with category tabs
- Food ordering with cart + checkout
- Table booking with date/time/party size picker
- Order & booking confirmation with unique IDs

## Project Structure
```
DineBot/
├── backend/    # Node.js + Express API (port 3000)
└── frontend/   # Angular 19 app (port 4200)
```

## Quick Start

### Backend
```bash
cd backend
npm install
node server.js
```

### Frontend
```bash
cd frontend
npm install
npx ng serve
```

Open http://localhost:4200

## Environment Variables (backend)
Copy `backend/.env.example` to `backend/.env`:
```
PORT=3000
```

## Deployment
See `render.yaml` for Render.com deployment configuration.
