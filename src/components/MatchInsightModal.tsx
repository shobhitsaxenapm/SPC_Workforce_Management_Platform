import React from 'react';
import { X, Activity, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Job, Client, Candidate } from '../types';
import { CandidateJobMatchInsight } from '../data/mockCandidateJobInsights';

interface MatchInsightModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job;
  client?: Client;
  candidate: Candidate;
  insight: CandidateJobMatchInsight;
}

export default function MatchInsightModal({ isOpen, onClose, job, client, candidate, insight }: MatchInsightModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-800">Match Insights · Advisory Only</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
            <div className="flex justify-between items-start gap-4">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">{job.title}</h3>
                <p className="text-sm text-slate-600 mb-2">{client?.name} • {job.location}</p>
                <p className="text-sm text-slate-700">{job.summary}</p>
              </div>
              <div className="flex flex-col items-center justify-center w-20 h-20 rounded-full bg-indigo-100 border-4 border-indigo-200 shrink-0 shadow-sm">
                <span className="font-bold text-2xl text-indigo-700">{insight.matchScore}%</span>
                <span className="text-[10px] font-medium text-indigo-600 uppercase tracking-wider">Score</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Strengths
              </h4>
              <ul className="space-y-2">
                {insight.strengths.length > 0 ? insight.strengths.map((s, i) => (
                  <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                    <span className="text-green-500 mt-0.5 font-bold">•</span>
                    {s}
                  </li>
                )) : (
                  <li className="text-sm text-slate-400 italic">No specific strengths identified.</li>
                )}
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Missing / Unverified
              </h4>
              <ul className="space-y-2">
                {insight.missingCriteria.length > 0 ? insight.missingCriteria.map((g, i) => (
                  <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5 font-bold">•</span>
                    {g}
                  </li>
                )) : (
                  <li className="text-sm text-slate-400 italic">No significant missing criteria.</li>
                )}
              </ul>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
               <h4 className="font-semibold text-slate-800 text-sm">Detailed Alignment</h4>
            </div>
            <div className="divide-y divide-slate-100">
               <div className="p-4 grid grid-cols-3 gap-4">
                 <div className="text-sm font-medium text-slate-500">Skills</div>
                 <div className="col-span-2 text-sm text-slate-700">
                   {candidate.skills.some(s => job.requiredSkills.includes(s)) 
                     ? 'Candidate possesses some required skills.' 
                     : 'Requires confirmation on specific skills.'}
                 </div>
               </div>
               <div className="p-4 grid grid-cols-3 gap-4">
                 <div className="text-sm font-medium text-slate-500">Experience</div>
                 <div className="col-span-2 text-sm text-slate-700">{candidate.totalExperience} total experience. Requires mapping to specific role.</div>
               </div>
               <div className="p-4 grid grid-cols-3 gap-4">
                 <div className="text-sm font-medium text-slate-500">Location</div>
                 <div className="col-span-2 text-sm text-slate-700">{candidate.currentLocation === job.location ? 'Exact match' : `${candidate.currentLocation} (Job is in ${job.location})`}</div>
               </div>
               <div className="p-4 grid grid-cols-3 gap-4">
                 <div className="text-sm font-medium text-slate-500">Qualification</div>
                 <div className="col-span-2 text-sm text-slate-700">{candidate.education}</div>
               </div>
               <div className="p-4 grid grid-cols-3 gap-4">
                 <div className="text-sm font-medium text-slate-500">Availability</div>
                 <div className="col-span-2 text-sm text-slate-700">{candidate.noticePeriod} notice period</div>
               </div>
            </div>
          </div>

          <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
             <h4 className="font-semibold text-indigo-900 mb-2 text-sm">Explanation</h4>
             <p className="text-sm text-indigo-800 leading-relaxed">{insight.explanation}</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
               <p className="text-xs text-slate-500 font-medium mb-1 uppercase tracking-wider">Candidate Source</p>
               <p className="font-semibold text-slate-800">{candidate.source}</p>
             </div>
             <div>
               <p className="text-xs text-slate-500 font-medium mb-1 uppercase tracking-wider">Recommended Action</p>
               <p className="font-semibold text-slate-800">
                 {insight.matchScore >= 80 ? 'Add to Pipeline (Strong Fit)' : 
                  insight.matchScore >= 70 ? 'Review carefully before adding' : 
                  'Not recommended'}
               </p>
             </div>
          </div>

        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-white flex justify-end gap-3 sticky bottom-0 z-10">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
            Close Insights
          </button>
        </div>
      </div>
    </div>
  );
}
