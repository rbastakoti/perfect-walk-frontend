"use client";

import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/places": "Nearby Places",
};

export default function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const pageTitle = PAGE_TITLES[pathname] ?? "Dashboard";

  return (
    <header className="h-16 shrink-0 bg-white border-b border-indigo-100 px-6 flex items-center justify-between shadow-sm">
      <h2 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider">
        {pageTitle}
      </h2>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          {session?.user?.image ? (
            <img
              src={session.user.image}
              alt={session.user.name || "User"}
              className="w-8 h-8 rounded-full border-2 border-indigo-200"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-sm font-bold">
              {session?.user?.name?.[0]?.toUpperCase() || "U"}
            </div>
          )}
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-800 leading-tight">
              {session?.user?.name}
            </p>
            <p className="text-xs text-gray-500 leading-tight">{session?.user?.email}</p>
          </div>
        </div>

        <div className="w-px h-6 bg-indigo-100" />

        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="text-sm text-gray-500 hover:text-red-500 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
