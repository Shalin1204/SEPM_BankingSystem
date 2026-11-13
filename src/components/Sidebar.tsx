import { useEffect, useState } from "react";
import type { Screen } from "../App";
import { getStoredUser, api } from "../api/client";

interface SidebarProps {
  current: Screen;
  navigate: (s: Screen) => void;
  currentUser?: any;
}

const navItems: { label: string; screen: Screen; icon: string }[] = [
  { label: "Dashboard", screen: "dashboard", icon: "⊞" },
  { label: "Transactions", screen: "transactions", icon: "↔" },
  { label: "Fraud Detection", screen: "fraud-detection", icon: "⚑" },
  { label: "Fraud Logs", screen: "fraud-logs", icon: "☰" },
  { label: "Investigations", screen: "investigations", icon: "🔍" },
  { label: "Reports & Analytics", screen: "reports", icon: "◈" },
  { label: "Customers", screen: "customers", icon: "◉" },
  { label: "Accounts", screen: "accounts", icon: "▤" },
  { label: "Settings", screen: "settings", icon: "⚙" },
];

export default function Sidebar({ current, navigate, currentUser }: SidebarProps) {
  const [user, setUser] = useState<any>(currentUser || getStoredUser());

  useEffect(() => {
    if (currentUser) {
      setUser(currentUser);
    } else {
      setUser(getStoredUser());
    }
  }, [currentUser]);

  const isActive = (s: Screen) =>
    s === current ||
    (s === "transactions" && current === "transaction-detail") ||
    (s === "investigations" && current === "investigation-detail") ||
    (s === "customers" && current === "customer-detail") ||
    (s === "accounts" && current === "account-detail");

  const handleLogout = async () => {
    await api.auth.logout();
    navigate("login");
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((w: string) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "SA";

  return (
    <aside className="flex flex-col h-full w-58 bg-[#0d1f35] text-white flex-shrink-0" style={{ minWidth: 224 }}>
      {/* Brand */}
      <div className="px-4 py-5 border-b border-white/10">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-7 h-7 bg-[#2563eb] rounded flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            B
          </div>
          <span className="text-[11px] font-semibold text-white/90 leading-tight">
            Banking Transaction<br />Tracking System
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3">
        <div className="px-3 mb-1">
          <span className="text-[10px] font-semibold text-white/30 uppercase tracking-widest px-2">Main Menu</span>
        </div>
        <ul className="mt-1">
          {navItems.map((item) => (
            <li key={item.screen}>
              <button
                onClick={() => navigate(item.screen)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left ${
                  isActive(item.screen)
                    ? "bg-[#2563eb] text-white font-medium"
                    : "text-white/65 hover:bg-white/8 hover:text-white"
                }`}
              >
                <span className="text-base w-4 text-center opacity-80">{item.icon}</span>
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom Profile & Logout */}
      <div className="border-t border-white/10 p-3">
        <div
          onClick={() => navigate("settings")}
          className="flex items-center gap-2.5 px-2 py-2 rounded hover:bg-white/8 cursor-pointer mb-1"
        >
          <div className="w-7 h-7 bg-[#2563eb]/80 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white/90 truncate">{user?.name || "Suresh Agarwal"}</p>
            <p className="text-[10px] text-white/45">{user?.role || "Administrator"}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-colors rounded"
        >
          <span className="text-base">⎋</span>
          Logout
        </button>
      </div>
    </aside>
  );
}
