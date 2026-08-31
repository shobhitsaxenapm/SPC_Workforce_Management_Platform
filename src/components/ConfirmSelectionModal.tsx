import React, { useState } from 'react';
import { X, CheckCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface ConfirmSelectionModalProps {
  applicationId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ConfirmSelectionModal({ applicationId, isOpen, onClose }: ConfirmSelectionModalProps) {
  const { applications, candidates, jobs, clients, updateApplicationStage, interviews } = useApp();
  
  const [employingEntity, setEmployingEntity] = useState<'SPC' | 'Client'>('SPC');
  
  const application = applications.find(a => a.id === applicationId);
  const candidate = candidates.find(c => c.id === application?.candidateId);
  const job = jobs.find(j => j.id === application?.jobId);
  const client = clients.find(c => c.id === job?.clientId);

  if (!isOpen || !application || !candidate || !job) return null;

  const appInterviews = interviews.filter(i => i.applicationId === applicationId);
  const missingFeedbackCount = appInterviews.filter(i => i.feedbackStatus !== 'Submitted').length;
  const isFeedbackComplete = missingFeedbackCount === 0;

  const handleConfirm = () => {
    updateApplicationStage(application.id, 'Selected');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800">Confirm Selection</h2>
          <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800">
            Confirming selection will move the candidate to the <strong>Selected</strong> stage, making them ready for an offer.
          </div>
          
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <span className="text-sm font-medium text-slate-500">Candidate:</span>
              <span className="col-span-2 text-sm font-semibold text-slate-900">{candidate.firstName} {candidate.lastName}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="text-sm font-medium text-slate-500">Job:</span>
              <span className="col-span-2 text-sm font-semibold text-slate-900">{job.title}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="text-sm font-medium text-slate-500">Client:</span>
              <span className="col-span-2 text-sm font-semibold text-slate-900">{client?.name || 'Unknown Client'}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="text-sm font-medium text-slate-500">Interviews:</span>
              <span className="col-span-2 text-sm font-medium text-slate-700">{appInterviews.length} Completed</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Employing Entity</label>
            <p className="text-xs text-slate-500 mb-2">Select who will legally employ this candidate.</p>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input 
                  type="radio" 
                  name="employingEntity" 
                  value="SPC"
                  checked={employingEntity === 'SPC'}
                  onChange={() => setEmployingEntity('SPC')}
                  className="text-blue-600 focus:ring-blue-600"
                />
                <span className="text-sm font-medium text-slate-700">SPC Workforce Solutions</span>
              </label>
              <label className="flex items-center gap-2">
                <input 
                  type="radio" 
                  name="employingEntity" 
                  value="Client"
                  checked={employingEntity === 'Client'}
                  onChange={() => setEmployingEntity('Client')}
                  className="text-blue-600 focus:ring-blue-600"
                />
                <span className="text-sm font-medium text-slate-700">{client?.name || 'Unknown Client'} (Direct)</span>
              </label>
            </div>
          </div>

          {!isFeedbackComplete && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              Cannot confirm selection. There are {missingFeedbackCount} interview(s) missing feedback. Please complete interview feedback first.
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleConfirm}
            disabled={!isFeedbackComplete}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle className="w-4 h-4" />
            Confirm Selection
          </button>
        </div>
      </div>
    </div>
  );
}
