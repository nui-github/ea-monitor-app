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
- `GET /api/orders/{account_id}` — pending (not yet triggered) orders via `mt5.orders_get()` — limit/stop/stop-limit, any symbol.
- `GET /api/candles/{account_id}?symbol=&timeframe=&count=` — OHLC candles via `mt5.copy_rates_from_pos`, timeframes M1–MN1.
- `GET /api/tick/{account_id}?symbol=` — latest bid/ask via `mt5.symbol_info_tick`, polled by the chart to live-update the in-progress candle.
- `GET /api/ea_signal/{account_id}?symbol=` — recomputes the side-selection rule of the EA running on that account from MT5 candles. `EA_PROFILES` in `main.py` says which EA runs on which account (name, version, magic, `kind`, cadence, and the "rules of the EA" facts shown in the UI) and the endpoint dispatches on `kind`; unknown accounts get 404. **`gsg`** (account 2, GSG v2.09 — v1.8 uses the same filter): the last closed H4 bar above EMA20, EMA20 above EMA60 and H1 ADX(14) ≥ 20 → BUY only, the mirror → SELL only, else "no trend – waiting"; decided only at H4 close. Returns the indicator values, `price_now`, and `flip` thresholds (the H4 close needed to move to BUY/SELL, solved from the EMA update equations: `close > EMA20` flips at the current EMA20, `EMA20 > EMA60` flips at `cross_price`; ADX has no single price threshold so the UI shows its distance from 20). **`gts`** (account 1, GoldTrendScalper v1.00, magic 99001): each of 8 timeframes (M1–W1) votes +1 if close > EMA20 > EMA50, −1 for the reverse, else 0 (W1/D1 read the bar still forming, the rest the last closed bar); score = W1×1 + D1×2 + H4×3 + H1×3 (`GTS_RULE`); score ≥ ±5 with H1 voting the same way and H1 ADX(14) ≥ 18 → BUY/SELL only, |score| ≥ 8 with ADX ≥ 25 → RUNNER, otherwise SCALP / STAND ASIDE (with `blockers`). Evaluated every M1 bar; returns the per-TF votes, score, ADX, and the `h1_flip` close thresholds. All values are estimates — the MT5 Python API cannot read values from inside a compiled EA, and the GTS M5 pullback entry trigger is not computed.
- `POST /api/close_all/{account_id}` — closes every open position on the account, any symbol (no longer hardcoded to one symbol).
- `POST /api/close_profitable/{account_id}` — closes only positions currently in profit.
- `GET /api/overview` — aggregate summary across both accounts (used by the Overview tab's top stat cards).
- `GET /api/history/{account_id}?year=&month=` or `?start=&end=` (inclusive `YYYY-MM-DD`) — daily P&L history; add `granularity=hour` for per-hour buckets (used by the "today" filter). The calendar keeps using `year`/`month`.
- `GET /api/symbol_stats/{account_id}?year=&month=` or `?start=&end=` — P&L and trade count grouped by symbol.
- `GET /api/balance_ops/{account_id}?year=&month=` — individual deposit/withdrawal deals for a month.
- `GET /api/balance_summary/{account_id}` — lifetime deposit/withdrawal/net totals.
- `GET /api/trades/{account_id}?year=&month=&day=` — full trade records (open+close price/time) for calendar drill-down.

Removed: the EA auto-trading toggle endpoint — the MT5 API cannot actually toggle `AlgoTrading` programmatically, so it was UI-only theater and was pulled along with the button.

Backend switches between the two MT5 terminal installations on the VPS via `mt5.initialize(path=...)`:
- Account 1: `C:\Program Files\MetaTrader 5\terminal64.exe`
- Account 2: `C:\Program Files\MetaTrader 5 - Port2\terminal64.exe`

### 2. Frontend (Next.js) UI Layout
Three routes sharing one layout, with a bottom tab bar on mobile / top tab bar on desktop (links, so each tab has its own URL and Back works). All UI lives in `frontend/app/dashboard.tsx` (a client module: the `Shell` chrome plus `OverviewTab`, `PositionsTab`, `CalendarTab`); `app/layout.tsx` wraps every route in `Shell`, and `app/page.tsx`, `app/positions/page.tsx`, `app/calendar/page.tsx` are thin pages that render one tab each:

- **ภาพรวม (Overview, `/`):** account summary cards, a shared date-range filter bar (วันนี้ default / เมื่อวาน / อาทิตย์นี้ Mon–Sun / เดือนนี้ / 3 เดือนล่าสุด / 6 เดือนล่าสุด / ปีล่าสุด / กำหนดเอง with start+end pickers) that drives the equity-curve P&L chart (with per-account filter), side-by-side account comparison chart, drawdown chart and per-symbol P&L breakdown. "Today" and "yesterday" (single days) plot per hour on a fixed 00:00–23:00 axis (server time); other ranges plot per day. The equity-curve chart labels each point with that period's own P&L (green/red): biggest movers are placed first and a label is skipped if it would overlap one already placed, so dense ranges show only the standout points; the label font is sized from the card width so it stays readable on phones (the cumulative value and full detail stay in the hover tooltip). Also a deposit/withdrawal panel (lifetime totals + browsable monthly list).
- **พอร์ต (Positions, `/positions`):**
  - **EA Dashboard** (top) — one card per account (1 account = 1 EA) showing the EA's name/version/magic and its own rules. Common to both: what it is actually playing (BUY / SELL / BUY+SELL from open positions, or "รอเข้า" when only pending orders exist) with per-side counts and lots, and a collapsible "กฎของ EA" section (order placement, targets, stop-loss, protections, cadence; closed by default). GSG cards show H4 close vs EMA20, EMA20 vs EMA60 and H1 ADX ≥ 20 (✓/✗) plus a "จะเปลี่ยนหน้าเล่นเมื่อ" list of what the next H4 close must do to move to no-trend / BUY / SELL. GTS cards show a TREND MAP of the 8 timeframes (gold border = the four scoring TFs), the weighted score, whether H1 agrees, ADX (RUNNER threshold shown), why it is standing aside, and the H1 closes that would flip the vote (GTS re-evaluates every M1 bar, so there is no fixed next-check time; H1 flipping against the side held makes the EA close everything). Cards warn when the signal flipped but positions are still open, using each EA's own behavior (GSG finishes the old side first; GTS closes on an H1 flip). Labeled as an estimate; a backend without profiles still renders the GSG layout.
  - Live price chart (`LiveChartCard`) — candlestick chart via `lightweight-charts`, one shared card with dropdowns for account / symbol / timeframe (M1–MN1). The symbol list is whatever the account has open or pending, plus a default (`DEFAULT_CHART_SYMBOL`, XAUUSDm) so an account with nothing open can still be charted; it follows the traded symbol until the user picks one. Dashed Entry (BUY/SELL) lines, amber dashed lines for pending orders, and dotted SL/TP lines overlay the candles, labeled compactly (font 10, order type abbreviated e.g. `B.STOP`, only the last 4 digits of the ticket) so they don't cover the candles; a TradingView-style OHLC legend (top-left, bordered) follows the crosshair and falls back to the latest candle when not hovering. The in-progress candle live-updates from `/api/tick` polling (~2s) instead of waiting on a full refetch. Native pan/zoom, a drag handle to resize the panel height, and auto-selection of the first account with open positions on load (falls back to Account 1).
  - Per-account panel (`AccountPanel`, one per account): connection status badge, 4 summary cards (Balance/Equity/Free Margin/Margin Level), open positions table, a collapsible **Pending Orders** table (closed by default, order count shown in the header), floating PnL summary, **Close Profitable** and **Close All Positions** buttons (both with a confirmation dialog).
- **Calendar (`/calendar`):** monthly calendar heatmap of daily P&L, click a day to see that day's full trade list (open/close price & time detail) below the grid.

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
- **[Pending Orders]** Backend only ever called `mt5.positions_get()`, so pending (not-yet-triggered) orders never showed up even though they existed on the VPS. Added `GET /api/orders`, a collapsible Pending Orders table per account (closed by default, count shown in the header), and amber pending-order lines overlaid on the live chart — the symbol picker now includes symbols that only have a pending order, not just open positions.
- **[Live Ticking Chart + OHLC Legend]** Added `GET /api/tick` and 2s polling that updates the in-progress candle in place via `series.update()`, so the chart moves with the market instead of only refreshing on symbol/timeframe change. Added a TradingView-style OHLC legend that follows the crosshair (fixed a race where the tick poll kept stomping the legend right after a hover) and styled it as a bordered, rounded floating box above everything else on the chart.
- **[Date-Range Filter]** Replaced the month prev/next controls on the Overview charts with one shared range filter (today default, this week Mon–Sun, this month, last 3/6 months, last year, custom start/end). `/api/history` and `/api/symbol_stats` now accept `start`/`end` alongside `year`/`month`, and `/api/history` takes `granularity=hour` so "today" can plot per hour on a 24-hour axis. Custom pickers clamp to today and keep start ≤ end.
- **[EA Dashboard]** Added `GET /api/ea_signal` and a per-account EA card at the top of the Positions tab showing the side each EA is playing and the EMA20/EMA60 (H4) + ADX(14) (H1) filter that decides it. The EAs' real indicator values live inside compiled code and are not readable through the MT5 Python API, so the backend recomputes the documented rule from candles and the UI marks the numbers as estimates.
- **[EA Flip Conditions]** EA cards now answer "when does it change side": the EA only re-decides when an H4 bar closes, so each card lists what that next close must do for the EA to go to no-trend / BUY / SELL. Backend solves the thresholds from the EMA update equations and returns them (plus the current price) from `/api/ea_signal`; the math was checked by feeding closes just either side of each threshold back through the EMAs. ADX is shown as distance from its threshold, since it depends on H1 bars rather than one price.
- **[Chart Without Open Positions]** The price chart no longer hides when an account has nothing open or pending: a default symbol is always selectable (traded symbols are listed first and followed until the user picks one), and a symbol with no candle data now says so instead of sitting on "loading". Also shrank the price-line labels (font 10, abbreviated order types, last 4 ticket digits) because the long labels were covering candles.
- **[Routes per Tab]** The three tabs are now real routes (`/`, `/positions`, `/calendar`) instead of one page switching on local state, so each has a shareable/bookmarkable URL, deep links work, and the browser Back button moves between tabs. The old `app/page.tsx` became `app/dashboard.tsx`; the header, mobile bottom nav and pull-to-refresh moved into a `Shell` mounted from the root layout so they persist across navigations. Pull-to-refresh now reloads whichever route you are on.
- **[Per-EA Rules on the Dashboard]** Account 1 now runs GoldTrendScalper v1.00 and account 2 GSG v2.09, so the dashboard no longer applies one shared filter to both. Added `EA_PROFILES` (which EA is on which account, plus the facts shown under "กฎของ EA") and a GTS signal engine alongside the GSG one; `/api/ea_signal` dispatches per account. The EA name lives in backend config because it cannot be read from MT5 — update `EA_PROFILES` when an EA is swapped. The GTS engine was checked on synthetic multi-timeframe data (up/down/mixed/low-ADX cases, H1 flip thresholds fed back through the EMAs) and run on real VPS candles.
- **[Yesterday Preset + Point Labels]** Added an "เมื่อวาน" range preset (hourly axis, like today) and per-point P&L labels on the cumulative chart. Labels use greedy collision avoidance (largest |P&L| first) and a font scaled to the card width so they survive the SVG being shrunk on mobile; the Drawdown chart and the mobile date axis are unchanged.
