import { useState, useEffect } from "react";
import type { InvStatus, Priority } from "../data";
import { api } from "../api/client";

interface Props {
  onSelect: (id: string) => void;
}

const statusColor: Record<string, string> = {
  Open: "bg-blue-100 text-blue-700",
  "Under Investigation": "bg-yellow-100 text-yellow-700",
  Resolved: "bg-green-100 text-green-700",
  Closed: "bg-gray-100 text-gray-600",
};

const priorityColor: Record<string, string> = {
  Low: "text-gray-500",
  Medium: "text-yellow-600",
  High: "text-orange-600",
  Critical: "text-red-600 font-bold",
};

export default function Investigations({ onSelect }: Props) {
  const [investigations, setInvestigations] = useState<any[]>([]);
  const [counts, setCounts] = useState<any>({ open: 0, underInv: 0, resolved: 0, closed: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");

  // New Investigation Modal
  const [showModal, setShowModal] = useState(false);
  const [newTxId, setNewTxId] = useState("");
  const [newPriority, setNewPriority] = useState<Priority>("High");
  const [newInvestigator, setNewInvestigator] = useState("Amit Joshi");
  const [newNote, setNewNote] = useState("");
  const [newEvidence, setNewEvidence] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchCases = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.investigations.list({
        status: statusFilter,
        priority: priorityFilter,
      });
      setInvestigations(res.data || []);
      setCounts(res.counts || { open: 0, underInv: 0, resolved: 0, closed: 0 });
    } catch (err: any) {
      console.error("Failed to load investigations:", err);
      setError(err.message || "Failed to load investigation cases from MySQL.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [statusFilter, priorityFilter]);

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    if (!newTxId.trim()) {
      setModalError("Please enter a Transaction ID (e.g., TXN-0002 or 2).");
      return;
    }

    setModalLoading(true);
    try {
      const res = await api.investigations.create({
        transactionId: newTxId.trim(),
        priority: newPriority,
        assignedInvestigator: newInvestigator,
        note: newNote,
        evidence: newEvidence,
      });
      setShowModal(false);
      setNewTxId("");
      setNewNote("");
      setNewEvidence("");
      fetchCases();
      if (res.investigationId) {
        onSelect(res.investigationId);
      }
    } catch (err: any) {
      setModalError(err.message || "Failed to create investigation case.");
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Open Cases", value: counts.open, color: "#2563eb", border: "#93c5fd" },
          { label: "Under Investigation", value: counts.underInv, color: "#b45309", border: "#fcd34d" },
          { label: "Resolved", value: counts.resolved, color: "#16a34a", border: "#4ade80" },
          { label: "Closed", value: counts.closed, color: "#6b7280", border: "#d1d5db" },
        ].map((c) => (
          <div
            key={c.label}
            className="bg-white border border-gray-200 rounded p-4"
            style={{ borderLeftColor: c.border, borderLeftWidth: 3 }}
          >
            <p className="text-xs text-gray-500 mb-1">{c.label}</p>
            <p className="text-2xl font-bold" style={{ color: c.color }}>
              {c.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded p-4">
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded px-3 py-2 text-gray-700 focus:outline-none focus:border-[#2563eb]"
          >
            <option value="">All Statuses</option>
            {["Open", "Under Investigation", "Resolved", "Closed"].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded px-3 py-2 text-gray-700 focus:outline-none focus:border-[#2563eb]"
          >
            <option value="">All Priorities</option>
            {["Critical", "High", "Medium", "Low"].map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              setStatusFilter("");
              setPriorityFilter("");
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
              + New Investigation
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Investigation Cases</h3>
          <p className="text-xs text-gray-500">{investigations.length} cases found in database</p>
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
                {["Investigation ID", "Fraud Log ID", "Customer", "Transaction", "Investigator", "Priority", "Status", "Created", "Updated", "Action"].map(
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
                  <td colSpan={10} className="py-12 text-center text-gray-400">
                    <span className="animate-spin inline-block w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full mr-2" />
                    Loading cases from MySQL...
                  </td>
                </tr>
              ) : investigations.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-gray-400">
                    No investigation cases match the selected criteria.
                  </td>
                </tr>
              ) : (
                investigations.map((inv) => (
                  <tr
                    key={inv.id}
                    className="border-b border-gray-50 hover:bg-blue-50/30 cursor-pointer transition-colors"
                    onClick={() => onSelect(inv.id)}
                  >
                    <td className="px-3 py-3 font-mono text-[11px] text-[#2563eb] font-medium">{inv.id}</td>
                    <td className="px-3 py-3 font-mono text-[11px] text-gray-500">{inv.fraudLogId}</td>
                    <td className="px-3 py-3 text-gray-800 font-medium">{inv.customerName}</td>
                    <td className="px-3 py-3 font-mono text-[11px] text-gray-600">{inv.transactionId}</td>
                    <td className="px-3 py-3 text-gray-700">{inv.assignedInvestigator}</td>
                    <td className={`px-3 py-3 font-semibold ${priorityColor[inv.priority] || "text-gray-600"}`}>
                      {inv.priority}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${statusColor[inv.status] || "bg-gray-100 text-gray-700"}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-gray-500 whitespace-nowrap">{inv.createdDate}</td>
                    <td className="px-3 py-3 text-gray-500 whitespace-nowrap">{inv.lastUpdated}</td>
                    <td className="px-3 py-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(inv.id);
                        }}
                        className="text-[10px] text-white bg-[#1e40af] hover:bg-[#1d4ed8] px-2.5 py-1 rounded font-medium transition-colors"
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Investigation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 text-xl font-bold"
            >
              ×
            </button>
            <h2 className="text-base font-bold text-gray-900 mb-1">Open New Investigation Case</h2>
            <p className="text-xs text-gray-500 mb-4">
              Create an official case linked to a transaction record.
            </p>

            {modalError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
                ⚠ {modalError}
              </div>
            )}

            <form onSubmit={handleCreateCase} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-gray-700 mb-1">Transaction ID</label>
                <input
                  type="text"
                  value={newTxId}
                  onChange={(e) => setNewTxId(e.target.value)}
                  placeholder="e.g. TXN-0002 or 2"
                  required
                  className="w-full border border-gray-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#2563eb]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as Priority)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#2563eb]"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Assign Investigator</label>
                  <select
                    value={newInvestigator}
                    onChange={(e) => setNewInvestigator(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#2563eb]"
                  >
                    <option value="Amit Joshi">Amit Joshi (Senior Investigator)</option>
                    <option value="Neha Tiwari">Neha Tiwari (Fraud Analyst)</option>
                    <option value="Rajesh Kumar">Rajesh Kumar (Compliance Officer)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Initial Case Note</label>
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={2}
                  placeholder="Reason for opening investigation..."
                  className="w-full border border-gray-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#2563eb]"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Initial Evidence</label>
                <input
                  type="text"
                  value={newEvidence}
                  onChange={(e) => setNewEvidence(e.target.value)}
                  placeholder="e.g. Geolocation anomaly or blacklisted merchant match"
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
                  {modalLoading ? "Creating..." : "Open Case"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
