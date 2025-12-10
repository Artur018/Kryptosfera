# 🧠 A_N_A_L – Algorytmiczna Nowoczesna Analiza Łańcucha

System analizy i raportowania kryptowalut z wykorzystaniem **FastAPI**, **Binance API**, **Discord Webhooków**, **AI (OpenAI GPT)** i **automatycznych harmonogramów**.
# Chainsignal / Kryptosfera – Production-ready Crypto Analytics Template

This repository is a reusable, production-ready template for building
crypto analytics applications:

- **Backend:** FastAPI + APScheduler (scheduled reports), Docker, Nginx, HTTPS (Let’s Encrypt)
- **Frontend:** Next.js 16 (App Router) + TypeScript + Tailwind
- **Deploy:** VPS (Hetzner) + Vercel
- **Use case:** daily market reports, signals, basic AI analysis

Originally built as part of the **Chainlogic / Chainsignal / Kryptosfera** ecosystem, this codebase is designed so it can be reused as a starting point for other projects: portfolio apps, internal dashboards, custom crypto tools, or any data-driven product with scheduled jobs and a web UI.

For full architectural context, see:

> `PROJECT_CONTEXT_CHAINLOGIC.md`
> (high-level description of the ecosystem and current state)

---

## 1. Features

### Backend (FastAPI + APScheduler)

- REST API with endpoints such as:

  - `GET /` – healthcheck:
    ```json
    { "status": "OK", "service": "chainlogic-api" }
    ```
  - `GET /reports/latest` – latest aggregated market report
  - `GET /signals` – signal list (e.g. 24h moves > 8%)
  - `POST /schedule/run-now` – manual trigger for scheduled tasks
  - `POST /predict` – AI-powered short analysis (Groq LLM)
  - `GET /chart` – prepared endpoint for chart/visualisation data

- Report engine:

  - periodic data collection (currently mocked / simplified)
  - calculations:
    - 24h / 3D / 7D percent change
    - ATR(3D), ATR(7D)
    - “big move” signals (> 8% in 24h)
  - CSV exports:
    - per-run CSV files
    - merged `all_reports.csv` history

- Scheduler:

  - APScheduler started on app startup
  - default schedule:
    - **06:00** and **16:00** (timezone `Europe/Warsaw`)
  - cron-style daily reports in the background

- Production-ready stack:

  - Dockerized backend
  - Nginx reverse proxy
  - HTTPS via Let’s Encrypt (Certbot)
  - logs + healthcheck endpoint for monitoring

---

### Frontend (Next.js + Tailwind)

- Next.js 16 (App Router) + TypeScript
- Main dashboard:
  - table with the latest report:
    - `symbol`, `close`, `change_24h`, `change_3d`, `change_7d`,
      `atr_3d`, `atr_7d`
  - signal list based on `/signals`
- Styling:
  - Tailwind CSS
  - responsive layout
- Simple language switch (EN / PL) implemented in the client component
  with `useState` (no heavy i18n framework)
- API client in `frontend/src/lib/api.ts`:
  - `getLatestReport()` → `/reports/latest`
  - `getSignals()` → `/signals`
  - shared `fetchJson()` helper

---

### Deploy & Domains (example setup)

The template is currently used with:

- **API:** `https://api.chainsignal.solutions`
- **Frontend:** `https://chainsignal.solutions`

You can replace these domains with your own by:

- pointing DNS to your VPS / Vercel
- updating Nginx config for the API domain
- setting `NEXT_PUBLIC_API_BASE_URL` on Vercel

---

## 2. Tech stack

**Backend**

- Python
- FastAPI
- APScheduler
- pandas
- Docker / docker-compose
- Nginx
- Certbot (Let’s Encrypt)
- (optional) Groq API for AI predictions
- (optional) Discord webhook for notifications

**Frontend**

- Next.js 16 (App Router)
- TypeScript
- React
- Tailwind CSS

**Infra**

- VPS (Hetzner in the reference setup)
- Vercel for frontend hosting
- GitHub repository integration

---

## 3. Running the project locally

### 3.1. Backend (FastAPI)

#### Prerequisites

- Python 3.11+
- Docker + docker-compose (recommended)

#### Option A: run with Docker

From `backend/` directory:

```bash
cd backend
docker-compose up -d backend
######################################################################

The API will be available at:

http://localhost:8000


Key endpoints to test:

curl http://localhost:8000/
curl http://localhost:8000/reports/latest
curl http://localhost:8000/signals

Option B: run with uvicorn (dev)
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

###########################################################################################

3.2. Frontend (Next.js)

From frontend/ directory:

cd frontend
npm install


Create a .env.local and set:

NEXT_PUBLIC_API_BASE_URL=http://localhost:8000


Then run the dev server:

npm run dev


By default it runs on:

http://localhost:3000

4. Using this as a template for your own project

Fork or clone this repo

git clone https://github.com/<your-account>/<your-repo>.git


Rename the project

Update the project name in README.md

Adjust any product-specific wording (e.g. “Chainsignal”) to your own brand

Adjust the reporting logic

Edit backend/app/services/analytics.py

Change:

the list of tracked symbols

data source (mock → real exchange API)

thresholds for signals (e.g. 8% → custom)

Change domains / deployment

Replace api.chainsignal.solutions and chainsignal.solutions with your own domains

Update:

Nginx config in backend/nginx/nginx.conf

Vercel project settings (NEXT_PUBLIC_API_BASE_URL)

Extend features

Example directions:

connect a real exchange API (Binance, etc.)

add authentication & user accounts

build an “investment calculator” view

add PostgreSQL + ORM for persisting more data

expose more API endpoints for your frontend

5. Known issues / TODO

A few things are intentionally left as “good next steps”:

i18n:

language switch (EN/PL) works, but not all UI strings use the translation object yet

mapping technical reasons (e.g. big_move_24h) to human-friendly labels

Next.js dev quirks:

if dev build breaks with .next artefacts, try:

cd frontend
rm -rf .next
npm run dev


Tests:

the API is production-like, but automated tests (pytest, etc.) are not yet wired in

For a detailed narrative of the project (architecture, roadmap, ecosystem),
read:

PROJECT_CONTEXT_CHAINLOGIC.md


Skopiuj cały ten blok do `README.md` w repo.  

---

## 3. Commit + push z jasnym przekazem

Zakładam, że jesteś w katalogu repo:  

```bash
git status
# powinieneś zobaczyć zmienione README.md i nowy PROJECT_CONTEXT_CHAINLOGIC.md

git add README.md PROJECT_CONTEXT_CHAINLOGIC.md

git commit -m "Turn Chainsignal/Kryptosfera into reusable crypto analytics template"

git push origin main

##########################################################################################################

Docker + docker-compose,

Nginx jako reverse proxy,

Let’s Encrypt (webroot),

auto-renew przez certbot-renew,

ścieżkę uruchomienia na czystym VPS (punkty typu: sklonuj repo, ustaw env, docker-compose up -d, certy, firewall).

link do dashboardu na Vercel,

link do https://chainsignal.solutions/openapi.json,