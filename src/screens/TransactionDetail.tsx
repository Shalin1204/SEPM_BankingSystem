import { useState, useEffect } from "react";
import type { Screen } from "../App";
import { api } from "../api/client";

interface Props {
  txId: string;
  navigate: (s: Screen) => void;
}

const statusColor: Record<string, string> = {
  Completed: "text-green-600 bg-green-50 border-green-200",
  Pending: "text-yellow-600 bg-yellow-50 border-yellow-200",
  Failed: "text-red-600 bg-red-50 border-red-200",
  Suspicious: "text-orange-600 bg-orange-50 border-orange-200",
};

const riskColor: Record<string, { text: string; bg: string }> = {
  Low: { text: "text-green-700", bg: "bg-green-100" },
  Medium: { text: "text-yellow-700", bg: "bg-yellow-100" },
  High: { text: "text-orange-700", bg: "bg-orange-100" },
  Critical: { text: "text-red-700", bg: "bg-red-100" },
};

export default function TransactionDetail({ txId, navigate }: Props) {
  const [tx, setTx] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [flagging, setFlagging] = useState(false);

  const fetchDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.transactions.get(txId);
      setTx(data);
    } catch (err: any) {
      console.error("Failed to load transaction:", err);
      setError(err.message || "Transaction not found.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [txId]);

  const handleFlag = async () => {
    setFlagging(true);
    setActionMsg(null);
    try {
      const res = await api.transactions.flag(txId);
      setActionMsg(res.message);
      fetchDetail();
    } catch (err: any) {
      setActionMsg(err.message || "Failed to flag transaction.");
    } finally {
      setFlagging(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-gray-400">
        <span className="animate-spin inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mr-2" />
        Loading transaction details...
      </div>
    );
  }

  if (error || !tx) {
    return (
      <div className="space-y-4 max-w-5xl">
        <button onClick={() => navigate("transactions")} className="text-sm text-gray-500 hover:text-gray-700">
          ← Back to Transactions
        </button>
        <div className="text-center py-16 bg-white border border-gray-200 rounded">
          <p className="text-gray-500 text-sm mb-2">{error || "Transaction record not found in database."}</p>
          <button
            onClick={() => navigate("transactions")}
            className="text-xs text-white bg-[#1e40af] px-3 py-1.5 rounded"
          >
            Return to Transaction List
          </button>
        </div>
      </div>
    );
  }

  const rc = riskColor[tx.risk] || riskColor.Low;

  return (
    <div className="space-y-4 max-w-5xl">
      {/* Back button */}
      <button
        onClick={() => navigate("transactions")}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        ← Back to Transactions
      </button>

      {actionMsg && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-700 text-xs rounded flex items-center justify-between">
          <span>{actionMsg}</span>
          <button onClick={() => setActionMsg(null)} className="text-blue-900 font-bold ml-2">×</button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border border-gray-200 rounded p-5 flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 mb-1">Transaction ID</p>
          <p className="font-mono text-xl font-bold text-gray-900">{tx.id}</p>
          <p className="text-xs text-gray-400 mt-1">{tx.dateTime}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded border text-xs font-semibold ${statusColor[tx.status] || "bg-gray-100 text-gray-700"}`}>
            {tx.status}
          </span>
          <button
            onClick={() => navigate("fraud-logs")}
            className="text-xs border border-gray-200 rounded px-3 py-1.5 text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
          >
            View Fraud Log
          </button>
          {tx.status !== "Suspicious" && (
            <button
              onClick={handleFlag}
              disabled={flagging}
              className="text-xs text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded transition-colors font-medium disabled:opacity-50"
            >
              {flagging ? "Flagging..." : "Flag Transaction"}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Transaction Details */}
        <div className="col-span-2 space-y-4">
          <div className="bg-white border border-gray-200 rounded p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">
              Transaction Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Customer Name", value: tx.customerName },
                { label: "Account Number", value: tx.accountNumber },
                { label: "Transaction Amount", value: `₹${tx.amount.toLocaleString()}`, mono: true, large: true },
                { label: "Transaction Type", value: tx.type },
                { label: "Merchant", value: tx.merchant },
                { label: "Location", value: tx.location },
                { label: "Payment Method", value: tx.paymentMethod },
                { label: "Date & Time", value: tx.dateTime },
                { label: "Description", value: tx.description || "Direct Bank Transaction" },
              ].map((f) => (
                <div key={f.label}>
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mb-0.5">{f.label}</p>
                  <p className={`text-sm text-gray-900 font-medium ${f.mono ? "font-mono" : ""} ${f.large ? "text-lg font-bold text-[#1e40af]" : ""}`}>
                    {f.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Fraud Detection Analysis */}
          <div
            className={`bg-white border rounded p-5 ${
              tx.risk === "Critical" ? "border-red-200" : tx.risk === "High" ? "border-orange-200" : "border-gray-200"
            }`}
          >
            <h3 className="text-sm font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">
              Fraud Detection Analysis
            </h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mb-1">Risk Score</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        tx.riskScore > 80 ? "bg-red-500" : tx.riskScore > 60 ? "bg-orange-500" : "bg-green-500"
                      }`}
                      style={{ width: `${tx.riskScore}%` }}
                    />
                  </div>
                  <span className="font-mono font-bold text-sm text-gray-900">{tx.riskScore}/100</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mb-1">Risk Level</p>
                <span className={`inline-block px-2.5 py-1 rounded text-xs font-bold ${rc.bg} ${rc.text}`}>{tx.risk}</span>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mb-1">Detection Result</p>
                <span
                  className={`text-sm font-semibold ${
                    tx.detectionResult === "Clean"
                      ? "text-green-600"
                      : tx.detectionResult === "Confirmed Fraud"
                      ? "text-red-600"
                      : "text-orange-600"
                  }`}
                >
                  {tx.detectionResult}
                </span>
              </div>
            </div>

            {tx.detectionRules && tx.detectionRules.length > 0 ? (
              <div>
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mb-2">
                  Detection Rules Triggered
                </p>
                <div className="flex flex-wrap gap-2">
                  {tx.detectionRules.map((rule: string) => (
                    <span
                      key={rule}
                      className="bg-red-50 text-red-700 border border-red-200 text-[11px] px-2.5 py-1 rounded font-medium"
                    >
                      ⚠ {rule}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <span>✓</span>
                <span>No automated fraud rules triggered. Transaction conforms to normal customer profile.</span>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Status & Actions */}
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded p-4">
            <h3 className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">
              Case Association
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Customer ID</span>
                <span className="font-mono text-[#2563eb]">{tx.customerId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Account ID</span>
                <span className="font-mono text-gray-800">{tx.accountId}</span>
              </div>
              {tx.investigationId && (
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-500">Investigation Case</span>
                    <span className="font-mono text-orange-600 font-bold">{tx.investigationId}</span>
                  </div>
                  <button
                    onClick={() => navigate("investigations")}
                    className="w-full mt-2 text-xs text-white bg-[#1e40af] py-1.5 rounded hover:bg-[#1d4ed8] transition-colors"
                  >
                    Open Case Details →
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded p-4">
            <h3 className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => navigate("customers")}
                className="w-full text-xs border border-gray-300 py-2 rounded text-gray-700 hover:border-gray-400 transition-colors"
              >
                View Customer Profile
              </button>
              <button
                onClick={() => navigate("fraud-detection")}
                className="w-full text-xs border border-gray-300 py-2 rounded text-gray-700 hover:border-gray-400 transition-colors"
              >
                Security Overview
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
