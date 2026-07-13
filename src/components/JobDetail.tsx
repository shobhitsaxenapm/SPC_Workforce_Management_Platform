import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { mockUsers } from '../data/mockData';
import { Briefcase, Building2, MapPin, Calendar, CheckCircle2, ChevronRight, Share, Eye, LayoutGrid, List } from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { ApplicationStage } from '../types';
import AIInsightCard from './AIInsightCard';
import { useApp } from '../context/AppContext';

export default function JobDetail() {
  const { id } = useParams();
  const { jobs, requirements, clients, applications, candidates, updateApplicationStage } = useApp();
  const job = jobs.find(j => j.id === id);
  const [activeTab, setActiveTab] = useState<'Overview' | 'Pipeline'>('Overview');
  
  if (!job) return <div>Job not found</div>;

  const req = requirements.find(r => r.id === job.requirementId);
  const client = clients.find(c => c.id === job.clientId);
  const recruiter = mockUsers.find(u => u.id === job.assignedRecruiterId);
  const jobApplications = applications.filter(a => a.jobId === job.id);
  
  const progress = (job.filled / job.openings) * 100;

  const pipelineStages: ApplicationStage[] = [
    'Sourced', 'Applied', 'Screening', 'Interview Round 1', 'Interview Round 2', 
    'Offer Extended', 'Offer Accepted', 'Rejected', 'Withdrawn'
  ];

  const updateStage = (appId: string, newStage: ApplicationStage) => {
    updateApplicationStage(appId, newStage);
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 text-sm">
          <Link to="/requirements" className="text-slate-500 hover:text-slate-800">Reqs</Link>
          <ChevronRight className="w-4 h-4 text-slate-400" />
          <Link to={`/requirements/${req?.id}`} className="text-slate-500 hover:text-slate-800">{req?.code}</Link>
          <ChevronRight className="w-4 h-4 text-slate-400" />
          <span className="font-medium text-slate-800 font-mono">{job.code}</span>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
            Edit Job
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
            <Eye className="w-4 h-4" />
            Preview
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
            Unpublish
          </button>
        </div>
      </div>

      <AIInsightCard 
        title="Talent Pool Resurfacing Suggestion"
        severity="info"
        explanation="There are 5 candidates in your talent pool who were previous runners-up for similar roles and have an 85%+ match for this job."
        actionLabel="View Matched Candidates"
        onAction={() => {}}
      />

      <div className="flex border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('Overview')} 
          className={cn("px-6 py-3 font-medium text-sm border-b-2 transition-colors", activeTab === 'Overview' ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700")}
        >
          Job Overview
        </button>
        <button 
          onClick={() => setActiveTab('Pipeline')} 
          className={cn("px-6 py-3 font-medium text-sm border-b-2 transition-colors", activeTab === 'Pipeline' ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700")}
        >
          Candidate Pipeline ({applications.length})
        </button>
      </div>

      {activeTab === 'Overview' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-slate-800">{job.title}</h1>
                  <div className="flex items-center gap-3 mt-2 text-slate-500">
                    <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {job.location}</span>
                    <span>•</span>
                    <span>{job.employmentType}</span>
                    <span>•</span>
                    <span>{job.experienceRange}</span>
                  </div>
                </div>
                <span className={cn(
                  "px-3 py-1 rounded-full text-sm font-medium border",
                  job.status === 'Published' ? "bg-green-50 text-green-700 border-green-200" :
                  "bg-slate-50 text-slate-700 border-slate-200"
                )}>
                  {job.status}
                </span>
              </div>

              <div className="prose prose-slate prose-sm max-w-none">
                <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-2">Summary</h3>
                <p>{job.summary}</p>
                
                <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mt-6 mb-2">Responsibilities</h3>
                <ul>
                  {job.responsibilities.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
                
                <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mt-6 mb-2">Qualifications & Skills</h3>
                <div className="mb-3">
                  {job.qualifications.map((q, i) => <span key={i} className="block">• {q}</span>)}
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {job.requiredSkills.map(s => (
                    <span key={s} className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded border border-slate-200">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-semibold text-slate-800 mb-4">Job Progress</h3>
              <div className="flex justify-between items-end mb-2">
                <div className="text-3xl font-bold text-slate-800">{job.filled}</div>
                <div className="text-sm font-medium text-slate-500 mb-1">of {job.openings} openings</div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 mb-3 overflow-hidden">
                <div 
                  className={cn(
                    "h-2.5 rounded-full transition-all duration-500",
                    progress === 100 ? "bg-green-500" : progress > 50 ? "bg-blue-500" : "bg-amber-500"
                  )}
                  style={{ width: `${Math.max(progress, 2)}%` }}
                ></div>
              </div>
              
              <div className="mt-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Applicants</span>
                  <span className="font-medium text-slate-800">{applications.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">In Pipeline</span>
                  <span className="font-medium text-slate-800">
                    {applications.filter(a => a.currentStage !== 'Rejected' && a.currentStage !== 'Withdrawn' && a.currentStage !== 'Offer Declined').length}
                  </span>
                </div>
                <button onClick={() => setActiveTab('Pipeline')} className="w-full mt-2 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">
                  View Applicants
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-semibold text-slate-800 mb-4">Details</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Target Joining Date</p>
                  <p className="text-sm font-medium text-slate-800">{formatDate(job.targetJoiningDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Application Deadline</p>
                  <p className="text-sm font-medium text-slate-800">{formatDate(job.applicationDeadline)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Visibility</p>
                  <p className="text-sm font-medium text-slate-800">{job.visibility}</p>
                </div>
                
                <hr className="border-slate-100" />
                
                <div>
                  <p className="text-xs text-slate-500 mb-1">Linked Requirement</p>
                  <Link to={`/requirements/${req?.id}`} className="text-sm font-medium text-blue-600 hover:underline">{req?.title}</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 overflow-x-auto shadow-inner flex gap-4 min-h-[500px]">
          {pipelineStages.filter(stage => ['Sourced', 'Applied', 'Screening', 'Interview Round 1', 'Offer Extended'].includes(stage)).map(stage => {
            const appsInStage = jobApplications.filter(a => a.currentStage === stage);
            return (
              <div key={stage} className="w-80 flex-shrink-0 flex flex-col">
                <div className="flex items-center justify-between mb-3 px-1">
                  <h4 className="font-semibold text-slate-700 text-sm">{stage}</h4>
                  <span className="bg-slate-200 text-slate-600 text-xs font-medium px-2 py-0.5 rounded-full">{appsInStage.length}</span>
                </div>
                
                <div className="flex-1 space-y-3">
                  {appsInStage.map(app => {
                    const candidate = candidates.find(c => c.id === app.candidateId);
                    if (!candidate) return null;
                    return (
                      <div key={app.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <Link to={`/candidates/${candidate.id}`} className="font-medium text-slate-800 hover:text-blue-600 block mb-1">
                          {candidate.fullName}
                        </Link>
                        <p className="text-xs text-slate-500 mb-3">{candidate.currentRole} • {candidate.totalExperience}</p>
                        
                        <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
                          <span className="text-xs text-slate-400">Score: {app.matchScore}%</span>
                          <select 
                            className="text-xs border-slate-200 rounded text-slate-600 outline-none p-1"
                            value={app.currentStage}
                            onChange={(e) => updateStage(app.id, e.target.value as ApplicationStage)}
                          >
                            {pipelineStages.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                  
                  {appsInStage.length === 0 && (
                    <div className="h-24 rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center text-sm text-slate-400">
                      Empty
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
