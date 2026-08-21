import React, { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { X, ExternalLink, Calendar, MapPin, Briefcase, Users, AlertCircle, FileText } from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { Link } from 'react-router-dom';

export default function RequirementQuickViewModal() {
  const { quickViewRequirementId, setQuickViewRequirementId, requirements, clients, jobs, applications, mockUsers } = useApp();
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setQuickViewRequirementId(null);
    };
    if (quickViewRequirementId) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [quickViewRequirementId, setQuickViewRequirementId]);

  if (!quickViewRequirementId) return null;

  const req = requirements.find(r => r.id === quickViewRequirementId);
  
  if (!req) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 flex flex-col items-center">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-lg font-semibold text-slate-800">Requirement Not Found</h2>
          <p className="text-slate-500 mt-2 text-center">The requested requirement does not exist or has been deleted.</p>
          <button 
            onClick={() => setQuickViewRequirementId(null)}
            className="mt-6 px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const client = clients.find(c => c.id === req.clientId);
  const recruiter = mockUsers?.find(u => u.id === req.assignedRecruiterId);
  const reqJobs = jobs.filter(j => j.requirementId === req.id);
  const reqApps = applications.filter(a => a.requirementId === req.id);
  
  const filledCount = reqApps.filter(a => a.currentStage === 'Joined').length;
  const progress = (filledCount / req.positionsRequired) * 100;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
      <div 
        ref={modalRef}
        className="bg-white rounded-xl shadow-xl w-full max-w-3xl my-auto flex flex-col max-h-[90vh] overflow-hidden outline-none"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{req.code}</span>
              <span className={cn(
                "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border",
                req.lifecycleStatus === 'Open' ? "bg-blue-50 text-blue-700 border-blue-200" :
                req.lifecycleStatus === 'On Hold' ? "bg-amber-50 text-amber-700 border-amber-200" :
                req.lifecycleStatus === 'Draft' ? "bg-slate-50 text-slate-700 border-slate-200" :
                req.lifecycleStatus === 'Closed' ? "bg-green-50 text-green-700 border-green-200" :
                "bg-red-50 text-red-700 border-red-200"
              )}>
                {req.lifecycleStatus}
              </span>
            </div>
            <h2 id="modal-title" className="text-xl font-bold text-slate-900">{req.title}</h2>
            <p className="text-sm text-slate-600 mt-1">Client: <span className="font-medium text-slate-800">{client?.name || 'Unknown'}</span></p>
          </div>
          <button 
            onClick={() => setQuickViewRequirementId(null)}
            className="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {/* Metrics & Meta */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Users className="w-3.5 h-3.5"/> Headcount</p>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold text-slate-800">{filledCount}</span>
                <span className="text-sm font-medium text-slate-500 mb-0.5">/ {req.positionsRequired}</span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-blue-600 h-full" style={{ width: `${Math.min(progress, 100)}%` }} />
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5"/> Target Date</p>
              <span className="text-slate-800 font-medium">{req.targetJoiningDate ? formatDate(req.targetJoiningDate) : 'Not specified'}</span>
            </div>
            <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5"/> Priority</p>
              <span className={cn("font-medium", req.priority === 'Critical' ? "text-red-600" : req.priority === 'High' ? "text-amber-600" : "text-blue-600")}>{req.priority}</span>
            </div>
            <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5"/> Recruiter</p>
              <span className="text-slate-800 font-medium">{recruiter?.name || 'Unassigned'}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2"><MapPin className="w-4 h-4 text-slate-400" /> Locations</h3>
                <div className="flex flex-wrap gap-2">
                  {req.locations && req.locations.length > 0 ? req.locations.map(loc => (
                    <span key={loc} className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-full border border-slate-200">{loc}</span>
                  )) : <span className="text-sm text-slate-500 italic">Not provided</span>}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2"><FileText className="w-4 h-4 text-slate-400" /> Details</h3>
                <dl className="space-y-2 text-sm">
                  <div className="grid grid-cols-3 gap-2">
                    <dt className="text-slate-500">Role Title:</dt>
                    <dd className="col-span-2 font-medium text-slate-800">{req.roleTitle}</dd>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <dt className="text-slate-500">Project:</dt>
                    <dd className="col-span-2 font-medium text-slate-800">{req.projectName}</dd>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <dt className="text-slate-500">Employment:</dt>
                    <dd className="col-span-2 font-medium text-slate-800">{req.employmentType}</dd>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <dt className="text-slate-500">Duration:</dt>
                    <dd className="col-span-2 font-medium text-slate-800">{req.contractDuration || 'N/A'}</dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center justify-between">
                  <span>Linked Jobs</span>
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-full">{reqJobs.length}</span>
                </h3>
                {reqJobs.length > 0 ? (
                  <div className="space-y-2">
                    {reqJobs.map(job => (
                      <div key={job.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{job.title}</p>
                          <p className="text-xs text-slate-500">{job.code} • {job.location}</p>
                        </div>
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border",
                          job.status === 'Published' ? "bg-green-50 text-green-700 border-green-200" : "bg-slate-100 text-slate-600 border-slate-200"
                        )}>
                          {job.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center">
                    <p className="text-sm text-slate-500">No jobs linked to this requirement yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {req.notes && (
            <div className="mt-8 pt-6 border-t border-slate-100">
              <h3 className="text-sm font-semibold text-slate-800 mb-2">Notes & Requirements</h3>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm text-slate-700 whitespace-pre-wrap">
                {req.notes}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3 rounded-b-xl">
          <button 
            onClick={() => setQuickViewRequirementId(null)}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm transition-colors"
          >
            Close
          </button>
          <Link
            to={`/requirements/${req.id}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setQuickViewRequirementId(null)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 shadow-sm transition-colors flex items-center gap-2"
          >
            Open Full Requirement <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
