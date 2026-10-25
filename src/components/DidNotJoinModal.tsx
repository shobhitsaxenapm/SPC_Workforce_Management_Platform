import React, { useState } from 'react';
import { Candidate, Job, Placement } from '../types';
import { useApp } from '../context/AppContext';
import { X, UserX, AlertCircle, FileText } from 'lucide-react';

interface DidNotJoinModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate;
  job: Job;
  applicationId: string;
  placement?: Placement;
}

const COMMON_REASONS = [
  'Counter-offer accepted at current employer',
  'Accepted competing offer from another company',
  'Compensation / Title mismatch after offer stage',
  'Relocation / Personal constraints',
  'Client revoked position / hiring freeze',
  'Candidate unresponsive / ghosted joining date',
  'Other / Custom note'
];

export default function DidNotJoinModal({
  isOpen,
  onClose,
  candidate,
  job,
  applicationId,
}: DidNotJoinModalProps) {
  const { recordDidNotJoin } = useApp();
  const [selectedReason, setSelectedReason] = useState(COMMON_REASONS[0]);
  const [customNotes, setCustomNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = selectedReason === 'Other / Custom note'
      ? (customNotes.trim() || 'Did not join (details omitted)')
      : (customNotes.trim() ? `${selectedReason} - ${customNotes.trim()}` : selectedReason);

    const res = recordDidNotJoin(applicationId, finalReason);
    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'Failed to record Did Not Join status.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Record Candidate Did Not Join</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {candidate.fullName || (candidate as any).name} • {job.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
              {error}
            </div>
          )}

          <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-950">Deliberate Recruiter Action Preserved:</p>
              <p className="mt-0.5 text-amber-900">
                The candidate remains under <strong>Selected</strong> with a <strong>Did Not Join</strong> status. 
                They will <strong>not</strong> be automatically rejected, giving the team full control to follow up or re-engage.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reason for not joining <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
            >
              {COMMON_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-slate-400" />
              Additional Details / Follow-up Notes
            </label>
            <textarea
              rows={3}
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="e.g. Candidate informed via call; open to reconsidering in Q3..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
            >
              <UserX className="w-4 h-4" />
              Record Did Not Join
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
