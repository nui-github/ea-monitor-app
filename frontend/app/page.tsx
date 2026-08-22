"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  LayoutDashboard,
  Wallet,
  CalendarDays,
  TrendingUp,
  TrendingDown,
  ListOrdered,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Wifi,
  WifiOff,
  Scale,
  Landmark,
  Gauge,
  Bot,
  OctagonX,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Repeat,
  Target,
  Waves,
  BarChart3,
} from "lucide-react";

const ACCOUNT_IDS = [1, 2];

function apiFetch(url: string, init?: RequestInit) {
  return fetch(url, init);
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
        <h1 className="text-xl font-semibold shrink-0 flex items-center gap-2">
          <Activity className="h-5 w-5 text-emerald-400" />
          EA Monitor
        </h1>
        <nav className="flex gap-1">
          {(["overview", "positions", "calendar"] as Tab[]).map((t) => {
            const Icon = t === "overview" ? LayoutDashboard : t === "positions" ? Wallet : CalendarDays;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-colors ${
                  tab === t
                    ? "bg-zinc-700 text-white"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Icon className="h-4 w-4" />
                {t === "overview" ? "ภาพรวม" : t === "positions" ? "พอร์ต" : "Calendar"}
              </button>
            );
          })}
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
        const res = await apiFetch(`/api/overview`);
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
        <StatCard label="พอร์ต" value={String(ACCOUNT_IDS.length)} sub="พอร์ตเชื่อมต่อ" icon={Wallet} />
        <StatCard label="ออเดอร์เปิด" value={String(data?.total_open_positions ?? "—")} sub="รวมทุกบัญชี" icon={ListOrdered} />
        <StatCard label="Balance รวม" value={data ? `${data.total_balance.toFixed(2)}` : "—"} sub="USD" icon={DollarSign} />
        <StatCard
          label="กำไร/ขาดทุนลอยตัว"
          value={data ? `${profit >= 0 ? "+" : ""}${profit.toFixed(2)}` : "—"}
          sub="USD"
          accent={data ? (profit >= 0 ? "green" : "red") : undefined}
          icon={profit >= 0 ? TrendingUp : TrendingDown}
        />
      </div>

      <PerformanceCharts />

      <div className="space-y-3">
        {data?.accounts.map((acc) => (
          <div key={acc.account_id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            {acc.error ? (
              <div className="flex items-center gap-2 text-zinc-500">
                <WifiOff className="h-4 w-4" />
                <span>Account {acc.account_id} — Offline</span>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Wifi className="h-3.5 w-3.5 text-emerald-500" />
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

function useMonthlyHistory() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const today = now.getDate();
  const [history, setHistory] = useState<DayHistory[]>([]);
  const [accountId, setAccountId] = useState<number | "all">("all");
  const [accountLabels, setAccountLabels] = useState<Record<number, string>>({});

  useEffect(() => {
    Promise.all(
      ACCOUNT_IDS.map((id) =>
        apiFetch(`/api/account/${id}`)
          .then((r) => r.json())
          .then((d) => [id, d.login ? `#${d.login}` : `Account ${id}`] as [number, string])
          .catch(() => [id, `Account ${id}`] as [number, string])
      )
    ).then((entries) => setAccountLabels(Object.fromEntries(entries)));
  }, []);

  useEffect(() => {
    const ids = accountId === "all" ? ACCOUNT_IDS : [accountId];
    Promise.all(
      ids.map((id) =>
        apiFetch(`/api/history/${id}?year=${year}&month=${month}`)
          .then((r) => r.json())
          .catch(() => [] as DayHistory[])
      )
    ).then((results) => {
      const merged: Record<string, DayHistory> = {};
      results.flat().forEach((h: DayHistory) => {
        if (merged[h.date]) merged[h.date].profit += h.profit;
        else merged[h.date] = { ...h };
      });
      setHistory(Object.values(merged));
    });
  }, [year, month, accountId]);

  const byDay: Record<string, number> = {};
  history.forEach((h) => (byDay[h.date] = h.profit));

  const days = Array.from({ length: today }, (_, i) => i + 1);
  const daily = days.map((d) => {
    const key = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    return byDay[key] ?? 0;
  });

  let running = 0;
  const cumulative = daily.map((v) => (running += v));
  const hasData = history.length > 0;

  return { year, month, days, daily, cumulative, hasData, accountId, setAccountId, accountLabels };
}

interface SymbolStat {
  symbol: string;
  profit: number;
  trades: number;
}

function useSymbolStats(accountId: number | "all", year: number, month: number) {
  const [stats, setStats] = useState<SymbolStat[]>([]);

  useEffect(() => {
    const ids = accountId === "all" ? ACCOUNT_IDS : [accountId];
    Promise.all(
      ids.map((id) =>
        apiFetch(`/api/symbol_stats/${id}?year=${year}&month=${month}`)
          .then((r) => (r.ok ? r.json() : []))
          .catch(() => [] as SymbolStat[])
      )
    ).then((results) => {
      const merged: Record<string, SymbolStat> = {};
      results.flat().forEach((s: SymbolStat) => {
        if (merged[s.symbol]) {
          merged[s.symbol].profit += s.profit;
          merged[s.symbol].trades += s.trades;
        } else {
          merged[s.symbol] = { ...s };
        }
      });
      setStats(Object.values(merged).sort((a, b) => b.profit - a.profit));
    });
  }, [accountId, year, month]);

  return stats;
}

function chartScales(cumulative: number[], days: number[]) {
  const W = 700, H = 220;
  const padL = 44, padR = 12, padT = 16, padB = 24;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const cumMin = Math.min(0, ...cumulative);
  const cumMax = Math.max(0, ...cumulative);
  const range = cumMax - cumMin || 1;
  const yFor = (v: number) => padT + plotH - ((v - cumMin) / range) * plotH;
  const xFor = (i: number) => padL + (days.length === 1 ? plotW / 2 : (plotW * i) / (days.length - 1));

  const ticks = [cumMax, (cumMax + cumMin) / 2, cumMin].filter((v, i, arr) => arr.indexOf(v) === i);
  const dayStep = Math.ceil(days.length / 6);
  const xLabels = days.filter((d, i) => i % dayStep === 0 || i === days.length - 1);

  return { W, H, padL, padR, yFor, xFor, ticks, xLabels };
}

function PerformanceCharts() {
  const m = useMonthlyHistory();
  const symbolStats = useSymbolStats(m.accountId, m.year, m.month);
  return (
    <div className="space-y-4">
      <PnLChart {...m} />
      <DrawdownChart {...m} />
      <SymbolBreakdown stats={symbolStats} />
    </div>
  );
}

function SymbolBreakdown({ stats }: { stats: SymbolStat[] }) {
  const maxAbs = Math.max(1, ...stats.map((s) => Math.abs(s.profit)));

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
      <div className="text-sm font-medium flex items-center gap-1.5 mb-3">
        <BarChart3 className="h-4 w-4" />
        กำไร/ขาดทุนแยกตาม Symbol เดือนนี้
      </div>
      {stats.length === 0 ? (
        <div className="text-zinc-500 text-sm py-6 text-center">ไม่มีข้อมูล</div>
      ) : (
        <div className="space-y-2.5">
          {stats.map((s) => (
            <div key={s.symbol} className="flex items-center gap-3">
              <div className="w-24 text-sm font-medium text-zinc-300 shrink-0">{s.symbol}</div>
              <div className="flex-1 h-5 bg-zinc-800 rounded overflow-hidden">
                <div
                  className={`h-full ${s.profit >= 0 ? "bg-emerald-500/70" : "bg-red-500/70"}`}
                  style={{ width: `${(Math.abs(s.profit) / maxAbs) * 100}%` }}
                />
              </div>
              <div className={`w-24 text-right text-sm font-semibold shrink-0 ${s.profit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {s.profit >= 0 ? "+" : ""}{s.profit.toFixed(2)}
              </div>
              <div className="w-16 text-right text-xs text-zinc-500 shrink-0">{s.trades} trades</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PnLChart({
  days,
  cumulative,
  daily,
  hasData,
  accountId,
  setAccountId,
  accountLabels,
}: ReturnType<typeof useMonthlyHistory>) {
  const monthTotal = cumulative[cumulative.length - 1] ?? 0;
  const { W, H, padL, padR, yFor, xFor, ticks, xLabels } = chartScales(cumulative, days);
  const zeroY = yFor(0);

  const linePoints = cumulative.map((v, i) => [xFor(i), yFor(v)] as const);
  const linePath = linePoints.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");
  const areaPath =
    `M${linePoints[0][0]},${zeroY} ` +
    linePoints.map(([x, y]) => `L${x},${y}`).join(" ") +
    ` L${linePoints[linePoints.length - 1][0]},${zeroY} Z`;

  const gradId = `pnlGrad-${accountId}`;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium flex items-center gap-1.5">
            {monthTotal >= 0 ? (
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-400" />
            )}
            กำไรสะสม เดือนนี้
          </div>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value === "all" ? "all" : Number(e.target.value))}
            className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs"
          >
            <option value="all">ทุกพอร์ต</option>
            {ACCOUNT_IDS.map((id) => (
              <option key={id} value={id}>{accountLabels[id] ?? `Account ${id}`}</option>
            ))}
          </select>
        </div>
        <div className={`text-lg font-semibold ${monthTotal >= 0 ? "text-emerald-400" : "text-red-400"}`}>
          {monthTotal >= 0 ? "+" : ""}{monthTotal.toFixed(2)} USD
        </div>
      </div>
      {!hasData ? (
        <div className="h-[220px] flex items-center justify-center text-zinc-500 text-sm">กำลังโหลด...</div>
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[220px]">
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={monthTotal >= 0 ? "#34d399" : "#f87171"} stopOpacity={0.35} />
              <stop offset="100%" stopColor={monthTotal >= 0 ? "#34d399" : "#f87171"} stopOpacity={0} />
            </linearGradient>
          </defs>

          {ticks.map((t, i) => (
            <g key={i}>
              <line x1={padL} y1={yFor(t)} x2={W - padR} y2={yFor(t)} stroke="#27272a" strokeWidth={1} />
              <text x={padL - 8} y={yFor(t)} dy={3} textAnchor="end" fontSize={10} fill="#71717a">
                {t.toFixed(0)}
              </text>
            </g>
          ))}

          {xLabels.map((d) => (
            <text key={d} x={xFor(days.indexOf(d))} y={H - 6} textAnchor="middle" fontSize={10} fill="#71717a">
              {d}
            </text>
          ))}

          <path d={areaPath} fill={`url(#${gradId})`} />
          <path d={linePath} fill="none" stroke={monthTotal >= 0 ? "#34d399" : "#f87171"} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

          {linePoints.map(([x, y], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r={2.5} fill={monthTotal >= 0 ? "#34d399" : "#f87171"} />
              <circle cx={x} cy={y} r={8} fill="transparent">
                <title>{`วันที่ ${days[i]}: สะสม ${cumulative[i] >= 0 ? "+" : ""}${cumulative[i].toFixed(2)} USD (วันนี้ ${daily[i] >= 0 ? "+" : ""}${daily[i].toFixed(2)})`}</title>
              </circle>
            </g>
          ))}
        </svg>
      )}
    </div>
  );
}

function DrawdownChart({
  days,
  cumulative,
  hasData,
  accountId,
  accountLabels,
}: ReturnType<typeof useMonthlyHistory>) {
  let peak = 0;
  const drawdown = cumulative.map((v) => {
    peak = Math.max(peak, v);
    return v - peak;
  });
  const maxDrawdown = Math.min(0, ...drawdown);

  const W = 700, H = 140;
  const padL = 44, padR = 12, padT = 12, padB = 24;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const ddRange = Math.max(1, -maxDrawdown);
  const yFor = (v: number) => padT + (-v / ddRange) * plotH;
  const xFor = (i: number) => padL + (days.length === 1 ? plotW / 2 : (plotW * i) / (days.length - 1));
  const zeroY = yFor(0);

  const dayStep = Math.ceil(days.length / 6);
  const xLabels = days.filter((d, i) => i % dayStep === 0 || i === days.length - 1);
  const ticks = [0, maxDrawdown / 2, maxDrawdown].filter((v, i, arr) => arr.indexOf(v) === i);

  const linePoints = drawdown.map((v, i) => [xFor(i), yFor(v)] as const);
  const linePath = linePoints.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");
  const areaPath =
    `M${linePoints[0][0]},${zeroY} ` +
    linePoints.map(([x, y]) => `L${x},${y}`).join(" ") +
    ` L${linePoints[linePoints.length - 1][0]},${zeroY} Z`;

  const gradId = `ddGrad-${accountId}`;
  const currentLabel = accountId === "all" ? "ทุกพอร์ต" : accountLabels[accountId] ?? `Account ${accountId}`;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
        <div className="text-sm font-medium flex items-center gap-1.5">
          <Waves className="h-4 w-4 text-red-400" />
          Drawdown เดือนนี้
          <span className="text-xs text-zinc-500 font-normal">({currentLabel})</span>
        </div>
        <div className="text-lg font-semibold text-red-400">
          {maxDrawdown.toFixed(2)} USD
        </div>
      </div>
      {!hasData ? (
        <div className="h-[140px] flex items-center justify-center text-zinc-500 text-sm">กำลังโหลด...</div>
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[140px]">
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f87171" stopOpacity={0} />
              <stop offset="100%" stopColor="#f87171" stopOpacity={0.45} />
            </linearGradient>
          </defs>

          {ticks.map((t, i) => (
            <g key={i}>
              <line x1={padL} y1={yFor(t)} x2={W - padR} y2={yFor(t)} stroke="#27272a" strokeWidth={1} />
              <text x={padL - 8} y={yFor(t)} dy={3} textAnchor="end" fontSize={10} fill="#71717a">
                {t.toFixed(0)}
              </text>
            </g>
          ))}

          {xLabels.map((d) => (
            <text key={d} x={xFor(days.indexOf(d))} y={H - 6} textAnchor="middle" fontSize={10} fill="#71717a">
              {d}
            </text>
          ))}

          <path d={areaPath} fill={`url(#${gradId})`} />
          <path d={linePath} fill="none" stroke="#f87171" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

          {linePoints.map(([x, y], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r={2} fill="#f87171" />
              <circle cx={x} cy={y} r={8} fill="transparent">
                <title>{`วันที่ ${days[i]}: drawdown ${drawdown[i].toFixed(2)} USD`}</title>
              </circle>
            </g>
          ))}
        </svg>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, accent, icon: Icon }: { label: string; value: string; sub: string; accent?: "green" | "red"; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
      <div className="flex items-center gap-1.5 text-xs text-zinc-400">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </div>
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
  const [accountId, setAccountId] = useState<number | "all">("all");
  const [history, setHistory] = useState<DayHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [accountLabels, setAccountLabels] = useState<Record<number, string>>({});

  useEffect(() => {
    Promise.all(
      ACCOUNT_IDS.map((id) =>
        apiFetch(`/api/account/${id}`)
          .then((r) => r.json())
          .then((d) => [id, d.login ? `#${d.login}` : `Account ${id}`] as [number, string])
          .catch(() => [id, `Account ${id}`] as [number, string])
      )
    ).then((entries) => setAccountLabels(Object.fromEntries(entries)));
  }, []);

  useEffect(() => {
    setLoading(true);
    const ids = accountId === "all" ? ACCOUNT_IDS : [accountId];
    Promise.all(
      ids.map((id) =>
        apiFetch(`/api/history/${id}?year=${year}&month=${month}`)
          .then((r) => r.json())
          .catch(() => [] as DayHistory[])
      )
    ).then((results) => {
      const merged: Record<string, DayHistory> = {};
      results.flat().forEach((h: DayHistory) => {
        if (merged[h.date]) {
          merged[h.date].profit += h.profit;
          merged[h.date].trades += h.trades;
        } else {
          merged[h.date] = { ...h };
        }
      });
      setHistory(Object.values(merged));
    }).finally(() => setLoading(false));
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
  const goToday = () => { setYear(now.getFullYear()); setMonth(now.getMonth() + 1); };

  const monthName = new Date(year, month - 1).toLocaleString("th-TH", { month: "long", year: "numeric" });
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value === "all" ? "all" : Number(e.target.value))}
            className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm"
          >
            <option value="all">ทุกพอร์ต</option>
            {ACCOUNT_IDS.map((id) => (
              <option key={id} value={id}>{accountLabels[id] ?? `Account ${id}`}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="p-1.5 rounded hover:bg-zinc-800"><ChevronLeft className="h-4 w-4" /></button>
          <span className="text-sm font-medium min-w-36 text-center">{monthName}</span>
          <button onClick={nextMonth} className="p-1.5 rounded hover:bg-zinc-800"><ChevronRight className="h-4 w-4" /></button>
          {!isCurrentMonth && (
            <button onClick={goToday} className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs bg-zinc-700 hover:bg-zinc-600 text-zinc-200">
              <RotateCcw className="h-3.5 w-3.5" /> วันนี้
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            {monthProfit >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            กำไรเดือนนี้
          </div>
          <div className={`text-xl font-semibold mt-1 ${monthProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {monthProfit >= 0 ? "+" : ""}{monthProfit.toFixed(2)} USD
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400"><Repeat className="h-3.5 w-3.5" /> จำนวน Trades</div>
          <div className="text-xl font-semibold mt-1">{tradeCount}</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400"><Target className="h-3.5 w-3.5" /> วันกำไร / วันขาดทุน</div>
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
          apiFetch(`/api/account/${accountId}`),
          apiFetch(`/api/positions/${accountId}`),
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
      await apiFetch(`/api/ea_toggle/${accountId}`, {
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
      await apiFetch(`/api/close_all/${accountId}`, { method: "POST" });
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
          {online ? <Wifi className="h-4 w-4 text-emerald-500" /> : <WifiOff className="h-4 w-4 text-red-500" />}
          <span className="text-sm text-zinc-400">{online ? "Connected" : "Offline"}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Balance" value={account?.balance} currency={account?.currency} icon={Wallet} />
        <SummaryCard label="Equity" value={account?.equity} currency={account?.currency} icon={Scale} />
        <SummaryCard label="Free Margin" value={account?.free_margin} currency={account?.currency} icon={Landmark} />
        <SummaryCard label="Margin Level" value={account?.margin_level} suffix="%" icon={Gauge} />
      </div>

      <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
        <h3 className="px-4 py-3 text-sm font-medium text-zinc-300 border-b border-zinc-800 flex items-center gap-2">
          <ListOrdered className="h-4 w-4" /> Open Positions
        </h3>
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
                    <td className={`px-4 py-2 font-medium flex items-center gap-1 ${p.type === "BUY" ? "text-emerald-400" : "text-red-400"}`}>
                      {p.type === "BUY" ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                      {p.type}
                    </td>
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
          <span className="text-sm font-medium text-zinc-300 flex items-center gap-1.5">
            <Bot className="h-4 w-4" /> EA Auto-Trading
          </span>
          <button onClick={handleEaToggle} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${eaEnabled ? "bg-emerald-500" : "bg-zinc-700"}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${eaEnabled ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </div>
        <button onClick={() => setShowConfirm(true)} className="flex items-center gap-1.5 rounded-md bg-red-600 hover:bg-red-700 px-4 py-2 text-sm font-semibold text-white transition-colors">
          <OctagonX className="h-4 w-4" /> Close All XAUUSD
        </button>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              Confirm Panic Close — {label}
            </h3>
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

function SummaryCard({ label, value, currency, suffix, icon: Icon }: { label: string; value?: number; currency?: string; suffix?: string; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
      <p className="text-sm text-zinc-400 flex items-center gap-1.5">
        {Icon && <Icon className="h-4 w-4" />}
        {label}
      </p>
      <p className="text-2xl font-semibold mt-1">
        {value !== undefined
          ? `${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${suffix ?? (currency ? ` ${currency}` : "")}`
          : "—"}
      </p>
    </div>
  );
}
