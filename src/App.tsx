import { useState, useEffect } from "react";
import Login from "./screens/Login";
import Dashboard from "./screens/Dashboard";
import Transactions from "./screens/Transactions";
import TransactionDetail from "./screens/TransactionDetail";
import FraudDetection from "./screens/FraudDetection";
import FraudLogs from "./screens/FraudLogs";
import Investigations from "./screens/Investigations";
import InvestigationDetail from "./screens/InvestigationDetail";
import Reports from "./screens/Reports";
import Customers from "./screens/Customers";
import CustomerDetail from "./screens/CustomerDetail";
import Accounts from "./screens/Accounts";
import AccountDetail from "./screens/AccountDetail";
import Layout from "./components/Layout";
import { getToken, getStoredUser, api } from "./api/client";

export type Screen =
  | "login"
  | "dashboard"
  | "transactions"
  | "transaction-detail"
  | "fraud-detection"
  | "fraud-logs"
  | "investigations"
  | "investigation-detail"
  | "reports"
  | "customers"
  | "customer-detail"
  | "accounts"
  | "account-detail"
  | "settings";

export type InvStatus = "Open" | "Under Investigation" | "Resolved" | "Closed";

const pageTitles: Record<Screen, { title: string; subtitle?: string }> = {
  login: { title: "Login" },
  dashboard: { title: "Dashboard", subtitle: "Overview of transactions and fraud activity" },
  transactions: { title: "Transaction History", subtitle: "Search, filter and manage all transactions" },
  "transaction-detail": { title: "Transaction Details", subtitle: "Full transaction and fraud analysis" },
  "fraud-detection": { title: "Fraud Detection", subtitle: "Real-time suspicious transaction monitoring" },
  "fraud-logs": { title: "Fraud Logs", subtitle: "Audit log of all detected fraud events" },
  investigations: { title: "Investigations", subtitle: "Manage fraud investigation cases" },
  "investigation-detail": { title: "Investigation Details", subtitle: "Case management and evidence review" },
  reports: { title: "Reports & Analytics", subtitle: "Transaction volume and fraud trend analysis" },
  customers: { title: "Customer Management", subtitle: "Manage and monitor customer profiles" },
  "customer-detail": { title: "Customer Details", subtitle: "Customer profile and account overview" },
  accounts: { title: "Account Management", subtitle: "View and manage bank accounts" },
  "account-detail": { title: "Account Details", subtitle: "Account information and transaction history" },
  settings: { title: "Settings & Merchant Controls", subtitle: "System security, user management, and blocked merchants" },
};

