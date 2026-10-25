import React, { useState } from 'react';
import { Job, HiringModel } from '../types';
import { useApp } from '../context/AppContext';
import { isJobHiringModelLocked, getHiringModelBadgeConfig } from '../lib/hiringModelUtils';
import { X, Building2, Briefcase, AlertTriangle, ShieldAlert, CheckCircle2, Lock } from 'lucide-react';
import { cn } from '../lib/utils';

interface ConfigureHiringModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job;
}

export default function ConfigureHiringModelModal({
  isOpen,
  onClose,
  job
}: ConfigureHiringModelModalProps) {
  const { applications, currentUser, updateJobHiringModel } = useApp();
  const [selectedModel, setSelectedModel] = useState<HiringModel>(
    (job.hiringModel === 'Client Hire' || job.hiringModel === 'SPC Hire') ? job.hiringModel : 'Client Hire'
  );
  const [adminConfirmed, setAdminConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isLocked = isJobHiringModelLocked(job.id, applications);
  const isAdmin = currentUser?.role === 'ADMIN' || (currentUser as any)?.role === 'company_admin';

  const handleSave = () => {
    setError(null);
    if (isLocked) {
      if (!isAdmin) {
        setError('Only administrators can override the Hiring Model once candidates have entered the pipeline.');
        return;
      }
      if (!adminConfirmed) {
        setError('Please check the confirmation box to authorize this administrator override.');
        return;
      }
    }

    const res = updateJobHiringModel(job.id, selectedModel, isLocked && isAdmin);
    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'Failed to update hiring model.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Configure Hiring Model</h3>
            <p className="text-xs text-slate-500 mt-0.5">{job.title} • {job.code}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {isLocked && !isAdmin && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
              <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 space-y-1">
                <p className="font-bold">Hiring Model Locked</p>
                <p>
                  Candidates have already entered the recruitment pipeline for this Job. 
                  Recruiters and Managers cannot change the hiring model. Please contact an Administrator to request an override.
                </p>
              </div>
            </div>
          )}

          {isLocked && isAdmin && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-900 space-y-2">
                <p className="font-bold">Admin Override Warning</p>
                <p>
                  Candidates have already entered the pipeline. Changing the Hiring Model will alter downstream candidate workflows (Offer generation vs. Placement Tracking) and placement billing eligibility.
                </p>
                <label className="flex items-center gap-2 pt-1 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={adminConfirmed}
                    onChange={(e) => setAdminConfirmed(e.target.checked)}
                    className="w-4 h-4 text-rose-600 rounded border-rose-300 focus:ring-rose-500"
                  />
                  <span>I confirm this override and understand downstream implications.</span>
                </label>
              </div>
            </div>
          )}

          {/* Model Selection Options */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Select Canonical Hiring Model
            </label>

            {/* Client Hire Option */}
            <div
              onClick={() => (!isLocked || isAdmin) && setSelectedModel('Client Hire')}
              className={cn(
                "p-4 rounded-xl border-2 transition-all cursor-pointer relative",
                selectedModel === 'Client Hire' 
                  ? "border-purple-600 bg-purple-50/50 ring-2 ring-purple-600/10" 
                  : "border-slate-200 hover:border-slate-300 bg-white",
                isLocked && !isAdmin && "opacity-60 cursor-not-allowed"
              )}
            >
              <div className="flex items-start gap-3.5">
                <div className={cn(
                  "p-2.5 rounded-lg shrink-0",
                  selectedModel === 'Client Hire' ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-600"
                )}>
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-800">Client Hire</span>
                    {selectedModel === 'Client Hire' && (
                      <CheckCircle2 className="w-4 h-4 text-purple-600" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Direct hire onto Client payroll. Post-selection bypasses SPC Offer module, initiates <strong>Joining Tracking</strong>, and moves directly to <strong>Joined/Placed</strong> with per-placement billing eligibility.
                  </p>
                </div>
              </div>
            </div>

            {/* SPC Hire Option */}
            <div
              onClick={() => (!isLocked || isAdmin) && setSelectedModel('SPC Hire')}
              className={cn(
                "p-4 rounded-xl border-2 transition-all cursor-pointer relative",
                selectedModel === 'SPC Hire' 
                  ? "border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/10" 
                  : "border-slate-200 hover:border-slate-300 bg-white",
                isLocked && !isAdmin && "opacity-60 cursor-not-allowed"
              )}
            >
              <div className="flex items-start gap-3.5">
                <div className={cn(
                  "p-2.5 rounded-lg shrink-0",
                  selectedModel === 'SPC Hire' ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
                )}>
                  <Briefcase className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-800">SPC Hire</span>
                    {selectedModel === 'SPC Hire' && (
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Hired onto SPC workforce. Full handoff to SPC Offers module for offer drafting, approval, issue, candidate acceptance, and internal workforce onboarding.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLocked && (!isAdmin || !adminConfirmed)}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors shadow-sm"
          >
            {isLocked && isAdmin ? 'Confirm Override & Save' : 'Save Hiring Model'}
          </button>
        </div>
      </div>
    </div>
  );
}
