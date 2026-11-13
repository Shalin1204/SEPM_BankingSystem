import { useState, useEffect } from "react";
import type { Screen } from "../App";
import { api } from "../api/client";

interface Props {
  navigate: (s: Screen) => void;
}

const statusColor: Record<string, string> = {
  New: "bg-blue-100 text-blue-700",
  "Under Review": "bg-yellow-100 text-yellow-700",
  Confirmed: "bg-red-100 text-red-700",
  "False Positive": "bg-green-100 text-green-700",
};

const riskBar = (score: number) => {
  if (score >= 90) return "bg-red-500";
  if (score >= 70) return "bg-orange-500";
  if (score >= 50) return "bg-yellow-500";
  return "bg-green-500";
};

export default function FraudLogs({ navigate }: Props) {
  const [logs, setLogs] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({
    total: 0,
    confirmed: 0,
    underReview: 0,
    falsePositives: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [riskFilter, setRiskFilter] = useState("");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.fraud.getLogs({
        search,
        status: statusFilter,
        type: typeFilter,
        riskLevel: riskFilter,
        date: dateFilter,
      });
      setLogs(res.logs || []);
      setSummary(res.summary || { total: 0, confirmed: 0, underReview: 0, falsePositives: 0 });
    } catch (err: any) {
      console.error("Failed to load fraud logs:", err);
      setError(err.message || "Failed to load fraud audit logs from database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [search, statusFilter, typeFilter, riskFilter, dateFilter]);

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setTypeFilter("");
    setRiskFilter("");
    setDateFilter("");
  };

  const exportCSV = () => {
    if (logs.length === 0) return;
    const headers = ["Fraud Log ID", "Transaction ID", "Detection Rule", "Risk Score", "Fraud Type", "Detected Date", "Status", "Investigator"];
    const rows = logs.map((l) => [
      l.id,
      l.transactionId,
      `"${l.detectionRule}"`,
      l.riskScore,
      `"${l.fraudType}"`,
      `"${l.detectedDate}"`,
      l.status,
      `"${l.investigator}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `FraudShield_Logs_${new Date().toISOString().slice(0, 10)}.csv`);
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
              placeholder="Search by Log ID, Transaction ID, Fraud Type, Rule..."
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:border-[#2563eb]"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded px-3 py-2 text-gray-700 focus:outline-none"
          >
            <option value="">All Statuses</option>
            {["New", "Under Review", "Confirmed", "False Positive"].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded px-3 py-2 text-gray-700 focus:outline-none"
          >
            <option value="">All Fraud Types</option>
            {["Blocked Merchant", "High Value", "Card Not Present", "Location Mismatch", "Automated Detection"].map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded px-3 py-2 text-gray-700 focus:outline-none"
          >
            <option value="">All Risk Levels</option>
            <option value="90">Critical (90+)</option>
            <option value="70">High (70–89)</option>
            <option value="50">Medium (50–69)</option>
          </select>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded px-3 py-2 text-gray-700 focus:outline-none"
          />
          <button
            onClick={clearFilters}
            className="text-sm px-3 py-2 border border-gray-200 rounded text-gray-500 hover:text-gray-700 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total Fraud Logs", value: summary.total, color: "#1e40af" },
          { label: "Confirmed Fraud", value: summary.confirmed, color: "#dc2626" },
          { label: "Under Review", value: summary.underReview, color: "#b45309" },
          { label: "False Positives", value: summary.falsePositives, color: "#16a34a" },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-gray-200 rounded p-3 text-center">
            <p className="text-xl font-bold" style={{ color: s.color }}>
              {s.value}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Fraud Log Records</h3>
            <p className="text-xs text-gray-500">{logs.length} logs recorded in database</p>
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
                {["Fraud Log ID", "Transaction ID", "Detection Rule", "Risk Score", "Fraud Type", "Detected Date", "Status", "Investigator", "Action"].map(
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
                    Loading fraud logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400">
                    No fraud logs match the selected criteria.
                  </td>
                </tr>
              ) : (
                logs.map((fl) => (
                  <tr key={fl.id} className="border-b border-gray-50 hover:bg-gray-50/70 transition-colors">
                    <td className="px-3 py-3 font-mono text-[11px] text-[#2563eb] font-medium">{fl.id}</td>
                    <td className="px-3 py-3 font-mono text-[11px] text-gray-600">{fl.transactionId}</td>
                    <td className="px-3 py-3 text-gray-700 max-w-[180px] truncate">{fl.detectionRule}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${riskBar(fl.riskScore)}`} style={{ width: `${fl.riskScore}%` }} />
                        </div>
                        <span className="font-mono font-bold text-gray-900">{fl.riskScore}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-gray-700 whitespace-nowrap">{fl.fraudType}</td>
                    <td className="px-3 py-3 text-gray-500 whitespace-nowrap">{fl.detectedDate}</td>
                    <td className="px-3 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${statusColor[fl.status] || "bg-gray-100 text-gray-600"}`}>
                        {fl.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-gray-700">{fl.investigator}</td>
                    <td className="px-3 py-3">
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => navigate("investigations")}
                          className="text-[10px] text-white bg-[#1e40af] hover:bg-[#1d4ed8] px-2 py-1 rounded font-medium transition-colors"
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
