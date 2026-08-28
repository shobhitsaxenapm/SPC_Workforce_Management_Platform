import React, { useState } from 'react';
import { X, CheckCircle, Calendar } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface ConfirmOfferAcceptanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
}

export default function ConfirmOfferAcceptanceModal({ isOpen, onClose, applicationId }: ConfirmOfferAcceptanceModalProps) {
  const { applications, candidates, jobs, offers, updateOffer, updateApplicationStage } = useApp();
  
  // Use current date as default acceptance date
  const [acceptanceDate, setAcceptanceDate] = useState(() => new Date().toISOString().split('T')[0]);

  if (!isOpen) return null;

  const app = applications.find(a => a.id === applicationId);
  if (!app) return null;
  const candidate = candidates.find(c => c.id === app.candidateId);
  if (!candidate) return null;
  const job = jobs.find(j => j.id === app.jobId);
  if (!job) return null;
  const offer = offers.find(o => o.applicationId === applicationId && (o.status === 'Offer Issued' || o.status === 'Sent'));
  if (!offer) return null;

  const handleConfirm = () => {
    if (!acceptanceDate) {
      alert("Please enter the acceptance date.");
      return;
    }

    // Change offer status to Accepted and record acceptance date
    updateOffer(offer.id, { 
      status: 'Accepted', 
      acceptedAt: new Date(acceptanceDate).toISOString() 
    });

    // Change pipeline stage to Hired
    updateApplicationStage(applicationId, 'Hired', 'Offer Accepted');
    
    // Add activity history logic if necessary (handled by updateApplicationStage/updateOffer if any)
    
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">Confirm Offer Acceptance</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors rounded-lg p-1 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="flex justify-center mb-2">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
          
          <div className="text-center">
            <h3 className="text-xl font-bold text-slate-800 mb-1">Mark as Hired</h3>
            <p className="text-slate-500 text-sm">
              Confirm that {candidate.fullName} has formally accepted the offer.
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Candidate</span>
              <span className="font-medium text-slate-800">{candidate.fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Role</span>
              <span className="font-medium text-slate-800">{job.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Offer Version</span>
              <span className="font-medium text-slate-800">v{offer.version || 1}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Proposed Joining</span>
              <span className="font-medium text-slate-800">{offer.proposedJoiningDate || 'Not set'}</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Acceptance Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                required
                value={acceptanceDate}
                onChange={(e) => setAcceptanceDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex gap-3 justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
          >
            Confirm Hired
          </button>
        </div>
      </div>
    </div>
  );
}
