# 📈 Master Plan: MT5 EA Monitor & Control Web App

## 🎯 Objective
Web dashboard to monitor and control MetaTrader 5 accounts trading gold/crypto via EA on Exness. Real-time account monitoring, position tracking, live price charts, P&L analytics, and emergency position control (panic close), across 2 MT5 accounts.

## 📊 AI Token Usage Tracker
This section monitors the AI tokens consumed by the AI Agent during the development of this project.
- **Total Cumulative Tokens (Since Inception):** ~63,000 (tracked through the "Hydration Fix" changelog entry below). Precise per-session tracking was discontinued after that point — too much overhead relative to its value versus git history, which already records what changed and when.

## 🛠️ Tech Stack
- **Backend:** Python, FastAPI, `MetaTrader5` python package (Windows-only; falls back to an in-memory mock when unavailable, e.g. on macOS dev), Uvicorn.
- **Frontend:** Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS v4, lucide-react icons, `lightweight-charts` (TradingView's open-source charting library).
- **Deploy:** Frontend on Vercel (auto-deploy on push to `main`). Backend on a Windows Forex VPS running two MT5 terminal installs side by side, manually redeployed by copying `backend/main.py` over and letting `uvicorn --reload` pick it up.
- **Network:** Frontend calls its own Next.js API route (`app/api/[...path]/route.ts`), which proxies server-side to the VPS backend — avoids CORS and keeps the backend URL off the client.
- **PWA:** Installable (manifest + dynamically generated icons), safe-area-aware header, custom pull-to-refresh (no native support in standalone PWA mode), native-style bottom tab bar on mobile.

---

## 🏗️ Project Architecture & Features

### 1. Backend (FastAPI) API Endpoints
Supports two MT5 accounts/terminals, selected via `{account_id}` path param (`1` or `2`), each mapped to its own terminal executable in `ACCOUNT_PATHS`:
- `GET /api/account/{account_id}` — account details (balance, equity, margin, free margin, margin level, login, name, company, server, trade mode).
- `GET /api/positions/{account_id}` — all open positions, any symbol (ticket, symbol, type, volume, open/current price, SL, TP, profit).
- `GET /api/candles/{account_id}?symbol=&timeframe=&count=` — OHLC candles via `mt5.copy_rates_from_pos`, timeframes M1–MN1.
- `POST /api/close_all/{account_id}` — closes every open position on the account, any symbol (no longer hardcoded to one symbol).
- `POST /api/close_profitable/{account_id}` — closes only positions currently in profit.
- `GET /api/overview` — aggregate summary across both accounts (used by the Overview tab's top stat cards).
- `GET /api/history/{account_id}?year=&month=` — daily P&L history for a given month.
- `GET /api/symbol_stats/{account_id}?year=&month=` — P&L and trade count grouped by symbol.
- `GET /api/balance_ops/{account_id}?year=&month=` — individual deposit/withdrawal deals for a month.
- `GET /api/balance_summary/{account_id}` — lifetime deposit/withdrawal/net totals.
- `GET /api/trades/{account_id}?year=&month=&day=` — full trade records (open+close price/time) for calendar drill-down.

Removed: the EA auto-trading toggle endpoint — the MT5 API cannot actually toggle `AlgoTrading` programmatically, so it was UI-only theater and was pulled along with the button.

Backend switches between the two MT5 terminal installations on the VPS via `mt5.initialize(path=...)`:
- Account 1: `C:\Program Files\MetaTrader 5\terminal64.exe`
- Account 2: `C:\Program Files\MetaTrader 5 - Port2\terminal64.exe`

### 2. Frontend (Next.js) UI Layout
Single-page app (`frontend/app/page.tsx`) with a bottom tab bar on mobile / top tab bar on desktop, three tabs:

- **ภาพรวม (Overview):** account summary cards, monthly equity-curve P&L chart (with month navigation and per-account filter), side-by-side account comparison chart, drawdown chart, per-symbol P&L breakdown, deposit/withdrawal panel (lifetime totals + browsable monthly list).
- **พอร์ต (Positions):**
  - Live price chart (`LiveChartCard`) — candlestick chart via `lightweight-charts`, one shared card with dropdowns for account / symbol / timeframe (M1–MN1), dashed Entry (BUY/SELL) and dotted SL/TP price lines overlaid on the candles, native pan/zoom, and a drag handle to resize the panel height. Auto-selects the first account that has open positions on load (falls back to Account 1 if none do).
  - Per-account panel (`AccountPanel`, one per account): connection status badge, 4 summary cards (Balance/Equity/Free Margin/Margin Level), open positions table, floating PnL summary, **Close Profitable** and **Close All Positions** buttons (both with a confirmation dialog).
- **Calendar:** monthly calendar heatmap of daily P&L, click a day to see that day's full trade list (open/close price & time detail) below the grid.

PWA behavior: installable via manifest + generated icons, sticky safe-area-aware header, custom touch-based pull-to-refresh, bottom tab nav that mimics a native app on mobile.

---

## 🚨 AI Workflow Rules (IMPORTANT)
1. **Keep this file synchronized** with the actual codebase — endpoints, tech stack, and UI layout — whenever a change would make it stale. Update it as part of the change, not as an afterthought.
2. **Log changes** briefly in the Changelog below.
3. Detailed per-task token accounting was dropped (see tracker note above) — git history is the source of truth for *what* changed and *when*; this file is for *why* and *how it fits together*.

---

## 📝 Changelog
- **[Initial Status]** Project master plan created. Awaiting AI execution for Phase 1. Token tracking initialized.
- **[Phase 1 Complete]** Created `backend/` with FastAPI app, CORS, and initial endpoints (`GET /api/account`, `GET /api/positions` filtered to XAUUSD, `POST /api/close_all`, `POST /api/ea_toggle`). `MetaTrader5` is Windows-only, unavailable on the macOS dev machine.
- **[Phase 2 Complete]** Created `frontend/` via `create-next-app` (Next.js 16, TypeScript, Tailwind v4). Dark dashboard: connection status, 4 summary cards, positions table, EA toggle, panic-close button with confirmation. 2s polling.
- **[Mock Mode Added]** Backend falls back to in-memory mock data when `MetaTrader5` can't be imported, so the stack runs locally without a Windows MT5 terminal.
- **[Deployed to Forex VPS]** Backend live on the VPS at port 8000, CORS opened, frontend pointed at it. Verified end-to-end.
- **[Multi-Account Support]** Refactored to support both MT5 terminals via `{account_id}`, fixed broker symbol name to `XAUUSDm`, split UI into a reusable `AccountPanel` per account.
- **[Hydration Fix]** Silenced a benign SSR/client mismatch from a browser extension.
- **[Tunnel → Proxy]** Replaced the Cloudflare tunnel with a Next.js API route (`app/api/[...path]/route.ts`) that proxies server-side to the VPS backend, removing CORS/tunnel-header fragility.
- **[Overview Analytics]** Added, over several iterations: monthly equity-curve P&L chart with month navigation and account filter, side-by-side account comparison chart, drawdown chart, per-symbol P&L breakdown, and a deposit/withdrawal panel (lifetime totals + monthly browsable list).
- **[Calendar]** Redesigned the day grid (rounded cells, gap-based spacing instead of borders, mobile text-overflow fixes) and added click-a-day trade drill-down showing full open/close detail per trade.
- **[Fonts/Icons]** Switched to IBM Plex Sans Thai for Thai-first typography, adopted lucide-react throughout.
- **[Position Controls Made Real]** Removed the EA auto-trading toggle — MT5's API can't actually flip `AlgoTrading`, so it was non-functional UI. Fixed `close_all` to cover every open symbol (was hardcoded to one). Added `close_profitable` to close only winning positions. Both close actions gated behind a confirmation dialog, and a floating PnL summary now sits above the buttons.
- **[UI Polish]** Badge-style connection status, compact 2-per-row mobile summary cards, mobile-compact calendar stat cards, stacked full-width close buttons on mobile.
- **[PWA]** Installable manifest with dynamically generated icons, sticky safe-area-aware header, native-style bottom tab bar on mobile, and a custom touch-based pull-to-refresh gesture (standalone PWA mode has no native one).
- **[Live Candlestick Chart]** Added `GET /api/candles` (MT5 `copy_rates_from_pos`, M1–MN1) and a `LiveChartCard` on the Positions tab using TradingView's `lightweight-charts` — real candles, native pan/zoom, and Entry(BUY/SELL)/SL/TP price lines per open position. Consolidated to one chart with account/symbol/timeframe pickers, a drag-to-resize handle, and auto-selection of the first account that actually has open orders on load.
