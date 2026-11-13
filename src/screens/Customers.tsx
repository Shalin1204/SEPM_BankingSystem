import { useState, useEffect } from "react";
import type { RiskLevel, AccountStatus } from "../data";
import { api } from "../api/client";

interface Props {
  onSelect: (id: string) => void;
}

const riskBadge: Record<RiskLevel, string> = {
  Low: "bg-green-50 text-green-700 border-green-200",
  Medium: "bg-yellow-50 text-yellow-700 border-yellow-200",
  High: "bg-orange-50 text-orange-700 border-orange-200",
  Critical: "bg-red-50 text-red-700 border-red-200",
};

const statusColor: Record<AccountStatus, string> = {
  Active: "bg-green-100 text-green-700",
  Frozen: "bg-blue-100 text-blue-700",
  Closed: "bg-gray-100 text-gray-600",
  Restricted: "bg-orange-100 text-orange-700",
};

export default function Customers({ onSelect }: Props) {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  // Add Customer Modal
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newCity, setNewCity] = useState("Mumbai");
  const [newState, setNewState] = useState("Maharashtra");
  const [newStreet, setNewStreet] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.customers.list({
        search,
        riskFilter,
        statusFilter,
      });
      setCustomers(data || []);
    } catch (err: any) {
      console.error("Failed to load customers:", err);
      setError(err.message || "Failed to load customers from MySQL.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search, riskFilter, statusFilter]);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    if (!newName.trim() || !newEmail.trim()) {
      setModalError("Name and email are required.");
      return;
    }

    setModalLoading(true);
    try {
      const res = await api.customers.create({
        name: newName.trim(),
        email: newEmail.trim(),
        phone: newPhone.trim(),
        city: newCity.trim(),
        state: newState.trim(),
        street: newStreet.trim(),
      });
      setShowModal(false);
      setNewName("");
      setNewEmail("");
      setNewPhone("");
      setNewStreet("");
      fetchCustomers();
      if (res.customerId) {
        onSelect(res.customerId);
      }
    } catch (err: any) {
      setModalError(err.message || "Failed to create customer profile.");
    } finally {
      setModalLoading(false);
    }
  };

  const exportCSV = () => {
    if (customers.length === 0) return;
    const headers = ["Customer ID", "Name", "Email", "Phone", "Accounts", "Total Transactions", "Risk Level", "Status", "City"];
    const rows = customers.map((c) => [
      c.id,
      `"${c.name}"`,
      `"${c.email}"`,
      `"${c.phone}"`,
      c.accountCount,
      c.totalTransactions,
      c.riskLevel,
      c.status,
      `"${c.city}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `FraudShield_Customers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">⌕</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customers by name, email, ID..."
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:border-[#2563eb]"
            />
          </div>
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
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded px-3 py-2 text-gray-700 focus:outline-none"
          >
            <option value="">All Statuses</option>
            {["Active", "Frozen", "Restricted", "Closed"].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              setSearch("");
              setRiskFilter("");
              setStatusFilter("");
            }}
            className="text-sm px-3 py-2 border border-gray-200 rounded text-gray-500 hover:text-gray-700 transition-colors"
          >
            Clear
          </button>
          <div className="ml-auto">
            <button
              onClick={() => {
                setShowModal(true);
                setModalError(null);
              }}
              className="text-sm text-white bg-[#1e40af] hover:bg-[#1d4ed8] px-4 py-2 rounded font-medium transition-colors"
            >
              + Add Customer
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Customer Records</h3>
            <p className="text-xs text-gray-500">{customers.length} customers found in MySQL</p>
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
                {["Customer ID", "Customer Name", "Email", "Phone", "Accounts", "Total Transactions", "Risk Level", "Status", "Action"].map(
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
                    Loading customers...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400">
                    No customers found.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-gray-50 hover:bg-blue-50/30 cursor-pointer transition-colors"
                    onClick={() => onSelect(c.id)}
                  >
                    <td className="px-3 py-3 font-mono text-[11px] text-[#2563eb] font-medium">{c.id}</td>
                    <td className="px-3 py-3 font-medium text-gray-900">{c.name}</td>
                    <td className="px-3 py-3 text-gray-600">{c.email}</td>
                    <td className="px-3 py-3 font-mono text-[11px] text-gray-600">{c.phone}</td>
                    <td className="px-3 py-3 text-center text-gray-700 font-medium">{c.accountCount}</td>
                    <td className="px-3 py-3 text-center font-mono text-gray-700">
                      {c.totalTransactions.toLocaleString()}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${riskBadge[c.riskLevel as RiskLevel] || "bg-gray-50 border-gray-200"}`}>
                        {c.riskLevel}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${statusColor[c.status as AccountStatus] || "bg-gray-100"}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(c.id);
                        }}
                        className="text-[10px] text-white bg-[#1e40af] hover:bg-[#1d4ed8] px-2.5 py-1 rounded font-medium transition-colors"
                      >
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Customer Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 text-xl font-bold"
            >
              ×
            </button>
            <h2 className="text-base font-bold text-gray-900 mb-1">Add New Customer</h2>
            <p className="text-xs text-gray-500 mb-4">
              Register a customer profile into MySQL database.
            </p>

            {modalError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
                ⚠ {modalError}
              </div>
            )}

            <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Ramesh Chandra"
                  required
                  className="w-full border border-gray-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#2563eb]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="ramesh@gmail.com"
                    required
                    className="w-full border border-gray-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#2563eb]"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="9876543210"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#2563eb]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    placeholder="Mumbai"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#2563eb]"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    value={newState}
                    onChange={(e) => setNewState(e.target.value)}
                    placeholder="Maharashtra"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#2563eb]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Street Address</label>
                <input
                  type="text"
                  value={newStreet}
                  onChange={(e) => setNewStreet(e.target.value)}
                  placeholder="e.g. 402, High Street"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#2563eb]"
                />
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
                  {modalLoading ? "Saving..." : "Save Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
