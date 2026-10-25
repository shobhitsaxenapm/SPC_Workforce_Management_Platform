import React, { useState } from 'react';
import { Candidate, Job } from '../types';
import { useApp } from '../context/AppContext';
import { X, Calendar, FileText, CheckCircle2 } from 'lucide-react';

interface StartJoiningTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate;
  job: Job;
  applicationId: string;
  initialExpectedDate?: string;
  initialNotes?: string;
}

export default function StartJoiningTrackingModal({
  isOpen,
  onClose,
  candidate,
  job,
  applicationId,
  initialExpectedDate = '',
  initialNotes = '',
}: StartJoiningTrackingModalProps) {
  const { startJoiningTracking } = useApp();
  const [expectedJoiningDate, setExpectedJoiningDate] = useState(
    initialExpectedDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState(initialNotes);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expectedJoiningDate) {
      setError('Expected joining date is required.');
      return;
    }

    const res = startJoiningTracking(applicationId, expectedJoiningDate, notes.trim() || undefined);
    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'Failed to start joining tracking.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Start Joining Tracking</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Client Hire • {candidate.fullName || (candidate as any).name} ({job.title})
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

          <div className="p-3.5 bg-purple-50/60 border border-purple-200 rounded-xl text-xs text-purple-900 leading-relaxed">
            <span className="font-semibold text-purple-950">Client Hire Workflow:</span>{' '}
            Candidate is hired directly onto Client payroll. This records expected joining and places the candidate in{' '}
            <strong className="text-purple-950">Joining Pending</strong> under Selected until confirmed.
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              Expected Joining Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={expectedJoiningDate}
              onChange={(e) => setExpectedJoiningDate(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-slate-400" />
              Tracking Notes (Optional)
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Client confirmed offer letter sent directly; notice period buyout in progress..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
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
              className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              Save Joining Tracking
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
