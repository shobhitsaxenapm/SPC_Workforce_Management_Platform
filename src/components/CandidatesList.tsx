import { mockCandidates, mockApplications, mockJobs, mockUsers } from '../data/mockData';
import { Search, Filter, AlertTriangle, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';

export default function CandidatesList() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-slate-600">View candidate profiles and their applications across client jobs.</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search by name, skills, location..." 
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
          />
        </div>
        <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">
          <Filter className="w-4 h-4" />
          Filters
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
              <tr>
                <th className="px-6 py-4">Candidate</th>
                <th className="px-6 py-4">Role & Experience</th>
                <th className="px-6 py-4">Top Skills</th>
                <th className="px-6 py-4">Current Application</th>
                <th className="px-6 py-4">Stage</th>
                <th className="px-6 py-4">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mockCandidates.map(candidate => {
                const activeApp = mockApplications.find(a => a.candidateId === candidate.id);
                const activeJob = activeApp ? mockJobs.find(j => j.id === activeApp.jobId) : null;
                
                return (
                  <tr key={candidate.id} className="hover:bg-slate-50 transition-colors group cursor-pointer">
                    <td className="px-6 py-4">
                      <Link to={`/candidates/${candidate.id}`} className="block">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-slate-800 group-hover:text-blue-600 transition-colors">{candidate.fullName}</p>
                          {candidate.duplicateStatus !== 'None' && (
                            <AlertTriangle className="w-4 h-4 text-amber-500" title={candidate.duplicateStatus} />
                          )}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">{candidate.currentLocation}</div>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-slate-800">{candidate.currentRole || 'N/A'}</p>
                      <p className="text-xs text-slate-500 mt-1">{candidate.totalExperience} • {candidate.currentCompany || 'No Company'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {candidate.skills.slice(0, 2).map(skill => (
                          <span key={skill} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[11px] rounded border border-slate-200">
                            {skill}
                          </span>
                        ))}
                        {candidate.skills.length > 2 && (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[11px] rounded border border-slate-200">
                            +{candidate.skills.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {activeJob ? (
                        <div>
                          <p className="font-medium text-slate-700">{activeJob.title}</p>
                          <p className="text-xs text-slate-500 mt-1">{activeJob.code}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400">No active application</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {activeApp ? (
                        <span className="px-2.5 py-1 rounded-md text-xs font-medium border bg-blue-50 text-blue-700 border-blue-200">
                          {activeApp.currentStage}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-600 text-xs">{candidate.source}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
