// app/(customer)/profile/page.tsx
'use client';

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, 
  MapPin, 
  Lock, 
  Building, 
  Trash2, 
  CheckCircle, 
  Loader2, 
  Edit3,
  Check,
  X,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Pencil,
  Save
} from "lucide-react";

interface Address {
  id: string;
  label: string;
  address: string;
  isDefault: boolean;
}

interface UserProfile {
  name: string;
  role: string;
  companyAddressName: string | null;
  hasPassword: boolean;
  hasGoogleCredential: boolean;
  addresses: Address[];
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Form Management states
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState("");
  
  // Password changes states
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdFeedback, setPwdFeedback] = useState<{ success?: string; error?: string } | null>(null);

  // Address label editing states
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");

  // Nominatim & Address Management States
  const [addressLabel, setAddressLabel] = useState("");
  const [addressInput, setAddressInput] = useState("");
  const [geoSuggestions, setGeoSuggestions] = useState<any[]>([]);
  const [addressFeedback, setAddressFeedback] = useState<string | null>(null);
  
  // Rate-limiting timestamp storage
  const [lastGeocodeTime, setLastGeocodeTime] = useState<number>(0);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/profile");
      if (!res.ok) throw new Error("Could not retrieve user profile records.");
      const data = await res.json();
      setProfile(data);
      setEditName(data.name);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Update Display Name Handler
  const handleUpdateName = async () => {
    if (!editName.trim()) return;
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "changeName", name: editName })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      setProfile(prev => prev ? { ...prev, name: editName.trim() } : null);
      setIsEditingName(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Update Password Form Submit Handler
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdFeedback(null);
    if (newPassword !== confirmPassword) {
      setPwdFeedback({ error: "Confirmation password does not match." });
      return;
    }
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "changePassword", oldPassword, newPassword, confirmPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      setPwdFeedback({ success: "Password updated successfully." });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPwdFeedback({ error: err.message });
    }
  };

  // OpenStreetMap Location Query Lookup
  const handleAddressLookup = async () => {
    if (!addressInput.trim()) return;
    
    const now = Date.now();
    if (now - lastGeocodeTime < 60000) {
      const remainingSeconds = Math.ceil((60000 - (now - lastGeocodeTime)) / 1000);
      setAddressFeedback(`Rate limit exceeded. Please wait ${remainingSeconds}s before validating again.`);
      return;
    }

    setLastGeocodeTime(now);
    setAddressFeedback(null);
    
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressInput)}&limit=3`);
      if (!res.ok) throw new Error();
      const items = await res.json();
      setGeoSuggestions(items);
      if (items.length === 0) {
        setAddressFeedback("No structured map intersections located. Refine coordinates syntax.");
      }
    } catch {
      setAddressFeedback("Geocoding configuration failure. Try again shortly.");
    }
  };

  // Confirm and Submit Location Payload
  const handleAddAddress = async (selected: any) => {
    if (!addressLabel.trim()) {
      setAddressFeedback("A tracking descriptive label is required (e.g., Home, Work).");
      return;
    }

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addAddress",
          label: addressLabel,
          address: selected.display_name,
          latitude: selected.lat,
          longitude: selected.lon
        })
      });
      
      if (!res.ok) throw new Error("Could not register incoming routing profile.");
      
      setAddressInput("");
      setAddressLabel("");
      setGeoSuggestions([]);
      fetchProfile();
    } catch (err: any) {
      setAddressFeedback(err.message);
    }
  };

  // Update Address Label Handler
  const handleUpdateAddressLabel = async (addressId: string, newLabel: string) => {
    if (!newLabel.trim()) {
      setAddressFeedback("Label cannot be empty.");
      return;
    }

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateAddressLabel",
          addressId,
          label: newLabel.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setEditingAddressId(null);
      setEditLabel("");
      fetchProfile(); // refresh to show updated label
    } catch (err: any) {
      setAddressFeedback(err.message);
    }
  };

  // Mutate Default Selection Address
  const handleSetDefaultAddress = async (id: string) => {
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addressId: id })
      });
      if (!res.ok) throw new Error();
      fetchProfile();
    } catch {
      alert("Error updating routing structures.");
    }
  };

  // Remove Address Handler
  const handleDeleteAddress = async (id: string) => {
    try {
      const res = await fetch(`/api/profile?addressId=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      fetchProfile();
    } catch {
      alert("Error processing location excision pipeline.");
    }
  };

  // Cancel label edit
  const cancelLabelEdit = () => {
    setEditingAddressId(null);
    setEditLabel("");
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-canvas-light dark:bg-canvas-dark">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-gold-polished animate-spin" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Parsing profile datasets...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center p-8 border border-red-500/30 liquid-glass-light dark:liquid-glass-dark rounded-3xl shadow-xl">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold mb-2">Failed to load core components</h3>
          <p className="text-xs text-slate-blue dark:text-platinum mb-6 opacity-80">{error || "Missing runtime state configuration."}</p>
          <button onClick={fetchProfile} className="px-6 py-2.5 rounded-xl bg-gold-polished text-white text-xs font-bold uppercase tracking-wider">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex-1 flex flex-col selection:bg-gold-metallic/30">
      
      {/* HEADER META CARD */}
      <div className="text-left mb-12 flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-navy-deep/5 dark:border-white/5 pb-8">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tight mb-3">
            Account Management{" "}
            <span className="bg-gradient-to-r from-gold-polished via-gold-metallic to-gold-pastel bg-clip-text text-transparent">
              Settings
            </span>
          </h1>
          <p className="text-slate-blue dark:text-platinum text-sm max-w-xl">
            Maintain your logistics records, authorization metrics, and identity validation credentials.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest bg-gold-polished/10 dark:bg-gold-metallic/10 text-gold-polished dark:text-gold-metallic border border-gold-metallic/20">
            System Level: {profile.role}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: PRIMARY PROFILE DATA */}
        <div className="lg:col-span-5 flex flex-col gap-8">
          
          {/* USER INFO PANEL */}
          <div className="rounded-3xl border border-navy-deep/10 dark:border-white/10 p-6 liquid-glass-light dark:liquid-glass-dark shadow-xl">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
              <User className="w-4 h-4 text-gold-polished" /> Personal Parameters
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Display Profile Identifier Name</label>
                <div className="flex items-center gap-3">
                  <AnimatePresence mode="wait">
                    {!isEditingName ? (
                      <motion.div key="view" className="flex-1 flex items-center justify-between bg-white/20 dark:bg-navy-deep/40 px-4 py-3 rounded-xl border border-navy-deep/5 dark:border-white/5">
                        <span className="text-sm font-semibold">{profile.name}</span>
                        {!profile.hasGoogleCredential && (
                          <button onClick={() => setIsEditingName(true)} className="p-1.5 hover:text-gold-polished transition-colors">
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                      </motion.div>
                    ) : (
                      <motion.div key="edit" className="flex-1 flex items-center gap-2" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                        <input 
                          type="text" 
                          value={editName} 
                          onChange={(e) => setEditName(e.target.value)} 
                          className="flex-1 px-4 py-2 rounded-xl border border-gold-polished bg-white/40 dark:bg-navy-deep/60 text-sm focus:outline-none"
                        />
                        <button onClick={handleUpdateName} className="p-2 rounded-xl bg-green-500 text-white hover:opacity-90 transition-opacity">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setIsEditingName(false); setEditName(profile.name); }} className="p-2 rounded-xl bg-red-500 text-white hover:opacity-90 transition-opacity">
                          <X className="w-4 h-4" />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                {profile.hasGoogleCredential && (
                  <p className="text-[10px] text-slate-400 mt-2 font-medium">Identity attributes verified via third-party Google Federated OAuth credentials.</p>
                )}
              </div>

              {profile.companyAddressName && (
                <div className="pt-4 border-t border-navy-deep/5 dark:border-white/5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Affiliated Workspace Headquarters</label>
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-blue dark:text-platinum">
                    <Building className="w-4 h-4 text-gold-polished shrink-0" />
                    <span>{profile.companyAddressName}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SECURITY AUTHORIZATION CARD - only if hasPassword */}
          {profile.hasPassword && (
            <div className="rounded-3xl border border-navy-deep/10 dark:border-white/10 p-6 liquid-glass-light dark:liquid-glass-dark shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-gold-polished" /> Security Modifications
                </h3>
                <button
                  onClick={() => {
                    setShowPasswordForm(!showPasswordForm);
                    if (!showPasswordForm) {
                      // Reset feedback when opening
                      setPwdFeedback(null);
                    }
                  }}
                  className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-gold-polished transition-colors"
                >
                  {showPasswordForm ? (
                    <>Hide <ChevronUp className="w-4 h-4" /></>
                  ) : (
                    <>Change Password <ChevronDown className="w-4 h-4" /></>
                  )}
                </button>
              </div>

              <AnimatePresence initial={false}>
                {showPasswordForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: "auto", marginTop: 16 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <form onSubmit={handleChangePassword} className="space-y-4">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Current Password</label>
                        <input 
                          type="password" 
                          required
                          value={oldPassword} 
                          onChange={(e) => setOldPassword(e.target.value)} 
                          className="w-full px-4 py-2.5 rounded-xl border border-navy-deep/10 dark:border-white/10 bg-white/40 dark:bg-navy-deep/40 text-xs focus:outline-none focus:border-gold-polished transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">New Password</label>
                        <input 
                          type="password" 
                          required
                          value={newPassword} 
                          onChange={(e) => setNewPassword(e.target.value)} 
                          className="w-full px-4 py-2.5 rounded-xl border border-navy-deep/10 dark:border-white/10 bg-white/40 dark:bg-navy-deep/40 text-xs focus:outline-none focus:border-gold-polished transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Confirm New Password</label>
                        <input 
                          type="password" 
                          required
                          value={confirmPassword} 
                          onChange={(e) => setConfirmPassword(e.target.value)} 
                          className="w-full px-4 py-2.5 rounded-xl border border-navy-deep/10 dark:border-white/10 bg-white/40 dark:bg-navy-deep/40 text-xs focus:outline-none focus:border-gold-polished transition-all"
                        />
                      </div>

                      {pwdFeedback && (
                        <div className={`p-3 rounded-lg text-xs font-semibold ${pwdFeedback.success ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                          {pwdFeedback.success || pwdFeedback.error}
                        </div>
                      )}

                      <button type="submit" className="w-full py-3 mt-2 rounded-xl bg-navy-deep dark:bg-white text-white dark:text-canvas-dark text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity">
                        Update Password
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: LOGISTICS ADDRESSES HUB */}
        <div className="lg:col-span-7 flex flex-col gap-8">
          
          {/* LIVE USER ROUTING INDICES */}
          <div className="rounded-3xl border border-navy-deep/10 dark:border-white/10 p-6 liquid-glass-light dark:liquid-glass-dark shadow-xl">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gold-polished" /> Registered Logistics Terminals
            </h3>

            <div className="space-y-4 mb-8">
              <AnimatePresence initial={false}>
                {profile.addresses.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-navy-deep/10 dark:border-white/10 rounded-2xl">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">No localized coordinates configured.</p>
                  </div>
                ) : (
                  profile.addresses.map((addr) => (
                    <motion.div 
                      key={addr.id} 
                      initial={{ opacity: 0, y: 10 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      exit={{ opacity: 0, x: -20 }}
                      className={`p-4 rounded-2xl border flex items-start justify-between gap-4 group transition-all duration-300 ${addr.isDefault ? 'border-gold-polished dark:border-gold-metallic bg-gold-metallic/[2%]' : 'border-navy-deep/10 dark:border-white/10 bg-transparent'}`}
                    >
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {editingAddressId === addr.id ? (
                            <div className="flex items-center gap-2 flex-1">
                              <input 
                                type="text"
                                value={editLabel}
                                onChange={(e) => setEditLabel(e.target.value)}
                                className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded border border-gold-polished bg-white/40 dark:bg-navy-deep/40 focus:outline-none flex-1 min-w-0"
                                autoFocus
                              />
                              <button 
                                onClick={() => handleUpdateAddressLabel(addr.id, editLabel)}
                                className="p-1 rounded bg-green-500 text-white hover:opacity-80"
                              >
                                <Save className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={cancelLabelEdit}
                                className="p-1 rounded bg-red-500 text-white hover:opacity-80"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <span className="text-xs font-black uppercase tracking-wider bg-navy-deep/5 dark:bg-white/5 px-2 py-0.5 rounded text-navy-deep dark:text-alabaster">
                                {addr.label}
                              </span>
                              <button 
                                onClick={() => {
                                  setEditingAddressId(addr.id);
                                  setEditLabel(addr.label || '');
                                }}
                                className="text-slate-400 hover:text-gold-polished transition-colors"
                                aria-label="Edit label"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          {addr.isDefault && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full border border-green-500/20">
                              <CheckCircle className="w-2.5 h-2.5" /> Primary
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-medium text-slate-blue dark:text-platinum leading-relaxed truncate">{addr.address}</p>
                      </div>

                      <div className="flex items-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        {!addr.isDefault && (
                          <button 
                            onClick={() => handleSetDefaultAddress(addr.id)} 
                            className="px-2.5 py-1 rounded-lg border border-navy-deep/10 dark:border-white/10 text-[10px] font-bold uppercase tracking-wider hover:bg-gold-metallic/5 transition-colors whitespace-nowrap"
                          >
                            Set Primary
                          </button>
                        )}
                        <button 
                          onClick={() => handleDeleteAddress(addr.id)} 
                          className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors" 
                          aria-label="Remove Coordinate Reference"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>

            {/* OPENSTREETMAP INCORPORATION WIDGET */}
            <div className="pt-6 border-t border-navy-deep/5 dark:border-white/5 space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Add Logistics Reference</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input 
                  type="text" 
                  placeholder="Label (e.g. Home)" 
                  value={addressLabel}
                  onChange={(e) => setAddressLabel(e.target.value)}
                  className="px-4 py-2.5 text-xs rounded-xl border border-navy-deep/10 dark:border-white/10 bg-white/40 dark:bg-navy-deep/40 text-navy-deep dark:text-alabaster focus:outline-none focus:border-gold-polished"
                />
                <div className="sm:col-span-2 flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Type Street Address to verify..." 
                    value={addressInput}
                    onChange={(e) => setAddressInput(e.target.value)}
                    className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-navy-deep/10 dark:border-white/10 bg-white/40 dark:bg-navy-deep/40 text-navy-deep dark:text-alabaster focus:outline-none focus:border-gold-polished"
                  />
                  <button type="button" onClick={handleAddressLookup} className="px-4 py-2.5 rounded-xl bg-gold-polished text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center">
                    Verify
                  </button>
                </div>
              </div>

              {addressFeedback && (
                <div className="p-3 bg-gold-polished/10 dark:bg-gold-metallic/10 rounded-xl text-xs text-gold-polished dark:text-gold-pastel font-medium border border-gold-metallic/20">
                  {addressFeedback}
                </div>
              )}

              {/* GEO SUGGESTION ACCORDIONS */}
              <AnimatePresence>
                {geoSuggestions.length > 0 && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-2 max-h-48 overflow-y-auto border border-navy-deep/10 dark:border-white/10 p-2 rounded-xl bg-white/10 dark:bg-black/10">
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider px-2">Map Intersections Located. Click to lock down allocation:</p>
                    {geoSuggestions.map((suggestion, idx) => (
                      <button 
                        key={idx} 
                        onClick={() => handleAddAddress(suggestion)}
                        className="w-full text-left p-2 hover:bg-gold-metallic/5 rounded-lg text-xs font-medium text-slate-blue dark:text-platinum transition-colors flex items-center gap-2 border border-transparent hover:border-gold-metallic/20"
                      >
                        <MapPin className="w-3.5 h-3.5 text-gold-polished shrink-0" />
                        <span className="truncate">{suggestion.display_name}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}