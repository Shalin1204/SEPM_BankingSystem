import { useState, useEffect } from "react";
import type { Screen, InvStatus } from "../App";
import { api } from "../api/client";

interface Props {
  invId: string;
  navigate: (s: Screen) => void;
}

const statusColor: Record<string, string> = {
  Open: "bg-blue-100 text-blue-700 border-blue-200",
  "Under Investigation": "bg-yellow-100 text-yellow-700 border-yellow-200",
  Resolved: "bg-green-100 text-green-700 border-green-200",
  Closed: "bg-gray-100 text-gray-600 border-gray-200",
};

const priorityColor: Record<string, string> = {
  Low: "text-gray-500",
  Medium: "text-yellow-600",
  High: "text-orange-600",
  Critical: "text-red-600 font-bold",
};

export default function InvestigationDetail({ invId, navigate }: Props) {
  const [inv, setInv] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [noteText, setNoteText] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<InvStatus>("Open");
  const [selectedInvestigator, setSelectedInvestigator] = useState("");
  const [updating, setUpdating] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.investigations.get(invId);
      setInv(data);
      setSelectedStatus(data.status || "Open");
      setSelectedInvestigator(data.assignedInvestigator || "Amit Joshi");
    } catch (err: any) {
      console.error("Failed to load investigation details:", err);
      setError(err.message || "Investigation not found.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [invId]);

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    setAddingNote(true);
    try {
      await api.investigations.addNote(invId, noteText.trim());
      setNoteText("");
      fetchDetail();
    } catch (err: any) {
      alert(err.message || "Failed to add note");
    } finally {
      setAddingNote(false);
    }
  };

  const handleUpdateStatus = async () => {
    setUpdating(true);
    setActionMessage(null);
    try {
      await api.investigations.update(invId, {
        status: selectedStatus,
        assignedInvestigator: selectedInvestigator,
      });
      setActionMessage("Status & Assignee updated successfully.");
      fetchDetail();
    } catch (err: any) {
      setActionMessage(err.message || "Failed to update case.");
    } finally {
      setUpdating(false);
    }
  };

  const handleAction = async (action: "confirm_fraud" | "mark_false_positive" | "close") => {
    setActionMessage(null);
    try {
      const res = await api.investigations.executeAction(invId, action);
      setActionMessage(res.message);
      fetchDetail();
    } catch (err: any) {
      setActionMessage(err.message || "Action execution failed.");
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-gray-400">
        <span className="animate-spin inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mr-2" />
        Loading investigation details...
      </div>
    );
  }

  if (error || !inv) {
    return (
      <div className="space-y-4 max-w-5xl">
        <button onClick={() => navigate("investigations")} className="text-sm text-gray-500 hover:text-gray-700">
          ← Back to Investigations
        </button>
        <div className="text-center py-16 bg-white border border-gray-200 rounded">
          <p className="text-gray-500 text-sm mb-2">{error || "Investigation case not found in database."}</p>
          <button
            onClick={() => navigate("investigations")}
            className="text-xs text-white bg-[#1e40af] px-3 py-1.5 rounded"
          >
            Return to Investigations
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-5xl">
      {/* Back */}
      <button
        onClick={() => navigate("investigations")}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        ← Back to Investigations
      </button>

      {actionMessage && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-700 text-xs rounded flex items-center justify-between">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="text-blue-900 font-bold ml-2">×</button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border border-gray-200 rounded p-5 flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-400 mb-1">Investigation Case</p>
          <p className="font-mono text-xl font-bold text-gray-900">{inv.id}</p>
          <p className="text-xs text-gray-400 mt-1">
            Created {inv.createdDate} · Last updated {inv.lastUpdated}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <span className={`px-3 py-1 rounded border text-xs font-semibold ${statusColor[inv.status] || "bg-gray-100 text-gray-700"}`}>
            {inv.status}
          </span>
          <span className={`text-sm font-bold ${priorityColor[inv.priority] || "text-gray-600"}`}>
            {inv.priority} Priority
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Left: Case Info + Evidence + Notes */}
        <div className="col-span-2 space-y-4">
          {/* Case Information */}
          <div className="bg-white border border-gray-200 rounded p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">
              Case Information
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              {[
                { label: "Customer", value: inv.customerName },
                { label: "Customer ID", value: inv.customerId },
                { label: "Transaction ID", value: inv.transactionId },
                { label: "Transaction Amount", value: `₹${inv.amount.toLocaleString()}` },
                { label: "Fraud Log ID", value: inv.fraudLogId },
                { label: "Assigned Investigator", value: inv.assignedInvestigator },
                { label: "Merchant", value: inv.merchant || "Direct Transfer" },
                { label: "Location", value: inv.location || "Mumbai" },
              ].map((f) => (
                <div key={f.label}>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">{f.label}</p>
                  <p className="font-medium text-gray-900">{f.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Fraud Evidence */}
          <div className="bg-white border border-orange-200 rounded p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 pb-3 border-b border-gray-100">
              Fraud Evidence &amp; Triggers
            </h3>
            <div className="space-y-2">
              {inv.evidence && inv.evidence.length > 0 ? (
                inv.evidence.map((e: string, i: number) => (
                  <div key={i} className="flex items-start gap-2.5 p-2.5 bg-orange-50 rounded border border-orange-100">
                    <span className="text-orange-500 text-sm mt-0.5">⚠</span>
                    <p className="text-xs text-orange-800">{e}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400">No specific evidence attached yet.</p>
              )}
            </div>
          </div>

          {/* Investigation Notes */}
          <div className="bg-white border border-gray-200 rounded p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Investigation Notes</h3>
            <div className="space-y-2 mb-4">
              {inv.notes && inv.notes.length > 0 ? (
                inv.notes.map((n: string, i: number) => (
                  <div key={i} className="flex items-start gap-2.5 p-3 bg-gray-50 rounded border border-gray-100">
                    <div className="w-5 h-5 bg-[#1e40af] rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
                      {inv.assignedInvestigator ? inv.assignedInvestigator.split(" ").map((w: string) => w[0]).join("") : "INV"}
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 mb-0.5">{inv.assignedInvestigator} · Recorded</p>
                      <p className="text-xs text-gray-800">{n}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400 py-2">No notes recorded yet.</p>
              )}
            </div>
            <div className="flex gap-2">
              <input
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
                placeholder="Add investigation note..."
                className="flex-1 text-sm border border-gray-200 rounded px-3 py-2 focus:outline-none focus:border-[#2563eb]"
              />
              <button
                onClick={handleAddNote}
                disabled={addingNote || !noteText.trim()}
                className="text-sm text-white bg-[#1e40af] hover:bg-[#1d4ed8] px-4 py-2 rounded font-medium transition-colors disabled:opacity-50"
              >
                {addingNote ? "Saving..." : "Add Note"}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="space-y-4">
          {/* Update Status & Assignee */}
          <div className="bg-white border border-gray-200 rounded p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Update Status</h3>
            <label className="block text-xs text-gray-500 mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as InvStatus)}
              className="w-full text-sm border border-gray-200 rounded px-3 py-2 focus:outline-none focus:border-[#2563eb] mb-3"
            >
              {["Open", "Under Investigation", "Resolved", "Closed"].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <label className="block text-xs text-gray-500 mb-1">Assigned Investigator</label>
            <select
              value={selectedInvestigator}
              onChange={(e) => setSelectedInvestigator(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded px-3 py-2 focus:outline-none mb-3"
            >
              <option value="Amit Joshi">Amit Joshi (Senior Investigator)</option>
              <option value="Neha Tiwari">Neha Tiwari (Fraud Analyst)</option>
              <option value="Rajesh Kumar">Rajesh Kumar (Compliance Officer)</option>
            </select>

            <button
              onClick={handleUpdateStatus}
              disabled={updating}
              className="w-full text-sm text-white bg-[#1e40af] hover:bg-[#1d4ed8] py-2 rounded font-medium transition-colors disabled:opacity-50"
            >
              {updating ? "Updating..." : "Save Changes"}
            </button>
          </div>

          {/* Quick Case Actions */}
          <div className="bg-white border border-gray-200 rounded p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Case Actions</h3>
            <div className="space-y-2">
              <button
                onClick={() => handleAction("confirm_fraud")}
                className="w-full text-sm text-white bg-red-600 hover:bg-red-700 py-2 rounded font-medium transition-colors"
              >
                ⚠ Confirm Fraud
              </button>
              <button
                onClick={() => handleAction("mark_false_positive")}
                className="w-full text-sm text-white bg-green-600 hover:bg-green-700 py-2 rounded font-medium transition-colors"
              >
                ✓ Mark False Positive
              </button>
              <button
                onClick={() => navigate("fraud-logs")}
                className="w-full text-sm border border-gray-200 py-2 rounded text-gray-700 hover:border-gray-300 transition-colors"
              >
                View Fraud Log
              </button>
              <button
                onClick={() => handleAction("close")}
                className="w-full text-sm border border-red-200 py-2 rounded text-red-600 hover:bg-red-50 transition-colors"
              >
                Close Investigation
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
