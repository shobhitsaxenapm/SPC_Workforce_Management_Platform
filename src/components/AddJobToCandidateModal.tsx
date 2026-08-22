import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Search, Briefcase, MapPin, AlertCircle, Building2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { Job } from '../types';

interface AddJobToCandidateModalProps {
  candidateId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function AddJobToCandidateModal({ candidateId, isOpen, onClose }: AddJobToCandidateModalProps) {
  const { candidates, jobs, clients, requirements, applications, addMatchToPipeline, matchRuns } = useApp();
  const candidate = candidates.find(c => c.id === candidateId);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  if (!isOpen || !candidate) return null;

  const filteredJobs = jobs.filter(j => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const client = clients.find(c => c.id === j.clientId);
    const req = requirements.find(r => r.id === j.requirementId);
    
    return (
      j.title.toLowerCase().includes(term) ||
      j.code.toLowerCase().includes(term) ||
      j.location.toLowerCase().includes(term) ||
      client?.name.toLowerCase().includes(term) ||
      req?.code.toLowerCase().includes(term) ||
      req?.title.toLowerCase().includes(term) ||
      j.requiredSkills?.some(s => s.toLowerCase().includes(term))
    );
  });

  const handleAdd = async () => {
    if (!selectedJobId) return;
    setIsProcessing(true);
    
    await new Promise(resolve => setTimeout(resolve, 800));

    const result = addMatchToPipeline(selectedJobId, candidateId, 'Recruiter Added from Candidate Profile');
    if (!result.success) {
      setToast({ message: result.error || 'Failed to add to pipeline.', type: 'error' });
      setIsProcessing(false);
      return;
    }

    setToast({ message: 'Candidate added to the Sourced stage for this Job.', type: 'success' });
    setIsProcessing(false);
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  const getDisabledReason = (job: Job) => {
    if (job.status === 'Paused') return 'Cannot add candidates to a paused job.';
    if (job.status === 'Filled') return 'Cannot add candidates to a filled job.';
    if (job.status === 'Closed') return 'Cannot add candidates to a closed job.';
    return null;
  };

  const selectedJob = jobs.find(j => j.id === selectedJobId);
  const alreadyInPipeline = selectedJobId ? applications.find(a => a.jobId === selectedJobId && a.candidateId === candidateId) : null;
  const isSelectedDisabled = selectedJob ? getDisabledReason(selectedJob) : null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header with Candidate Context */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 sticky top-0 z-10 flex justify-between items-start">
          <div className="flex gap-4 items-center">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-lg font-bold shrink-0">
              {candidate.fullName.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                Add to Job Pipeline
              </h2>
              <div className="text-sm text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                <span className="font-medium text-slate-700">{candidate.fullName}</span>
                <span>•</span>
                <span>{candidate.code}</span>
                <span>•</span>
                <span>{candidate.currentRole}</span>
                <span>•</span>
                <span>{candidate.currentLocation}</span>
                <span>•</span>
                <span>{candidate.totalExperience}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-6 flex flex-col lg:flex-row gap-6">
          <div className="flex-1 space-y-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
              <Search className="w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search jobs by title, client, location, or skills..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="flex-1 outline-none text-sm"
              />
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col max-h-[500px]">
              <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 font-semibold text-sm text-slate-700 flex justify-between">
                <span>Eligible Jobs</span>
                <span>{filteredJobs.length} results</span>
              </div>
              <div className="overflow-y-auto p-2 space-y-2">
                {filteredJobs.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-sm">No jobs found</div>
                ) : (
                  filteredJobs.map(job => {
                    const client = clients.find(c => c.id === job.clientId);
                    const disabledReason = getDisabledReason(job);
                    const inPipeline = applications.find(a => a.jobId === job.id && a.candidateId === candidateId);
                    const run = matchRuns.find(r => r.jobId === job.id);
                    const match = run?.matches.find(m => m.candidateId === candidateId);
                    
                    return (
                      <div 
                        key={job.id} 
                        onClick={() => setSelectedJobId(job.id)}
                        className={cn(
                          "p-4 border rounded-lg cursor-pointer transition-colors relative",
                          selectedJobId === job.id ? "bg-blue-50 border-blue-300 ring-1 ring-blue-300" : "bg-white border-slate-200 hover:border-blue-200 hover:bg-slate-50"
                        )}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-semibold text-sm text-slate-800">{job.title}</h4>
                          <div className="flex gap-2 items-center">
                            {match && (
                              <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded shadow-sm">{match.score}% Match</span>
                            )}
                            {inPipeline ? (
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">In Pipeline</span>
                            ) : disabledReason ? (
                              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{job.status}</span>
                            ) : (
                              <span className="text-xs text-slate-500">{job.code}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-slate-600 mb-2 truncate flex items-center gap-1.5">
                           <Building2 className="w-3 h-3 text-slate-400" />
                           {client?.name} • <MapPin className="w-3 h-3 text-slate-400 inline" /> {job.location}
                        </div>
                        <div className="text-xs text-slate-500 flex gap-4">
                          <span>{job.employmentType}</span>
                          <span>{job.openings - job.filled} Openings</span>
                          {job.assignedRecruiterId && <span>Assigned to Recruiter</span>}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right sidebar action area */}
          <div className="w-full lg:w-80 flex flex-col gap-4 shrink-0">
            {toast && (
              <div className={cn("p-4 rounded-xl border text-sm font-medium", toast.type === 'error' ? "bg-red-50 text-red-700 border-red-200" : "bg-green-50 text-green-700 border-green-200")}>
                {toast.message}
              </div>
            )}
            
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm sticky top-6">
              <h3 className="font-bold text-slate-800 mb-4">Action Summary</h3>
              {selectedJobId && selectedJob ? (
                <div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4">
                    <p className="font-semibold text-slate-800 text-sm mb-1">{selectedJob.title}</p>
                    <p className="text-xs text-slate-500">{clients.find(c => c.id === selectedJob.clientId)?.name} • {selectedJob.location}</p>
                  </div>
                  
                  {alreadyInPipeline ? (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-2 text-amber-800 text-xs">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <div>This candidate is already associated with this job and is currently in the <strong>{alreadyInPipeline.currentStage}</strong> stage.</div>
                    </div>
                  ) : isSelectedDisabled ? (
                    <div className="p-3 bg-slate-100 border border-slate-200 rounded-lg flex gap-2 text-slate-700 text-xs">
                       <AlertCircle className="w-4 h-4 shrink-0" />
                       <div>{isSelectedDisabled}</div>
                    </div>
                  ) : (
                    <button
                      onClick={handleAdd}
                      disabled={isProcessing}
                      className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                    >
                      {isProcessing ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Adding to pipeline...</> : 'Add to Pipeline'}
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center p-6 text-slate-400 text-sm">
                  <Briefcase className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                  Select a job from the list to add the candidate to its pipeline.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
