import { useState, useEffect } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { Screen } from "../App";
import { api } from "../api/client";

interface Props {
  navigate: (s: Screen) => void;
  onSelectTransaction: (id: string) => void;
}

const statusColor: Record<string, string> = {
  Completed: "bg-green-100 text-green-700",
  Pending: "bg-yellow-100 text-yellow-700",
  Failed: "bg-red-100 text-red-700",
  Suspicious: "bg-orange-100 text-orange-700",
};

const riskColor: Record<string, string> = {
  Low: "text-green-600",
  Medium: "text-yellow-600",
  High: "text-orange-600",
  Critical: "text-red-600",
};

const alertRiskBadge: Record<string, string> = {
  High: "bg-orange-100 text-orange-700 border-orange-200",
  Critical: "bg-red-100 text-red-700 border-red-200",
};

export default function Dashboard({ navigate, onSelectTransaction }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any>({
    transactionVolume: [],
    fraudTrend: [],
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, reportsRes] = await Promise.all([
        api.stats.getStats(),
        api.reports.get(),
      ]);
      setStats(statsRes);
      if (reportsRes && reportsRes.charts) {
        setChartData(reportsRes.charts);
      }
    } catch (err: any) {
      console.error("Failed to load dashboard data:", err);
      setError(err.message || "Failed to load dashboard statistics from database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="grid grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 bg-white border border-gray-200 rounded p-4" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-64 bg-white border border-gray-200 rounded" />
          <div className="h-64 bg-white border border-gray-200 rounded" />
        </div>
        <div className="h-64 bg-white border border-gray-200 rounded" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded p-6 text-center">
        <p className="text-red-700 font-semibold mb-2">Error connecting to database</p>
        <p className="text-xs text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchData}
          className="text-xs text-white bg-[#1e40af] hover:bg-[#1d4ed8] px-4 py-2 rounded font-medium transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const kpis = [
    {
      label: "Total Transactions",
      value: `₹${((stats?.totalAmount || 0) / 1000000).toFixed(1)}M`,
      sub: `${stats?.transactions || 0} Total in System`,
      color: "#1e40af",
      screen: "transactions" as Screen,
    },
    {
      label: "Total Accounts",
      value: String(stats?.accounts || 0),
      sub: `${stats?.customers || 0} Registered Customers`,
      color: "#0369a1",
      screen: "accounts" as Screen,
    },
    {
      label: "Suspicious Transactions",
      value: String(stats?.flagged || 0),
      sub: "Flagged by Rules & Triggers",
      color: "#b45309",
      screen: "fraud-detection" as Screen,
    },
    {
      label: "Audit Fraud Logs",
      value: String(stats?.fraudLogs || 0),
      sub: "Recorded Security Events",
      color: "#dc2626",
      screen: "fraud-logs" as Screen,
    },
    {
      label: "Pending Investigations",
      value: String(stats?.pendingInvestigations || 0),
      sub: "Require Action",
      color: "#7c3aed",
      screen: "investigations" as Screen,
    },
  ];

  const recent = stats?.recentTransactions || [];
  const alerts = stats?.recentFraudAlerts || [];

  return (
    <div className="space-y-5">
      {/* KPI Cards */}
      <div className="grid grid-cols-5 gap-4">
        {kpis.map((k) => (
          <div
            key={k.label}
            onClick={() => navigate(k.screen)}
            className="bg-white border border-gray-200 rounded p-4 cursor-pointer hover:shadow-sm transition-all"
            style={{ borderLeftColor: k.color, borderLeftWidth: 3 }}
          >
            <p className="text-xs text-gray-500 font-medium mb-1.5">{k.label}</p>
            <p className="text-2xl font-bold text-gray-900">{k.value}</p>
            <p className="text-xs mt-1" style={{ color: k.color }}>{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Transaction Activity */}
        <div className="bg-white border border-gray-200 rounded p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Transaction Activity</h3>
              <p className="text-xs text-gray-500">Live Database Trends — Volume &amp; Amount</p>
            </div>
            <button
              onClick={() => navigate("reports")}
              className="text-xs text-[#2563eb] hover:underline font-medium"
            >
              Full Analytics →
            </button>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData.transactionVolume}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ fontSize: 11, border: "1px solid #e5e7eb", borderRadius: 4 }}
                labelStyle={{ fontWeight: 600 }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="transactions" stroke="#2563eb" strokeWidth={2} dot={false} name="Transactions" />
              <Line type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} dot={false} name="Amount (₹M)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Fraud Detection Overview */}
        <div className="bg-white border border-gray-200 rounded p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Fraud Detection Overview</h3>
              <p className="text-xs text-gray-500">Suspicious vs High-Value Alerts</p>
            </div>
            <button
              onClick={() => navigate("fraud-detection")}
              className="text-xs text-[#2563eb] hover:underline font-medium"
            >
              View All →
            </button>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData.fraudTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 11, border: "1px solid #e5e7eb", borderRadius: 4 }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="suspicious" fill="#f59e0b" name="Suspicious" radius={[2, 2, 0, 0]} />
              <Bar dataKey="confirmed" fill="#ef4444" name="High Risk" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Recent Transactions */}
        <div className="col-span-2 bg-white border border-gray-200 rounded">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Recent Transactions</h3>
            <button
              onClick={() => navigate("transactions")}
              className="text-xs text-[#2563eb] hover:underline font-medium"
            >
              View All ({stats?.transactions || 0}) →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-4 py-2.5 text-gray-500 font-medium">TX ID</th>
                  <th className="text-left px-3 py-2.5 text-gray-500 font-medium">Customer</th>
                  <th className="text-left px-3 py-2.5 text-gray-500 font-medium">Type</th>
                  <th className="text-left px-3 py-2.5 text-gray-500 font-medium">Merchant</th>
                  <th className="text-right px-3 py-2.5 text-gray-500 font-medium">Amount</th>
                  <th className="text-left px-3 py-2.5 text-gray-500 font-medium">Status</th>
                  <th className="text-left px-3 py-2.5 text-gray-500 font-medium">Risk</th>
                </tr>
              </thead>
              <tbody>
                {recent.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-400">
                      No transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  recent.map((tx: any) => (
                    <tr
                      key={tx.id}
                      className="border-b border-gray-50 hover:bg-blue-50/40 cursor-pointer transition-colors"
                      onClick={() => onSelectTransaction(tx.id)}
                    >
                      <td className="px-4 py-2.5 font-mono text-[11px] text-[#2563eb] font-medium">{tx.id}</td>
                      <td className="px-3 py-2.5 text-gray-800 font-medium">{tx.customerName}</td>
                      <td className="px-3 py-2.5 text-gray-600">{tx.type}</td>
                      <td className="px-3 py-2.5 text-gray-600 max-w-[120px] truncate">{tx.merchant}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-gray-900 font-medium">
                        ₹{tx.amount.toLocaleString()}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${statusColor[tx.status] || "bg-gray-100 text-gray-700"}`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className={`px-3 py-2.5 font-semibold ${riskColor[tx.risk] || "text-gray-600"}`}>
                        {tx.risk}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Fraud Alerts */}
        <div className="bg-white border border-gray-200 rounded">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Recent Fraud Alerts</h3>
            <span className="text-[10px] bg-red-100 text-red-600 font-semibold px-2 py-0.5 rounded">
              {alerts.length} Active
            </span>
          </div>
          <div className="divide-y divide-gray-50 max-h-[360px] overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400">No active alerts.</div>
            ) : (
              alerts.map((alert: any) => (
                <div key={alert.id} className="p-3 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="font-mono text-[10px] text-[#2563eb] font-medium">{alert.transactionId}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${alertRiskBadge[alert.riskLevel] || "bg-yellow-100 text-yellow-700"}`}>
                      {alert.riskLevel}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-800 font-medium mb-0.5">{alert.customerName}</p>
                  <p className="text-[10px] text-gray-500 leading-snug mb-2">{alert.reason}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400">{alert.time}</span>
                    <button
                      onClick={() => onSelectTransaction(alert.transactionId)}
                      className="text-[10px] text-white bg-[#1e40af] hover:bg-[#1d4ed8] px-2.5 py-1 rounded font-medium transition-colors"
                    >
                      Review
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium text-gray-500">Quick Actions:</span>
        {[
          { label: "New Investigation", screen: "investigations" as Screen },
          { label: "View Fraud Logs", screen: "fraud-logs" as Screen },
          { label: "Generate Report", screen: "reports" as Screen },
          { label: "Customer Lookup", screen: "customers" as Screen },
          { label: "Accounts", screen: "accounts" as Screen },
        ].map((a) => (
          <button
            key={a.label}
            onClick={() => navigate(a.screen)}
            className="text-xs border border-gray-300 rounded px-3 py-1.5 text-gray-700 hover:border-[#2563eb] hover:text-[#2563eb] hover:bg-blue-50/50 transition-colors shadow-2xs"
          >
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}
