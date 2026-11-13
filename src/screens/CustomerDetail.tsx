import { useState, useEffect } from "react";
import type { Screen } from "../App";
import { api } from "../api/client";

interface Props {
  customerId: string;
  navigate: (s: Screen) => void;
  onSelectTransaction: (id: string) => void;
}

const riskColor: Record<string, string> = {
  Low: "bg-green-100 text-green-700",
  Medium: "bg-yellow-100 text-yellow-700",
  High: "bg-orange-100 text-orange-700",
  Critical: "bg-red-100 text-red-700",
};

const statusColor: Record<string, string> = {
  Active: "bg-green-100 text-green-700",
  Frozen: "bg-blue-100 text-blue-700",
  Closed: "bg-gray-100 text-gray-600",
  Restricted: "bg-orange-100 text-orange-700",
};

const txStatusColor: Record<string, string> = {
  Completed: "bg-green-100 text-green-700",
  Pending: "bg-yellow-100 text-yellow-700",
  Failed: "bg-red-100 text-red-600",
  Suspicious: "bg-orange-100 text-orange-700",
};

export default function CustomerDetail({ customerId, navigate, onSelectTransaction }: Props) {
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.customers.get(customerId);
      setCustomer(data);
    } catch (err: any) {
      console.error("Failed to load customer profile:", err);
      setError(err.message || "Customer not found.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [customerId]);

  if (loading) {
    return (
      <div className="py-20 text-center text-gray-400">
        <span className="animate-spin inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mr-2" />
        Loading customer profile...
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="space-y-4 max-w-5xl">
        <button onClick={() => navigate("customers")} className="text-sm text-gray-500 hover:text-gray-700">
          ← Back to Customers
        </button>
        <div className="text-center py-16 bg-white border border-gray-200 rounded">
          <p className="text-gray-500 text-sm mb-2">{error || "Customer record not found in database."}</p>
          <button
            onClick={() => navigate("customers")}
            className="text-xs text-white bg-[#1e40af] px-3 py-1.5 rounded"
          >
            Return to Customers
          </button>
        </div>
      </div>
    );
  }

  const custAccounts = customer.accounts || [];
  const custTxns = customer.transactions || [];

  return (
    <div className="space-y-4 max-w-5xl">
      <button
        onClick={() => navigate("customers")}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        ← Back to Customers
      </button>

      {/* Header */}
      <div className="bg-white border border-gray-200 rounded p-5 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-[#1e40af] rounded-full flex items-center justify-center text-white text-xl font-bold">
            {customer.name ? customer.name.split(" ").map((w: string) => w[0]).join("") : "C"}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{customer.name}</h2>
            <p className="text-sm text-gray-500">
              {customer.id} · {customer.city}, {customer.state}
            </p>
            <p className="text-xs text-gray-400 mt-1">Registered since {customer.joinDate}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded text-xs font-semibold ${riskColor[customer.riskLevel] || "bg-gray-100"}`}>
            {customer.riskLevel} Risk
          </span>
          <span className={`px-2.5 py-1 rounded text-xs font-semibold ${statusColor[customer.status] || "bg-gray-100"}`}>
            {customer.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-4">
          {/* Info */}
          <div className="bg-white border border-gray-200 rounded p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">
              Customer Information
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              {[
                { label: "Email", value: customer.email },
                { label: "Phone", value: customer.phone },
                { label: "City & State", value: `${customer.city}, ${customer.state}` },
                { label: "Street Address", value: customer.street || "Not specified" },
                { label: "Total Transactions", value: String(customer.totalTransactions) },
                { label: "Active Bank Accounts", value: String(customer.accountCount) },
                { label: "Member Since", value: customer.joinDate },
              ].map((f) => (
                <div key={f.label}>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">{f.label}</p>
                  <p className="font-medium text-gray-900">{f.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Accounts */}
          <div className="bg-white border border-gray-200 rounded p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Linked Bank Accounts</h3>
            <div className="space-y-2">
              {custAccounts.length === 0 ? (
                <p className="text-xs text-gray-400">No bank accounts linked to this customer.</p>
              ) : (
                custAccounts.map((acc: any) => (
                  <div
                    key={acc.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-100"
                  >
                    <div>
                      <p className="font-mono text-xs font-medium text-gray-800">{acc.number}</p>
                      <p className="text-[10px] text-gray-500">{acc.type} Account</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm font-bold text-gray-900">₹{acc.balance.toLocaleString()}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${statusColor[acc.status] || "bg-gray-100"}`}>
                        {acc.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white border border-gray-200 rounded overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Recent Customer Transactions</h3>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["TX ID", "Type", "Merchant", "Amount", "Status"].map((h) => (
                    <th key={h} className="text-left px-3 py-2.5 text-gray-500 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {custTxns.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400 text-xs">
                      No transactions recorded for this customer yet.
                    </td>
                  </tr>
                ) : (
                  custTxns.map((tx: any) => (
                    <tr
                      key={tx.id}
                      className="border-b border-gray-50 hover:bg-blue-50/30 cursor-pointer"
                      onClick={() => onSelectTransaction(tx.id)}
                    >
                      <td className="px-3 py-2.5 font-mono text-[11px] text-[#2563eb]">{tx.id}</td>
                      <td className="px-3 py-2.5 text-gray-600">{tx.type}</td>
                      <td className="px-3 py-2.5 text-gray-700">{tx.merchant}</td>
                      <td className="px-3 py-2.5 font-mono font-bold text-gray-900">₹{tx.amount.toLocaleString()}</td>
                      <td className="px-3 py-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${txStatusColor[tx.status] || "bg-gray-100"}`}>
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Risk Panel */}
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Risk Assessment</h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Calculated Risk</span>
                <span className={`font-bold ${riskColor[customer.riskLevel] || "text-gray-600"}`}>
                  {customer.riskLevel}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Total Transactions</span>
                <span className="font-semibold text-gray-800">{customer.totalTransactions}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Flagged Incidents</span>
                <span className="font-semibold text-orange-600">
                  {custTxns.filter((t: any) => t.status === "Suspicious").length}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded p-4">
            <h3 className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">
              Actions
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => navigate("transactions")}
                className="w-full text-xs text-white bg-[#1e40af] hover:bg-[#1d4ed8] py-2 rounded font-medium transition-colors"
              >
                View All Transactions
              </button>
              <button
                onClick={() => navigate("investigations")}
                className="w-full text-xs border border-gray-300 py-2 rounded text-gray-700 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                Security Investigations
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
