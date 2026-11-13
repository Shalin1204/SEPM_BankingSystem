import { useState, useEffect } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { api } from "../api/client";

const PIE_COLORS = ["#2563eb", "#0891b2", "#7c3aed", "#dc2626", "#f59e0b"];

export default function Reports() {
  const [period, setPeriod] = useState("Last 30 Days");
  const [dateFrom, setDateFrom] = useState("2026-03-01");
  const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10));
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.reports.get({
        period,
        from: dateFrom,
        to: dateTo,
      });
      setData(res);
    } catch (err: any) {
      console.error("Failed to load report analytics:", err);
      setError(err.message || "Failed to load report analytics from MySQL.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [period, dateFrom, dateTo]);

  const handleExport = () => {
    if (!data) return;
    const summary = data.summary || {};
    const lines = [
      "FraudShield — Security & Transaction Analytics Report",
      `Generated on: ${new Date().toISOString()}`,
      `Period: ${period} (${dateFrom} to ${dateTo})`,
      "",
      "--- KPI SUMMARY ---",
      `Total Transactions: ${summary.totalTransactions}`,
      `Total Transaction Value: ${summary.transactionValue}`,
      `Fraud Cases: ${summary.fraudCases}`,
      `Fraud Rate: ${summary.fraudRate}`,
      "",
      "--- TRANSACTION VOLUME BY DATE ---",
      "Date,Transactions,Amount (INR M)",
      ...(data.charts?.transactionVolume || []).map((v: any) => `${v.date},${v.transactions},${v.amount}`),
      "",
      "--- FRAUD INCIDENTS BY LOCATION ---",
      "Location,Cases",
      ...(data.charts?.fraudByLocation || []).map((l: any) => `"${l.city}",${l.count}`),
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `FraudShield_Analytics_Report_${dateFrom}_${dateTo}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-gray-400">
        <span className="animate-spin inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mr-2" />
        Aggregating financial and fraud report data from MySQL...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded p-6 text-center">
        <p className="text-red-700 font-semibold mb-2">Error loading analytics</p>
        <p className="text-xs text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchReports}
          className="text-xs text-white bg-[#1e40af] hover:bg-[#1d4ed8] px-4 py-2 rounded font-medium transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const summary = data.summary || {};
  const charts = data.charts || {};

  return (
    <div className="space-y-5">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="text-sm border border-gray-200 rounded px-3 py-2 text-gray-700 focus:outline-none focus:border-[#2563eb]"
          >
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>Last 90 Days</option>
            <option>This Year</option>
          </select>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="border border-gray-200 rounded px-3 py-2 text-gray-700 text-xs"
            />
            <span>to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="border border-gray-200 rounded px-3 py-2 text-gray-700 text-xs"
            />
          </div>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 text-sm text-white bg-[#1e40af] hover:bg-[#1d4ed8] px-4 py-2 rounded font-medium transition-colors shadow-2xs"
        >
          ⬇ Export Report CSV
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Transactions", value: String(summary.totalTransactions), sub: `${period} volume`, color: "#1e40af" },
          { label: "Transaction Value", value: summary.transactionValue, sub: "Total INR transacted", color: "#0369a1" },
          { label: "Fraud Cases", value: String(summary.fraudCases), sub: "Flagged transactions", color: "#dc2626" },
          { label: "Fraud Rate", value: summary.fraudRate, sub: "of total transactions", color: "#b45309" },
        ].map((k) => (
          <div key={k.label} className="bg-white border border-gray-200 rounded p-4" style={{ borderTopColor: k.color, borderTopWidth: 3 }}>
            <p className="text-xs text-gray-500 mb-1">{k.label}</p>
            <p className="text-2xl font-bold text-gray-900">{k.value}</p>
            <p className="text-xs text-gray-400 mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Transaction Volume Over Time</h3>
          <p className="text-xs text-gray-500 mb-4">Daily transaction count and volume in ₹M</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={charts.transactionVolume || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 11, border: "1px solid #e5e7eb", borderRadius: 4 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="transactions" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} name="Transactions" />
              <Line type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="Amount (₹M)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-gray-200 rounded p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Fraud Detection Trend</h3>
          <p className="text-xs text-gray-500 mb-4">Suspicious vs High-Value Fraud incidents</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={charts.fraudTrend || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 11, border: "1px solid #e5e7eb", borderRadius: 4 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="suspicious" fill="#f59e0b" name="Suspicious" radius={[2, 2, 0, 0]} />
              <Bar dataKey="confirmed" fill="#ef4444" name="High Risk" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-3 gap-4">
        {/* Pie */}
        <div className="bg-white border border-gray-200 rounded p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Fraud by Transaction Type</h3>
          <p className="text-xs text-gray-500 mb-2">Distribution by payment type</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={charts.fraudByType || []}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={65}
                innerRadius={30}
                paddingAngle={2}
              >
                {(charts.fraudByType || []).map((_: any, i: number) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 11, border: "1px solid #e5e7eb", borderRadius: 4 }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Fraud by Merchant */}
        <div className="bg-white border border-gray-200 rounded p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Fraud by Merchant Category</h3>
          <p className="text-xs text-gray-500 mb-4">Top fraud-prone merchant entities</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={charts.fraudByMerchant || []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis dataKey="merchant" type="category" tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} width={80} />
              <Tooltip contentStyle={{ fontSize: 11, border: "1px solid #e5e7eb", borderRadius: 4 }} />
              <Bar dataKey="count" fill="#2563eb" name="Cases" radius={[0, 2, 2, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Fraud by Location */}
        <div className="bg-white border border-gray-200 rounded p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Fraud by Geolocation</h3>
          <div className="space-y-2.5">
            {(charts.fraudByLocation || []).map((loc: any) => (
              <div key={loc.city}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-700">{loc.city}</span>
                  <span className="text-gray-500 font-mono">{loc.count} cases</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#2563eb] rounded-full" style={{ width: `${loc.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
