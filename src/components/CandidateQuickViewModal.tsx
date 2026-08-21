import React, { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { X, ExternalLink, Calendar, MapPin, Briefcase, GraduationCap, AlertCircle, Phone, Mail, FileText } from 'lucide-react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';

export default function CandidateQuickViewModal() {
  const { quickViewCandidateId, setQuickViewCandidateId, quickViewJobId, candidates, applications } = useApp();
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setQuickViewCandidateId(null);
    };
    if (quickViewCandidateId) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [quickViewCandidateId, setQuickViewCandidateId]);

  if (!quickViewCandidateId) return null;

  const candidate = candidates.find(c => c.id === quickViewCandidateId);
  
  if (!candidate) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 flex flex-col items-center">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-lg font-semibold text-slate-800">Candidate Not Found</h2>
          <p className="text-slate-500 mt-2 text-center">The requested candidate does not exist or has been deleted.</p>
          <button 
            onClick={() => setQuickViewCandidateId(null)}
            className="mt-6 px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // If opened from a job context, show their stage
  let stageInfo = null;
  if (quickViewJobId) {
    const app = applications.find(a => a.candidateId === candidate.id && a.jobId === quickViewJobId);
    if (app) {
      stageInfo = app.currentStage;
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
        aria-labelledby="candidate-modal-title"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between bg-slate-50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-200 border-2 border-white shadow-sm overflow-hidden">
              <div className="w-full h-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg">
                {candidate.name.split(' ').map(n => n[0]).join('')}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{candidate.code}</span>
              </div>
              <h2 id="candidate-modal-title" className="text-xl font-bold text-slate-900">{candidate.name}</h2>
              <p className="text-sm text-slate-600 mt-0.5">{candidate.currentRole} • {candidate.location}</p>
            </div>
          </div>
          <button 
            onClick={() => setQuickViewCandidateId(null)}
            className="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {stageInfo && (
            <div className="mb-6 p-4 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center gap-3">
              <Briefcase className="w-5 h-5 text-indigo-600" />
              <div>
                <p className="font-semibold text-indigo-900 text-sm">Context: Active Application</p>
                <p className="text-xs text-indigo-700 mt-0.5">This candidate is currently in the <span className="font-bold">{stageInfo}</span> stage for the selected job.</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5"/> Experience</p>
              <div className="flex items-end gap-2">
                <span className="text-xl font-bold text-slate-800">{candidate.experience}</span>
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5"/> Notice Period</p>
              <span className="text-slate-800 font-medium text-sm">{candidate.noticePeriod}</span>
            </div>
            <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5"/> Location</p>
              <span className="text-slate-800 font-medium text-sm">{candidate.location}</span>
            </div>
            <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5"/> Education</p>
              <span className="text-slate-800 font-medium text-sm truncate block" title={candidate.education}>{candidate.education}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2"><Phone className="w-4 h-4 text-slate-400" /> Contact Info</h3>
                <dl className="space-y-2 text-sm">
                  <div className="grid grid-cols-3 gap-2">
                    <dt className="text-slate-500">Email:</dt>
                    <dd className="col-span-2 font-medium text-slate-800">{candidate.email}</dd>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <dt className="text-slate-500">Phone:</dt>
                    <dd className="col-span-2 font-medium text-slate-800">{candidate.phone}</dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-800 mb-2">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {candidate.skills.map(skill => (
                    <span key={skill} className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-full border border-slate-200">{skill}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3 rounded-b-xl">
          <button 
            onClick={() => setQuickViewCandidateId(null)}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm transition-colors"
          >
            Close
          </button>
          <Link
            to={`/candidates/${candidate.id}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setQuickViewCandidateId(null)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 shadow-sm transition-colors flex items-center gap-2"
          >
            Open Full Candidate Profile <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
