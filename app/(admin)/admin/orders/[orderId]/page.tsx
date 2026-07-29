// app/(admin)/orders/[orderId]/page.tsx
'use client';

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import {
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  Clock,
  CheckCircle2,
  Package,
  MapPin,
  Hash,
  Phone,
  Calendar,
  CreditCard,
  Tag,
  Edit,
  ChevronLeft,
  ChevronRight,
  Play,
  FileText,
  Ban,
} from "lucide-react";
import OrderEditModal from "@/components/admin/edit";

import "swiper/css";
import "swiper/css/pagination";

interface SubOrder {
  id: string;
  name: string;
  quantity: number;
  finalPrice: number | null;
  status: string | null;
}

interface DeliveryGroup {
  id: string;
  deliveryMode: string;
  processingRuleName: string;
  pickdeliveryfee: number;
  returndeliveryfee: number;
  pickdeliverycode: string | null;
  returndeliverycode: string | null;
  status: string | null;
  pickAddress: string | null;
  returnAddress: string | null;
  subOrders: SubOrder[];
}

interface OrderDetail {
  id: string;
  createdAt: string;
  status: string;
  currency: string;
  phoneNumber: string | null;
  totalServiceAmount: number | null;
  totalPickDeliveryFee: number | null;
  totalReturnDeliveryFee: number | null;
  totalAmount: number | null;
  discountAmount: number | null;
  netAmount: number | null;
  paymentDate?: string | null;
  deliveryGroups: DeliveryGroup[];
  customerName?: string | null;
  invoiceIssued: boolean; // 👈 new field
}

// Duplicated from the API for client‑side checks
const ORDER_STATUS_HIERARCHY = ['Received', 'Confirmed', 'Processing', 'Ready'];

function getOrderNextStatus(current: string | null, direction: 'next' | 'prev'): string {
  if (!current) return ORDER_STATUS_HIERARCHY[0];
  const idx = ORDER_STATUS_HIERARCHY.indexOf(current);
  if (idx === -1) return ORDER_STATUS_HIERARCHY[0];
  if (direction === 'next') {
    return ORDER_STATUS_HIERARCHY[Math.min(idx + 1, ORDER_STATUS_HIERARCHY.length - 1)];
  } else {
    return ORDER_STATUS_HIERARCHY[Math.max(idx - 1, 0)];
  }
}

