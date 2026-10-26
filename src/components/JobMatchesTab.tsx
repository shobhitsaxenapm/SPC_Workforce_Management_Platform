import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Job, JobMatch } from '../types';
import { Search, UserPlus, X, Filter, ChevronDown, CheckCircle2, Eye, RotateCcw } from 'lucide-react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import CandidateMatchProfileDrawer from './CandidateMatchProfileDrawer';
import SourceBadge from './SourceBadge';

interface JobMatchesTabProps {
  job: Job;
}

export default function JobMatchesTab({ job }: JobMatchesTabProps) {
  const { matchRuns, candidates, addMatchToPipeline, dismissMatch, currentUser, runJobMatching } = useApp();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [scoreFilter, setScoreFilter] = useState<string>('All');
  const [locationFilter, setLocationFilter] = useState<string>('All');
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  
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

  const handleAddToPipeline = (candidateId: string) => {
    addMatchToPipeline(job.id, candidateId, 'Matched from AI Engine', 'AI Match');
  };

  const handleDismiss = (candidateId: string) => {
    dismissMatch(job.id, candidateId);
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
              {filteredMatches.map(match => {
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
                      {canAction && (
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => setSelectedProfileId(candidate.id)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleAddToPipeline(candidate.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-medium transition-colors"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            Pipeline
                          </button>
                          <button 
                            onClick={() => handleDismiss(candidate.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Dismiss Match"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
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
      </div>
      
      <CandidateMatchProfileDrawer 
        isOpen={!!selectedProfileId}
        onClose={() => setSelectedProfileId(null)}
        candidate={candidates.find(c => c.id === selectedProfileId) || null}
        match={run.matches.find(m => m.candidateId === selectedProfileId) || null}
      />
    </div>
  );
}
