import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import SmartCandidateUpload from './SmartCandidateUpload';
import CandidateFormModal from './CandidateFormModal';
import { UploadCloud, Users, Search, MapPin, Check, Plus, X, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import SourceBadge from './SourceBadge';

interface AddCandidateToJobModalProps {
  jobId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
}

export default function AddCandidateToJobModal({ jobId, isOpen, onClose, onSuccess }: AddCandidateToJobModalProps) {
  const { addMatchToPipeline, jobs, candidates, applications } = useApp();
  const targetJob = jobs.find(j => j.id === jobId);

  const [activeMode, setActiveMode] = useState<'upload' | 'pool'>('upload');
  const [searchTerm, setSearchTerm] = useState('');
  const [showUpload, setShowUpload] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [addingCandidateId, setAddingCandidateId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter existing candidates for Talent Pool selection
  const jobApps = applications.filter(a => a.jobId === jobId);
  const filteredCandidates = candidates.filter(cand => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    const matchName = (cand.fullName || '').toLowerCase().includes(q);
    const matchRole = (cand.currentRole || '').toLowerCase().includes(q);
    const matchEmail = (cand.email || '').toLowerCase().includes(q);
    const matchSkills = (cand.skills || []).some(s => s.toLowerCase().includes(q));
    const matchLocation = (cand.currentLocation || '').toLowerCase().includes(q);
    return matchName || matchRole || matchEmail || matchSkills || matchLocation;
  });

  const handleSelectPoolCandidate = (candidateId: string) => {
    setAddingCandidateId(candidateId);
    const cand = candidates.find(c => c.id === candidateId);
    const result = addMatchToPipeline(jobId, candidateId, 'Added by Recruiter from Talent Pool', 'Recruiter Added');
    setAddingCandidateId(null);
    if (result.success) {
      onSuccess?.(`${cand?.fullName || 'Candidate'} successfully added to the Sourced stage for this Job.`);
      onClose();
    }
  };

  return (
    <>
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-4xl max-h-[95vh] flex flex-col bg-slate-50 rounded-2xl shadow-xl overflow-hidden border border-slate-200">
            
            {/* Header with Mode Switcher */}
            <div className="px-6 py-4 bg-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>Add Candidate to Pipeline</span>
                  {targetJob && (
                    <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                      {targetJob.title} ({targetJob.code})
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Candidates will enter the <strong className="text-blue-600 font-semibold">Sourced</strong> stage of this job opening.
                </p>
              </div>

              {/* Mode Switcher */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setActiveMode('upload')}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                    activeMode === 'upload'
                      ? "bg-white text-blue-700 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload &amp; Parse Resume</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMode('pool')}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                    activeMode === 'pool'
                      ? "bg-white text-blue-700 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Select from Candidate Pool</span>
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeMode === 'upload' ? (
                <div className="flex items-center justify-center">
                  <SmartCandidateUpload
                    onExtractionSuccess={(data, meta) => {
                      setExtractedData({
                        ...data,
                        resumeUrl: meta.originalFilename,
                        resumeFileUrl: meta.fileUrl,
                        rawResumeText: meta.rawResumeText,
                        sourceMetadata: meta,
                      });
                      setShowUpload(false);
                      setShowReviewForm(true);
                    }}
                    onCancel={onClose}
                  />
                </div>
              ) : (
                <div className="max-w-3xl mx-auto space-y-4">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search candidates by name, current role, skills, or location..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-xs"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Candidate List */}
                  <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 shadow-xs max-h-[500px] overflow-y-auto">
                    {filteredCandidates.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 text-xs">
                        No candidates found matching "{searchTerm}".
                      </div>
                    ) : (
                      filteredCandidates.map(cand => {
                        const existingJobApp = jobApps.find(a => a.candidateId === cand.id);
                        const isInPipeline = existingJobApp && !['New', 'Under Review', 'Application Rejected'].includes(existingJobApp.currentStage);

                        return (
                          <div 
                            key={cand.id}
                            className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-900 text-sm">{cand.fullName}</span>
                                <span className="text-[11px] text-slate-400 font-mono">{cand.code}</span>
                                {cand.source && <SourceBadge source={cand.source} compact />}
                              </div>
                              <p className="text-xs text-slate-600 mt-0.5 truncate">
                                {cand.currentRole || 'Candidate'} {cand.totalExperience ? `• ${cand.totalExperience}` : ''} {cand.currentCompany ? `at ${cand.currentCompany}` : ''}
                              </p>
                              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                {cand.currentLocation && (
                                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                                    <MapPin className="w-3 h-3 text-slate-400" />
                                    {cand.currentLocation}
                                  </span>
                                )}
                                {(cand.skills || []).slice(0, 4).map(skill => (
                                  <span 
                                    key={skill}
                                    className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-medium"
                                  >
                                    {skill}
                                  </span>
                                ))}
                                {(cand.skills || []).length > 4 && (
                                  <span className="text-[10px] text-slate-400 font-medium">
                                    +{cand.skills.length - 4} more
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
                              {isInPipeline ? (
                                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold">
                                  <Check className="w-3.5 h-3.5" />
                                  <span>In {existingJobApp?.currentStage}</span>
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  disabled={addingCandidateId === cand.id}
                                  onClick={() => handleSelectPoolCandidate(cand.id)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Add to Sourced</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {showReviewForm && extractedData && (
        <CandidateFormModal
          isOpen={showReviewForm}
          onClose={onClose}
          initialData={extractedData}
          isEditMode={false}
          targetJobTitle={targetJob?.title}
          isJobMatched={true}
          uploadedFileUrl={extractedData.resumeFileUrl}
          rawResumeText={extractedData.rawResumeText}
          sourceMetadata={extractedData.sourceMetadata}
          onSaveSuccess={(candidateId) => {
            const result = addMatchToPipeline(jobId, candidateId, 'Candidate uploaded directly against Job', 'Manual Upload');
            if (result.success) {
              onSuccess?.('Candidate successfully uploaded and added to the Sourced stage for this Job.');
            }
            onClose();
          }}
        />
      )}
    </>
  );
}
