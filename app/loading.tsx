// app/loading.tsx
import React from 'react';

export default function ServiceCatalogLoading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-400 text-sm font-medium animate-pulse tracking-wide">
        Loading...
      </p>
    </div>
  );
}