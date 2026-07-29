//app/(auth)/verify-email/page.tsx
'use client';

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, RefreshCw, ArrowRight } from "lucide-react";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState<boolean>(true);
  const [success, setSuccess] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("Verifying your email address...");

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setSuccess(false);
      setMessage("Missing verification token in URL.");
      return;
    }

    // Trigger API GET endpoint directly
    window.location.href = `/api/auth/verify-email?token=${token}`;
  }, [token]);

  return (
    <div className="w-full min-h-[calc(100vh-80px)] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md liquid-glass-light dark:liquid-glass-dark p-8 sm:p-10 rounded-3xl border border-navy-deep/10 dark:border-white/10 shadow-2xl text-center"
      >
        {loading ? (
          <div className="py-8 flex flex-col items-center justify-center gap-4">
            <RefreshCw className="w-10 h-10 text-gold-polished dark:text-gold-metallic animate-spin" />
            <h2 className="text-xl font-bold">Verifying Email...</h2>
            <p className="text-xs text-slate-blue dark:text-platinum">{message}</p>
          </div>
        ) : success ? (
          <div className="py-4 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-green-500/10 text-green-500 border border-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tight">Email Verified</h2>
            <p className="text-xs text-slate-blue dark:text-platinum mb-4">{message}</p>
            <Link
              href="/login"
              className="w-full py-3.5 rounded-xl bg-gold-polished dark:bg-gold-metallic text-white dark:text-canvas-dark text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg"
            >
              Continue to Login <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="py-4 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 flex items-center justify-center">
              <XCircle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tight">Verification Failed</h2>
            <p className="text-xs text-slate-blue dark:text-platinum mb-4">{message}</p>
            <Link
              href="/login"
              className="w-full py-3.5 rounded-xl border border-navy-deep/10 dark:border-white/10 text-xs font-bold uppercase tracking-wider hover:bg-navy-deep/5 dark:hover:bg-white/5 transition-colors"
            >
              Back to Login
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
}