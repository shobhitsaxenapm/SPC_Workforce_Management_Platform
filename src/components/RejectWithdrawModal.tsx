import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ApplicationStage } from '../types';

interface RejectWithdrawModalProps {
  applicationId: string;
  action: 'Rejected' | 'Withdrawn';
  isOpen: boolean;
  onClose: () => void;
}

export default function RejectWithdrawModal({ applicationId, action, isOpen, onClose }: RejectWithdrawModalProps) {
  const { applications, candidates, jobs, updateApplicationStage } = useApp();
  
  const [reason, setReason] = useState('');
  
  const application = applications.find(a => a.id === applicationId);
  const candidate = candidates.find(c => c.id === application?.candidateId);
  const job = jobs.find(j => j.id === application?.jobId);

  if (!isOpen || !application || !candidate || !job) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    
    updateApplicationStage(application.id, action, undefined, reason.trim());
    onClose();
  };

  const title = action === 'Rejected' ? 'Reject Candidate' : 'Withdraw Candidate';
  const description = action === 'Rejected' 
    ? 'Are you sure you want to reject this candidate for this job? This action cannot be easily undone.'
    : 'Are you sure you want to mark this candidate as withdrawn?';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            {title}
          </h2>
          <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <p className="text-sm text-slate-600">{description}</p>
            
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
              <p className="text-sm">
                <span className="font-medium text-slate-500">Candidate: </span>
                <span className="font-semibold text-slate-900">{candidate.firstName} {candidate.lastName}</span>
              </p>
              <p className="text-sm">
                <span className="font-medium text-slate-500">Job: </span>
                <span className="font-semibold text-slate-900">{job.title}</span>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Reason for {action === 'Rejected' ? 'Rejection' : 'Withdrawal'} *
              </label>
              <textarea 
                required
                rows={3}
                className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none resize-none"
                placeholder={`Please provide a reason...`}
                value={reason}
                onChange={e => setReason(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50">
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={!reason.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              Confirm {action === 'Rejected' ? 'Rejection' : 'Withdrawal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
