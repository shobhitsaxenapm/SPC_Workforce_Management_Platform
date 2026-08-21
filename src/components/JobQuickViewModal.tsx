import React, { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { X, ExternalLink, Calendar, MapPin, Briefcase, Users, AlertCircle, FileText, CheckCircle2, XCircle } from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { Link } from 'react-router-dom';

export default function JobQuickViewModal() {
  const { quickViewJobId, setQuickViewJobId, quickViewCandidateId, jobs, requirements, clients, matchRuns } = useApp();
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setQuickViewJobId(null);
    };
    if (quickViewJobId) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [quickViewJobId, setQuickViewJobId]);

  if (!quickViewJobId) return null;

  const job = jobs.find(j => j.id === quickViewJobId);
  
  if (!job) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 flex flex-col items-center">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-lg font-semibold text-slate-800">Job Not Found</h2>
          <p className="text-slate-500 mt-2 text-center">The requested job does not exist or has been deleted.</p>
          <button 
            onClick={() => setQuickViewJobId(null)}
            className="mt-6 px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const req = requirements.find(r => r.id === job.requirementId);
  const client = clients.find(c => c.id === req?.clientId);

  // If opened from candidate context, try to find match info
  let matchInfo = null;
  if (quickViewCandidateId) {
    const run = matchRuns.find(r => r.jobId === job.id);
    if (run) {
      matchInfo = run.matches.find(m => m.candidateId === quickViewCandidateId);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
      <div 
        ref={modalRef}
        className="bg-white rounded-xl shadow-xl w-full max-w-3xl my-auto flex flex-col max-h-[90vh] overflow-hidden outline-none"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="job-modal-title"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{job.code}</span>
              <span className={cn(
                "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border",
                job.status === 'Published' ? "bg-green-50 text-green-700 border-green-200" :
                job.status === 'Draft' ? "bg-slate-50 text-slate-700 border-slate-200" :
                "bg-red-50 text-red-700 border-red-200"
              )}>
                {job.status}
              </span>
            </div>
            <h2 id="job-modal-title" className="text-xl font-bold text-slate-900">{job.title}</h2>
            <p className="text-sm text-slate-600 mt-1">Client: <span className="font-medium text-slate-800">{client?.name || 'Unknown'}</span></p>
          </div>
          <button 
            onClick={() => setQuickViewJobId(null)}
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
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Users className="w-3.5 h-3.5"/> Openings</p>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold text-slate-800">{job.openings}</span>
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5"/> Target Date</p>
              <span className="text-slate-800 font-medium">{job.applicationDeadline ? formatDate(job.applicationDeadline) : 'Not specified'}</span>
            </div>
            <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5"/> Location</p>
              <span className="text-slate-800 font-medium">{job.location}</span>
            </div>
            <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5"/> Employment</p>
              <span className="text-slate-800 font-medium">{req?.employmentType || 'Unknown'}</span>
            </div>
          </div>

          {matchInfo && (
            <div className="mb-8 p-4 bg-blue-50 border border-blue-100 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Candidate Match Insights
              </h3>
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 rounded-full border-4 border-white shadow-sm flex items-center justify-center font-bold text-white bg-blue-500">
                  {matchInfo.score}%
                </div>
                <div>
                  <p className="font-semibold text-blue-900">Match Score</p>
                  <p className="text-xs text-blue-700">Based on required skills and experience</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-blue-800 mb-1">Matching Skills:</p>
                  <div className="flex flex-wrap gap-1">
                    {matchInfo.matchingSkills.map(s => <span key={s} className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">{s}</span>)}
                  </div>
                </div>
                {matchInfo.missingSkills.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-blue-800 mb-1">Missing Skills:</p>
                    <div className="flex flex-wrap gap-1">
                      {matchInfo.missingSkills.map(s => <span key={s} className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">{s}</span>)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2"><FileText className="w-4 h-4 text-slate-400" /> Description</h3>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm text-slate-700 whitespace-pre-wrap">
                {job.summary}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-800 mb-2">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {job.requiredSkills.map(skill => (
                  <span key={skill} className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-full border border-slate-200">{skill}</span>
                ))}
              </div>
            </div>
          </div>
          
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3 rounded-b-xl">
          <button 
            onClick={() => setQuickViewJobId(null)}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm transition-colors"
          >
            Close
          </button>
          <Link
            to={`/job-desk/${job.id}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setQuickViewJobId(null)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 shadow-sm transition-colors flex items-center gap-2"
          >
            Open Full Job Page <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