export default function CustomerOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.orderId as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);
  const [togglingInvoice, setTogglingInvoice] = useState<boolean>(false); // 👈 for button state

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/orders/${orderId}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error("We couldn't find this order. It may have been removed.");
        throw new Error("Something went wrong while fetching your order details.");
      }
      const data = await res.json();
      // Ensure the API returns invoiceIssued – if not, add it in the GET route.
      setOrder(data);
    } catch (err: any) {
      setError(err.message || "An unexpected error happened while loading your order.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  // ---------- Invoice toggle ----------
  const handleInvoiceToggle = async () => {
    if (!order) return;
    const newVal = !order.invoiceIssued;
    const confirmMsg = newVal
      ? "Issue an invoice to the customer?"
      : "Cancel this invoice?";
    if (!window.confirm(confirmMsg)) return;

    try {
      setTogglingInvoice(true);
      const res = await fetch(`/api/orders/${orderId}/invoice-issued`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceIssued: newVal }),
      });
      if (!res.ok) throw new Error('Failed to update invoice status');
      // Optimistically update local state
      setOrder(prev => prev ? { ...prev, invoiceIssued: newVal } : prev);
      // Refresh data to be sure
      await fetchOrderDetails();
    } catch (e: any) {
      alert(e.message || 'Invoice toggle failed');
    } finally {
      setTogglingInvoice(false);
    }
  };

  // ---------- Status change with confirmation ----------
  const handleStatusChange = async (
    targetType: 'order' | 'deliveryGroup' | 'subOrder',
    targetId?: string,
    direction?: 'next' | 'prev'
  ) => {
    const confirmed = window.confirm(
      `Are you sure you want to change the status of this ${targetType}?`
    );
    if (!confirmed) return;

    try {
      setUpdatingStatus(true);
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType,
          targetId,
          direction,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to update status');
      }

      await fetchOrderDetails();
    } catch (e: any) {
      alert(e.message || 'Status update failed');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const formatPrice = (value: number | null, showPending = false) => {
    if (value === null || value === undefined) {
      return showPending ? 'Pending' : '0.00';
    }
    return Number(value).toFixed(2);
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-gray-500/10 text-gray-500 border border-gray-500/20 tracking-wider">
          Not Started
        </span>
      );
    }
    const s = status.toLowerCase();
    if (s === 'completed' || s === 'delivered' || s === 'ready') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-green-500/10 text-green-500 border border-green-500/20 tracking-wider">
          <CheckCircle2 className="w-3.5 h-3.5" /> {status}
        </span>
      );
    }
    if (s === 'pending' || s === 'processing' || s === 'confirmed' || s === 'received') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20 tracking-wider">
          <Clock className="w-3.5 h-3.5 animate-pulse" /> {status}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-navy-deep/10 dark:bg-white/10 text-slate-blue dark:text-platinum tracking-wider">
        {status}
      </span>
    );
  };

  // ---------- Order status movement control ----------
  const canChangeOrderStatus = (direction: 'next' | 'prev'): boolean => {
    if (!order) return false;
    const nextStatus = getOrderNextStatus(order.status, direction);

    // If the order is paid, block moving TO "Received" or "Confirmed"
    // unless the order is already at that exact status.
    if (order.paymentDate && (nextStatus === 'Received' || nextStatus === 'Confirmed')) {
      if (order.status !== nextStatus) {
        return false;
      }
    }
    return true;
  };

  return (
    <div className="w-full pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex-1 flex flex-col">
      {/* Back Button & Edit (hidden if paid) */}
      <div className="mb-8 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="group inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-blue dark:text-platinum hover:text-gold-polished dark:hover:text-gold-metallic transition-colors"
        >
          <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-0.5 transition-transform" />
          Back to Orders
        </button>

        {/* Edit button hidden when payment date exists */}
        {!order?.paymentDate && (
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gold-polished text-white text-xs font-bold uppercase tracking-wider shadow-md hover:bg-gold-metallic transition-colors"
          >
            <Edit className="w-4 h-4" />
            Edit Order
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-32 flex-1 flex items-center justify-center flex-col gap-3"
          >
            <RefreshCw className="w-8 h-8 text-gold-polished dark:text-gold-metallic animate-spin" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading your order...</p>
          </motion.div>
        ) : error ? (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="py-16 flex justify-center text-center max-w-md mx-auto flex-1 items-center"
          >
            <div className="liquid-glass-light dark:liquid-glass-dark border border-red-500/30 p-8 rounded-3xl shadow-xl w-full">
              <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
              <h3 className="text-base font-bold mb-1">Couldn't load order</h3>
              <p className="text-xs text-slate-blue dark:text-platinum mb-4 opacity-80">{error}</p>
              <button
                onClick={fetchOrderDetails}
                className="px-5 py-2.5 rounded-xl bg-gold-polished text-white text-xs font-bold uppercase tracking-wider shadow-md"
              >
                Try Again
              </button>
            </div>
          </motion.div>
        ) : order ? (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="w-full space-y-8"
          >
            {/* Order Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-navy-deep/5 dark:border-white/5 pb-6">
              <div>
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <span className="text-xs font-mono font-bold tracking-wider px-2.5 py-1 rounded-lg bg-navy-deep/5 dark:bg-white/5 text-navy-deep dark:text-alabaster">
                    #{order.id.toUpperCase()}
                  </span>
                  {getStatusBadge(order.status)}
                  {order.paymentDate && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-blue-500/10 text-blue-500 border border-blue-500/20 tracking-wider">
                      <CreditCard className="w-3.5 h-3.5" /> Order Paid
                    </span>
                  )}
                  {/* Show invoice status badge if issued */}
                  {order.invoiceIssued && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-purple-500/10 text-purple-500 border border-purple-500/20 tracking-wider">
                      <FileText className="w-3.5 h-3.5" /> Invoice Issued
                    </span>
                  )}
                </div>

                {/* Order Direct Status Controls */}
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs font-semibold">Change Order Status:</span>
                  <button
                    disabled={updatingStatus || !canChangeOrderStatus('prev')}
                    onClick={() => handleStatusChange('order', undefined, 'prev')}
                    className="p-1 rounded bg-navy-deep/10 dark:bg-white/10 hover:bg-gold-polished hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    disabled={updatingStatus || !canChangeOrderStatus('next')}
                    onClick={() => handleStatusChange('order', undefined, 'next')}
                    className="p-1 rounded bg-navy-deep/10 dark:bg-white/10 hover:bg-gold-polished hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="text-left md:text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Net Total</p>
                <p className="text-2xl font-black text-navy-deep dark:text-alabaster">
                  {order.currency}{' '}
                  {order.netAmount != null ? Number(order.netAmount).toFixed(2) : 'Pending'}
                </p>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Laundry Bags Section */}
              <div className="lg:col-span-8 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <Package className="w-4 h-4 text-gold-polished" /> Your Laundry Bags
                  </h2>
                </div>

                {/* Mobile View: Swipeable Cards */}
                <div className="block md:hidden">
                  <Swiper
                    modules={[Pagination]}
                    spaceBetween={16}
                    slidesPerView={1}
                    pagination={{ clickable: true, dynamicBullets: true }}
                    className="pb-12"
                  >
                    {order.deliveryGroups.map((group) => (
                      <SwiperSlide key={group.id}>
                        {renderDeliveryGroupCard(group, order.currency, handleStatusChange, updatingStatus)}
                      </SwiperSlide>
                    ))}
                  </Swiper>
                </div>

                {/* Desktop View: Stacked Cards */}
                <div className="hidden md:flex flex-col gap-6">
                  {order.deliveryGroups.map((group) => (
                    <div key={group.id} className="w-full">
                      {renderDeliveryGroupCard(group, order.currency, handleStatusChange, updatingStatus)}
                    </div>
                  ))}
                </div>
              </div>

              {/* Sidebar: Order Info & Payment */}
              <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-28">
                {/* Order Info Panel */}
                <div className="liquid-glass-light dark:liquid-glass-dark border border-navy-deep/10 dark:border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Order Information</h3>

                  <div className="space-y-3 text-xs">
                    {order.customerName && (
                      <div className="flex justify-between items-center py-2 border-b border-navy-deep/5 dark:border-white/5">
                        <span className="font-semibold opacity-70">Customer Name</span>
                        <span className="font-bold text-navy-deep dark:text-alabaster">{order.customerName}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center py-2 border-b border-navy-deep/5 dark:border-white/5">
                      <span className="font-semibold opacity-70 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Order Date</span>
                      <span className="font-medium">
                        {new Date(order.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    {order.phoneNumber && (
                      <div className="flex justify-between items-center py-2 border-b border-navy-deep/5 dark:border-white/5">
                        <span className="font-semibold opacity-70 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Phone</span>
                        <span className="font-mono tracking-wider">{order.phoneNumber}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Summary */}
                <div className="liquid-glass-light dark:liquid-glass-dark border border-navy-deep/10 dark:border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5" /> Payment Summary
                  </h3>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between items-center opacity-80">
                      <span>Cleaning Service Cost</span>
                      <span className="font-semibold">
                        {order.currency} {formatPrice(order.totalServiceAmount, true)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center opacity-80">
                      <span>Pickup Delivery Fee</span>
                      <span className="font-semibold">
                        {order.currency} {formatPrice(order.totalPickDeliveryFee, false)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center opacity-80">
                      <span>Return Delivery Fee</span>
                      <span className="font-semibold">
                        {order.currency} {formatPrice(order.totalReturnDeliveryFee, false)}
                      </span>
                    </div>

                    {order.discountAmount != null && order.discountAmount > 0 && (
                      <div className="flex justify-between items-center text-green-500 font-medium bg-green-500/5 px-2.5 py-1.5 rounded-lg border border-green-500/10">
                        <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> Discount</span>
                        <span>-{order.currency} {Number(order.discountAmount).toFixed(2)}</span>
                      </div>
                    )}

                    <div className="h-px bg-navy-deep/10 dark:bg-white/10 my-3" />

                    {order.discountAmount != null && order.discountAmount > 0 && order.totalAmount != null ? (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-xs opacity-60">Subtotal</span>
                          <span className="text-xs font-semibold line-through opacity-60">
                            {order.currency} {Number(order.totalAmount).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-baseline pt-1">
                          <span className="text-sm font-bold uppercase text-navy-deep dark:text-alabaster">Total You Pay</span>
                          <span className="text-xl font-black text-gold-polished dark:text-gold-metallic">
                            {order.currency}{' '}
                            {order.netAmount != null ? Number(order.netAmount).toFixed(2) : 'Pending'}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between items-baseline pt-1">
                        <span className="text-sm font-bold uppercase text-navy-deep dark:text-alabaster">Total</span>
                        <span className="text-xl font-black text-gold-polished dark:text-gold-metallic">
                          {order.currency}{' '}
                          {order.netAmount != null ? Number(order.netAmount).toFixed(2) : 'Pending'}
                        </span>
                      </div>
                    )}

                    {/* Invoice Toggle – visible only when unpaid but netAmount is defined */}
                    {!order.paymentDate && order.netAmount != null && (
                      <div className="pt-2">
                        <button
                          onClick={handleInvoiceToggle}
                          disabled={togglingInvoice}
                          className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors ${
                            order.invoiceIssued
                              ? 'bg-red-600/10 border border-red-600/30 text-red-600 hover:bg-red-600/20'
                              : 'bg-blue-600/10 border border-blue-600/30 text-blue-600 hover:bg-blue-600/20'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {order.invoiceIssued ? (
                            <>
                              <Ban className="w-3.5 h-3.5" /> Cancel Invoice
                            </>
                          ) : (
                            <>
                              <FileText className="w-3.5 h-3.5" /> Issue Invoice
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Edit Modal – only rendered when modal state is true */}
      {isEditModalOpen && (
        <OrderEditModal
          orderId={orderId}
          onClose={() => setIsEditModalOpen(false)}
          onUpdate={() => {
            setIsEditModalOpen(false);
            fetchOrderDetails();
          }}
        />
      )}
    </div>
  );
}

// ---------- Delivery Group Card (unchanged) ----------
function renderDeliveryGroupCard(
  group: DeliveryGroup,
  currency: string,
  onStatusChange: (type: 'deliveryGroup' | 'subOrder', id: string, direction?: 'next' | 'prev') => void,
  disabled: boolean
) {
  return (
    <div className="liquid-glass-light dark:liquid-glass-dark border border-navy-deep/10 dark:border-white/10 rounded-3xl p-5 sm:p-6 shadow-lg space-y-6 select-none">
      {/* Bag Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-navy-deep/5 dark:border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-black uppercase tracking-widest bg-gold-polished/10 dark:bg-gold-metallic/10 text-gold-polished dark:text-gold-metallic px-2.5 py-1 rounded-md mb-1.5 inline-block">
              {group.deliveryMode} Option
            </span>
            <span className="text-[10px] font-mono text-slate-400 bg-navy-deep/5 dark:bg-white/5 px-2 py-0.5 rounded">
              Bag #{group.id}
            </span>
          </div>
          <h4 className="text-base font-bold text-navy-deep dark:text-alabaster mt-1">
            {group.processingRuleName}
          </h4>
        </div>

        {/* Group Direct Status Updater */}
        <div className="flex flex-col items-start sm:items-end gap-1">
          <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-navy-deep/5 dark:bg-white/5">
            Status: {group.status || "Not Started"}
          </span>
          <div className="flex items-center gap-1.5 mt-1">
            {!group.status ? (
              <button
                disabled={disabled}
                onClick={() => onStatusChange('deliveryGroup', group.id)}
                className="inline-flex items-center gap-1 px-2 py-1 bg-gold-polished text-white text-[10px] font-bold rounded"
              >
                <Play className="w-3 h-3" /> Start Processing
              </button>
            ) : (
              <>
                <button
                  disabled={disabled}
                  onClick={() => onStatusChange('deliveryGroup', group.id, 'prev')}
                  className="p-1 rounded bg-navy-deep/10 dark:bg-white/10 hover:bg-gold-polished hover:text-white transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  disabled={disabled}
                  onClick={() => onStatusChange('deliveryGroup', group.id, 'next')}
                  className="p-1 rounded bg-navy-deep/10 dark:bg-white/10 hover:bg-gold-polished hover:text-white transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
          <Hash className="w-3 h-3" /> Items in this bag
        </p>

        <div className="rounded-2xl border border-navy-deep/5 dark:border-white/5 overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-navy-deep/[2%] dark:bg-white/[2%] text-[10px] uppercase font-bold tracking-wider text-slate-400 border-b border-navy-deep/5 dark:border-white/5">
                <th className="px-4 py-2.5">Item</th>
                <th className="px-4 py-2.5 text-center">Qty</th>
                <th className="px-4 py-2.5 text-center">Status</th>
                <th className="px-4 py-2.5 text-right">Price</th>
              </tr>
            </thead>
            <tbody>
              {group.subOrders.map((so) => (
                <tr key={so.id} className="border-b border-navy-deep/5 dark:border-white/5 last:border-0 hover:bg-navy-deep/[1%] dark:hover:bg-white/[1%]">
                  <td className="px-4 py-3 font-semibold text-navy-deep dark:text-alabaster">{so.name}</td>
                  <td className="px-4 py-3 text-center font-medium opacity-80">{so.quantity}</td>

                  {/* SubOrder Status Controls */}
                  <td className="px-4 py-3 text-center">
                    <div className="inline-flex items-center gap-1">
                      <span className="text-[10px] font-mono mr-1">
                        {so.status || "Not Started"}
                      </span>
                      {!so.status ? (
                        <button
                          disabled={disabled}
                          onClick={() => onStatusChange('subOrder', so.id)}
                          className="px-1.5 py-0.5 bg-gold-polished text-white text-[9px] font-bold rounded"
                        >
                          Start
                        </button>
                      ) : (
                        <>
                          <button
                            disabled={disabled}
                            onClick={() => onStatusChange('subOrder', so.id, 'prev')}
                            className="p-0.5 rounded bg-navy-deep/10 dark:bg-white/10 hover:bg-gold-polished hover:text-white"
                          >
                            <ChevronLeft className="w-3 h-3" />
                          </button>
                          <button
                            disabled={disabled}
                            onClick={() => onStatusChange('subOrder', so.id, 'next')}
                            className="p-0.5 rounded bg-navy-deep/10 dark:bg-white/10 hover:bg-gold-polished hover:text-white"
                          >
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-3 text-right font-mono text-slate-blue dark:text-platinum">
                    {so.finalPrice != null ? `${currency} ${Number(so.finalPrice).toFixed(2)}` : 'Pending'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pickup & Return Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-navy-deep/5 dark:border-white/5">
        {/* Pickup */}
        <div className="p-3.5 rounded-2xl bg-navy-deep/[1.5%] dark:bg-white/[1.5%] space-y-2">
          <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
            <MapPin className="w-3 h-3 text-gold-polished" /> Pickup Address
          </p>
          <p className="text-xs font-medium text-navy-deep dark:text-alabaster min-h-[2rem]">
            {group.pickAddress || "Store drop off"}
          </p>
          {group.pickdeliverycode && (
            <p className="text-[10px] font-mono opacity-60">Tracking: {group.pickdeliverycode}</p>
          )}
          <div className="text-[10px] font-semibold opacity-70">
            Fee: {currency} {Number(group.pickdeliveryfee).toFixed(2)}
          </div>
        </div>

        {/* Return */}
        <div className="p-3.5 rounded-2xl bg-navy-deep/[1.5%] dark:bg-white/[1.5%] space-y-2">
          <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
            <MapPin className="w-3 h-3 text-gold-metallic" /> Return Address
          </p>
          <p className="text-xs font-medium text-navy-deep dark:text-alabaster min-h-[2rem]">
            {group.returnAddress || "Store pickup"}
          </p>
          {group.returndeliverycode && (
            <p className="text-[10px] font-mono text-green-500 font-bold">Return Code: {group.returndeliverycode}</p>
          )}
          <div className="text-[10px] font-semibold opacity-70">
            Fee: {currency} {Number(group.returndeliveryfee).toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
}