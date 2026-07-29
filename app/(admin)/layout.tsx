// app/(admin)/layout.tsx
'use client';

import React, { useState } from "react";
import AdminSidebar from "@/components/admin/sidebar";
import AdminTopbar from "@/components/admin/topbar";

export default function AdminShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-canvas-light dark:bg-canvas-dark">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col lg:ml-72 transition-all duration-300">
        <AdminTopbar onMenuClick={() => setSidebarOpen(true)} />

        {/* pt-0 brings content right to the topbar; adjust as needed */}
        <main className="flex-1 pt-0 pb-6 px-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}