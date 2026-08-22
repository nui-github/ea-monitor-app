"use client";

import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://154.16.66.54:8000";
const ACCOUNT_IDS = [1, 2];

const CF_HEADERS = { "bypass-tunnel-reminder": "1" };
function apiFetch(url: string, init?: RequestInit) {
  return fetch(url, { ...init, headers: { ...CF_HEADERS, ...(init?.headers ?? {}) } });
}

interface Account {
  balance: number;
  equity: number;
  margin: number;
  free_margin: number;
  margin_level: number;
  currency: string;
  login: number;
  name: string;
  company: string;
  server: string;
  trade_mode: string;
}

interface Position {
  ticket: number;
  symbol: string;
  type: string;
  volume: number;
  price_open: number;
  price_current: number;
  sl: number;
  tp: number;
  profit: number;
}

interface OverviewAccount {
  account_id: number;
  login?: number;
  name?: string;
  company?: string;
  server?: string;
  trade_mode?: string;
  currency?: string;
  balance?: number;
  equity?: number;
  free_margin?: number;
  margin_level?: number;
  open_positions?: number;
  floating_profit?: number;
  error?: string;
}

interface Overview {
  total_balance: number;
  total_equity: number;
  total_floating_profit: number;
  total_open_positions: number;
  accounts: OverviewAccount[];
}

interface DayHistory {
  date: string;
  profit: number;
  trades: number;
}

type Tab = "overview" | "positions" | "calendar";

export default function Home() {
  const [tab, setTab] = useState<Tab>("overview");

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      <header className="flex items-center gap-6 px-6 py-4 border-b border-zinc-800">
        <h1 className="text-xl font-semibold shrink-0">EA Monitor</h1>
        <nav className="flex gap-1">
          {(["overview", "positions", "calendar"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded text-sm capitalize transition-colors ${
                tab === t
                  ? "bg-zinc-700 text-white"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {t === "overview" ? "ภาพรวม" : t === "positions" ? "พอร์ต" : "Calendar"}
            </button>
          ))}
        </nav>
      </header>

      <main className="p-6 max-w-5xl mx-auto">
        {tab === "overview" && <OverviewTab />}
        {tab === "positions" && (
          <div className="space-y-8">
            {ACCOUNT_IDS.map((id) => (
              <AccountPanel key={id} accountId={id} label={`Account ${id}`} />
            ))}
          </div>
        )}
        {tab === "calendar" && <CalendarTab />}
      </main>
    </div>
  );
}

// ─── Overview Tab ────────────────────────────────────────────────────────────

