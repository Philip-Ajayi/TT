"use client";

import React from "react";

interface AuthCardProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export function AuthCard({ children, title, subtitle }: AuthCardProps) {
  return (
    <div className="w-full max-w-md backdrop-blur-xl bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/50 dark:border-zinc-800/50 shadow-2xl rounded-3xl p-8 sm:p-10 transition-all duration-300 transform">
      <div className="flex flex-col space-y-2 text-center mb-8">
        <div className="mx-auto h-12 w-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/20">
          P
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mt-4">
          {title}
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {subtitle}
        </p>
      </div>
      {children}
    </div>
  );
}