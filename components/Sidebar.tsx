"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/places", label: "Places", icon: "📍" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen shrink-0 bg-white border-r border-indigo-100 flex flex-col overflow-y-auto">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-indigo-100">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌳</span>
          <span className="text-lg font-bold text-indigo-800">Perfect Walk</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              pathname === item.href
                ? "bg-indigo-50 text-indigo-700"
                : "text-gray-600 hover:bg-indigo-50/60 hover:text-indigo-900"
            }`}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
