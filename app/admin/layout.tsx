import type { Metadata } from "next";
import Link from "next/link";
import React from "react";
import { auth } from "@/auth";
import AdminLogoutButton from "@/components/admin/AdminLogoutButton";

export const metadata: Metadata = {
  title: "Admin Portal - Halisi Gifts Shop",
  description: "Product management and storefront section assigner for Halisi Gifts Shop",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1B1C1C] flex flex-col font-sans">
      <header className="sticky top-0 z-40 bg-white border-b border-black/10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="flex items-center gap-3 group">
              <img
                src="/halisi-logo.png"
                alt="Halisi Logo"
                className="h-9 w-auto object-contain"
              />
              <div className="border-l border-black/15 pl-3">
                <span className="text-sm font-serif font-bold text-black tracking-tight group-hover:text-[#266e00] transition-colors">
                  Halisi Gifts
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-black/80 bg-black/5 hover:bg-black/10 rounded-md transition-colors"
            >
              <svg
                className="w-3.5 h-3.5 text-[#266e00]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
              View Live Store
            </Link>

            {session?.user && (
              <div className="flex items-center gap-3 pl-2 border-l border-black/10">
                <div className="hidden sm:block text-right">
                  <div className="text-xs font-semibold text-gray-900">
                    {session.user.name || "Administrator"}
                  </div>
                  <div className="text-[11px] text-gray-500">
                    {session.user.email}
                  </div>
                </div>
                <AdminLogoutButton />
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <footer className="border-t border-black/10 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-black/60 gap-2">
          <span>Halisi Gifts Shop - Admin Product Management System</span>
          <span>Catalog &amp; Section Manager</span>
        </div>
      </footer>
    </div>
  );
}

