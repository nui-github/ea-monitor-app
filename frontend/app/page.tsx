"use client";

import { useEffect, useRef, useState } from "react";
import { createChart, IChartApi, ISeriesApi, IPriceLine, LineStyle, UTCTimestamp } from "lightweight-charts";
import {
  Activity,
  RotateCw,
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
  OctagonX,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Repeat,
  Target,
  Waves,
  BarChart3,
  GitCompare,
  ArrowDownToLine,
  ArrowUpFromLine,
  Equal,
  History,
  X,
  PiggyBank,
  CandlestickChart,
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

const PULL_THRESHOLD = 70;
const PULL_MAX = 100;
const PULL_SHIFT = 50;

function usePullToRefresh() {
  const [progress, setProgress] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const startYRef = useRef<number | null>(null);
  const pullingRef = useRef(false);

  useEffect(() => {
    if (refreshing) return;

    const onTouchStart = (e: TouchEvent) => {
      if (window.scrollY <= 0) {
        startYRef.current = e.touches[0].clientY;
        pullingRef.current = true;
        setDragging(true);
      } else {
        pullingRef.current = false;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!pullingRef.current || startYRef.current === null) return;
      const diff = e.touches[0].clientY - startYRef.current;
      if (diff <= 0 || window.scrollY > 0) {
        pullingRef.current = false;
        setDragging(false);
        setProgress(0);
        return;
      }
      e.preventDefault();
      const eased = Math.min(diff * 0.5, PULL_MAX);
      setProgress(eased / PULL_THRESHOLD);
    };

    const onTouchEnd = () => {
      if (!pullingRef.current) return;
      pullingRef.current = false;
      setDragging(false);
      setProgress((p) => {
        if (p >= 1) {
          setRefreshing(true);
          setTimeout(() => window.location.reload(), 200);
          return 1;
        }
        return 0;
      });
    };

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd);
    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [refreshing]);

  return { progress: Math.min(progress, 1), refreshing, dragging };
}

function PullToRefreshIndicator({ progress, refreshing }: { progress: number; refreshing: boolean }) {
  if (progress <= 0 && !refreshing) return null;
  const translate = -36 + progress * 56;

  return (
    <div
      className="fixed left-0 right-0 z-50 flex justify-center pointer-events-none"
      style={{ top: "env(safe-area-inset-top)", transform: `translateY(${translate}px)`, opacity: progress }}
    >
      <div className="bg-zinc-800 border border-zinc-700 rounded-full p-2 shadow-lg mt-2">
        <RotateCw
          className={`h-4 w-4 text-emerald-400 ${refreshing ? "animate-spin" : ""}`}
          style={refreshing ? undefined : { transform: `rotate(${progress * 360}deg)` }}
        />
      </div>
    </div>
  );
}

export default function Home() {
  const [tab, setTab] = useState<Tab>("overview");
  const { progress, refreshing, dragging } = usePullToRefresh();
  const shiftPx = (refreshing ? 1 : progress) * PULL_SHIFT;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      <PullToRefreshIndicator progress={progress} refreshing={refreshing} />
      <div style={{ transform: `translateY(${shiftPx}px)`, transition: dragging ? "none" : "transform 0.25s ease" }}>
      <header
        className="sticky top-0 z-30 flex items-center gap-6 px-6 py-4 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur"
        style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}
      >
        <h1 className="text-xl font-semibold shrink-0 flex items-center gap-2">
          <Activity className="h-5 w-5 text-emerald-400" />
          EA Monitor
        </h1>
        <nav className="hidden sm:flex gap-1">
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

      <main className="p-6 pb-24 sm:pb-6 max-w-5xl mx-auto">
        {tab === "overview" && <OverviewTab />}
        {tab === "positions" && (
          <div className="space-y-8">
            <LiveChartCard />
            {ACCOUNT_IDS.map((id) => (
              <AccountPanel key={id} accountId={id} label={`Account ${id}`} />
            ))}
          </div>
        )}
        {tab === "calendar" && <CalendarTab />}
      </main>
      </div>

      <nav
        className="sm:hidden fixed bottom-0 inset-x-0 bg-zinc-900/95 backdrop-blur border-t border-zinc-800 flex items-stretch z-40"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {(["overview", "positions", "calendar"] as Tab[]).map((t) => {
          const Icon = t === "overview" ? LayoutDashboard : t === "positions" ? Wallet : CalendarDays;
          const active = tab === t;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-xs transition-colors ${
                active ? "text-emerald-400" : "text-zinc-500"
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? "text-emerald-400" : "text-zinc-500"}`} />
              {t === "overview" ? "ภาพรวม" : t === "positions" ? "พอร์ต" : "Calendar"}
            </button>
          );
        })}
      </nav>
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

      <DepositWithdrawalPanel />

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
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = isCurrentMonth ? now.getDate() : daysInMonth;
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

  const prevMonth = () => {
    if (month === 1) { setYear((y) => y - 1); setMonth(12); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setYear((y) => y + 1); setMonth(1); }
    else setMonth((m) => m + 1);
  };
  const goToday = () => { setYear(now.getFullYear()); setMonth(now.getMonth() + 1); };
  const monthName = new Date(year, month - 1).toLocaleString("th-TH", { month: "long", year: "numeric" });

  return {
    year, month, days, daily, cumulative, hasData, accountId, setAccountId, accountLabels,
    prevMonth, nextMonth, goToday, isCurrentMonth, monthName,
  };
}

interface AccountStat {
  accountId: number;
  profit: number;
  trades: number;
}

function useAccountComparison(year: number, month: number) {
  const [data, setData] = useState<AccountStat[]>([]);

  useEffect(() => {
    Promise.all(
      ACCOUNT_IDS.map((id) =>
        apiFetch(`/api/history/${id}?year=${year}&month=${month}`)
          .then((r) => (r.ok ? r.json() : []))
          .catch(() => [] as DayHistory[])
          .then((hist: DayHistory[]) => ({
            accountId: id,
            profit: hist.reduce((s, h) => s + h.profit, 0),
            trades: hist.reduce((s, h) => s + h.trades, 0),
          }))
      )
    ).then(setData);
  }, [year, month]);

  return data;
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

interface BalanceOp {
  ticket: number;
  time: string;
  amount: number;
  comment: string;
}

interface BalanceSummary {
  deposits: number;
  withdrawals: number;
  net: number;
}

const EMPTY_SUMMARY: BalanceSummary = { deposits: 0, withdrawals: 0, net: 0 };

function useBalanceData() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [accountId, setAccountId] = useState<number | "all">("all");
  const [accountLabels, setAccountLabels] = useState<Record<number, string>>({});
  const [ops, setOps] = useState<(BalanceOp & { accountId: number })[]>([]);
  const [summaries, setSummaries] = useState<Record<number, BalanceSummary>>({});

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
    Promise.all(
      ACCOUNT_IDS.map((id) =>
        apiFetch(`/api/balance_summary/${id}`)
          .then((r) => (r.ok ? r.json() : EMPTY_SUMMARY))
          .catch(() => EMPTY_SUMMARY)
          .then((s: BalanceSummary) => [id, s] as [number, BalanceSummary])
      )
    ).then((entries) => setSummaries(Object.fromEntries(entries)));
  }, []);

  useEffect(() => {
    const ids = accountId === "all" ? ACCOUNT_IDS : [accountId];
    Promise.all(
      ids.map((id) =>
        apiFetch(`/api/balance_ops/${id}?year=${year}&month=${month}`)
          .then((r) => (r.ok ? r.json() : []))
          .catch(() => [] as BalanceOp[])
          .then((list: BalanceOp[]) => list.map((o) => ({ ...o, accountId: id })))
      )
    ).then((results) => {
      setOps(results.flat().sort((a, b) => a.time.localeCompare(b.time)));
    });
  }, [accountId, year, month]);

  const prevMonth = () => {
    if (month === 1) { setYear((y) => y - 1); setMonth(12); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setYear((y) => y + 1); setMonth(1); }
    else setMonth((m) => m + 1);
  };
  const goToday = () => { setYear(now.getFullYear()); setMonth(now.getMonth() + 1); };
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
  const monthName = new Date(year, month - 1).toLocaleString("th-TH", { month: "long", year: "numeric" });

  return {
    year, month, accountId, setAccountId, accountLabels, ops, summaries,
    prevMonth, nextMonth, goToday, isCurrentMonth, monthName,
  };
}

function DepositWithdrawalPanel() {
  const b = useBalanceData();

  const activeAccounts = b.accountId === "all" ? ACCOUNT_IDS : [b.accountId];
  const lifetimeDeposits = activeAccounts.reduce((s, id) => s + (b.summaries[id]?.deposits ?? 0), 0);
  const lifetimeWithdrawals = activeAccounts.reduce((s, id) => s + (b.summaries[id]?.withdrawals ?? 0), 0);
  const lifetimeNet = lifetimeDeposits + lifetimeWithdrawals;

  const monthDeposits = b.ops.filter((o) => o.amount >= 0).reduce((s, o) => s + o.amount, 0);
  const monthWithdrawals = b.ops.filter((o) => o.amount < 0).reduce((s, o) => s + o.amount, 0);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3.5">
      <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
        <div className="text-sm font-medium flex items-center gap-1.5">
          <Landmark className="h-4 w-4" />
          เงินฝาก-ถอน
        </div>
        <select
          value={b.accountId}
          onChange={(e) => b.setAccountId(e.target.value === "all" ? "all" : Number(e.target.value))}
          className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs"
        >
          <option value="all">ทุกพอร์ต</option>
          {ACCOUNT_IDS.map((id) => (
            <option key={id} value={id}>{b.accountLabels[id] ?? `Account ${id}`}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="bg-zinc-800/50 rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400"><ArrowDownToLine className="h-3.5 w-3.5 text-emerald-400" /> ฝากทั้งหมด</div>
          <div className="text-lg font-semibold mt-1 text-emerald-400">+{lifetimeDeposits.toFixed(2)}</div>
        </div>
        <div className="bg-zinc-800/50 rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400"><ArrowUpFromLine className="h-3.5 w-3.5 text-red-400" /> ถอนทั้งหมด</div>
          <div className="text-lg font-semibold mt-1 text-red-400">{lifetimeWithdrawals.toFixed(2)}</div>
        </div>
        <div className="bg-zinc-800/50 rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400"><Equal className="h-3.5 w-3.5" /> สุทธิ</div>
          <div className={`text-lg font-semibold mt-1 ${lifetimeNet >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {lifetimeNet >= 0 ? "+" : ""}{lifetimeNet.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
        <div className="flex items-center gap-2">
          <button onClick={b.prevMonth} className="p-1.5 rounded hover:bg-zinc-800"><ChevronLeft className="h-4 w-4" /></button>
          <span className="text-sm font-medium min-w-32 text-center">{b.monthName}</span>
          <button onClick={b.nextMonth} className="p-1.5 rounded hover:bg-zinc-800"><ChevronRight className="h-4 w-4" /></button>
          {!b.isCurrentMonth && (
            <button onClick={b.goToday} className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs bg-zinc-700 hover:bg-zinc-600 text-zinc-200">
              <RotateCcw className="h-3.5 w-3.5" /> วันนี้
            </button>
          )}
        </div>
        <div className="text-xs text-zinc-400">
          ฝาก <span className="text-emerald-400 font-medium">+{monthDeposits.toFixed(2)}</span>
          {" · "}
          ถอน <span className="text-red-400 font-medium">{monthWithdrawals.toFixed(2)}</span>
        </div>
      </div>

      {b.ops.length === 0 ? (
        <div className="text-zinc-500 text-sm py-4 text-center">ไม่มีรายการฝาก-ถอนเดือนนี้</div>
      ) : (
        <div className="max-h-56 overflow-y-auto space-y-1">
          {b.ops.map((o) => (
            <div key={`${o.accountId}-${o.ticket}`} className="flex items-center gap-3 text-sm py-1.5 border-b border-zinc-800 last:border-0">
              {o.amount >= 0 ? (
                <ArrowDownToLine className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              ) : (
                <ArrowUpFromLine className="h-3.5 w-3.5 text-red-400 shrink-0" />
              )}
              <span className="text-zinc-400 text-xs w-32 shrink-0">{o.time}</span>
              {b.accountId === "all" && (
                <span className="text-xs text-zinc-500 shrink-0">{b.accountLabels[o.accountId] ?? o.accountId}</span>
              )}
              <span className="text-zinc-500 text-xs truncate flex-1">{o.comment}</span>
              <span className={`font-medium shrink-0 ${o.amount >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {o.amount >= 0 ? "+" : ""}{o.amount.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function chartScales(cumulative: number[], days: number[]) {
  const W = 700, H = 170;
  const padL = 44, padR = 12, padT = 14, padB = 22;
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
  const accountStats = useAccountComparison(m.year, m.month);
  return (
    <div className="space-y-3">
      <PnLChart {...m} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <AccountComparisonChart stats={accountStats} accountLabels={m.accountLabels} />
        <DrawdownChart {...m} />
      </div>
      <SymbolBreakdown stats={symbolStats} />
    </div>
  );
}

function AccountComparisonChart({ stats, accountLabels }: { stats: AccountStat[]; accountLabels: Record<number, string> }) {
  const maxAbs = Math.max(1, ...stats.map((s) => Math.abs(s.profit)));
  const barMaxH = 92;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3.5 h-full flex flex-col">
      <div className="text-sm font-medium flex items-center gap-1.5 mb-2">
        <GitCompare className="h-4 w-4" />
        เปรียบเทียบกำไรแต่ละพอร์ต
      </div>
      {stats.length === 0 ? (
        <div className="text-zinc-500 text-sm py-6 text-center flex-1 flex items-center justify-center">กำลังโหลด...</div>
      ) : (
        <div className="flex items-end justify-center gap-8 flex-1" style={{ minHeight: barMaxH + 48 }}>
          {stats.map((s) => {
            const h = Math.max((Math.abs(s.profit) / maxAbs) * barMaxH, 2);
            const positive = s.profit >= 0;
            return (
              <div key={s.accountId} className="flex flex-col items-center gap-1 w-24">
                <div className={`text-xs font-semibold ${positive ? "text-emerald-400" : "text-red-400"}`}>
                  {positive ? "+" : ""}{s.profit.toFixed(2)}
                </div>
                <div className="w-full flex flex-col justify-end" style={{ height: barMaxH }}>
                  <div
                    className={`w-full rounded-t ${positive ? "bg-emerald-500/70" : "bg-red-500/70"}`}
                    style={{ height: h }}
                  />
                </div>
                <div className="text-xs text-zinc-400 text-center">
                  {accountLabels[s.accountId] ?? `Account ${s.accountId}`}
                </div>
                <div className="text-xs text-zinc-500">{s.trades} trades</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SymbolBreakdown({ stats }: { stats: SymbolStat[] }) {
  const maxAbs = Math.max(1, ...stats.map((s) => Math.abs(s.profit)));

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3.5">
      <div className="text-sm font-medium flex items-center gap-1.5 mb-2">
        <BarChart3 className="h-4 w-4" />
        กำไร/ขาดทุนแยกตาม Symbol
      </div>
      {stats.length === 0 ? (
        <div className="text-zinc-500 text-sm py-4 text-center">ไม่มีข้อมูล</div>
      ) : (
        <div className="space-y-1.5">
          {stats.map((s) => (
            <div key={s.symbol} className="flex items-center gap-3">
              <div className="w-24 text-sm font-medium text-zinc-300 shrink-0">{s.symbol}</div>
              <div className="flex-1 h-4 bg-zinc-800 rounded overflow-hidden">
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
  prevMonth,
  nextMonth,
  goToday,
  isCurrentMonth,
  monthName,
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
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3.5">
      <div className="flex items-center justify-between mb-2 gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium flex items-center gap-1.5">
            {monthTotal >= 0 ? (
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-400" />
            )}
            กำไรสะสม
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
      <div className="flex items-center gap-2 mb-2">
        <button onClick={prevMonth} className="p-1.5 rounded hover:bg-zinc-800"><ChevronLeft className="h-4 w-4" /></button>
        <span className="text-sm font-medium min-w-32 text-center">{monthName}</span>
        <button onClick={nextMonth} className="p-1.5 rounded hover:bg-zinc-800"><ChevronRight className="h-4 w-4" /></button>
        {!isCurrentMonth && (
          <button onClick={goToday} className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs bg-zinc-700 hover:bg-zinc-600 text-zinc-200">
            <RotateCcw className="h-3.5 w-3.5" /> วันนี้
          </button>
        )}
      </div>
      {!hasData ? (
        <div className="h-[170px] flex items-center justify-center text-zinc-500 text-sm">กำลังโหลด...</div>
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[170px]">
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

  const W = 460, H = 140;
  const padL = 44, padR = 12, padT = 12, padB = 22;
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
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3.5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-2 gap-3 flex-wrap">
        <div className="text-sm font-medium flex items-center gap-1.5">
          <Waves className="h-4 w-4 text-red-400" />
          Drawdown
          <span className="text-xs text-zinc-500 font-normal">({currentLabel})</span>
        </div>
        <div className="text-sm font-semibold text-red-400">
          {maxDrawdown.toFixed(2)} USD
        </div>
      </div>
      {!hasData ? (
        <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm" style={{ minHeight: 140 }}>กำลังโหลด...</div>
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full flex-1" style={{ minHeight: 140 }}>
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

interface TradeRecord {
  ticket: number;
  symbol: string;
  type: "BUY" | "SELL";
  volume: number;
  open_time: string | null;
  open_price: number | null;
  close_time: string;
  close_price: number;
  profit: number;
}

function CalendarTab() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [accountId, setAccountId] = useState<number | "all">("all");
  const [history, setHistory] = useState<DayHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [accountLabels, setAccountLabels] = useState<Record<number, string>>({});
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [trades, setTrades] = useState<(TradeRecord & { accountId: number })[]>([]);
  const [tradesLoading, setTradesLoading] = useState(false);

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

  useEffect(() => {
    setSelectedDay(null);
  }, [accountId, year, month]);

  useEffect(() => {
    if (selectedDay === null) return;
    setTradesLoading(true);
    const ids = accountId === "all" ? ACCOUNT_IDS : [accountId];
    Promise.all(
      ids.map((id) =>
        apiFetch(`/api/trades/${id}?year=${year}&month=${month}&day=${selectedDay}`)
          .then((r) => (r.ok ? r.json() : []))
          .catch(() => [] as TradeRecord[])
          .then((list: TradeRecord[]) => list.map((t) => ({ ...t, accountId: id })))
      )
    ).then((results) => {
      setTrades(results.flat().sort((a, b) => a.close_time.localeCompare(b.close_time)));
    }).finally(() => setTradesLoading(false));
  }, [selectedDay, accountId, year, month]);

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

      <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-2 sm:p-3 overflow-hidden">
          <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs text-zinc-400 whitespace-nowrap">
            {monthProfit >= 0 ? <TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" /> : <TrendingDown className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />}
            <span className="truncate">กำไรเดือนนี้</span>
          </div>
          <div className={`text-sm sm:text-xl font-semibold mt-0.5 sm:mt-1 truncate ${monthProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            <span className="sm:hidden">{monthProfit >= 0 ? "+" : ""}{monthProfit.toFixed(0)}</span>
            <span className="hidden sm:inline">{monthProfit >= 0 ? "+" : ""}{monthProfit.toFixed(2)} USD</span>
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-2 sm:p-3 overflow-hidden">
          <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs text-zinc-400 whitespace-nowrap">
            <Repeat className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
            <span className="sm:hidden truncate">Trades</span>
            <span className="hidden sm:inline truncate">จำนวน Trades</span>
          </div>
          <div className="text-sm sm:text-xl font-semibold mt-0.5 sm:mt-1">{tradeCount}</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-2 sm:p-3 overflow-hidden">
          <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs text-zinc-400 whitespace-nowrap">
            <Target className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
            <span className="sm:hidden truncate">กำไร/ขาดทุน</span>
            <span className="hidden sm:inline truncate">วันกำไร / วันขาดทุน</span>
          </div>
          <div className="text-sm sm:text-xl font-semibold mt-0.5 sm:mt-1">
            <span className="text-emerald-400">{winDays}</span>
            <span className="text-zinc-500"> / </span>
            <span className="text-red-400">{loseDays}</span>
          </div>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
        <div className="grid grid-cols-7 gap-1.5 mb-1.5">
          {["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"].map((d) => (
            <div key={d} className="text-center text-xs text-zinc-500 py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`e${i}`} className="min-h-16" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const data = byDay[dateKey];
            const isToday = dateKey === new Date().toISOString().split("T")[0];
            const isSelected = selectedDay === day;
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(isSelected ? null : day)}
                className={`min-h-16 p-1 sm:p-1.5 rounded-lg text-left transition-colors hover:bg-zinc-800 overflow-hidden ${
                  isSelected ? "ring-2 ring-emerald-500" : ""
                } ${
                  data
                    ? data.profit > 0
                      ? "bg-emerald-950/40"
                      : "bg-red-950/40"
                    : "bg-zinc-800/40"
                }`}
              >
                <div className={`text-[10px] sm:text-xs font-medium ${isToday ? "text-emerald-400" : "text-zinc-400"}`}>{day}</div>
                {data && (
                  <div className="mt-0.5 sm:mt-1 w-full">
                    <div className={`text-[9px] sm:text-xs font-semibold truncate ${data.profit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      <span className="sm:hidden">{data.profit >= 0 ? "+" : ""}{data.profit.toFixed(0)}</span>
                      <span className="hidden sm:inline">{data.profit >= 0 ? "+" : ""}{data.profit.toFixed(2)}</span>
                    </div>
                    <div className="text-zinc-500 text-[9px] sm:text-xs truncate flex items-center gap-0.5">
                      <Repeat className="h-2.5 w-2.5 sm:hidden" />
                      <span className="sm:hidden">{data.trades}</span>
                      <span className="hidden sm:inline">{data.trades} trades</span>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
      {loading && <div className="text-center text-zinc-500 text-sm py-2">Loading...</div>}

      {selectedDay !== null && (
        <DayTradesPanel
          year={year}
          month={month}
          day={selectedDay}
          trades={trades}
          loading={tradesLoading}
          accountId={accountId}
          accountLabels={accountLabels}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </div>
  );
}

function DayTradesPanel({
  year,
  month,
  day,
  trades,
  loading,
  accountId,
  accountLabels,
  onClose,
}: {
  year: number;
  month: number;
  day: number;
  trades: (TradeRecord & { accountId: number })[];
  loading: boolean;
  accountId: number | "all";
  accountLabels: Record<number, string>;
  onClose: () => void;
}) {
  const dateLabel = new Date(year, month - 1, day).toLocaleString("th-TH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const dayTotal = trades.reduce((s, t) => s + t.profit, 0);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="text-sm font-medium flex items-center gap-2">
          <History className="h-4 w-4" />
          {dateLabel}
        </div>
        <div className="flex items-center gap-3">
          {trades.length > 0 && (
            <span className={`text-sm font-semibold ${dayTotal >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {dayTotal >= 0 ? "+" : ""}{dayTotal.toFixed(2)} USD
            </span>
          )}
          <button onClick={onClose} className="p-1 rounded hover:bg-zinc-800 text-zinc-400">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-zinc-500 text-sm py-6">กำลังโหลด...</div>
      ) : trades.length === 0 ? (
        <div className="text-center text-zinc-500 text-sm py-6">ไม่มีรายการเทรดวันนี้</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-zinc-400 text-left">
                <th className="px-4 py-2">Ticket</th>
                {accountId === "all" && <th className="px-4 py-2">พอร์ต</th>}
                <th className="px-4 py-2">Symbol</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Volume</th>
                <th className="px-4 py-2">เปิด</th>
                <th className="px-4 py-2">ปิด</th>
                <th className="px-4 py-2">Profit</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((t) => (
                <tr key={`${t.accountId}-${t.ticket}`} className="border-t border-zinc-800">
                  <td className="px-4 py-2 text-zinc-300">{t.ticket}</td>
                  {accountId === "all" && (
                    <td className="px-4 py-2 text-zinc-400 text-xs">{accountLabels[t.accountId] ?? t.accountId}</td>
                  )}
                  <td className="px-4 py-2 font-medium text-zinc-200">{t.symbol}</td>
                  <td className={`px-4 py-2 font-medium flex items-center gap-1 ${t.type === "BUY" ? "text-emerald-400" : "text-red-400"}`}>
                    {t.type === "BUY" ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                    {t.type}
                  </td>
                  <td className="px-4 py-2">{t.volume}</td>
                  <td className="px-4 py-2 text-xs text-zinc-400">
                    {t.open_time ? (
                      <>
                        <div>{t.open_time.slice(11, 16)}</div>
                        <div className="text-zinc-500">{t.open_price}</div>
                      </>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-4 py-2 text-xs text-zinc-400">
                    <div>{t.close_time.slice(11, 16)}</div>
                    <div className="text-zinc-500">{t.close_price}</div>
                  </td>
                  <td className={`px-4 py-2 font-medium ${t.profit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {t.profit >= 0 ? "+" : ""}{t.profit.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Positions Tab ────────────────────────────────────────────────────────────

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

const TIMEFRAMES = ["M1", "M5", "M15", "M30", "H1", "H4", "D1", "W1", "MN1"] as const;

function useCandles(accountId: number, symbol: string, timeframe: string) {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!symbol) return;
    setLoading(true);
    apiFetch(`/api/candles/${accountId}?symbol=${encodeURIComponent(symbol)}&timeframe=${timeframe}&count=150`)
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => [] as Candle[])
      .then((data: Candle[]) => setCandles(data))
      .finally(() => setLoading(false));
  }, [accountId, symbol, timeframe]);

  return { candles, loading };
}

function useAccountPositions(accountId: number) {
  const [positions, setPositions] = useState<Position[]>([]);

  useEffect(() => {
    let alive = true;
    const fetchData = () => {
      apiFetch(`/api/positions/${accountId}`)
        .then((r) => (r.ok ? r.json() : []))
        .then((d: Position[]) => { if (alive) setPositions(d); })
        .catch(() => {});
    };
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => { alive = false; clearInterval(interval); };
  }, [accountId]);

  return positions;
}

function LightweightCandleChart({ candles, positions }: { candles: Candle[]; positions: Position[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const priceLinesRef = useRef<IPriceLine[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;
    const chart = createChart(containerRef.current, {
      height: 320,
      layout: { background: { color: "transparent" }, textColor: "#a1a1aa" },
      grid: { vertLines: { color: "#27272a" }, horzLines: { color: "#27272a" } },
      timeScale: { timeVisible: true, secondsVisible: false, borderColor: "#3f3f46" },
      rightPriceScale: { borderColor: "#3f3f46" },
    });
    const series = chart.addCandlestickSeries({
      upColor: "#34d399",
      downColor: "#f87171",
      borderVisible: false,
      wickUpColor: "#34d399",
      wickDownColor: "#f87171",
    });
    chartRef.current = chart;
    seriesRef.current = series;

    const resize = () => {
      if (containerRef.current) chart.applyOptions({ width: containerRef.current.clientWidth });
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!seriesRef.current) return;
    seriesRef.current.setData(
      candles.map((c) => ({ time: c.time as UTCTimestamp, open: c.open, high: c.high, low: c.low, close: c.close }))
    );
    chartRef.current?.timeScale().fitContent();
  }, [candles]);

  useEffect(() => {
    if (!seriesRef.current) return;
    priceLinesRef.current.forEach((l) => seriesRef.current!.removePriceLine(l));
    priceLinesRef.current = [];
    positions.forEach((p) => {
      const color = p.type === "BUY" ? "#34d399" : "#f87171";
      priceLinesRef.current.push(
        seriesRef.current!.createPriceLine({ price: p.price_open, color, lineWidth: 1, lineStyle: LineStyle.Dashed, title: `${p.type} #${p.ticket}` })
      );
      if (p.sl > 0) {
        priceLinesRef.current.push(
          seriesRef.current!.createPriceLine({ price: p.sl, color: "#f87171", lineWidth: 1, lineStyle: LineStyle.Dotted, title: "SL" })
        );
      }
      if (p.tp > 0) {
        priceLinesRef.current.push(
          seriesRef.current!.createPriceLine({ price: p.tp, color: "#34d399", lineWidth: 1, lineStyle: LineStyle.Dotted, title: "TP" })
        );
      }
    });
  }, [positions]);

  return <div ref={containerRef} className="w-full" />;
}

function LiveChartCard() {
  const [accountId, setAccountId] = useState<number>(ACCOUNT_IDS[0]);
  const [symbol, setSymbol] = useState("");
  const [timeframe, setTimeframe] = useState<(typeof TIMEFRAMES)[number]>("M15");
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

  const positions = useAccountPositions(accountId);
  const symbols = Array.from(new Set(positions.map((p) => p.symbol)));

  useEffect(() => {
    if (symbols.length > 0 && !symbols.includes(symbol)) setSymbol(symbols[0]);
    if (symbols.length === 0 && symbol) setSymbol("");
  }, [symbols.join(","), symbol]);

  const { candles, loading } = useCandles(accountId, symbol, timeframe);
  const symbolPositions = positions.filter((p) => p.symbol === symbol);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3.5">
      <div className="flex items-center justify-between mb-2 gap-3 flex-wrap">
        <div className="text-sm font-medium flex items-center gap-1.5">
          <CandlestickChart className="h-4 w-4" /> กราฟราคา
        </div>
        <div className="flex items-center gap-2">
          <select
            value={accountId}
            onChange={(e) => setAccountId(Number(e.target.value))}
            className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs"
          >
            {ACCOUNT_IDS.map((id) => (
              <option key={id} value={id}>{accountLabels[id] ?? `Account ${id}`}</option>
            ))}
          </select>
          {symbols.length > 0 && (
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs"
            >
              {symbols.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )}
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as (typeof TIMEFRAMES)[number])}
            className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs"
          >
            {TIMEFRAMES.map((tf) => (
              <option key={tf} value={tf}>{tf}</option>
            ))}
          </select>
        </div>
      </div>

      {symbols.length === 0 ? (
        <div className="h-[320px] flex items-center justify-center text-zinc-500 text-sm">ไม่มี position เปิดอยู่</div>
      ) : loading || candles.length === 0 ? (
        <div className="h-[320px] flex items-center justify-center text-zinc-500 text-sm">กำลังโหลด...</div>
      ) : (
        <>
          <LightweightCandleChart candles={candles} positions={symbolPositions} />
          <div className="flex items-center gap-4 mt-1 text-xs text-zinc-500">
            <span className="flex items-center gap-1"><span className="inline-block w-3 border-t border-dashed border-zinc-400" /> Entry</span>
            <span className="flex items-center gap-1"><span className="inline-block w-3 border-t border-dotted border-red-400" /> SL</span>
            <span className="flex items-center gap-1"><span className="inline-block w-3 border-t border-dotted border-emerald-400" /> TP</span>
          </div>
        </>
      )}
    </div>
  );
}

function AccountPanel({ accountId, label }: { accountId: number; label: string }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [online, setOnline] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"all" | "profitable" | null>(null);
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

  const handleClose = async () => {
    if (!confirmAction) return;
    setClosing(true);
    try {
      const endpoint = confirmAction === "all" ? "close_all" : "close_profitable";
      await apiFetch(`/api/${endpoint}/${accountId}`, { method: "POST" });
    } catch {}
    finally {
      setClosing(false);
      setConfirmAction(null);
    }
  };

  const floatingPnl = positions.reduce((s, p) => s + p.profit, 0);

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
        <div className="mt-1">
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${
              online ? "bg-emerald-900/50 text-emerald-300" : "bg-red-900/50 text-red-300"
            }`}
          >
            {online ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
            {online ? "Connected" : "Offline"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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

      <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-sm text-zinc-400">
          Floating PnL
          <span className={`font-semibold ${floatingPnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {floatingPnl >= 0 ? "+" : ""}{floatingPnl.toFixed(2)} USD
          </span>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <button onClick={() => setConfirmAction("profitable")} className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition-colors">
            <PiggyBank className="h-4 w-4 shrink-0" /> Close Profitable
          </button>
          <button onClick={() => setConfirmAction("all")} className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-md bg-red-600 hover:bg-red-700 px-4 py-2 text-sm font-semibold text-white transition-colors">
            <OctagonX className="h-4 w-4 shrink-0" /> Close All Positions
          </button>
        </div>
      </div>

      {confirmAction && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              {confirmAction === "all" ? "Confirm Close All Positions" : "Confirm Close Profitable Positions"} — {label}
            </h3>
            <p className="text-sm text-zinc-400 mb-6">
              {confirmAction === "all"
                ? `ปิดทุก position บน ${label} ที่ราคาตลาด ไม่สามารถยกเลิกได้`
                : `ปิดเฉพาะ position ที่กำไรอยู่บน ${label} ที่ราคาตลาด ไม่สามารถยกเลิกได้`}
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmAction(null)} className="px-4 py-2 text-sm rounded-md bg-zinc-800 hover:bg-zinc-700">Cancel</button>
              <button onClick={handleClose} disabled={closing} className="px-4 py-2 text-sm rounded-md bg-red-600 hover:bg-red-700 disabled:opacity-50 font-semibold">
                {closing ? "Closing..." : "Yes, Close"}
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
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 sm:p-4">
      <p className="text-xs sm:text-sm text-zinc-400 flex items-center gap-1.5">
        {Icon && <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />}
        <span className="truncate">{label}</span>
      </p>
      <p className="text-base sm:text-2xl font-semibold mt-1 whitespace-nowrap overflow-hidden text-ellipsis">
        {value !== undefined
          ? `${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${suffix ?? (currency ? ` ${currency}` : "")}`
          : "—"}
      </p>
    </div>
  );
}
