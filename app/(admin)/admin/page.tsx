//app/(admin)/admin/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Users,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  CheckCircle2,
  Clock,
  Calendar,
  RefreshCw,
  AlertCircle,
  PackageCheck,
  Filter,
} from "lucide-react";

interface DashboardData {
  uniqueUsers: number;
  revenueByCurrency: Record<string, number>;
  notReceivedOrders: number;
  readyOrders: number;
  notReceivedOrConfirmedOrders: number;
  totalOrders: number;
  expenditureByCurrency: Record<string, number>;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Date Filter State
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const res = await fetch(`/api/dashboard/overview?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch dashboard data (${res.status})`);
      }

      const result: DashboardData = await res.json();
      setData(result);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleResetFilters = () => {
    setStartDate("");
    setEndDate("");
  };

  // Helper function to format currency
  const formatCurrency = (val: number, currencyCode: string) => {
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currencyCode,
        maximumFractionDigits: 2,
      }).format(val);
    } catch {
      return `${currencyCode} ${val.toLocaleString()}`;
    }
  };

  return (
    <div className="w-full min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-6 border-b border-navy-deep/10 dark:border-white/10">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Dashboard{" "}
            <span className="bg-gradient-to-r from-gold-polished via-gold-metallic to-gold-pastel bg-clip-text text-transparent">
              Overview
            </span>
          </h1>
          <p className="text-sm text-slate-blue dark:text-platinum mt-1">
            Real-time business metrics, sales revenue, expenses, and order statuses.
          </p>
        </div>

        {/* Date Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-3 liquid-glass-light dark:liquid-glass-dark p-2.5 rounded-2xl border border-navy-deep/10 dark:border-white/10 shadow-sm">
          <div className="flex items-center gap-2 px-2 text-xs font-bold uppercase tracking-wider text-slate-blue dark:text-platinum">
            <Filter className="w-3.5 h-3.5 text-gold-polished dark:text-gold-metallic" />
            Filter
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-navy-deep/10 dark:border-white/10 bg-white/50 dark:bg-navy-deep/50 text-xs font-medium focus:outline-none focus:border-gold-polished transition-all"
            />
            <span className="text-xs text-slate-blue dark:text-platinum">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-navy-deep/10 dark:border-white/10 bg-white/50 dark:bg-navy-deep/50 text-xs font-medium focus:outline-none focus:border-gold-polished transition-all"
            />
          </div>

          {(startDate || endDate) && (
            <button
              onClick={handleResetFilters}
              className="px-3 py-1.5 text-xs text-red-500 hover:text-red-600 font-semibold transition-colors"
            >
              Reset
            </button>
          )}

          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="p-2 rounded-xl bg-gold-polished dark:bg-gold-metallic text-white dark:text-canvas-dark hover:opacity-90 transition-opacity disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* ERROR DISPLAY */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* METRICS GRID */}
      {loading ? (
        <DashboardSkeleton />
      ) : data ? (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-8"
        >
          {/* PRIMARY STATS CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Unique Customers */}
            <MetricCard
              title="Unique Customers"
              value={data.uniqueUsers.toLocaleString()}
              subtitle="Customers with orders"
              icon={<Users className="w-6 h-6 text-gold-polished dark:text-gold-metallic" />}
            />

            {/* Total Orders */}
            <MetricCard
              title="Total Orders"
              value={data.totalOrders.toLocaleString()}
              subtitle="All order records"
              icon={<ShoppingBag className="w-6 h-6 text-gold-polished dark:text-gold-metallic" />}
            />

            {/* Ready Orders */}
            <MetricCard
              title="Ready for Pickup"
              value={data.readyOrders.toLocaleString()}
              subtitle="Status: Ready"
              icon={<PackageCheck className="w-6 h-6 text-emerald-500" />}
              highlight="emerald"
            />

            {/* Orders In Progress */}
            <MetricCard
              title="In Progress / Active"
              value={data.notReceivedOrConfirmedOrders.toLocaleString()}
              subtitle="Beyond Confirmed status"
              icon={<Clock className="w-6 h-6 text-amber-500" />}
              highlight="amber"
            />
          </div>

          {/* FINANCIAL OVERVIEW SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Revenue Breakdown */}
            <FinancialBreakdownCard
              title="Revenue by Currency"
              type="revenue"
              icon={<TrendingUp className="w-5 h-5 text-emerald-500" />}
              data={data.revenueByCurrency}
              formatCurrency={formatCurrency}
            />

            {/* Expenditure Breakdown */}
            <FinancialBreakdownCard
              title="Expenditure by Currency"
              type="expenditure"
              icon={<TrendingDown className="w-5 h-5 text-rose-500" />}
              data={data.expenditureByCurrency}
              formatCurrency={formatCurrency}
            />
          </div>

          {/* ORDER STATUS SUMMARY TABLE / CARDS */}
          <div className="liquid-glass-light dark:liquid-glass-dark p-6 sm:p-8 rounded-3xl border border-navy-deep/10 dark:border-gold-metallic/15 space-y-6">
            <h2 className="text-xl font-bold tracking-tight">Order Status Diagnostics</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="p-5 rounded-2xl bg-white/40 dark:bg-navy-deep/40 border border-navy-deep/5 dark:border-white/5 space-y-2">
                <span className="text-xs text-slate-blue dark:text-platinum font-semibold uppercase tracking-wider">
                  Active Processing
                </span>
                <p className="text-2xl font-extrabold">{data.notReceivedOrders}</p>
                <p className="text-xs text-slate-blue/80 dark:text-platinum/80">
                  Orders that are past "Order received" status.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white/40 dark:bg-navy-deep/40 border border-navy-deep/5 dark:border-white/5 space-y-2">
                <span className="text-xs text-slate-blue dark:text-platinum font-semibold uppercase tracking-wider">
                  Fulfillment Ready
                </span>
                <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {data.readyOrders}
                </p>
                <p className="text-xs text-slate-blue/80 dark:text-platinum/80">
                  Orders ready for customer pickup or dispatch.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white/40 dark:bg-navy-deep/40 border border-navy-deep/5 dark:border-white/5 space-y-2">
                <span className="text-xs text-slate-blue dark:text-platinum font-semibold uppercase tracking-wider">
                  Advanced Stages
                </span>
                <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
                  {data.notReceivedOrConfirmedOrders}
                </p>
                <p className="text-xs text-slate-blue/80 dark:text-platinum/80">
                  Orders past initial received & confirmed stages.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      ) : null}
    </div>
  );
}

