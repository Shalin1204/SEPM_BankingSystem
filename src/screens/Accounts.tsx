import { useState, useEffect } from "react";
import type { AccountStatus, RiskLevel } from "../data";
import { api } from "../api/client";

interface Props {
  onSelect: (id: string) => void;
}

const statusColor: Record<string, string> = {
  Active: "bg-green-100 text-green-700",
  Frozen: "bg-blue-100 text-blue-700",
  Closed: "bg-gray-100 text-gray-600",
  Restricted: "bg-orange-100 text-orange-700",
};

const riskBadge: Record<string, string> = {
  Low: "bg-green-50 text-green-700 border-green-200",
  Medium: "bg-yellow-50 text-yellow-700 border-yellow-200",
  High: "bg-orange-50 text-orange-700 border-orange-200",
  Critical: "bg-red-50 text-red-700 border-red-200",
};

export default function Accounts({ onSelect }: Props) {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({
    totalAccounts: 0,
    totalBalance: 0,
    activeAccounts: 0,
    frozenAccounts: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [riskFilter, setRiskFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState("");

  // Add Account Modal
  const [showModal, setShowModal] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [newCustId, setNewCustId] = useState<number | "">("");
  const [newAccNumber, setNewAccNumber] = useState("");
  const [newBalance, setNewBalance] = useState("50000");
  const [newType, setNewType] = useState("SAVINGS");
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchAccounts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.accounts.list({
        search,
        typeFilter,
        statusFilter,
        riskFilter,
      });
      setAccounts(res.accounts || []);
      setSummary(res.summary || { totalAccounts: 0, totalBalance: 0, activeAccounts: 0, frozenAccounts: 0 });
    } catch (err: any) {
      console.error("Failed to load accounts:", err);
      setError(err.message || "Failed to load accounts from MySQL database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [search, typeFilter, statusFilter, riskFilter]);

  const openModal = async () => {
    setShowModal(true);
    setModalError(null);
    try {
      const custData = await api.customers.list();
      setCustomers(custData || []);
      if (custData && custData.length > 0) {
        setNewCustId(custData[0].rawId || 1);
      }
      setNewAccNumber(`ACC${Math.floor(1000 + Math.random() * 9000)}`);
    } catch (e) {
      console.error("Failed to load customers for account modal", e);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    if (!newCustId || !newAccNumber.trim()) {
      setModalError("Please select a customer and specify an account number.");
      return;
    }

    setModalLoading(true);
    try {
      const res = await api.accounts.create({
        customer_id: Number(newCustId),
        account_number: newAccNumber.trim(),
        balance: Number(newBalance) || 0,
        account_type: newType,
      });
      setShowModal(false);
      fetchAccounts();
      if (res.accountId) {
        onSelect(res.accountId);
      }
    } catch (err: any) {
      setModalError(err.message || "Failed to create account.");
    } finally {
      setModalLoading(false);
    }
  };

  const handleToggleFreeze = async (e: React.MouseEvent, accId: string) => {
    e.stopPropagation();
    try {
      await api.accounts.freeze(accId);
      fetchAccounts();
    } catch (err: any) {
      alert(err.message || "Failed to toggle account status");
    }
  };

  const exportCSV = () => {
    if (accounts.length === 0) return;
    const headers = ["Account ID", "Account Number", "Customer", "Type", "Balance", "Status", "Created Date", "Risk Level"];
    const rows = accounts.map((a) => [
      a.id,
      a.number,
      `"${a.customerName}"`,
      a.type,
      a.balance,
      a.status,
      `"${a.createdDate}"`,
      a.riskLevel,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `FraudShield_Accounts_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Accounts", value: summary.totalAccounts, color: "#1e40af" },
          { label: "Total Balance", value: `₹${(summary.totalBalance / 1000000).toFixed(2)}M`, color: "#0369a1" },
          { label: "Active Accounts", value: summary.activeAccounts, color: "#16a34a" },
          { label: "Frozen / Restricted", value: summary.frozenAccounts, color: "#dc2626" },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white border border-gray-200 rounded p-4"
            style={{ borderLeftColor: s.color, borderLeftWidth: 3 }}
          >
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className="text-2xl font-bold" style={{ color: s.color }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">⌕</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Account Number, Customer Name..."
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:border-[#2563eb]"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded px-3 py-2 text-gray-700 focus:outline-none"
          >
            <option value="">All Types</option>
            {["Savings", "Current"].map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded px-3 py-2 text-gray-700 focus:outline-none"
          >
            <option value="">All Statuses</option>
            {["Active", "Frozen", "Restricted"].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded px-3 py-2 text-gray-700 focus:outline-none"
          >
            <option value="">All Risk Levels</option>
            {["Low", "Medium", "High", "Critical"].map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              setSearch("");
              setStatusFilter("");
              setRiskFilter("");
              setTypeFilter("");
            }}
            className="text-sm px-3 py-2 border border-gray-200 rounded text-gray-500 hover:text-gray-700 transition-colors"
          >
            Clear
          </button>
          <div className="ml-auto">
            <button
              onClick={openModal}
              className="text-sm text-white bg-[#1e40af] hover:bg-[#1d4ed8] px-4 py-2 rounded font-medium transition-colors"
            >
              + Add Account
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Account Records</h3>
            <p className="text-xs text-gray-500">{accounts.length} accounts found in database</p>
          </div>
          <button
            onClick={exportCSV}
            className="text-xs border border-gray-200 rounded px-3 py-1.5 text-gray-600 hover:border-gray-300 transition-colors"
          >
            Export CSV
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-700 text-xs text-center border-b border-red-200">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {["Account Number", "Customer", "Type", "Balance", "Status", "Created Date", "Last Transaction", "Risk Level", "Action"].map(
                  (h) => (
                    <th key={h} className="text-left px-3 py-3 text-gray-500 font-medium whitespace-nowrap">
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400">
                    <span className="animate-spin inline-block w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full mr-2" />
                    Loading accounts...
                  </td>
                </tr>
              ) : accounts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400">
                    No accounts found matching criteria.
                  </td>
                </tr>
              ) : (
                accounts.map((acc) => (
                  <tr
                    key={acc.id}
                    className="border-b border-gray-50 hover:bg-blue-50/30 cursor-pointer transition-colors"
                    onClick={() => onSelect(acc.id)}
                  >
                    <td className="px-3 py-3 font-mono text-[11px] text-[#2563eb] font-medium">{acc.number}</td>
                    <td className="px-3 py-3 text-gray-800 font-medium">{acc.customerName}</td>
                    <td className="px-3 py-3">
                      <span className="bg-blue-50 text-blue-700 text-[10px] px-1.5 py-0.5 rounded font-medium">
                        {acc.type}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-mono font-bold text-gray-900">₹{acc.balance.toLocaleString()}</td>
                    <td className="px-3 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${statusColor[acc.status] || "bg-gray-100"}`}>
                        {acc.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-gray-500 whitespace-nowrap">{acc.createdDate}</td>
                    <td className="px-3 py-3 text-gray-500 whitespace-nowrap">{acc.lastTransaction}</td>
                    <td className="px-3 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${riskBadge[acc.riskLevel] || "bg-gray-50"}`}>
                        {acc.riskLevel}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelect(acc.id);
                          }}
                          className="text-[10px] text-white bg-[#1e40af] hover:bg-[#1d4ed8] px-2 py-1 rounded font-medium transition-colors"
                        >
                          View
                        </button>
                        <button
                          onClick={(e) => handleToggleFreeze(e, acc.id)}
                          className={`text-[10px] px-2 py-1 rounded transition-colors border ${
                            acc.status === "Frozen"
                              ? "text-green-700 border-green-200 hover:bg-green-50"
                              : "text-orange-600 border-orange-200 hover:bg-orange-50"
                          }`}
                        >
                          {acc.status === "Frozen" ? "Unfreeze" : "Freeze"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Account Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 text-xl font-bold"
            >
              ×
            </button>
            <h2 className="text-base font-bold text-gray-900 mb-1">Open Bank Account</h2>
            <p className="text-xs text-gray-500 mb-4">
              Create an account linked to an existing customer in MySQL.
            </p>

            {modalError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
                ⚠ {modalError}
              </div>
            )}

            <form onSubmit={handleCreateAccount} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-gray-700 mb-1">Customer</label>
                <select
                  value={newCustId}
                  onChange={(e) => setNewCustId(Number(e.target.value))}
                  required
                  className="w-full border border-gray-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#2563eb]"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.rawId}>
                      {c.name} ({c.id}) — {c.city}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Account Number</label>
                <input
                  type="text"
                  value={newAccNumber}
                  onChange={(e) => setNewAccNumber(e.target.value)}
                  placeholder="ACC1005"
                  required
                  className="w-full border border-gray-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#2563eb]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Account Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#2563eb]"
                  >
                    <option value="SAVINGS">Savings</option>
                    <option value="CURRENT">Current</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Initial Balance (₹)</label>
                  <input
                    type="number"
                    value={newBalance}
                    onChange={(e) => setNewBalance(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#2563eb]"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-4 py-2 bg-[#1e40af] hover:bg-[#1d4ed8] text-white rounded font-medium disabled:opacity-50"
                >
                  {modalLoading ? "Creating..." : "Open Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