function OverviewTab() {
  const [data, setData] = useState<Overview | null>(null);

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await apiFetch(`${API_BASE}/api/overview`);
        if (res.ok) setData(await res.json());
      } catch {}
    };
    fetch_();
    const iv = setInterval(fetch_, 3000);
    return () => clearInterval(iv);
  }, []);

  const profit = data?.total_floating_profit ?? 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="พอร์ต" value={String(ACCOUNT_IDS.length)} sub="พอร์ตเชื่อมต่อ" />
        <StatCard label="ออเดอร์เปิด" value={String(data?.total_open_positions ?? "—")} sub="รวมทุกบัญชี" />
        <StatCard label="Balance รวม" value={data ? `${data.total_balance.toFixed(2)}` : "—"} sub="USD" />
        <StatCard label="กำไร/ขาดทุนลอยตัว" value={data ? `${profit >= 0 ? "+" : ""}${profit.toFixed(2)}` : "—"} sub="USD" accent={data ? (profit >= 0 ? "green" : "red") : undefined} />
      </div>

      <div className="space-y-3">
        {data?.accounts.map((acc) => (
          <div key={acc.account_id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            {acc.error ? (
              <div className="flex items-center gap-2 text-zinc-500">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                <span>Account {acc.account_id} — Offline</span>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="font-medium">{acc.company} · #{acc.login}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${acc.trade_mode === "Demo" ? "bg-yellow-900 text-yellow-300" : "bg-emerald-900 text-emerald-300"}`}>{acc.trade_mode}</span>
                  </div>
                  <div className="text-xs text-zinc-400 mt-0.5">{acc.name} · {acc.server}</div>
                </div>
                <div className="flex gap-6 text-sm text-right">
                  <div>
                    <div className="text-zinc-400 text-xs">Balance</div>
                    <div className="font-medium">{acc.balance?.toFixed(2)} {acc.currency}</div>
                  </div>
                  <div>
                    <div className="text-zinc-400 text-xs">Equity</div>
                    <div className="font-medium">{acc.equity?.toFixed(2)} {acc.currency}</div>
                  </div>
                  <div>
                    <div className="text-zinc-400 text-xs">Floating P/L</div>
                    <div className={`font-medium ${(acc.floating_profit ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {(acc.floating_profit ?? 0) >= 0 ? "+" : ""}{acc.floating_profit?.toFixed(2)} {acc.currency}
                    </div>
                  </div>
                  <div>
                    <div className="text-zinc-400 text-xs">Positions</div>
                    <div className="font-medium">{acc.open_positions}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: "green" | "red" }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
      <div className="text-xs text-zinc-400">{label}</div>
      <div className={`text-2xl font-semibold mt-1 ${accent === "green" ? "text-emerald-400" : accent === "red" ? "text-red-400" : ""}`}>{value}</div>
      <div className="text-xs text-zinc-500 mt-0.5">{sub}</div>
    </div>
  );
}

// ─── Calendar Tab ─────────────────────────────────────────────────────────────

function CalendarTab() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [accountId, setAccountId] = useState(1);
  const [history, setHistory] = useState<DayHistory[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    apiFetch(`${API_BASE}/api/history/${accountId}?year=${year}&month=${month}`)
      .then((r) => r.json())
      .then((d) => setHistory(d))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, [accountId, year, month]);

  const byDay: Record<string, DayHistory> = {};
  history.forEach((h) => (byDay[h.date] = h));

  const monthProfit = history.reduce((s, h) => s + h.profit, 0);
  const tradeCount = history.reduce((s, h) => s + h.trades, 0);
  const winDays = history.filter((h) => h.profit > 0).length;
  const loseDays = history.filter((h) => h.profit < 0).length;

  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };

  const monthName = new Date(year, month - 1).toLocaleString("th-TH", { month: "long", year: "numeric" });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <select
            value={accountId}
            onChange={(e) => setAccountId(Number(e.target.value))}
            className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm"
          >
            {ACCOUNT_IDS.map((id) => (
              <option key={id} value={id}>Account {id}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="px-2 py-1 rounded hover:bg-zinc-800">‹</button>
          <span className="text-sm font-medium min-w-36 text-center">{monthName}</span>
          <button onClick={nextMonth} className="px-2 py-1 rounded hover:bg-zinc-800">›</button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
          <div className="text-xs text-zinc-400">กำไรเดือนนี้</div>
          <div className={`text-xl font-semibold mt-1 ${monthProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {monthProfit >= 0 ? "+" : ""}{monthProfit.toFixed(2)} USD
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
          <div className="text-xs text-zinc-400">จำนวน Trades</div>
          <div className="text-xl font-semibold mt-1">{tradeCount}</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
          <div className="text-xs text-zinc-400">วันกำไร / วันขาดทุน</div>
          <div className="text-xl font-semibold mt-1">
            <span className="text-emerald-400">{winDays}</span>
            <span className="text-zinc-500"> / </span>
            <span className="text-red-400">{loseDays}</span>
          </div>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        <div className="grid grid-cols-7 border-b border-zinc-800">
          {["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"].map((d) => (
            <div key={d} className="text-center text-xs text-zinc-500 py-2">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`e${i}`} className="min-h-16 border-b border-r border-zinc-800 last:border-r-0" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const data = byDay[dateKey];
            const isToday = dateKey === new Date().toISOString().split("T")[0];
            return (
              <div
                key={day}
                className={`min-h-16 p-1.5 border-b border-r border-zinc-800 last:border-r-0 ${
                  data
                    ? data.profit > 0
                      ? "bg-emerald-950/40"
                      : "bg-red-950/40"
                    : ""
                }`}
              >
                <div className={`text-xs font-medium ${isToday ? "text-emerald-400" : "text-zinc-400"}`}>{day}</div>
                {data && (
                  <div className="mt-1">
                    <div className={`text-xs font-semibold ${data.profit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {data.profit >= 0 ? "+" : ""}{data.profit.toFixed(2)}
                    </div>
                    <div className="text-zinc-500 text-xs">{data.trades} trades</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {loading && <div className="text-center text-zinc-500 text-sm py-2">Loading...</div>}
    </div>
  );
}

// ─── Positions Tab ────────────────────────────────────────────────────────────

function AccountPanel({ accountId, label }: { accountId: number; label: string }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [online, setOnline] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [eaEnabled, setEaEnabled] = useState(true);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [accRes, posRes] = await Promise.all([
          apiFetch(`${API_BASE}/api/account/${accountId}`),
          apiFetch(`${API_BASE}/api/positions/${accountId}`),
        ]);
        if (!accRes.ok || !posRes.ok) throw new Error("bad response");
        setAccount(await accRes.json());
        setPositions(await posRes.json());
        setOnline(true);
      } catch {
        setOnline(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, [accountId]);

  const handleEaToggle = async () => {
    const next = !eaEnabled;
    try {
      await apiFetch(`${API_BASE}/api/ea_toggle/${accountId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: next }),
      });
      setEaEnabled(next);
    } catch {}
  };

  const handleCloseAll = async () => {
    setClosing(true);
    try {
      await apiFetch(`${API_BASE}/api/close_all/${accountId}`, { method: "POST" });
    } catch {}
    finally {
      setClosing(false);
      setShowConfirm(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold">{label}</h2>
          {account && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-zinc-400">
              <span>{account.company}</span>
              <span>#{account.login} — {account.name}</span>
              <span className={`font-medium ${account.trade_mode === "Demo" ? "text-yellow-400" : "text-emerald-400"}`}>{account.trade_mode}</span>
              <span>{account.server}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className={`h-2.5 w-2.5 rounded-full ${online ? "bg-emerald-500" : "bg-red-500"}`} />
          <span className="text-sm text-zinc-400">{online ? "Connected" : "Offline"}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Balance" value={account?.balance} currency={account?.currency} />
        <SummaryCard label="Equity" value={account?.equity} currency={account?.currency} />
        <SummaryCard label="Free Margin" value={account?.free_margin} currency={account?.currency} />
        <SummaryCard label="Margin Level" value={account?.margin_level} suffix="%" />
      </div>

      <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
        <h3 className="px-4 py-3 text-sm font-medium text-zinc-300 border-b border-zinc-800">Open Positions</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-zinc-400 text-left">
                <th className="px-4 py-2">Ticket</th>
                <th className="px-4 py-2">Symbol</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Volume</th>
                <th className="px-4 py-2">Open Price</th>
                <th className="px-4 py-2">Current Price</th>
                <th className="px-4 py-2">SL</th>
                <th className="px-4 py-2">TP</th>
                <th className="px-4 py-2">Profit</th>
              </tr>
            </thead>
            <tbody>
              {positions.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-6 text-center text-zinc-500">No open positions</td></tr>
              ) : (
                positions.map((p) => (
                  <tr key={p.ticket} className="border-t border-zinc-800">
                    <td className="px-4 py-2">{p.ticket}</td>
                    <td className="px-4 py-2 font-medium text-zinc-200">{p.symbol}</td>
                    <td className={`px-4 py-2 font-medium ${p.type === "BUY" ? "text-emerald-400" : "text-red-400"}`}>{p.type}</td>
                    <td className="px-4 py-2">{p.volume}</td>
                    <td className="px-4 py-2">{p.price_open}</td>
                    <td className="px-4 py-2">{p.price_current}</td>
                    <td className="px-4 py-2">{p.sl}</td>
                    <td className="px-4 py-2">{p.tp}</td>
                    <td className={`px-4 py-2 font-medium ${p.profit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {p.profit.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-zinc-300">EA Auto-Trading</span>
          <button onClick={handleEaToggle} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${eaEnabled ? "bg-emerald-500" : "bg-zinc-700"}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${eaEnabled ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </div>
        <button onClick={() => setShowConfirm(true)} className="rounded-md bg-red-600 hover:bg-red-700 px-4 py-2 text-sm font-semibold text-white transition-colors">
          Close All XAUUSD
        </button>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Confirm Panic Close — {label}</h3>
            <p className="text-sm text-zinc-400 mb-6">ปิดทุก position บน {label} ที่ราคาตลาด ไม่สามารถยกเลิกได้</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowConfirm(false)} className="px-4 py-2 text-sm rounded-md bg-zinc-800 hover:bg-zinc-700">Cancel</button>
              <button onClick={handleCloseAll} disabled={closing} className="px-4 py-2 text-sm rounded-md bg-red-600 hover:bg-red-700 disabled:opacity-50 font-semibold">
                {closing ? "Closing..." : "Yes, Close All"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function SummaryCard({ label, value, currency, suffix }: { label: string; value?: number; currency?: string; suffix?: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
      <p className="text-sm text-zinc-400">{label}</p>
      <p className="text-2xl font-semibold mt-1">
        {value !== undefined
          ? `${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${suffix ?? (currency ? ` ${currency}` : "")}`
          : "—"}
      </p>
    </div>
  );
}
