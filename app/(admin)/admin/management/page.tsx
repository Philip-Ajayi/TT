// app/(admin)/admin/management/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import {
  ShieldCheck,
  UserCheck,
  UserX,
  Building2,
  RefreshCw,
  AlertCircle,
  X,
  Edit2,
  Save,
  CheckCircle,
  XCircle,
  UserMinus,
  MapPin,
  Users,
} from 'lucide-react';

import 'swiper/css';
import 'swiper/css/pagination';

// ---------- TYPES ----------
interface Workspace {
  id: string;
  address: string;
}

interface AdminUser {
  id: string;
  adminApproved: boolean;
  workspace: Workspace | null;
}

interface CompanyAddress {
  id: string;
  address: string;
  createdAt: string;
}

export default function AdminManagementPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [addresses, setAddresses] = useState<CompanyAddress[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Workspace Modal / Change State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>('');
  const [modalMode, setModalMode] = useState<'approve' | 'changeWorkspace'>('approve');

  // Form submitting / action states
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // ---------- FETCH DATA ----------
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [adminsRes, addressesRes] = await Promise.all([
        fetch('/api/admin'),
        fetch('/api/address'),
      ]);

      if (!adminsRes.ok) throw new Error('Failed to fetch admin accounts.');
      if (!addressesRes.ok) throw new Error('Failed to fetch company addresses.');

      const adminsData = await adminsRes.json();
      const addressesData = await addressesRes.json();

      setAdmins(adminsData);
      setAddresses(addressesData);
    } catch (err: any) {
      setError(err.message || 'An error occurred while loading admin management data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ---------- ACTIONS ----------

  // 1. Revert Admin to Customer (Strip Status)
  const handleRevertToCustomer = async (adminId: string) => {
    if (!confirm('Are you sure you want to strip this user of admin privileges? They will be reverted to a customer.')) {
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`/api/admin/${adminId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'revertToCustomer' }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to revert admin status.');

      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error executing action.');
    } finally {
      setSubmitting(false);
    }
  };

  // Open modal to assign/change workspace
  const openWorkspaceModal = (admin: AdminUser, mode: 'approve' | 'changeWorkspace') => {
    setSelectedAdmin(admin);
    setModalMode(mode);
    setSelectedWorkspaceId(admin.workspace?.id || (addresses[0]?.id ?? ''));
    setActionError(null);
    setIsModalOpen(true);
  };

  // Submit Approval or Change Workspace Form
  const handleWorkspaceAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmin) return;

    if (!selectedWorkspaceId) {
      setActionError('Please select a company workspace address.');
      return;
    }

    try {
      setSubmitting(true);
      setActionError(null);

      const res = await fetch(`/api/admin/${selectedAdmin.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: modalMode,
          workspaceId: selectedWorkspaceId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Operation failed.');

      setIsModalOpen(false);
      setSelectedAdmin(null);
      fetchData();
    } catch (err: any) {
      setActionError(err.message || 'An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex-1 flex flex-col">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tight mb-2">
            Admin{' '}
            <span className="bg-gradient-to-r from-gold-polished via-gold-metallic to-gold-pastel bg-clip-text text-transparent">
              Management
            </span>
          </h1>
          <p className="text-slate-blue dark:text-platinum text-sm max-w-xl">
            Approve new admin requests, assign workspace addresses, and manage access levels.
          </p>
        </div>

        <button
          onClick={fetchData}
          className="px-5 py-3 rounded-xl border border-navy-deep/10 dark:border-white/10 hover:bg-navy-deep/5 dark:hover:bg-white/5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Data
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full">
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
                Loading admin accounts...
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
                <h3 className="text-base font-bold mb-1">Failed to load admins</h3>
                <p className="text-xs text-slate-blue dark:text-platinum mb-4 opacity-80">{error}</p>
                <button
                  onClick={fetchData}
                  className="px-5 py-2 rounded-xl bg-gold-polished text-white text-xs font-bold uppercase tracking-wider shadow-md"
                >
                  Retry Query
                </button>
              </div>
            </motion.div>
          ) : admins.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-20 text-center liquid-glass-light dark:liquid-glass-dark rounded-3xl border border-dashed border-navy-deep/10 dark:border-white/10 p-12"
            >
              <Users className="w-12 h-12 text-slate-400 mx-auto mb-4 opacity-60" />
              <h3 className="text-lg font-bold mb-1 text-navy-deep dark:text-alabaster">
                No Admin Accounts Found
              </h3>
              <p className="text-xs text-slate-blue dark:text-platinum max-w-sm mx-auto opacity-70">
                There are currently no admin accounts waiting for approval or active in the database.
              </p>
            </motion.div>
          ) : (
            <div className="w-full space-y-8">
              {/* DESKTOP TABLE */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="hidden md:block w-full overflow-hidden rounded-3xl border border-navy-deep/10 dark:border-white/10 liquid-glass-light dark:liquid-glass-dark shadow-2xl"
              >
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="border-b border-navy-deep/10 dark:border-white/10 bg-navy-deep/[2%] dark:bg-white/[2%]">
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Approval Status</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Admin ID</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Assigned Workspace Address</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {admins.map((item, idx) => (
                        <motion.tr
                          key={item.id}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          className="border-b border-navy-deep/5 dark:border-white/5 last:border-0 hover:bg-navy-deep/[1%] dark:hover:bg-white/[1%] transition-colors"
                        >
                          {/* Approval Status */}
                          <td className="px-6 py-4">
                            {item.adminApproved ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase bg-green-500/10 text-green-500 border border-green-500/20">
                                <CheckCircle className="w-3.5 h-3.5" /> Approved
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                <XCircle className="w-3.5 h-3.5" /> Pending Approval
                              </span>
                            )}
                          </td>

                          {/* Admin ID */}
                          <td className="px-6 py-4 text-xs font-mono font-bold text-navy-deep dark:text-alabaster">
                            <span className="bg-gold-polished/10 px-2.5 py-1 rounded-md text-gold-polished dark:text-gold-metallic">
                              {item.id}
                            </span>
                          </td>

                          {/* Workspace Address */}
                          <td className="px-6 py-4 text-xs font-semibold text-slate-blue dark:text-platinum">
                            {item.workspace ? (
                              <div className="flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-gold-polished shrink-0" />
                                <span>{item.workspace.address}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 font-sans italic">Unassigned</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {!item.adminApproved ? (
                                <button
                                  onClick={() => openWorkspaceModal(item, 'approve')}
                                  disabled={submitting}
                                  className="px-3 py-1.5 rounded-xl bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500/20 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5"
                                  title="Approve Admin"
                                >
                                  <UserCheck className="w-3.5 h-3.5" /> Approve
                                </button>
                              ) : (
                                <button
                                  onClick={() => openWorkspaceModal(item, 'changeWorkspace')}
                                  disabled={submitting}
                                  className="p-2 rounded-xl border border-navy-deep/10 dark:border-white/10 hover:bg-navy-deep/5 dark:hover:bg-white/5 transition-all text-gold-polished"
                                  title="Change Workspace Address"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                              )}

                              <button
                                onClick={() => handleRevertToCustomer(item.id)}
                                disabled={submitting}
                                className="p-2 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-all"
                                title="Strip Admin Status (Revert to Customer)"
                              >
                                <UserMinus className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>

              {/* MOBILE SWIPER VIEW */}
              <div className="block md:hidden w-full">
                <Swiper
                  modules={[Pagination]}
                  spaceBetween={16}
                  slidesPerView={1.1}
                  pagination={{ clickable: true, dynamicBullets: true }}
                  className="pb-12"
                >
                  {admins.map((item) => (
                    <SwiperSlide key={item.id}>
                      <div className="liquid-glass-light dark:liquid-glass-dark p-6 rounded-3xl border border-navy-deep/10 dark:border-white/10 flex flex-col justify-between h-full min-h-[260px] shadow-lg">
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            {item.adminApproved ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-green-500/10 text-green-500 border border-green-500/20">
                                <CheckCircle className="w-3.5 h-3.5" /> Approved
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                <XCircle className="w-3.5 h-3.5" /> Pending
                              </span>
                            )}

                            <button
                              onClick={() => handleRevertToCustomer(item.id)}
                              className="p-2 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors"
                              title="Strip Admin Status"
                            >
                              <UserMinus className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="mb-4">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                              Admin User ID
                            </span>
                            <p className="text-xs font-mono font-bold text-gold-polished dark:text-gold-metallic truncate">
                              {item.id}
                            </p>
                          </div>

                          <div className="text-xs">
                            <span className="text-[10px] font-bold text-slate-400 block uppercase mb-1">
                              Assigned Workspace
                            </span>
                            <p className="font-medium text-navy-deep dark:text-alabaster flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-gold-polished shrink-0" />
                              {item.workspace ? item.workspace.address : 'Unassigned'}
                            </p>
                          </div>
                        </div>

                        <div className="pt-4 mt-4 border-t border-navy-deep/5 dark:border-white/5 flex items-center justify-end gap-2">
                          {!item.adminApproved ? (
                            <button
                              onClick={() => openWorkspaceModal(item, 'approve')}
                              className="w-full py-2.5 rounded-xl bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500/20 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                            >
                              <UserCheck className="w-4 h-4" /> Approve Admin
                            </button>
                          ) : (
                            <button
                              onClick={() => openWorkspaceModal(item, 'changeWorkspace')}
                              className="w-full py-2.5 rounded-xl border border-navy-deep/10 dark:border-white/10 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                            >
                              <Edit2 className="w-4 h-4 text-gold-polished" /> Change Workspace
                            </button>
                          )}
                        </div>
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* WORKSPACE ASSIGNMENT MODAL */}
      <AnimatePresence>
        {isModalOpen && selectedAdmin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-navy-deep/60 backdrop-blur-md"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg rounded-3xl border border-navy-deep/10 dark:border-white/10 bg-white dark:bg-canvas-dark p-6 sm:p-8 shadow-2xl z-10 overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between pb-4 border-b border-navy-deep/10 dark:border-white/10 mb-6">
                <h3 className="text-lg font-black uppercase tracking-wide flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-gold-polished" />
                  {modalMode === 'approve' ? 'Approve Admin Account' : 'Change Workspace Address'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-xl hover:bg-navy-deep/5 dark:hover:bg-white/5 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleWorkspaceAction} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                    Admin User ID
                  </label>
                  <p className="text-xs font-mono font-bold text-navy-deep dark:text-alabaster bg-navy-deep/5 dark:bg-white/5 p-3 rounded-xl border border-navy-deep/10 dark:border-white/10">
                    {selectedAdmin.id}
                  </p>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
                    Assign Company Workspace Address
                  </label>
                  {addresses.length === 0 ? (
                    <p className="text-xs text-red-500">
                      No company addresses found. Please create company addresses in the database first.
                    </p>
                  ) : (
                    <div className="relative">
                      <select
                        value={selectedWorkspaceId}
                        onChange={(e) => setSelectedWorkspaceId(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-navy-deep/10 dark:border-white/10 bg-white/40 dark:bg-navy-deep/40 text-xs text-navy-deep dark:text-alabaster focus:outline-none focus:border-gold-polished transition-all appearance-none"
                      >
                        {addresses.map((addr) => (
                          <option key={addr.id} value={addr.id}>
                            {addr.address}
                          </option>
                        ))}
                      </select>
                      <MapPin className="w-4 h-4 text-slate-400 absolute right-4 top-3.5 pointer-events-none" />
                    </div>
                  )}
                </div>

                {actionError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {actionError}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-6 border-t border-navy-deep/10 dark:border-white/10 flex items-center justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-navy-deep/10 dark:border-white/10 text-xs font-semibold uppercase hover:bg-navy-deep/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || addresses.length === 0}
                    className="px-6 py-2.5 rounded-xl bg-gold-polished dark:bg-gold-metallic text-white dark:text-canvas-dark text-xs font-bold uppercase tracking-wider shadow-md hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-2"
                  >
                    {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    {modalMode === 'approve' ? 'Confirm Approval' : 'Update Workspace'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}