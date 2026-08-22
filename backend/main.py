from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime, timezone

try:
    import MetaTrader5 as mt5
    MOCK_MODE = False
except ImportError:
    mt5 = None
    MOCK_MODE = True

SYMBOL = "XAUUSDm"

# Two MT5 terminal installations on the VPS, each logged into its own account.
ACCOUNT_PATHS = {
    1: r"C:\Program Files\MetaTrader 5\terminal64.exe",
    2: r"C:\Program Files\MetaTrader 5 - Port2\terminal64.exe",
}

app = FastAPI(title="MT5 EA Monitor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory state for mock mode
_mock_ea_enabled = {1: True, 2: True}
_mock_positions = {
    1: [
        {
            "ticket": 100001,
            "type": "BUY",
            "volume": 0.1,
            "price_open": 2345.50,
            "price_current": 2351.20,
            "sl": 2330.00,
            "tp": 2380.00,
            "profit": 57.00,
        },
        {
            "ticket": 100002,
            "type": "SELL",
            "volume": 0.2,
            "price_open": 2360.00,
            "price_current": 2351.20,
            "sl": 2375.00,
            "tp": 2330.00,
            "profit": 176.00,
        },
    ],
    2: [
        {
            "ticket": 200001,
            "type": "BUY",
            "volume": 0.05,
            "price_open": 2348.00,
            "price_current": 2351.20,
            "sl": 2335.00,
            "tp": 2370.00,
            "profit": 16.00,
        },
    ],
}

_active_account = None


def validate_account(account_id: int):
    if account_id not in ACCOUNT_PATHS:
        raise HTTPException(status_code=404, detail=f"Unknown account id {account_id}")


def ensure_connection(account_id: int):
    global _active_account
    validate_account(account_id)
    if MOCK_MODE:
        return

    if _active_account != account_id:
        mt5.shutdown()
        if not mt5.initialize(path=ACCOUNT_PATHS[account_id]):
            _active_account = None
            raise HTTPException(status_code=503, detail=f"MT5 terminal {account_id} not available")
        _active_account = account_id


@app.on_event("shutdown")
def shutdown():
    if not MOCK_MODE:
        mt5.shutdown()


@app.get("/api/account/{account_id}")
def get_account(account_id: int):
    ensure_connection(account_id)

    if MOCK_MODE:
        return {
            "balance": 10000.00 if account_id == 1 else 5000.00,
            "equity": 10233.00 if account_id == 1 else 5016.00,
            "margin": 470.00 if account_id == 1 else 80.00,
            "free_margin": 9763.00 if account_id == 1 else 4936.00,
            "margin_level": 2177.23 if account_id == 1 else 6270.00,
            "currency": "USD",
        }

    info = mt5.account_info()
    if info is None:
        raise HTTPException(status_code=503, detail="Unable to fetch account info")
    trade_modes = {0: "Demo", 1: "Contest", 2: "Real"}
    return {
        "balance": info.balance,
        "equity": info.equity,
        "margin": info.margin,
        "free_margin": info.margin_free,
        "margin_level": info.margin_level,
        "currency": info.currency,
        "login": info.login,
        "name": info.name,
        "company": info.company,
        "server": info.server,
        "trade_mode": trade_modes.get(info.trade_mode, "Unknown"),
    }


@app.get("/api/debug/positions/{account_id}")
def debug_positions(account_id: int):
    ensure_connection(account_id)
    if MOCK_MODE:
        return []
    positions = mt5.positions_get()
    if positions is None:
        return []
    return [{"ticket": p.ticket, "symbol": p.symbol, "type": p.type} for p in positions]


@app.get("/api/positions/{account_id}")
def get_positions(account_id: int):
    ensure_connection(account_id)

    if MOCK_MODE:
        return _mock_positions[account_id]

    positions = mt5.positions_get()
    if positions is None:
        return []
    result = []
    for pos in positions:
        result.append({
            "ticket": pos.ticket,
            "symbol": pos.symbol,
            "type": "BUY" if pos.type == mt5.ORDER_TYPE_BUY else "SELL",
            "volume": pos.volume,
            "price_open": pos.price_open,
            "price_current": pos.price_current,
            "sl": pos.sl,
            "tp": pos.tp,
            "profit": pos.profit,
        })
    return result


@app.post("/api/close_all/{account_id}")
def close_all(account_id: int):
    ensure_connection(account_id)

    if MOCK_MODE:
        closed = len(_mock_positions[account_id])
        _mock_positions[account_id].clear()
        return {"closed": closed, "errors": []}

    positions = mt5.positions_get(symbol=SYMBOL)
    if positions is None or len(positions) == 0:
        return {"closed": 0, "errors": []}

    closed = 0
    errors = []
    for pos in positions:
        order_type = mt5.ORDER_TYPE_SELL if pos.type == mt5.ORDER_TYPE_BUY else mt5.ORDER_TYPE_BUY
        tick = mt5.symbol_info_tick(SYMBOL)
        price = tick.bid if order_type == mt5.ORDER_TYPE_SELL else tick.ask

        request = {
            "action": mt5.TRADE_ACTION_DEAL,
            "symbol": SYMBOL,
            "volume": pos.volume,
            "type": order_type,
            "position": pos.ticket,
            "price": price,
            "deviation": 20,
            "magic": 123456,
            "comment": "panic close",
            "type_time": mt5.ORDER_TIME_GTC,
            "type_filling": mt5.ORDER_FILLING_IOC,
        }
        result = mt5.order_send(request)
        if result.retcode != mt5.TRADE_RETCODE_DONE:
            errors.append({"ticket": pos.ticket, "retcode": result.retcode})
        else:
            closed += 1

    return {"closed": closed, "errors": errors}


class EAToggleRequest(BaseModel):
    enabled: bool


@app.post("/api/ea_toggle/{account_id}")
def ea_toggle(account_id: int, req: EAToggleRequest):
    ensure_connection(account_id)

    if MOCK_MODE:
        _mock_ea_enabled[account_id] = req.enabled
        return {
            "requested": req.enabled,
            "trade_allowed": _mock_ea_enabled[account_id],
            "note": "Mock mode (MetaTrader5 package unavailable on this OS).",
        }

    terminal = mt5.terminal_info()
    if terminal is None:
        raise HTTPException(status_code=503, detail="Unable to fetch terminal info")

    return {
        "requested": req.enabled,
        "trade_allowed": terminal.trade_allowed,
        "note": "MT5 Python API cannot toggle AlgoTrading directly; enable it in the terminal settings.",
    }


@app.get("/api/overview")
def get_overview():
    accounts = []
    total_balance = 0.0
    total_equity = 0.0
    total_profit = 0.0
    total_positions = 0

    for account_id in ACCOUNT_PATHS:
        try:
            ensure_connection(account_id)
            if MOCK_MODE:
                continue
            info = mt5.account_info()
            positions = mt5.positions_get() or []
            profit = sum(p.profit for p in positions)
            trade_modes = {0: "Demo", 1: "Contest", 2: "Real"}
            accounts.append({
                "account_id": account_id,
                "login": info.login,
                "name": info.name,
                "company": info.company,
                "server": info.server,
                "trade_mode": trade_modes.get(info.trade_mode, "Unknown"),
                "currency": info.currency,
                "balance": info.balance,
                "equity": info.equity,
                "free_margin": info.margin_free,
                "margin_level": info.margin_level,
                "open_positions": len(positions),
                "floating_profit": profit,
            })
            total_balance += info.balance
            total_equity += info.equity
            total_profit += profit
            total_positions += len(positions)
        except Exception:
            accounts.append({"account_id": account_id, "error": "offline"})

    return {
        "total_balance": total_balance,
        "total_equity": total_equity,
        "total_floating_profit": total_profit,
        "total_open_positions": total_positions,
        "accounts": accounts,
    }


@app.get("/api/history/{account_id}")
def get_history(
    account_id: int,
    year: int = Query(...),
    month: int = Query(...),
):
    ensure_connection(account_id)

    if MOCK_MODE:
        return []

    date_from = datetime(year, month, 1, tzinfo=timezone.utc)
    if month == 12:
        date_to = datetime(year + 1, 1, 1, tzinfo=timezone.utc)
    else:
        date_to = datetime(year, month + 1, 1, tzinfo=timezone.utc)

    deals = mt5.history_deals_get(date_from, date_to)
    if deals is None:
        return []

    # Group closing deals by date
    daily: dict = {}
    for d in deals:
        # entry 1 = DEAL_ENTRY_OUT (closing), skip balance/deposit deals (type != 0,1)
        if d.entry != 1:
            continue
        dt = datetime.fromtimestamp(d.time, tz=timezone.utc)
        day_key = dt.strftime("%Y-%m-%d")
        if day_key not in daily:
            daily[day_key] = {"date": day_key, "profit": 0.0, "trades": 0}
        daily[day_key]["profit"] += d.profit + d.commission + d.swap
        daily[day_key]["trades"] += 1

    return list(daily.values())


@app.get("/api/symbol_stats/{account_id}")
def get_symbol_stats(
    account_id: int,
    year: int = Query(...),
    month: int = Query(...),
):
    ensure_connection(account_id)

    if MOCK_MODE:
        return []

    date_from = datetime(year, month, 1, tzinfo=timezone.utc)
    if month == 12:
        date_to = datetime(year + 1, 1, 1, tzinfo=timezone.utc)
    else:
        date_to = datetime(year, month + 1, 1, tzinfo=timezone.utc)

    deals = mt5.history_deals_get(date_from, date_to)
    if deals is None:
        return []

    stats: dict = {}
    for d in deals:
        if d.entry != 1:
            continue
        if d.symbol not in stats:
            stats[d.symbol] = {"symbol": d.symbol, "profit": 0.0, "trades": 0}
        stats[d.symbol]["profit"] += d.profit + d.commission + d.swap
        stats[d.symbol]["trades"] += 1

    return list(stats.values())


@app.get("/api/balance_ops/{account_id}")
def get_balance_ops(
    account_id: int,
    year: int = Query(...),
    month: int = Query(...),
):
    ensure_connection(account_id)

    if MOCK_MODE:
        return []

    date_from = datetime(year, month, 1, tzinfo=timezone.utc)
    if month == 12:
        date_to = datetime(year + 1, 1, 1, tzinfo=timezone.utc)
    else:
        date_to = datetime(year, month + 1, 1, tzinfo=timezone.utc)

    deals = mt5.history_deals_get(date_from, date_to)
    if deals is None:
        return []

    result = []
    for d in deals:
        # DEAL_TYPE_BALANCE = 2: manual deposit/withdrawal (not a trade)
        if d.type != 2:
            continue
        result.append({
            "ticket": d.ticket,
            "time": datetime.fromtimestamp(d.time, tz=timezone.utc).strftime("%Y-%m-%d %H:%M"),
            "amount": d.profit,
            "comment": d.comment,
        })

    result.sort(key=lambda x: x["time"])
    return result


@app.get("/api/balance_summary/{account_id}")
def get_balance_summary(account_id: int):
    ensure_connection(account_id)

    if MOCK_MODE:
        return {"deposits": 0.0, "withdrawals": 0.0, "net": 0.0}

    date_from = datetime(2000, 1, 1, tzinfo=timezone.utc)
    date_to = datetime.now(timezone.utc)

    deals = mt5.history_deals_get(date_from, date_to)
    if deals is None:
        return {"deposits": 0.0, "withdrawals": 0.0, "net": 0.0}

    deposits = 0.0
    withdrawals = 0.0
    for d in deals:
        if d.type != 2:
            continue
        if d.profit >= 0:
            deposits += d.profit
        else:
            withdrawals += d.profit

    return {"deposits": deposits, "withdrawals": withdrawals, "net": deposits + withdrawals}
