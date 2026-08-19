import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Job, JobMatch } from '../types';
import { Search, UserPlus, X, Filter, ChevronDown, CheckCircle2, Eye } from 'lucide-react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import CandidateMatchProfileDrawer from './CandidateMatchProfileDrawer';

interface JobMatchesTabProps {
  job: Job;
}

export default function JobMatchesTab({ job }: JobMatchesTabProps) {
  const { matchRuns, candidates, addMatchToPipeline, dismissMatch, currentUser } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [minScore, setMinScore] = useState(70);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  
  const run = matchRuns.find(r => r.jobId === job.id);
  const matches = run?.matches || [];
  
  // Filter out dismissed matches
  const activeMatches = matches.filter(m => !m.dismissed);
  
  const filteredMatches = activeMatches.filter(m => {
    const candidate = candidates.find(c => c.id === m.candidateId);
    if (!candidate) return false;
    
    if (m.score < minScore) return false;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return candidate.fullName.toLowerCase().includes(term) || 
             candidate.currentLocation.toLowerCase().includes(term) ||
             candidate.skills.some(s => s.toLowerCase().includes(term));
    }
    
    return true;
  });

  const handleAddToPipeline = (candidateId: string) => {
    addMatchToPipeline(job.id, candidateId);
  };

  const handleDismiss = (candidateId: string) => {
    dismissMatch(job.id, candidateId);
  };

  const canAction = currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER' || currentUser?.id === job.assignedRecruiterId;

  if (!run) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Matching Data</h3>
        <p className="text-gray-500 mb-4">Run the matching engine to find suitable candidates from the database.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search matches by name, location, or skills..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
          />
        </div>
        
        <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-1">
          <span className="text-sm text-gray-600">Min Score:</span>
          <input 
            type="number" 
            min="0" max="100" step="5"
            value={minScore}
            onChange={e => setMinScore(parseInt(e.target.value) || 0)}
            className="w-16 p-1 text-sm outline-none font-medium"
          />
          <span className="text-gray-500">%</span>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50/50 border-b border-gray-200 text-gray-500 font-medium">
              <tr>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider">Candidate</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider">Match Score</th>
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
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
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
