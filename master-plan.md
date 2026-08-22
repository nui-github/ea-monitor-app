# 📈 Master Plan: MT5 EA Monitor & Control Web App

## 🎯 Objective
Build a modern web application to monitor and control a MetaTrader 5 Expert Advisor (EA) specifically trading **XAUUSD** on the Exness broker. The app provides a centralized dashboard for real-time account monitoring, position tracking, and emergency control (Panic Button).

## 📊 AI Token Usage Tracker
This section monitors the AI tokens consumed by the AI Agent during the development of this project.
- **Current Session Tokens (Latest Task):** ~20,000
- **Total Cumulative Tokens (Since Inception):** ~63,000

## 🛠️ Tech Stack
- **Backend:** Python, FastAPI, `MetaTrader5` python package, Uvicorn, Pydantic.
- **Frontend:** Next.js (App Router), React, Tailwind CSS, Shadcn UI (or Lucide-react for icons).
- **Network:** REST API communicating between local/VPS frontend and MT5 terminal.

---

## 🏗️ Project Architecture & Features

### 1. Backend (FastAPI) API Endpoints
Supports two MT5 accounts/terminals, selected via `{account_id}` path param (`1` or `2`):
- `GET /api/account/{account_id}` -> Returns Account details (Balance, Equity, Free Margin, Margin Level).
- `GET /api/positions/{account_id}` -> Returns all open positions filtered by symbol 'XAUUSDm' (Ticket, Type, Volume, Open Price, Current Price, SL, TP, Profit).
- `POST /api/close_all/{account_id}` -> Panic Button function to close all open XAUUSDm positions at market price.
- `POST /api/ea_toggle/{account_id}` -> Toggles EA auto-trading status (True/False).

Backend switches between the two MT5 terminal installations on the VPS via `mt5.initialize(path=...)`:
- Account 1: `C:\Program Files\MetaTrader 5\terminal64.exe`
- Account 2: `C:\Program Files\MetaTrader 5 - Port2\terminal64.exe`

### 2. Frontend (Next.js) UI Layout
- **Header:** Project title.
- **Account Panels (x2):** One panel per MT5 account ("Account 1", "Account 2"), each with its own:
  - Connection Status indicator (Online/Offline)
  - 4 Account Summary Cards: Balance, Equity, Free Margin, Margin Level
  - Positions Data Table showing active XAUUSDm positions with auto-refresh polling (every 2 seconds)
  - EA Auto-Trading toggle switch
  - Highly visible, red **"Close All XAUUSD" (Panic Button)** with a confirmation dialog to prevent accidental clicks.

---

## 🚀 Execution Steps for AI Agent (Please execute sequentially)

### Phase 1: Backend Initialization
1. Create a `backend` directory.
2. Inside `backend`, set up a Python virtual environment (`.venv`) and create `requirements.txt` (`fastapi`, `uvicorn`, `MetaTrader5`, `pydantic`).
3. Create `main.py` and implement the FastAPI server with CORS middleware enabled (allowing `http://localhost:3000`).
4. Implement the connection logic to MT5 terminal and the endpoints listed in the Architecture section.

### Phase 2: Frontend Initialization
1. Create a `frontend` directory in the root folder.
2. Initialize a Next.js app with Tailwind CSS inside the `frontend` folder (`npx create-next-app@latest .`).
3. Clean up the default boilerplate in `app/page.tsx` and `app/globals.css`.
4. Build the Dashboard UI components (Cards, Table, Buttons) based on the Features list.
5. Implement `fetch` logic with `useEffect` or `setInterval` to pull real-time data from `http://localhost:8000`.

### Phase 3: Integration & Refinement
1. Ensure the frontend gracefully handles network errors if the backend/MT5 is unreachable.
2. Add a confirmation modal (Alert Dialog) before triggering the `close_all` endpoint.

---

## 🚨 AI Workflow Rules (IMPORTANT)
As an AI Agent working on this workspace, you MUST adhere to the following rules:
1. **Always Update This File:** Every time you successfully implement a new feature, modify existing code, or change the folder structure, you MUST automatically update this `master-plan.md` file to reflect the current, accurate state of the project.
2. **Single Source of Truth:** Ensure that the API endpoints, tech stack, and UI layouts listed in this document are 100% synchronized with the actual codebase.
3. **Log Changes:** Add a brief note in the "Changelog" section below to summarize what was just implemented.
4. **Log Token Usage:** After completing any task, you MUST report the estimated token usage (prompt + completion) for that specific task, and update the `Current Session Tokens` and calculate the new `Total Cumulative Tokens` in the tracker section at the top of this document.

---

## 📝 Changelog
- **[Initial Status]** Project master plan created. Awaiting AI execution for Phase 1. Token tracking initialized.
- **[Phase 1 Complete]** Created `backend/` with `.venv`, `requirements.txt` (fastapi, uvicorn, MetaTrader5, pydantic), and `main.py`. Implemented FastAPI app with CORS for `http://localhost:3000` and endpoints: `GET /api/account`, `GET /api/positions` (filtered to XAUUSD), `POST /api/close_all` (panic close via market orders), `POST /api/ea_toggle` (reports terminal AlgoTrading status — note: MT5 Python API cannot programmatically toggle AlgoTrading, only read terminal_info().trade_allowed). Note: `MetaTrader5` package is Windows-only and could not be installed on this macOS dev machine; core deps (fastapi, uvicorn, pydantic) installed and verified.
- **[Phase 2 Complete]** Created `frontend/` via `create-next-app` (Next.js 16, TypeScript, Tailwind CSS v4, App Router). Replaced boilerplate `app/page.tsx` and `app/globals.css` with a dark-themed dashboard: header with connection status indicator, 4 account summary cards (Balance, Equity, Free Margin, Margin Level), open positions table for XAUUSD, EA auto-trading toggle switch, and a red "Close All XAUUSD" panic button with confirmation modal. Polling implemented via `useEffect`/`setInterval` every 2s against the backend API. Production build verified successful.
- **[Mock Mode Added]** `backend/main.py` now falls back to in-memory mock data automatically when the `MetaTrader5` package can't be imported (e.g. on macOS dev machine), so the full stack can be run/tested locally without a Windows MT5 terminal.
- **[Deployed to Forex VPS — Live & Verified]** Backend deployed to Windows Forex VPS at `154.16.66.54`: installed Python, created `.venv`, installed `requirements.txt` (incl. real `MetaTrader5` package), opened firewall port 8000 (`netsh advfirewall`), and ran `uvicorn main:app --host 0.0.0.0 --port 8000` with MT5 terminal logged in. CORS opened to `allow_origins=["*"]` for cross-host access. Frontend `API_BASE` updated to `http://154.16.66.54:8000`. End-to-end test successful: dashboard on mac (localhost:3000) shows live "Connected" status, real account balance/equity/margin from MT5.
- **[Multi-Account Support Added — Live & Verified]** Refactored backend to support 2 MT5 terminals/accounts via `{account_id}` path param, switching terminals with `mt5.initialize(path=...)`. Fixed broker symbol name from `XAUUSD` to actual `XAUUSDm`. Frontend refactored into a reusable `AccountPanel` component, rendering Account 1 and Account 2 side by side, each polling independently. Verified live on VPS: both accounts show correct balances and open XAUUSDm positions with live P/L (Account 1 SELL -44.37, Account 2 BUY +10.95).
- **[Hydration Fix]** Added `suppressHydrationWarning` to `<html>` in `frontend/app/layout.tsx` to silence a benign hydration mismatch caused by a browser extension injecting a `data-scribe-recorder-ready` attribute.