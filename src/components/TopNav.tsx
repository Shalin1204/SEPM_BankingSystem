import { useState, useRef, useEffect } from "react";
import type { Screen } from "../App";
import { getStoredUser, api } from "../api/client";

interface Notification {
  id: string;
  type: "fraud" | "suspicious" | "transaction" | "system";
  title: string;
  message: string;
  time: string;
  read: boolean;
  txId?: string;
}

const typeConfig = {
  fraud: { icon: "🚨", bg: "bg-red-50", dot: "bg-red-500", label: "bg-red-100 text-red-700" },
  suspicious: { icon: "⚠️", bg: "bg-orange-50", dot: "bg-orange-500", label: "bg-orange-100 text-orange-700" },
  transaction: { icon: "↔", bg: "bg-blue-50", dot: "bg-blue-500", label: "bg-blue-100 text-blue-700" },
  system: { icon: "⚙", bg: "bg-gray-50", dot: "bg-gray-400", label: "bg-gray-100 text-gray-600" },
};

interface TopNavProps {
  title: string;
  subtitle?: string;
  navigate?: (s: Screen) => void;
  onSelectTransaction?: (id: string) => void;
  currentUser?: any;
}

export default function TopNav({ title, subtitle, navigate, onSelectTransaction, currentUser }: TopNavProps) {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<any>(currentUser || getStoredUser());
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "fraud" | "suspicious" | "transaction">("all");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentUser) {
      setUser(currentUser);
    } else {
      setUser(getStoredUser());
    }
  }, [currentUser]);

  // Load real notifications from backend stats/alerts
  useEffect(() => {
    const loadAlerts = async () => {
      try {
        const stats = await api.stats.getStats();
        const alerts = stats?.recentFraudAlerts || [];
        const recentTxns = stats?.recentTransactions || [];

        const notifs: Notification[] = [];

        alerts.forEach((a: any, i: number) => {
          notifs.push({
            id: `N-ALERT-${i}`,
            type: a.riskLevel === "Critical" ? "fraud" : "suspicious",
            title: a.riskLevel === "Critical" ? "Critical Fraud Alert" : "Suspicious Activity Detected",
            message: `${a.transactionId} — ${a.reason} (${a.customerName})`,
            time: a.time || "Recently",
            read: false,
            txId: a.transactionId,
          });
        });

        recentTxns.slice(0, 3).forEach((tx: any, i: number) => {
          notifs.push({
            id: `N-TX-${i}`,
            type: "transaction",
            title: tx.status === "Suspicious" ? "Transaction Flagged" : "Transaction Processed",
            message: `${tx.id} — ${tx.type} ₹${tx.amount.toLocaleString()} at ${tx.merchant} (${tx.customerName})`,
            time: tx.dateTime?.split(" ")[1] || "Today",
            read: tx.status !== "Suspicious",
            txId: tx.id,
          });
        });

        if (notifs.length === 0) {
          notifs.push({
            id: "N-SYS",
            type: "system",
            title: "Database Connected",
            message: "Connected to MySQL database fraud_detection_db via Express REST API",
            time: "Now",
            read: true,
          });
        }

        setNotifications(notifs);
      } catch (err) {
        console.error("Failed to load notifications:", err);
      }
    };

    loadAlerts();
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markAllRead = () => setNotifications((n) => n.map((x) => ({ ...x, read: true })));
  const markRead = (id: string) => setNotifications((n) => n.map((x) => (x.id === id ? { ...x, read: true } : x)));

  const displayed = activeTab === "all" ? notifications : notifications.filter((n) => n.type === activeTab);

  const handleNotifClick = (notif: Notification) => {
    markRead(notif.id);
    if (notif.txId && onSelectTransaction) {
      onSelectTransaction(notif.txId);
      setOpen(false);
    } else if (notif.type === "system" && navigate) {
      navigate("investigations");
      setOpen(false);
    }
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
    <header className="h-14 bg-white border-b border-gray-200 flex items-center px-6 gap-4 flex-shrink-0 z-20 relative">
      <div className="flex-1 min-w-0">
        <h1 className="text-base font-semibold text-gray-900 leading-tight">{title}</h1>
        {subtitle && <p className="text-xs text-gray-500 leading-tight">{subtitle}</p>}
      </div>

      {/* Global Search */}
      <div className="relative hidden md:block">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">⌕</span>
        <input
          type="text"
          placeholder="Search transactions, customers..."
          className="pl-8 pr-4 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded w-60 focus:outline-none focus:border-[#2563eb] focus:bg-white transition-colors"
          onKeyDown={(e) => {
            if (e.key === "Enter" && navigate) navigate("transactions");
          }}
        />
      </div>

      {/* Notification Bell */}
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className={`relative w-9 h-9 flex items-center justify-center rounded transition-colors ${
            open ? "bg-blue-50 text-[#2563eb]" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          }`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown Panel */}
        {open && (
          <div
            className="absolute right-0 top-11 w-96 bg-white border border-gray-200 rounded shadow-xl z-50"
            style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div>
                <span className="text-sm font-semibold text-gray-900">Notifications</span>
                {unreadCount > 0 && (
                  <span className="ml-2 text-[10px] bg-red-100 text-red-600 font-bold px-1.5 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-[#2563eb] hover:underline font-medium">
                  Mark all read
                </button>
              )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100">
              {(["all", "fraud", "suspicious", "transaction"] as const).map((tab) => {
                const count =
                  tab === "all"
                    ? notifications.filter((n) => !n.read).length
                    : notifications.filter((n) => n.type === tab && !n.read).length;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-2 text-xs font-medium transition-colors capitalize border-b-2 ${
                      activeTab === tab
                        ? "border-[#2563eb] text-[#2563eb]"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {tab === "all" ? "All" : tab === "fraud" ? "Fraud" : tab === "suspicious" ? "Suspicious" : "Transactions"}
                    {count > 0 && (
                      <span
                        className={`ml-1 text-[9px] font-bold px-1 py-0.5 rounded-full ${
                          tab === "fraud"
                            ? "bg-red-100 text-red-600"
                            : tab === "suspicious"
                            ? "bg-orange-100 text-orange-600"
                            : "bg-blue-100 text-blue-600"
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto">
              {displayed.length === 0 && (
                <div className="py-10 text-center text-xs text-gray-400">No notifications in this category</div>
              )}
              {displayed.map((notif) => {
                const cfg = typeConfig[notif.type] || typeConfig.system;
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotifClick(notif)}
                    className={`flex gap-3 px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50/80 transition-colors ${
                      !notif.read ? cfg.bg : ""
                    }`}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-sm ${
                          !notif.read ? "bg-white border border-gray-200" : "bg-gray-50 border border-gray-100"
                        }`}
                      >
                        {cfg.icon}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-0.5">
                        <p className={`text-xs font-semibold leading-tight ${!notif.read ? "text-gray-900" : "text-gray-600"}`}>
                          {notif.title}
                        </p>
                        {!notif.read && <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-0.5 ${cfg.dot}`} />}
                      </div>
                      <p className="text-[11px] text-gray-500 leading-snug line-clamp-2">{notif.message}</p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[10px] text-gray-400">{notif.time}</span>
                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded capitalize ${cfg.label}`}>
                          {notif.type}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-gray-100 flex items-center justify-between">
              <button
                onClick={() => {
                  navigate && navigate("transactions");
                  setOpen(false);
                }}
                className="text-xs text-[#2563eb] hover:underline font-medium"
              >
                View all transactions →
              </button>
              <button
                onClick={() => {
                  navigate && navigate("fraud-detection");
                  setOpen(false);
                }}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Fraud dashboard →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Profile */}
      <div className="flex items-center gap-2.5 pl-3 border-l border-gray-200">
        <div className="w-8 h-8 bg-[#1e40af] rounded-full flex items-center justify-center text-white text-xs font-bold">
          {initials}
        </div>
        <div className="hidden sm:block">
          <p className="text-xs font-semibold text-gray-900 leading-none">{user?.name || "Suresh Agarwal"}</p>
          <p className="text-[10px] text-[#2563eb] font-medium mt-0.5">{user?.role || "Administrator"}</p>
        </div>
      </div>
    </header>
  );
}
