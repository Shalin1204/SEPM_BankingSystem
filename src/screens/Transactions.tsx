import { useState, useMemo, useEffect } from "react";
import type { TxStatus, RiskLevel } from "../data";
import { api } from "../api/client";

interface Props {
  onSelect: (id: string) => void;
}

const statusColor: Record<string, string> = {
  Completed: "bg-green-100 text-green-700",
  Pending: "bg-yellow-100 text-yellow-700",
  Failed: "bg-red-100 text-red-600",
  Suspicious: "bg-orange-100 text-orange-700",
};

const riskBadge: Record<string, string> = {
  Low: "bg-green-50 text-green-700 border-green-200",
  Medium: "bg-yellow-50 text-yellow-700 border-yellow-200",
  High: "bg-orange-50 text-orange-700 border-orange-200",
  Critical: "bg-red-50 text-red-700 border-red-200",
};

const TX_TYPES = ["DEBIT", "CREDIT"];
const STATUSES: TxStatus[] = ["Completed", "Pending", "Failed", "Suspicious"];
const RISK_LEVELS: RiskLevel[] = ["Low", "Medium", "High", "Critical"];

export default function Transactions({ onSelect }: Props) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TxStatus | "">("");
  const [riskFilter, setRiskFilter] = useState<RiskLevel | "">("");
  const [typeFilter, setTypeFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [amountMin, setAmountMin] = useState("");
  const [amountMax, setAmountMax] = useState("");
  const [sortCol, setSortCol] = useState<"dateTime" | "amount" | "riskScore">("dateTime");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  // New Transaction Modal State
  const [showModal, setShowModal] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [newAccountId, setNewAccountId] = useState<number | "">("");
  const [newType, setNewType] = useState("DEBIT");
  const [newAmount, setNewAmount] = useState("");
  const [newMerchant, setNewMerchant] = useState("");
  const [newLocation, setNewLocation] = useState("Mumbai");
  const [newDescription, setNewDescription] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);

  const loadTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.transactions.list({
        search,
        status: statusFilter,
        risk: riskFilter,
        type: typeFilter,
        dateFrom,
        dateTo,
        amountMin,
        amountMax,
        sortCol,
        sortDir,
      });
      setTransactions(res.data || []);
    } catch (err: any) {
      console.error("Failed to load transactions:", err);
      setError(err.message || "Failed to load transactions from MySQL database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [search, statusFilter, riskFilter, typeFilter, dateFrom, dateTo, amountMin, amountMax, sortCol, sortDir]);

  // Load accounts for transaction creation
  const openNewTransactionModal = async () => {
    setShowModal(true);
    setModalError(null);
    setModalSuccess(null);
    try {
      const res = await api.accounts.list();
      setAccounts(res.accounts || []);
      if (res.accounts && res.accounts.length > 0) {
        setNewAccountId(res.accounts[0].rawId || 1);
      }
    } catch (e) {
      console.error("Failed to fetch accounts for modal", e);
    }
  };

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setModalSuccess(null);
    if (!newAccountId || !newAmount) {
      setModalError("Please select an account and specify an amount.");
      return;
    }

    setModalLoading(true);
    try {
      const res = await api.transactions.create({
        account_id: Number(newAccountId),
        transaction_type: newType,
        amount: Number(newAmount),
        merchant_name: newMerchant || "Direct Merchant",
        description: newDescription || "Online transfer",
        location: newLocation || "Mumbai",
      });

      setModalSuccess(
        `Transaction created: ${res.transaction.id} (${res.transaction.status}) ${
          res.transaction.status === "Suspicious" ? "⚠ Triggered fraud detection rule!" : "✓ Completed"
        }`
      );
      setNewAmount("");
      setNewMerchant("");
      setNewDescription("");
      loadTransactions();
      setTimeout(() => {
        setShowModal(false);
        setModalSuccess(null);
      }, 1500);
    } catch (err: any) {
      setModalError(err.message || "Transaction creation failed.");
    } finally {
      setModalLoading(false);
    }
  };

  const exportCSV = () => {
    if (transactions.length === 0) return;
    const headers = ["Transaction ID", "Customer", "Account", "Date Time", "Type", "Merchant", "Amount", "Status", "Risk", "Rules"];
    const rows = transactions.map((t) => [
      t.id,
      `"${t.customerName}"`,
      t.accountNumber,
      `"${t.dateTime}"`,
      t.type,
      `"${t.merchant}"`,
      t.amount,
      t.status,
      t.risk,
      `"${(t.detectionRules || []).join("; ")}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `FraudShield_Transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeFilterCount = [statusFilter, riskFilter, typeFilter, dateFrom, dateTo, amountMin, amountMax].filter(Boolean).length;

  const clearAll = () => {
    setSearch("");
    setStatusFilter("");
    setRiskFilter("");
    setTypeFilter("");
    setDateFrom("");
    setDateTo("");
    setAmountMin("");
    setAmountMax("");
    setPage(1);
  };

  const toggleSort = (col: typeof sortCol) => {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortCol(col);
      setSortDir("desc");
    }
  };

  const paged = useMemo(() => {
    return transactions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  }, [transactions, page]);

  const totalPages = Math.max(1, Math.ceil(transactions.length / PAGE_SIZE));

  const SortIcon = ({ col }: { col: typeof sortCol }) =>
    sortCol === col ? (
      <span className="ml-1 text-[#2563eb]">{sortDir === "asc" ? "↑" : "↓"}</span>
    ) : (
      <span className="ml-1 text-gray-300">↕</span>
    );

  return (
    <div className="space-y-4">
      {/* Search Bar & Action Controls */}
      <div className="bg-white border border-gray-200 rounded p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">⌕</span>
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by Transaction ID, Customer Name, Merchant, Account Number, Location..."
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded focus:outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/15 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                ×
              </button>
            )}
          </div>

          {/* Quick status chips */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setStatusFilter(statusFilter === s ? "" : s);
                  setPage(1);
                }}
                className={`text-xs px-2.5 py-1.5 rounded border transition-colors font-medium ${
                  statusFilter === s
                    ? s === "Completed"
                      ? "bg-green-600 text-white border-green-600"
                      : s === "Suspicious"
                      ? "bg-orange-500 text-white border-orange-500"
                      : s === "Failed"
                      ? "bg-red-600 text-white border-red-600"
                      : "bg-yellow-500 text-white border-yellow-500"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <button
            onClick={() => setFiltersOpen((v) => !v)}
            className={`flex items-center gap-1.5 text-sm px-3 py-2.5 rounded border transition-colors font-medium flex-shrink-0 ${
              filtersOpen || activeFilterCount > 0
                ? "bg-[#1e40af] text-white border-[#1e40af]"
                : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
            }`}
          >
            ⊟ Filters
            {activeFilterCount > 0 && (
              <span className="bg-white/30 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>

          {(search || activeFilterCount > 0) && (
            <button onClick={clearAll} className="text-sm text-gray-400 hover:text-gray-600 px-2 py-2.5 flex-shrink-0">
              Clear all
            </button>
          )}

          <button
            onClick={openNewTransactionModal}
            className="flex items-center gap-1.5 text-sm text-white bg-[#1e40af] hover:bg-[#1d4ed8] px-4 py-2.5 rounded font-medium transition-colors flex-shrink-0"
          >
            + New Transaction
          </button>
        </div>

        {/* Expanded Filters Panel */}
        {filtersOpen && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="grid grid-cols-4 gap-4">
              {/* Transaction Type */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Transaction Type
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {TX_TYPES.map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        setTypeFilter(typeFilter === t ? "" : t);
                        setPage(1);
                      }}
                      className={`text-xs px-2.5 py-1 rounded border transition-colors ${
                        typeFilter === t
                          ? "bg-[#2563eb] text-white border-[#2563eb]"
                          : "bg-white text-gray-600 border-gray-200 hover:border-[#2563eb] hover:text-[#2563eb]"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Risk Level */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Risk Level
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {RISK_LEVELS.map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        setRiskFilter(riskFilter === r ? "" : r);
                        setPage(1);
                      }}
                      className={`text-xs px-2 py-1 rounded border transition-colors font-medium ${
                        riskFilter === r
                          ? r === "Low"
                            ? "bg-green-600 text-white border-green-600"
                            : r === "Medium"
                            ? "bg-yellow-500 text-white border-yellow-500"
                            : r === "High"
                            ? "bg-orange-500 text-white border-orange-500"
                            : "bg-red-600 text-white border-red-600"
                          : `bg-white text-gray-600 border-gray-200 ${riskBadge[r]}`
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Date Range
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => {
                      setDateFrom(e.target.value);
                      setPage(1);
                    }}
                    className="flex-1 text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:border-[#2563eb]"
                  />
                  <span className="text-gray-400 text-xs">–</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => {
                      setDateTo(e.target.value);
                      setPage(1);
                    }}
                    className="flex-1 text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:border-[#2563eb]"
                  />
                </div>
              </div>

              {/* Amount Range */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Amount Range (₹)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={amountMin}
                    onChange={(e) => {
                      setAmountMin(e.target.value);
                      setPage(1);
                    }}
                    className="flex-1 text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:border-[#2563eb]"
                  />
                  <span className="text-gray-400 text-xs">–</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={amountMax}
                    onChange={(e) => {
                      setAmountMax(e.target.value);
                      setPage(1);
                    }}
                    className="flex-1 text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:border-[#2563eb]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Transaction Records</h3>
            <p className="text-xs text-gray-500">
              Showing {transactions.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, transactions.length)} of {transactions.length} records in MySQL
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>Sort by:</span>
              {[
                { label: "Date", col: "dateTime" as const },
                { label: "Amount", col: "amount" as const },
                { label: "Risk Score", col: "riskScore" as const },
              ].map((s) => (
                <button
                  key={s.col}
                  onClick={() => toggleSort(s.col)}
                  className={`px-2 py-1 rounded border transition-colors ${
                    sortCol === s.col
                      ? "bg-blue-50 border-blue-200 text-blue-700 font-medium"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  {s.label} <SortIcon col={s.col} />
                </button>
              ))}
            </div>
            <button
              onClick={exportCSV}
              className="text-xs border border-gray-200 rounded px-3 py-1.5 text-gray-600 hover:border-gray-300 transition-colors"
            >
              Export CSV
            </button>
          </div>
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
                <th className="text-left px-3 py-3 text-gray-500 font-medium whitespace-nowrap">Transaction ID</th>
                <th className="text-left px-3 py-3 text-gray-500 font-medium whitespace-nowrap">Customer</th>
                <th className="text-left px-3 py-3 text-gray-500 font-medium whitespace-nowrap">Account</th>
                <th
                  className="text-left px-3 py-3 text-gray-500 font-medium whitespace-nowrap cursor-pointer hover:text-gray-700 select-none"
                  onClick={() => toggleSort("dateTime")}
                >
                  Date & Time <SortIcon col="dateTime" />
                </th>
                <th className="text-left px-3 py-3 text-gray-500 font-medium whitespace-nowrap">Type</th>
                <th className="text-left px-3 py-3 text-gray-500 font-medium whitespace-nowrap">Merchant</th>
                <th
                  className="text-right px-3 py-3 text-gray-500 font-medium whitespace-nowrap cursor-pointer hover:text-gray-700 select-none"
                  onClick={() => toggleSort("amount")}
                >
                  Amount <SortIcon col="amount" />
                </th>
                <th className="text-left px-3 py-3 text-gray-500 font-medium whitespace-nowrap">Status</th>
                <th
                  className="text-left px-3 py-3 text-gray-500 font-medium whitespace-nowrap cursor-pointer hover:text-gray-700 select-none"
                  onClick={() => toggleSort("riskScore")}
                >
                  Risk <SortIcon col="riskScore" />
                </th>
                <th className="text-left px-3 py-3 text-gray-500 font-medium whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-gray-400">
                    <span className="animate-spin inline-block w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full mr-2" />
                    Loading transactions from MySQL...
                  </td>
                </tr>
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center">
                    <p className="text-gray-400 text-sm mb-1">No transactions match your search</p>
                    <p className="text-gray-400 text-xs">Try adjusting your filters or search term</p>
                    <button onClick={clearAll} className="mt-3 text-xs text-[#2563eb] hover:underline">
                      Clear all filters
                    </button>
                  </td>
                </tr>
              ) : (
                paged.map((tx) => (
                  <tr
                    key={tx.id}
                    className={`border-b border-gray-50 hover:bg-blue-50/30 transition-colors cursor-pointer ${
                      tx.status === "Suspicious" ? "bg-orange-50/20" : ""
                    }`}
                    onClick={() => onSelect(tx.id)}
                  >
                    <td className="px-3 py-3 font-mono text-[11px] text-[#2563eb] font-medium whitespace-nowrap">{tx.id}</td>
                    <td className="px-3 py-3 text-gray-800 font-medium whitespace-nowrap">{tx.customerName}</td>
                    <td className="px-3 py-3 font-mono text-[11px] text-gray-500 whitespace-nowrap">{tx.accountNumber}</td>
                    <td className="px-3 py-3 text-gray-600 whitespace-nowrap">{tx.dateTime}</td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-medium">{tx.type}</span>
                    </td>
                    <td className="px-3 py-3 text-gray-700 max-w-[130px] truncate">{tx.merchant}</td>
                    <td className="px-3 py-3 font-mono text-gray-900 font-semibold whitespace-nowrap text-right">
                      ₹{tx.amount.toLocaleString()}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${statusColor[tx.status] || "bg-gray-100 text-gray-700"}`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${riskBadge[tx.risk] || "bg-gray-50 text-gray-700 border-gray-200"}`}>
                        {tx.risk}
                      </span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(tx.id);
                        }}
                        className="text-[11px] text-white bg-[#1e40af] hover:bg-[#1d4ed8] px-2.5 py-1 rounded font-medium transition-colors"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {transactions.length > PAGE_SIZE && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="text-xs px-2.5 py-1.5 border border-gray-200 rounded disabled:opacity-40 hover:border-gray-300 transition-colors"
              >
                ‹ Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`text-xs px-2.5 py-1.5 border rounded transition-colors ${
                    p === page
                      ? "bg-[#1e40af] text-white border-[#1e40af]"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="text-xs px-2.5 py-1.5 border border-gray-200 rounded disabled:opacity-40 hover:border-gray-300 transition-colors"
              >
                Next ›
              </button>
            </div>
          </div>
        )}
      </div>

      {/* New Transaction Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 text-xl font-bold"
            >
              ×
            </button>
            <h2 className="text-base font-bold text-gray-900 mb-1">Create New Transaction</h2>
            <p className="text-xs text-gray-500 mb-4">
              Submit a transaction into MySQL. Triggers will automatically evaluate fraud rules and update balances.
            </p>

            {modalError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
                ⚠ {modalError}
              </div>
            )}
            {modalSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-xs rounded">
                {modalSuccess}
              </div>
            )}

            <form onSubmit={handleCreateTransaction} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-gray-700 mb-1">Account</label>
                <select
                  value={newAccountId}
                  onChange={(e) => setNewAccountId(Number(e.target.value))}
                  required
                  className="w-full border border-gray-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#2563eb]"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.rawId}>
                      {a.number} — {a.customerName} (Bal: ₹{a.balance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#2563eb]"
                  >
                    <option value="DEBIT">DEBIT</option>
                    <option value="CREDIT">CREDIT</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    placeholder="e.g. 75000"
                    required
                    className="w-full border border-gray-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#2563eb]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Merchant Name</label>
                <input
                  type="text"
                  value={newMerchant}
                  onChange={(e) => setNewMerchant(e.target.value)}
                  placeholder="e.g. Amazon or Meesho or New Electronics Store"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#2563eb]"
                />
                <span className="text-[10px] text-gray-400">
                  Tip: 'Meesho' and 'New Electronics Store' are blocked merchants and will trigger fraud alert!
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="e.g. Mumbai or Delhi"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#2563eb]"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="e.g. Equipment purchase"
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
                  {modalLoading ? "Submitting..." : "Submit Transaction"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
