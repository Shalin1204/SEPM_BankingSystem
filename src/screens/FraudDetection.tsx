import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { Screen } from "../App";
import { api } from "../api/client";

interface Props {
  navigate: (s: Screen) => void;
}

const statusColor: Record<string, string> = {
  Suspicious: "bg-orange-100 text-orange-700",
  "Confirmed Fraud": "bg-red-100 text-red-700",
  Flagged: "bg-yellow-100 text-yellow-700",
};

export default function FraudDetection({ navigate }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<any>(null);
  const [fraudTrend, setFraudTrend] = useState<any[]>([]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [overRes, repRes] = await Promise.all([
        api.fraud.getOverview(),
        api.reports.get(),
      ]);
      setOverview(overRes);
      if (repRes?.charts?.fraudTrend) {
        setFraudTrend(repRes.charts.fraudTrend);
      }
    } catch (err: any) {
      console.error("Failed to load fraud detection data:", err);
      setError(err.message || "Failed to load fraud detection data from MySQL.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center text-gray-400">
        <span className="animate-spin inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mr-2" />
        Scanning database for suspicious transactions and risk patterns...
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="bg-red-50 border border-red-200 rounded p-6 text-center">
        <p className="text-red-700 font-semibold mb-2">Error loading fraud detection data</p>
        <p className="text-xs text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchData}
          className="text-xs text-white bg-[#1e40af] hover:bg-[#1d4ed8] px-4 py-2 rounded font-medium transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const kpis = overview.kpis || [];
  const riskDistribution = overview.riskDistribution || [];
  const suspicious = overview.suspicious || [];

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {kpis.map((k: any) => (
          <div
            key={k.label}
            className="bg-white border border-gray-200 rounded p-4"
            style={{ borderLeftColor: k.border, borderLeftWidth: 3 }}
          >
            <p className="text-xs text-gray-500 mb-1">{k.label}</p>
            <p className="text-2xl font-bold" style={{ color: k.color }}>
              {k.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Fraud Trend Chart */}
        <div className="col-span-2 bg-white border border-gray-200 rounded p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Fraud Detection Trend</h3>
          <p className="text-xs text-gray-500 mb-4">Suspicious vs Confirmed Fraud — Database History</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={fraudTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 11, border: "1px solid #e5e7eb", borderRadius: 4 }} />
              <Bar dataKey="suspicious" fill="#f59e0b" name="Suspicious" radius={[2, 2, 0, 0]} />
              <Bar dataKey="confirmed" fill="#ef4444" name="Confirmed" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Distribution */}
        <div className="bg-white border border-gray-200 rounded p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Risk Distribution</h3>
          <div className="space-y-3">
            {riskDistribution.map((r: any) => (
              <div key={r.level}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium" style={{ color: r.color }}>
                    {r.level}
                  </span>
                  <span className="text-gray-500">{r.count} transactions</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${r.pct}%`, backgroundColor: r.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Suspicious Transactions Table */}
      <div className="bg-white border border-gray-200 rounded overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Suspicious Transactions</h3>
            <p className="text-xs text-gray-500">
              {suspicious.length} transactions flagged by database triggers and security rules
            </p>
          </div>
          <button
            onClick={() => navigate("investigations")}
            className="text-xs text-white bg-[#1e40af] hover:bg-[#1d4ed8] px-3 py-1.5 rounded font-medium transition-colors"
          >
            Open Investigations
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {["Transaction ID", "Customer", "Amount", "Merchant", "Risk Score", "Detection Rule", "Detected At", "Status", "Action"].map(
                  (h) => (
                    <th key={h} className="text-left px-3 py-3 text-gray-500 font-medium whitespace-nowrap">
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {suspicious.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400">
                    No suspicious transactions detected in database.
                  </td>
                </tr>
              ) : (
                suspicious.map((tx: any) => (
                  <tr key={tx.id} className="border-b border-gray-50 hover:bg-orange-50/30 transition-colors">
                    <td className="px-3 py-3 font-mono text-[11px] text-[#2563eb] font-medium">{tx.id}</td>
                    <td className="px-3 py-3 text-gray-800 font-medium">{tx.customerName}</td>
                    <td className="px-3 py-3 font-mono font-bold text-gray-900">₹{tx.amount.toLocaleString()}</td>
                    <td className="px-3 py-3 text-gray-600 max-w-[120px] truncate">{tx.merchant}</td>
                    <td className="px-3 py-3">
                      <span
                        className={`font-mono font-bold text-sm ${
                          tx.riskScore > 80 ? "text-red-600" : tx.riskScore > 60 ? "text-orange-600" : "text-yellow-600"
                        }`}
                      >
                        {tx.riskScore}
                      </span>
                      <span className="text-gray-400 text-[10px]">/100</span>
                    </td>
                    <td className="px-3 py-3 text-gray-600 max-w-[180px] truncate">
                      {tx.detectionRules && tx.detectionRules.length > 0 ? tx.detectionRules[0] : "—"}
                    </td>
                    <td className="px-3 py-3 text-gray-500 whitespace-nowrap">{tx.dateTime}</td>
                    <td className="px-3 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          statusColor[tx.detectionResult] || "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {tx.detectionResult}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => navigate("fraud-logs")}
                          className="text-[10px] text-white bg-[#1e40af] hover:bg-[#1d4ed8] px-2 py-1 rounded font-medium transition-colors"
                        >
                          Log
                        </button>
                        <button
                          onClick={() => navigate("investigations")}
                          className="text-[10px] text-white bg-orange-500 hover:bg-orange-600 px-2 py-1 rounded font-medium transition-colors"
                        >
                          Investigate
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
    </div>
  );
}