/* ==========================================
   REUSABLE UI COMPONENTS
   ========================================== */

function MetricCard({
  title,
  value,
  subtitle,
  icon,
  highlight,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  highlight?: "emerald" | "amber";
}) {
  return (
    <div className="liquid-glass-light dark:liquid-glass-dark p-6 rounded-2xl border border-navy-deep/10 dark:border-gold-metallic/15 hover:border-gold-polished/40 transition-all duration-300 flex flex-col justify-between space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-blue dark:text-platinum">
          {title}
        </span>
        <div className="p-2.5 rounded-xl bg-gold-polished/10 dark:bg-gold-metallic/10">
          {icon}
        </div>
      </div>
      <div>
        <div
          className={`text-3xl font-black ${
            highlight === "emerald"
              ? "text-emerald-600 dark:text-emerald-400"
              : highlight === "amber"
              ? "text-amber-600 dark:text-amber-400"
              : ""
          }`}
        >
          {value}
        </div>
        <p className="text-xs text-slate-blue/80 dark:text-platinum/80 mt-1">{subtitle}</p>
      </div>
    </div>
  );
}

function FinancialBreakdownCard({
  title,
  type,
  icon,
  data,
  formatCurrency,
}: {
  title: string;
  type: "revenue" | "expenditure";
  icon: React.ReactNode;
  data: Record<string, number>;
  formatCurrency: (val: number, currencyCode: string) => string;
}) {
  const currencies = Object.keys(data);

  return (
    <div className="liquid-glass-light dark:liquid-glass-dark p-6 sm:p-8 rounded-3xl border border-navy-deep/10 dark:border-gold-metallic/15 space-y-6">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl ${type === "revenue" ? "bg-emerald-500/10" : "bg-rose-500/10"}`}>
          {icon}
        </div>
        <h2 className="text-lg font-bold">{title}</h2>
      </div>

      {currencies.length === 0 ? (
        <div className="py-8 text-center text-sm text-slate-blue dark:text-platinum opacity-60">
          No {type} recorded for this timeframe.
        </div>
      ) : (
        <div className="space-y-3">
          {currencies.map((curr) => (
            <div
              key={curr}
              className="flex items-center justify-between p-4 rounded-xl bg-white/40 dark:bg-navy-deep/40 border border-navy-deep/5 dark:border-white/5"
            >
              <span className="font-bold text-sm text-slate-blue dark:text-platinum">
                {curr}
              </span>
              <span
                className={`font-black text-lg ${
                  type === "revenue"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {formatCurrency(data[curr], curr)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 rounded-2xl bg-slate-200 dark:bg-navy-deep/40" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="h-60 rounded-3xl bg-slate-200 dark:bg-navy-deep/40" />
        <div className="h-60 rounded-3xl bg-slate-200 dark:bg-navy-deep/40" />
      </div>
    </div>
  );
}