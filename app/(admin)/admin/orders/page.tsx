// app/(admin)/orders/page.tsx
'use client';

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Search,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  FileText,
  User,
  ShieldCheck,
  History,
  X,
  CreditCard
} from "lucide-react";

interface Order {
  id: string;
  createdAt: string;
  status: string;
  currency: string;
  netAmount: number | null;
  paymentDate?: string | null;
  customerName?: string;
  customerEmail?: string;
}

interface PaginationMeta {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

interface AdminLog {
  adminName: string;
  workplace: string[];
  action: string;
  details: string;
}

export default function AdminOrdersPage() {
  const router = useRouter();

  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [customerSearch, setCustomerSearch] = useState<string>("");

  const [orders, setOrders] = useState<Order[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    page: 1,
    pageSize: 20,
    totalCount: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Admin Logs Modal State
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [logsLoading, setLogsLoading] = useState<boolean>(false);

  const fetchOrders = async (page: number) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
      });

      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (customerSearch.trim())
        params.append("search", customerSearch.trim());

      const res = await fetch(`/api/orders?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Could not load orders (status: ${res.status})`);
      }

      const data = await res.json();
      setOrders(data.orders || []);
      setMeta({
        page: data.page,
        pageSize: data.pageSize,
        totalCount: data.totalCount,
        totalPages: data.totalPages,
      });
    } catch (err: any) {
      setError(err.message || "Something went wrong while fetching orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(currentPage);
  }, [currentPage]);

  const handleFetchLogs = async (orderId: string) => {
    setSelectedOrderId(orderId);
    setLogsLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/admin-logs`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchOrders(1);
  };

  const handleResetFilters = () => {
    setStartDate("");
    setEndDate("");
    setCustomerSearch("");
    setCurrentPage(1);
    setTimeout(() => {
      fetchOrders(1);
    }, 50);
  };

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === "completed" || s === "delivered") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-green-500/10 text-green-500 border border-green-500/20">
          <CheckCircle2 className="w-3 h-3" /> {status}
        </span>
      );
    }
    if (s === "pending" || s === "processing") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20">
          <Clock className="w-3 h-3" /> {status}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-navy-deep/10 dark:bg-white/10 text-slate-blue dark:text-platinum">
        {status}
      </span>
    );
  };

  return (
    <div className="w-full pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex-1 flex flex-col">
      {/* Page Title */}
      <div className="text-left mb-12">
        <h1 className="text-4xl font-black uppercase tracking-tight mb-3">
          Order{" "}
          <span className="bg-gradient-to-r from-gold-polished via-gold-metallic to-gold-pastel bg-clip-text text-transparent">
            Management
          </span>
        </h1>
        <p className="text-slate-blue dark:text-platinum text-sm max-w-xl">
          View all orders, filter by date, search customers, and inspect administrative logs.
        </p>
      </div>

      {/* Filters (Date + Customer Search) */}
      <div className="w-full mb-8 rounded-3xl border border-navy-deep/10 dark:border-white/10 p-5 liquid-glass-light dark:liquid-glass-dark shadow-xl">
        <form
          onSubmit={handleFilterSubmit}
          className="flex flex-col gap-4 w-full"
        >
          {/* Row 1: date inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <Calendar className="w-3 h-3 text-gold-polished" /> Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-navy-deep/10 dark:border-white/10 bg-white/40 dark:bg-navy-deep/40 text-xs text-navy-deep dark:text-alabaster focus:outline-none focus:border-gold-polished transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <Calendar className="w-3 h-3 text-gold-polished" /> End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-navy-deep/10 dark:border-white/10 bg-white/40 dark:bg-navy-deep/40 text-xs text-navy-deep dark:text-alabaster focus:outline-none focus:border-gold-polished transition-all"
              />
            </div>
          </div>

          {/* Row 2: customer search + buttons */}
          <div className="flex flex-col sm:flex-row items-end gap-4">
            <div className="w-full sm:flex-1 flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <User className="w-3 h-3 text-gold-polished" /> Customer
              </label>
              <input
                type="text"
                placeholder="Search by name or email…"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-navy-deep/10 dark:border-white/10 bg-white/40 dark:bg-navy-deep/40 text-xs text-navy-deep dark:text-alabaster focus:outline-none focus:border-gold-polished transition-all"
              />
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
              <button
                type="submit"
                className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-gold-polished dark:bg-gold-metallic text-white dark:text-canvas-dark text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-md"
              >
                <Search className="w-3.5 h-3.5" /> Search
              </button>
              {(startDate || endDate || customerSearch) && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-4 py-3 rounded-xl border border-navy-deep/10 dark:border-white/10 text-xs font-semibold uppercase hover:bg-navy-deep/5 dark:hover:bg-white/5 transition-colors text-slate-blue dark:text-platinum"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Orders Table */}
      <div className="flex-1 w-full flex flex-col justify-between">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-24 flex items-center justify-center flex-col gap-3"
            >
              <RefreshCw className="w-8 h-8 text-gold-polished dark:text-gold-metallic animate-spin" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Loading orders…
              </p>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="py-16 flex justify-center text-center max-w-md mx-auto"
            >
              <div className="liquid-glass-light dark:liquid-glass-dark border border-red-500/30 p-8 rounded-3xl shadow-xl w-full">
                <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                <h3 className="text-base font-bold mb-1">
                  Could not load orders
                </h3>
                <p className="text-xs text-slate-blue dark:text-platinum mb-4 opacity-80">
                  {error}
                </p>
                <button
                  onClick={() => fetchOrders(currentPage)}
                  className="px-5 py-2 rounded-xl bg-gold-polished text-white text-xs font-bold uppercase tracking-wider shadow-md"
                >
                  Try Again
                </button>
              </div>
            </motion.div>
          ) : orders.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-20 text-center liquid-glass-light dark:liquid-glass-dark rounded-3xl border border-dashed border-navy-deep/10 dark:border-white/10 p-12"
            >
              <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4 opacity-60" />
              <h3 className="text-lg font-bold mb-1 text-navy-deep dark:text-alabaster">
                No Orders Found
              </h3>
              <p className="text-xs text-slate-blue dark:text-platinum max-w-sm mx-auto opacity-70">
                {startDate || endDate || customerSearch
                  ? "No orders match your search criteria."
                  : "There are no orders in the system yet."}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="table"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="w-full overflow-hidden rounded-3xl border border-navy-deep/10 dark:border-white/10 liquid-glass-light dark:liquid-glass-dark shadow-2xl"
            >
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="border-b border-navy-deep/10 dark:border-white/10 bg-navy-deep/[2%] dark:bg-white/[2%]">
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Order ID
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Customer
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Date Placed
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Status / Payment
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">
                        Total
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">
                        Logs
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order, idx) => (
                      <motion.tr
                        key={order.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.02 }}
                        className="border-b border-navy-deep/5 dark:border-white/5 last:border-0 hover:bg-navy-deep/[1%] dark:hover:bg-white/[1%] transition-colors group cursor-pointer"
                      >
                        <td 
                          onClick={() => router.push(`/admin/orders/${order.id}`)}
                          className="px-6 py-4 text-xs font-mono text-navy-deep dark:text-alabaster selection:bg-gold-metallic/30"
                        >
                          #{order.id.substring(0, 8).toUpperCase()}…
                        </td>
                        <td 
                          onClick={() => router.push(`/admin/orders/${order.id}`)}
                          className="px-6 py-4"
                        >
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-navy-deep dark:text-alabaster">
                              {order.customerName || "—"}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {order.customerEmail || "—"}
                            </span>
                          </div>
                        </td>
                        <td 
                          onClick={() => router.push(`/admin/orders/${order.id}`)}
                          className="px-6 py-4 text-xs text-slate-blue dark:text-platinum font-medium"
                        >
                          {new Date(order.createdAt).toLocaleDateString(
                            undefined,
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </td>
                        <td 
                          onClick={() => router.push(`/admin/orders/${order.id}`)}
                          className="px-6 py-4"
                        >
                          <div className="flex flex-col items-start gap-1">
                            {getStatusBadge(order.status)}
                            {order.paymentDate && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/10 text-blue-500 border border-blue-500/20">
                                <CreditCard className="w-3 h-3" /> Paid
                              </span>
                            )}
                          </div>
                        </td>
                        <td 
                          onClick={() => router.push(`/admin/orders/${order.id}`)}
                          className="px-6 py-4 text-xs font-bold text-right text-navy-deep dark:text-alabaster"
                        >
                          {order.currency}{" "}
                          {order.netAmount != null
                            ? Number(order.netAmount).toFixed(2)
                            : "Pending"}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFetchLogs(order.id);
                            }}
                            className="p-2 rounded-xl border border-navy-deep/10 dark:border-white/10 hover:bg-gold-polished hover:text-white transition-colors"
                            title="View Admin Logs"
                          >
                            <History className="w-4 h-4" />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pagination */}
        {!loading && !error && meta.totalPages > 1 && (
          <div className="flex items-center justify-between mt-8 pt-4 border-t border-navy-deep/5 dark:border-white/5 w-full">
            <span className="text-xs font-medium text-slate-blue dark:text-platinum opacity-70">
              Page <b>{meta.page}</b> of {meta.totalPages} (
              {meta.totalCount} total orders)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() =>
                  setCurrentPage((prev) => Math.max(prev - 1, 1))
                }
                className="p-2 rounded-xl border border-navy-deep/10 dark:border-white/10 text-slate-blue dark:text-platinum disabled:opacity-40 hover:bg-gold-metallic/5 transition-colors"
                aria-label="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={currentPage === meta.totalPages}
                onClick={() =>
                  setCurrentPage((prev) =>
                    Math.min(prev + 1, meta.totalPages)
                  )
                }
                className="p-2 rounded-xl border border-navy-deep/10 dark:border-white/10 text-slate-blue dark:text-platinum disabled:opacity-40 hover:bg-gold-metallic/5 transition-colors"
                aria-label="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Admin Logs Modal */}
      {selectedOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-white dark:bg-navy-deep rounded-3xl border border-navy-deep/10 dark:border-white/10 p-6 shadow-2xl relative max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center pb-4 border-b border-navy-deep/5 dark:border-white/5">
              <h3 className="text-base font-black uppercase flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-gold-polished" /> Admin Logs
              </h3>
              <button
                onClick={() => setSelectedOrderId(null)}
                className="p-1.5 rounded-full hover:bg-navy-deep/5 dark:hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {logsLoading ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                  Loading logs...
                </div>
              ) : logs.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">No admin logs recorded for this order.</p>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="p-3.5 rounded-2xl bg-navy-deep/[2%] dark:bg-white/[2%] border border-navy-deep/5 dark:border-white/5 text-xs space-y-1">
                    <div className="flex justify-between font-bold">
                      <span>{log.adminName}</span>
                      <span className="text-[10px] text-gold-polished font-mono">{log.action}</span>
                    </div>
                    {log.workplace && log.workplace.length > 0 && (
                      <p className="text-[10px] opacity-60">Workplace: {log.workplace.join(', ')}</p>
                    )}
                    <p className="text-slate-blue dark:text-platinum mt-1">{log.details}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}