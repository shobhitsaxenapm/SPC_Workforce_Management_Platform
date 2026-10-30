import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Job, JobMatch, Candidate } from '../types';
import { Search, UserPlus, X, Filter, ChevronDown, CheckCircle2, Eye, RotateCcw, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import CandidateMatchProfileDrawer from './CandidateMatchProfileDrawer';
import SourceBadge from './SourceBadge';

interface JobMatchesTabProps {
  job: Job;
}

export default function JobMatchesTab({ job }: JobMatchesTabProps) {
  const { matchRuns, candidates, applications, clients, addMatchToPipeline, dismissMatch, currentUser, runJobMatching } = useApp();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [scoreFilter, setScoreFilter] = useState<string>('All');
  const [locationFilter, setLocationFilter] = useState<string>('All');
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [candidateToAddToPipeline, setCandidateToAddToPipeline] = useState<Candidate | null>(null);
  const [candidateToDismiss, setCandidateToDismiss] = useState<Candidate | null>(null);
  const [isSubmittingPipeline, setIsSubmittingPipeline] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  const client = clients.find(c => c.id === job.clientId);
  const run = matchRuns.find(r => r.jobId === job.id);
  const matches = run?.matches || [];
  
  // Filter out dismissed matches
  const activeMatches = matches.filter(m => !m.dismissed);

  // Available filter options
  const availableLocations = useMemo(() => {
    const locs = new Set<string>();
    activeMatches.forEach(m => {
      const c = candidates.find(cand => cand.id === m.candidateId);
      if (c?.currentLocation) locs.add(c.currentLocation);
    });
    return Array.from(locs).sort();
  }, [activeMatches, candidates]);

  
  const filteredMatches = activeMatches.filter(m => {
    const candidate = candidates.find(c => c.id === m.candidateId);
    if (!candidate) return false;
    
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchesSearch = candidate.fullName.toLowerCase().includes(term) || 
             candidate.currentLocation.toLowerCase().includes(term) ||
             candidate.skills.some(s => s.toLowerCase().includes(term));
      if (!matchesSearch) return false;
    }


    // Score filter
    if (scoreFilter === '85+') {
      if (m.score < 85) return false;
    } else if (scoreFilter === '70+') {
      if (m.score < 70) return false;
    } else if (scoreFilter === '<70') {
      if (m.score >= 70) return false;
    }

    // Location filter
    if (locationFilter !== 'All' && candidate.currentLocation !== locationFilter) {
      return false;
    }

    
    return true;
  });

  // Pagination state (10 matches per page)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, scoreFilter, locationFilter, job.id]);

  const totalPages = Math.ceil(filteredMatches.length / itemsPerPage);
  const paginatedMatches = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredMatches.slice(start, start + itemsPerPage);
  }, [filteredMatches, currentPage]);

  const handleConfirmAddToPipeline = () => {
    if (!candidateToAddToPipeline) return;
    setIsSubmittingPipeline(true);
    const cand = candidateToAddToPipeline;
    const res = addMatchToPipeline(job.id, cand.id, 'Matched from AI Engine', 'AI Match');
    setIsSubmittingPipeline(false);
    setCandidateToAddToPipeline(null);

    if (res.success) {
      setToast({ message: `${cand.fullName} has been moved to the Pipeline (Sourced).`, type: 'success' });
      setTimeout(() => setToast(null), 3500);
    } else {
      setToast({ message: res.error || 'Failed to add to pipeline.', type: 'error' });
      setTimeout(() => setToast(null), 3500);
    }
  };

  const handleConfirmDismiss = () => {
    if (!candidateToDismiss) return;
    const cand = candidateToDismiss;
    dismissMatch(job.id, cand.id);
    setCandidateToDismiss(null);
    setToast({ message: `${cand.fullName} has been dismissed from matches.`, type: 'success' });
    setTimeout(() => setToast(null), 3000);
  };

  const canAction = currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER' || currentUser?.id === job.assignedRecruiterId;

  const handleRunMatches = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      runJobMatching(job.id);
      setIsRefreshing(false);
    }, 1000);
  };

  const hasActiveFilters = searchTerm !== '' || scoreFilter !== 'All' || locationFilter !== 'All';

  const handleResetFilters = () => {
    setSearchTerm('');
    setScoreFilter('All');
    setLocationFilter('All');
  };

  if (!run) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Matching Data</h3>
        <p className="text-gray-500 mb-4">Run the matching engine to find suitable candidates from the database.</p>
        <button 
          onClick={handleRunMatches} 
          disabled={isRefreshing}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300 inline-flex items-center justify-center gap-2"
        >
          {isRefreshing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Finding Matches...
            </>
          ) : (
            'Find AI Matches'
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters Toolbar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row justify-between gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search matches by name, location, or skills..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Score Filter */}
            <select
              value={scoreFilter}
              onChange={e => setScoreFilter(e.target.value)}
              className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none text-slate-700 hover:bg-slate-50"
            >
              <option value="All">All Match Scores</option>
              <option value="85+">High Match (85%+)</option>
              <option value="70+">Good Match (70%+)</option>
              <option value="<70">Under 70%</option>
            </select>

            {/* Location Filter */}
            <select
              value={locationFilter}
              onChange={e => setLocationFilter(e.target.value)}
              className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none text-slate-700 hover:bg-slate-50"
            >
              <option value="All">All Locations</option>
              {availableLocations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>

            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1 px-2.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                title="Reset filters"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </button>
            )}

            {canAction && (
              <button 
                onClick={handleRunMatches} 
                disabled={isRefreshing}
                className="px-3 py-2 bg-white border border-blue-200 text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-1.5 shadow-sm text-sm"
              >
                {isRefreshing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    Refreshing...
                  </>
                ) : (
                  'Refresh'
                )}
              </button>
            )}
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium flex items-center justify-between">
          <span>Showing {filteredMatches.length} of {activeMatches.length} candidate matches (All matched from AI Engine)</span>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50/50 border-b border-gray-200 text-gray-500 font-medium">
              <tr>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider">Candidate</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider">Match Score</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider">Source</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider">Experience & Location</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider">Notice Period</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedMatches.map(match => {
                const candidate = candidates.find(c => c.id === match.candidateId);
                if (!candidate) return null;
                
                return (
                  <tr key={match.candidateId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <button onClick={() => setSelectedProfileId(candidate.id)} className="font-medium text-blue-600 hover:underline text-left">{candidate.fullName}</button>
                      <div className="text-xs text-gray-500 mt-0.5 truncate max-w-[200px]">{candidate.currentRole}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "flex items-center justify-center w-9 h-9 rounded-full font-bold text-sm",
                          match.score >= 85 ? "bg-green-100 text-green-700" :
                          match.score >= 70 ? "bg-blue-100 text-blue-700" :
                          "bg-amber-100 text-amber-700"
                        )}>
                          {match.score}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-500">Skills: {match.breakdown.skills}/40</span>
                          <span className="text-xs text-gray-500">Exp: {match.breakdown.experience}/20</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <SourceBadge source="AI Match" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900">{candidate.totalExperience}</div>
                      <div className="text-xs text-gray-500">{candidate.currentLocation}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                        {candidate.noticePeriod}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      {canAction && (() => {
                        const isInPipeline = applications.some(a => a.jobId === job.id && a.candidateId === match.candidateId);
                        return (
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => setSelectedProfileId(candidate.id)}
                              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View Match Profile"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {isInPipeline ? (
                              <span 
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold"
                                title="Candidate is already active in the pipeline for this job"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                In Pipeline
                              </span>
                            ) : (
                              <button 
                                onClick={() => setCandidateToAddToPipeline(candidate)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-medium transition-colors shadow-sm"
                                title="Add to Pipeline"
                              >
                                <UserPlus className="w-3.5 h-3.5" />
                                Pipeline
                              </button>
                            )}

                            {!isInPipeline && (
                              <button 
                                onClick={() => setCandidateToDismiss(candidate)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Dismiss Match"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                  </tr>
                );
              })}
              {filteredMatches.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No active matches found. Try adjusting your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-3.5 border-t border-slate-200 bg-slate-50/70">
            <span className="text-xs sm:text-sm text-slate-500 font-medium">
              Showing <span className="font-semibold text-slate-800">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="font-semibold text-slate-800">{Math.min(currentPage * itemsPerPage, filteredMatches.length)}</span> of <span className="font-semibold text-slate-800">{filteredMatches.length}</span> matches
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-white bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
              >
                Previous
              </button>
              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      "w-8 h-8 text-xs font-semibold rounded-lg transition-colors",
                      currentPage === page
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-200/60"
                    )}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-white bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-[70] animate-slide-in-right">
          <div className={cn(
            "flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium",
            toast.type === 'success' 
              ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
              : "bg-red-50 border-red-200 text-red-800"
          )}>
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Add to Pipeline Confirmation Modal */}
      {candidateToAddToPipeline && (() => {
        const matchData = run.matches.find(m => m.candidateId === candidateToAddToPipeline.id);
        return (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
              <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Add to Pipeline</h3>
                    <p className="text-xs text-slate-500">Confirm candidate workflow entry</p>
                  </div>
                </div>
                <button 
                  onClick={() => setCandidateToAddToPipeline(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-sm text-slate-600">
                  Are you sure you want to move <strong className="text-slate-900">{candidateToAddToPipeline.fullName}</strong> into the active recruitment pipeline?
                </p>

                {/* Candidate & Job Summary Card */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-xs text-slate-500">Candidate</div>
                      <div className="text-sm font-semibold text-slate-900">{candidateToAddToPipeline.fullName}</div>
                      <div className="text-xs text-slate-600">{candidateToAddToPipeline.currentRole} • {candidateToAddToPipeline.currentLocation}</div>
                    </div>
                    {matchData && (
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-bold",
                        matchData.score >= 85 ? "bg-emerald-100 text-emerald-800" :
                        matchData.score >= 70 ? "bg-blue-100 text-blue-800" :
                        "bg-amber-100 text-amber-800"
                      )}>
                        {matchData.score}% Match
                      </span>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-200">
                    <div className="text-xs text-slate-500">Target Job</div>
                    <div className="text-sm font-medium text-slate-800">{job.title}</div>
                    <div className="text-xs text-slate-500">{client?.name || 'Client'} • {job.code}</div>
                  </div>
                </div>

                {/* Initial Workflow Parameters */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-blue-50/50 border border-blue-100 rounded-lg p-2.5">
                  <div>
                    <span className="text-slate-500 block">Initial Stage:</span>
                    <span className="font-semibold text-blue-900">Sourced</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Origin / Source:</span>
                    <span className="font-semibold text-blue-900">AI Match</span>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setCandidateToAddToPipeline(null)}
                  disabled={isSubmittingPipeline}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAddToPipeline}
                  disabled={isSubmittingPipeline}
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {isSubmittingPipeline ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Confirm & Move to Pipeline
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Dismiss Match Confirmation Modal */}
      {candidateToDismiss && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="p-6">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-3">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">Dismiss Match Recommendation</h3>
              <p className="text-sm text-slate-600">
                Are you sure you want to dismiss <strong className="text-slate-900">{candidateToDismiss.fullName}</strong> from matches for this job?
              </p>
              <p className="text-xs text-slate-500 mt-2">
                This candidate will be hidden from the active match list for {job.title}. They remain in the candidate database and will still match other jobs.
              </p>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setCandidateToDismiss(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDismiss}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-sm"
              >
                Dismiss Match
              </button>
            </div>
          </div>
        </div>
      )}
      
      <CandidateMatchProfileDrawer 
        isOpen={!!selectedProfileId}
        onClose={() => setSelectedProfileId(null)}
        candidate={candidates.find(c => c.id === selectedProfileId) || null}
        match={run.matches.find(m => m.candidateId === selectedProfileId) || null}
        isInPipeline={!!selectedProfileId && applications.some(a => a.jobId === job.id && a.candidateId === selectedProfileId)}
        onAddToPipeline={(cand) => {
          setSelectedProfileId(null);
          setCandidateToAddToPipeline(cand);
        }}
        canAction={canAction}
      />
    </div>
  );
}
