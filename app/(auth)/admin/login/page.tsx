//app/(auth)/admin/login/page.tsx
'use client';

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  RefreshCw, 
  AlertCircle 
} from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all credentials.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError(res.error);
      } else if (res?.ok) {
        router.push("/admin/address");
        router.refresh();
      }
    } catch (err: any) {
      setError("An unexpected admin auth error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAdminSignIn = async () => {
    try {
      setGoogleLoading(true);
      setError(null);
      await signIn("google", { callbackUrl: "/admin/address?role=admin" });
    } catch (err) {
      setError("Failed to initiate Google OAuth.");
      setGoogleLoading(false);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-80px)] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md liquid-glass-light dark:liquid-glass-dark p-8 sm:p-10 rounded-3xl border border-navy-deep/20 dark:border-white/10 shadow-2xl relative overflow-hidden"
      >
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gold-polished/10 dark:bg-gold-metallic/10 border border-gold-polished/30 flex items-center justify-center mx-auto mb-4 text-gold-polished dark:text-gold-metallic">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tight mb-2">
            Admin <span className="bg-gradient-to-r from-gold-polished via-gold-metallic to-gold-pastel bg-clip-text text-transparent">Portal</span>
          </h1>
          <p className="text-xs text-slate-blue dark:text-platinum">
            Authorized management access required.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
              Admin Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@company.com"
                required
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-navy-deep/10 dark:border-white/10 bg-white/40 dark:bg-navy-deep/40 text-xs text-navy-deep dark:text-alabaster focus:outline-none focus:border-gold-polished transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Password
              </label>
              <Link 
                href="/reset-password"
                className="text-[10px] font-bold text-gold-polished dark:text-gold-pastel hover:underline"
              >
                Forgot?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-11 pr-11 py-3 rounded-xl border border-navy-deep/10 dark:border-white/10 bg-white/40 dark:bg-navy-deep/40 text-xs text-navy-deep dark:text-alabaster focus:outline-none focus:border-gold-polished transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy-deep dark:hover:text-alabaster transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gold-polished dark:bg-gold-metallic text-white dark:text-canvas-dark text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg hover:shadow-gold-metallic/20 disabled:opacity-50 transition-all mt-2"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Admin Login <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-navy-deep/10 dark:border-white/10" />
          </div>
          <span className="relative px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-white dark:bg-canvas-dark">
            Or Single Sign-On
          </span>
        </div>

        <button
          type="button"
          onClick={handleGoogleAdminSignIn}
          disabled={googleLoading}
          className="w-full py-3 rounded-xl border border-navy-deep/10 dark:border-white/10 bg-white/50 dark:bg-navy-deep/50 hover:bg-gold-metallic/5 text-xs font-bold text-navy-deep dark:text-alabaster flex items-center justify-center gap-3 transition-all disabled:opacity-50"
        >
          {googleLoading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Shield className="w-4 h-4 text-gold-polished" />
              Google Admin SSO
            </>
          )}
        </button>

        <p className="mt-8 text-center text-xs text-slate-blue dark:text-platinum">
          Need an admin account?{" "}
          <Link href="/admin/signup" className="font-bold text-gold-polished dark:text-gold-pastel hover:underline">
            Request Registration
          </Link>
        </p>
      </motion.div>
    </div>
  );
}