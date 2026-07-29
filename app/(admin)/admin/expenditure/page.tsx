//app/(admin)/admin/expenditure/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
  AlertCircle,
  Receipt,
  CreditCard,
  User,
  Tag,
  Calendar,
} from "lucide-react";

interface Transaction {
  type: "payment" | "expense";
  id: string;
  userId?: string;
  userName?: string;
  adminId?: string;
  category?: string;
  amount: number;
  currencyCode: string;
  date: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

export default function ExpenditureSpreadPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 1,
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(20);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      params.append("page", currentPage.toString());
      params.append("limit", limit.toString());

      const res = await fetch(`/api/dashboard/spread?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch transactions (${res.status})`);
      }

      const data = await res.json();
      setTransactions(data.transactions || []);
      setPagination(
        data.pagination || {
          page: 1,
          limit: 20,
          totalCount: 0,
          totalPages: 1,
        }
      );
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, currentPage, limit]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleResetFilters = () => {
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

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

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="w-full min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* HEADER & FILTER TOOLBAR */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-6 border-b border-navy-deep/10 dark:border-white/10">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Financial{" "}
            <span className="bg-gradient-to-r from-gold-polished via-gold-metallic to-gold-pastel bg-clip-text text-transparent">
              Spread & Ledger
            </span>
          </h1>
          <p className="text-sm text-slate-blue dark:text-platinum mt-1">
            Audit payment inflows and expense outflows in a unified timeline.
          </p>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-3 liquid-glass-light dark:liquid-glass-dark p-2.5 rounded-2xl border border-navy-deep/10 dark:border-white/10 shadow-sm">
          <div className="flex items-center gap-2 px-2 text-xs font-bold uppercase tracking-wider text-slate-blue dark:text-platinum">
            <Filter className="w-3.5 h-3.5 text-gold-polished dark:text-gold-metallic" />
            Filter
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 rounded-xl border border-navy-deep/10 dark:border-white/10 bg-white/50 dark:bg-navy-deep/50 text-xs font-medium focus:outline-none focus:border-gold-polished transition-all"
            />
            <span className="text-xs text-slate-blue dark:text-platinum">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 rounded-xl border border-navy-deep/10 dark:border-white/10 bg-white/50 dark:bg-navy-deep/50 text-xs font-medium focus:outline-none focus:border-gold-polished transition-all"
            />
          </div>

          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 rounded-xl border border-navy-deep/10 dark:border-white/10 bg-white/50 dark:bg-navy-deep/50 text-xs font-medium focus:outline-none focus:border-gold-polished transition-all"
          >
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
          </select>

          {(startDate || endDate) && (
            <button
              onClick={handleResetFilters}
              className="px-3 py-1.5 text-xs text-red-500 hover:text-red-600 font-semibold transition-colors"
            >
              Reset
            </button>
          )}

          <button
            onClick={fetchTransactions}
            disabled={loading}
            className="p-2 rounded-xl bg-gold-polished dark:bg-gold-metallic text-white dark:text-canvas-dark hover:opacity-90 transition-opacity disabled:opacity-50"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* ERROR NOTICE */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* TRANSACTIONS TABLE CONTAINER */}
      <div className="liquid-glass-light dark:liquid-glass-dark rounded-3xl border border-navy-deep/10 dark:border-gold-metallic/15 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-navy-deep/10 dark:border-white/10 bg-white/30 dark:bg-navy-deep/30 text-xs font-bold uppercase tracking-wider text-slate-blue dark:text-platinum">
                <th className="py-4 px-6">Type</th>
                <th className="py-4 px-6">Entity / Category</th>
                <th className="py-4 px-6">Transaction ID</th>
                <th className="py-4 px-6">Date</th>
                <th className="py-4 px-6 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-deep/5 dark:divide-white/5 text-sm">
              {loading ? (
                <TableSkeleton rows={limit > 10 ? 10 : limit} />
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-blue dark:text-platinum opacity-70">
                    No transactions found for the selected criteria.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr
                    key={`${tx.type}-${tx.id}`}
                    className="hover:bg-white/40 dark:hover:bg-navy-deep/40 transition-colors"
                  >
                    {/* Transaction Type */}
                    <td className="py-4 px-6">
                      {tx.type === "payment" ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <TrendingUp className="w-3.5 h-3.5" />
                          Payment (In)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                          <TrendingDown className="w-3.5 h-3.5" />
                          Expense (Out)
                        </span>
                      )}
                    </td>

                    {/* Customer / Category */}
                    <td className="py-4 px-6 font-medium">
                      {tx.type === "payment" ? (
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-blue dark:text-platinum opacity-60" />
                          <span>{tx.userName || tx.userId || "Anonymous Customer"}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-gold-polished dark:text-gold-metallic" />
                          <span className="capitalize">{tx.category || "General Expense"}</span>
                          {tx.adminId && (
                            <span className="text-xs text-slate-blue/60 dark:text-platinum/60">
                              (By: {tx.adminId})
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* ID */}
                    <td className="py-4 px-6 font-mono text-xs text-slate-blue dark:text-platinum opacity-80">
                      {tx.id}
                    </td>

                    {/* Date */}
                    <td className="py-4 px-6 text-xs text-slate-blue dark:text-platinum">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 opacity-60" />
                        {formatDate(tx.date)}
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="py-4 px-6 text-right font-black text-base">
                      <span
                        className={
                          tx.type === "payment"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400"
                        }
                      >
                        {tx.type === "payment" ? "+" : "-"}
                        {formatCurrency(Number(tx.amount), tx.currencyCode)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        {!loading && pagination.totalPages > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-navy-deep/10 dark:border-white/10 bg-white/20 dark:bg-navy-deep/20 text-xs text-slate-blue dark:text-platinum">
            <div>
              Showing <span className="font-bold">{transactions.length}</span> of{" "}
              <span className="font-bold">{pagination.totalCount}</span> records
              (Page <span className="font-bold">{pagination.page}</span> of{" "}
              <span className="font-bold">{pagination.totalPages}</span>)
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1 || loading}
                className="p-2 rounded-xl border border-navy-deep/10 dark:border-white/10 liquid-glass-light dark:liquid-glass-dark hover:border-gold-polished disabled:opacity-40 disabled:hover:border-transparent transition-all"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="px-3 py-1 font-bold">
                {pagination.page} / {pagination.totalPages}
              </div>

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, pagination.totalPages))
                }
                disabled={currentPage >= pagination.totalPages || loading}
                className="p-2 rounded-xl border border-navy-deep/10 dark:border-white/10 liquid-glass-light dark:liquid-glass-dark hover:border-gold-polished disabled:opacity-40 disabled:hover:border-transparent transition-all"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TableSkeleton({ rows }: { rows: number }) {
  return (
    <>
      {[...Array(rows)].map((_, i) => (
        <tr key={i} className="animate-pulse">
          <td className="py-4 px-6">
            <div className="h-6 w-28 bg-slate-200 dark:bg-navy-deep/50 rounded-full" />
          </td>
          <td className="py-4 px-6">
            <div className="h-4 w-36 bg-slate-200 dark:bg-navy-deep/50 rounded-md" />
          </td>
          <td className="py-4 px-6">
            <div className="h-4 w-24 bg-slate-200 dark:bg-navy-deep/50 rounded-md" />
          </td>
          <td className="py-4 px-6">
            <div className="h-4 w-28 bg-slate-200 dark:bg-navy-deep/50 rounded-md" />
          </td>
          <td className="py-4 px-6 text-right">
            <div className="h-5 w-20 bg-slate-200 dark:bg-navy-deep/50 rounded-md ml-auto" />
          </td>
        </tr>
      ))}
    </>
  );
}