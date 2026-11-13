import { useState, useEffect } from "react";
import type { Screen } from "../App";
import { api } from "../api/client";

interface Props {
  accountId: string;
  navigate: (s: Screen) => void;
  onSelectTransaction: (id: string) => void;
}

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

export default function AccountDetail({ accountId, navigate, onSelectTransaction }: Props) {
  const [account, setAccount] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [freezing, setFreezing] = useState(false);

  const fetchDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.accounts.get(accountId);
      setAccount(data);
    } catch (err: any) {
      console.error("Failed to load account details:", err);
      setError(err.message || "Account not found.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [accountId]);

  const handleToggleFreeze = async () => {
    setFreezing(true);
    try {
      await api.accounts.freeze(accountId);
      fetchDetail();
    } catch (err: any) {
      alert(err.message || "Failed to update account status");
    } finally {
      setFreezing(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-gray-400">
        <span className="animate-spin inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mr-2" />
        Loading account details...
      </div>
    );
  }

  if (error || !account) {
    return (
      <div className="space-y-4 max-w-5xl">
        <button onClick={() => navigate("accounts")} className="text-sm text-gray-500 hover:text-gray-700">
          ← Back to Accounts
        </button>
        <div className="text-center py-16 bg-white border border-gray-200 rounded">
          <p className="text-gray-500 text-sm mb-2">{error || "Account record not found in database."}</p>
          <button
            onClick={() => navigate("accounts")}
            className="text-xs text-white bg-[#1e40af] px-3 py-1.5 rounded"
          >
            Return to Accounts
          </button>
        </div>
      </div>
    );
  }

  const acctTxns = account.transactions || [];

  return (
    <div className="space-y-4 max-w-5xl">
      <button
        onClick={() => navigate("accounts")}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        ← Back to Accounts
      </button>

      {/* Header */}
      <div className="bg-white border border-gray-200 rounded p-5 flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-400 mb-1">Account Number</p>
          <p className="font-mono text-2xl font-bold text-gray-900">{account.number}</p>
          <p className="text-sm text-gray-500 mt-1">
            {account.customerName} · {account.type} Account
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400 mb-1">Current Balance</p>
          <p className="font-mono text-2xl font-bold text-[#1e40af]">₹{account.balance.toLocaleString()}</p>
          <span
            className={`text-xs px-2.5 py-1 rounded font-semibold mt-2 inline-block ${
              statusColor[account.status] || "bg-gray-100"
            }`}
          >
            {account.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-4">
          {/* Account Info */}
          <div className="bg-white border border-gray-200 rounded p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">
              Account Details
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              {[
                { label: "Account ID", value: account.id },
                { label: "Account Holder", value: account.customerName },
                { label: "Account Type", value: account.type },
                { label: "Risk Level", value: account.riskLevel },
                { label: "Account Status", value: account.status },
                { label: "Created Date", value: account.createdDate },
                { label: "Last Transaction", value: account.lastTransaction },
              ].map((f) => (
                <div key={f.label}>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">{f.label}</p>
                  <p className="font-medium text-gray-900">{f.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Transaction History */}
          <div className="bg-white border border-gray-200 rounded overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Transaction History</h3>
              <span className="text-xs text-gray-400">{acctTxns.length} records in MySQL</span>
            </div>
            {acctTxns.length > 0 ? (
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {["TX ID", "Date & Time", "Type", "Merchant", "Amount", "Status"].map((h) => (
                      <th key={h} className="text-left px-3 py-2.5 text-gray-500 font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {acctTxns.map((tx: any) => (
                    <tr
                      key={tx.id}
                      className="border-b border-gray-50 hover:bg-blue-50/30 cursor-pointer"
                      onClick={() => onSelectTransaction(tx.id)}
                    >
                      <td className="px-3 py-2.5 font-mono text-[11px] text-[#2563eb]">{tx.id}</td>
                      <td className="px-3 py-2.5 text-gray-500">{tx.dateTime}</td>
                      <td className="px-3 py-2.5 text-gray-600">{tx.type}</td>
                      <td className="px-3 py-2.5 text-gray-700">{tx.merchant}</td>
                      <td className="px-3 py-2.5 font-mono font-bold text-gray-900">₹{tx.amount.toLocaleString()}</td>
                      <td className="px-3 py-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${txStatusColor[tx.status] || "bg-gray-100"}`}>
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-8 text-center text-xs text-gray-400">No transactions found for this account.</div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded p-4">
            <h3 className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">
              Risk Information
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Risk Level</span>
                <span
                  className={`font-bold ${
                    account.riskLevel === "Critical"
                      ? "text-red-600"
                      : account.riskLevel === "High"
                      ? "text-orange-600"
                      : "text-green-600"
                  }`}
                >
                  {account.riskLevel}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Flagged Transactions</span>
                <span className="font-bold text-orange-600">
                  {acctTxns.filter((t: any) => t.status === "Suspicious").length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Transactions</span>
                <span className="font-medium text-gray-800">{acctTxns.length}</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded p-4">
            <h3 className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">
              Account Actions
            </h3>
            <div className="space-y-2">
              <button
                onClick={handleToggleFreeze}
                disabled={freezing}
                className={`w-full text-xs py-2 rounded font-medium transition-colors border ${
                  account.status === "Frozen"
                    ? "text-green-700 border-green-200 hover:bg-green-50"
                    : "text-orange-600 border-orange-200 hover:bg-orange-50"
                }`}
              >
                {freezing ? "Updating..." : account.status === "Frozen" ? "Unfreeze Account" : "Freeze Account"}
              </button>
              <button
                onClick={() => navigate("customers")}
                className="w-full text-xs text-white bg-[#1e40af] py-2 rounded font-medium hover:bg-[#1d4ed8] transition-colors"
              >
                View Customer Profile
              </button>
              <button
                onClick={() => navigate("investigations")}
                className="w-full text-xs border border-gray-200 py-2 rounded text-gray-700 hover:border-blue-300 hover:text-blue-700 transition-colors"
              >
                Open Investigation
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