function SettingsScreen() {
  const [users, setUsers] = useState<any[]>([]);
  const [merchants, setMerchants] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingMerchants, setLoadingMerchants] = useState(true);

  // New blocked merchant state
  const [newMerchantName, setNewMerchantName] = useState("");
  const [newMerchantReason, setNewMerchantReason] = useState("");
  const [merchantActionLoading, setMerchantActionLoading] = useState(false);
  const [merchantMessage, setMerchantMessage] = useState<{ text: string; error?: boolean } | null>(null);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const data = await api.auth.getUsers();
      setUsers(data || []);
    } catch (e) {
      console.error("Failed to load users", e);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchMerchants = async () => {
    setLoadingMerchants(true);
    try {
      const data = await api.merchants.list();
      setMerchants(data || []);
    } catch (e) {
      console.error("Failed to load blocked merchants", e);
    } finally {
      setLoadingMerchants(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchMerchants();
  }, []);

  const handleBlockMerchant = async (e: React.FormEvent) => {
    e.preventDefault();
    setMerchantMessage(null);
    if (!newMerchantName.trim()) return;

    setMerchantActionLoading(true);
    try {
      await api.merchants.create({
        merchant_name: newMerchantName.trim(),
        reason: newMerchantReason.trim() || "Suspicious transaction patterns",
      });
      setMerchantMessage({ text: `Merchant '${newMerchantName.trim()}' added to blocked list.` });
      setNewMerchantName("");
      setNewMerchantReason("");
      fetchMerchants();
    } catch (err: any) {
      setMerchantMessage({ text: err.message || "Failed to block merchant", error: true });
    } finally {
      setMerchantActionLoading(false);
    }
  };

  const handleUnblock = async (id: number, name: string) => {
    setMerchantMessage(null);
    try {
      await api.merchants.delete(id);
      setMerchantMessage({ text: `Merchant '${name}' unblocked.` });
      fetchMerchants();
    } catch (err: any) {
      setMerchantMessage({ text: err.message || "Failed to unblock merchant", error: true });
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      {/* Blocked Merchants Management */}
      <div className="bg-white border border-gray-200 rounded p-6 shadow-2xs">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-900">Blocked Merchants Management</h3>
          <span className="text-[11px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded">
            {merchants.length} Blocked
          </span>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Transactions matching blocked merchants are automatically flagged by database triggers and logged as fraud incidents.
        </p>

        {merchantMessage && (
          <div
            className={`mb-4 p-3 rounded text-xs border ${
              merchantMessage.error ? "bg-red-50 border-red-200 text-red-700" : "bg-green-50 border-green-200 text-green-700"
            }`}
          >
            {merchantMessage.text}
          </div>
        )}

        {/* Add Blocked Merchant Form */}
        <form onSubmit={handleBlockMerchant} className="grid grid-cols-5 gap-2 mb-4 p-3 bg-gray-50 rounded border border-gray-100 text-xs">
          <div className="col-span-2">
            <input
              type="text"
              value={newMerchantName}
              onChange={(e) => setNewMerchantName(e.target.value)}
              placeholder="Merchant name (e.g. Dark Web Shop)"
              required
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 bg-white focus:outline-none focus:border-[#2563eb]"
            />
          </div>
          <div className="col-span-2">
            <input
              type="text"
              value={newMerchantReason}
              onChange={(e) => setNewMerchantReason(e.target.value)}
              placeholder="Reason for block"
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 bg-white focus:outline-none focus:border-[#2563eb]"
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={merchantActionLoading}
              className="w-full py-1.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded transition-colors disabled:opacity-50"
            >
              {merchantActionLoading ? "..." : "+ Block"}
            </button>
          </div>
        </form>

        {/* List */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-3 py-2 text-gray-500 font-medium">Merchant Name</th>
                <th className="text-left px-3 py-2 text-gray-500 font-medium">Reason</th>
                <th className="text-left px-3 py-2 text-gray-500 font-medium">Blocked Date</th>
                <th className="text-right px-3 py-2 text-gray-500 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {loadingMerchants ? (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-gray-400">Loading blocked merchants...</td>
                </tr>
              ) : merchants.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-gray-400">No blocked merchants currently recorded.</td>
                </tr>
              ) : (
                merchants.map((m) => (
                  <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-3 py-2 font-medium text-gray-900">{m.merchantName}</td>
                    <td className="px-3 py-2 text-gray-600">{m.reason || "Suspicious activity"}</td>
                    <td className="px-3 py-2 text-gray-400 whitespace-nowrap">{m.blockedAt}</td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => handleUnblock(m.id, m.merchantName)}
                        className="text-[10px] text-red-600 hover:text-red-800 hover:underline font-medium"
                      >
                        Unblock
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* System Settings */}
      <div className="bg-white border border-gray-200 rounded p-6 shadow-2xs">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Fraud Engine Configuration</h3>
        <div className="space-y-4">
          {[
            { label: "High Value Flagging Threshold (₹)", value: "50000", hint: "Database trigger automatically flags transactions above this amount" },
            { label: "Location Mismatch Trigger", value: "Active", hint: "Database trigger compares transaction location with customer home city" },
            { label: "Blocked Merchant Detection", value: "Active", hint: "Instant check against blocked_merchants table on transaction insertion" },
            { label: "Negative Balance Prevention", value: "Enforced", hint: "Database BEFORE trigger checks fund availability before debiting" },
          ].map((s) => (
            <div key={s.label} className="flex items-start justify-between py-3 border-b border-gray-100 last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-800">{s.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.hint}</p>
              </div>
              <span className="text-xs font-mono font-semibold bg-blue-50 text-blue-700 px-2.5 py-1 rounded">
                {s.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* User Management */}
      <div className="bg-white border border-gray-200 rounded p-6 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Security Personnel &amp; Users</h3>
            <p className="text-xs text-gray-500">Database user accounts registered in users table</p>
          </div>
          <span className="text-xs text-gray-400">{users.length} accounts</span>
        </div>
        <div className="space-y-3">
          {loadingUsers ? (
            <p className="text-xs text-gray-400 py-3">Loading users...</p>
          ) : (
            users.map((u) => (
              <div key={u.user_id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#1e40af]/10 rounded-full flex items-center justify-center text-[#1e40af] text-xs font-bold">
                    {u.name ? u.name.split(" ").map((w: string) => w[0]).join("") : "U"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{u.name}</p>
                    <p className="text-xs text-gray-400">{u.email} · {u.role}</p>
                  </div>
                </div>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium">{u.status || "Active"}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(getStoredUser());
  const [screen, setScreen] = useState<Screen>(getToken() ? "dashboard" : "login");
  const [selectedTxId, setSelectedTxId] = useState<string>("");
  const [selectedInvId, setSelectedInvId] = useState<string>("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");

  useEffect(() => {
    const handleAuthExpired = () => {
      setCurrentUser(null);
      setScreen("login");
    };
    window.addEventListener("auth:expired", handleAuthExpired);
    return () => window.removeEventListener("auth:expired", handleAuthExpired);
  }, []);

  const navigate = (s: Screen) => setScreen(s);

  const handleLoginSuccess = (user: any) => {
    setCurrentUser(user);
    setScreen("dashboard");
  };

  const handleSelectTransaction = (id: string) => {
    setSelectedTxId(id);
    setScreen("transaction-detail");
  };

  const handleSelectInvestigation = (id: string) => {
    setSelectedInvId(id);
    setScreen("investigation-detail");
  };

  const handleSelectCustomer = (id: string) => {
    setSelectedCustomerId(id);
    setScreen("customer-detail");
  };

  const handleSelectAccount = (id: string) => {
    setSelectedAccountId(id);
    setScreen("account-detail");
  };

  if (screen === "login") {
    return <Login navigate={navigate} onLoginSuccess={handleLoginSuccess} />;
  }

  const { title, subtitle } = pageTitles[screen];

  return (
    <Layout
      current={screen}
      navigate={navigate}
      onSelectTransaction={handleSelectTransaction}
      title={title}
      subtitle={subtitle}
    >
      {screen === "dashboard" && (
        <Dashboard navigate={navigate} onSelectTransaction={handleSelectTransaction} />
      )}
      {screen === "transactions" && (
        <Transactions onSelect={handleSelectTransaction} />
      )}
      {screen === "transaction-detail" && (
        <TransactionDetail txId={selectedTxId} navigate={navigate} />
      )}
      {screen === "fraud-detection" && (
        <FraudDetection navigate={navigate} />
      )}
      {screen === "fraud-logs" && (
        <FraudLogs navigate={navigate} />
      )}
      {screen === "investigations" && (
        <Investigations onSelect={handleSelectInvestigation} />
      )}
      {screen === "investigation-detail" && (
        <InvestigationDetail invId={selectedInvId} navigate={navigate} />
      )}
      {screen === "reports" && (
        <Reports />
      )}
      {screen === "customers" && (
        <Customers onSelect={handleSelectCustomer} />
      )}
      {screen === "customer-detail" && (
        <CustomerDetail customerId={selectedCustomerId} navigate={navigate} onSelectTransaction={handleSelectTransaction} />
      )}
      {screen === "accounts" && (
        <Accounts onSelect={handleSelectAccount} />
      )}
      {screen === "account-detail" && (
        <AccountDetail accountId={selectedAccountId} navigate={navigate} onSelectTransaction={handleSelectTransaction} />
      )}
      {screen === "settings" && (
        <SettingsScreen />
      )}
    </Layout>
  );
}
