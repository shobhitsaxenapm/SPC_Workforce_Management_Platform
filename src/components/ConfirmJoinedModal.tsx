import React, { useState } from 'react';
import { Candidate, Job, Placement } from '../types';
import { useApp } from '../context/AppContext';
import { X, Calendar, CheckCircle, FileText, AlertCircle } from 'lucide-react';

interface ConfirmJoinedModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate;
  job: Job;
  applicationId: string;
  placement?: Placement;
}

export default function ConfirmJoinedModal({
  isOpen,
  onClose,
  candidate,
  job,
  applicationId,
  placement,
}: ConfirmJoinedModalProps) {
  const { confirmJoined } = useApp();
  const [actualJoiningDate, setActualJoiningDate] = useState(
    placement?.expectedJoiningDate || new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actualJoiningDate) {
      setError('Actual joining date is required.');
      return;
    }

    const res = confirmJoined(applicationId, actualJoiningDate, notes.trim() || undefined);
    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'Failed to confirm joined status.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Confirm Joined on Client Payroll</h3>
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

          <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-950 leading-relaxed flex items-start gap-2.5">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-emerald-950">Placement &amp; Billing Impact:</p>
              <p className="mt-0.5 text-emerald-900">
                Candidate will move into <strong>Completed Outcomes</strong> as <strong>Joined/Placed</strong>. 
                A linked Placement record will be marked <strong>Billing Eligible</strong> for agency placement invoicing.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              Actual Joining Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={actualJoiningDate}
              onChange={(e) => setActualJoiningDate(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-slate-400" />
              Confirmation Notes (Optional)
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Joined client Bangalore office; onboarding verified by client HR manager..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
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
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              Confirm Joined &amp; Make Billing Eligible
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
