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

  const canonicalStages = ['Sourced', 'Applied', 'Screening', 'Interviewing', 'Selected', 'Offered', 'Joined', 'Rejected', 'Other'] as const;
  
  const normalizeStage = (stage: string) => {
    const s = stage.toLowerCase();
    if (s.includes('sourced')) return 'Sourced';
    if (s.includes('applied') || s === 'under review') return 'Applied';
    if (s.includes('screen') || s.includes('hold')) return 'Screening';
    if (s.includes('interview') || s.includes('shortlisted')) return 'Interviewing';
    if (s.includes('select')) return 'Selected';
    if (s.includes('offer') || s.includes('ready for onboarding')) return 'Offered';
    if (s.includes('join')) return 'Joined';
    if (s.includes('reject') || s.includes('decline') || s.includes('withdrawn') || s.includes('no show')) return 'Rejected';
    return 'Other';
  };

  const groupedApps: Record<string, typeof jobApplications> = {};
  canonicalStages.forEach(s => groupedApps[s] = []);
  
  let groupedCount = 0;
  jobApplications.forEach(app => {
    const canonical = normalizeStage(app.currentStage);
    if (groupedApps[canonical]) {
        groupedApps[canonical].push(app);
    } else {
        groupedApps['Other'] = groupedApps['Other'] || [];
        groupedApps['Other'].push(app);
    }
    groupedCount++;
    if (canonical === 'Other' && process.env.NODE_ENV === 'development') {
        console.log(`Unmapped stage: ${app.currentStage} for app ${app.id}`);
    }
  });

  if (process.env.NODE_ENV === 'development' && groupedCount !== jobApplications.length) {
     console.warn(`Pipeline mismatch: Job ${job.id} has ${jobApplications.length} apps, but grouped ${groupedCount}`);
  }

  const pipelineStages: ApplicationStage[] = [
    'Sourced', 'Applied', 'Under Review', 'Screening', 'Interview Round 1', 'Interview Round 2', 'Shortlisted', 'Interview Scheduled', 'Interview Completed', 'Selected', 'Offer Extended', 'Offer Sent', 'Offer Accepted', 'Ready for Onboarding', 'On Hold', 'Rejected', 'Withdrawn', 'No Show', 'Offer Declined', 'Joined'
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
          Candidate Pipeline ({jobApplications.length})
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
                  <span className="font-medium text-slate-800">{jobApplications.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">In Pipeline</span>
                  <span className="font-medium text-slate-800">
                    {jobApplications.filter(a => a.currentStage !== 'Rejected' && a.currentStage !== 'Withdrawn' && a.currentStage !== 'Offer Declined').length}
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
        <div className="bg-slate-50/50 rounded-xl border border-slate-200 p-6 overflow-x-auto shadow-inner flex gap-6 min-h-[500px]">
          {canonicalStages.map(stage => {
            const appsInStage = groupedApps[stage] || [];
            if (stage === 'Other' && appsInStage.length === 0) return null;
            return (
              <div key={stage} className="w-[320px] flex-shrink-0 flex flex-col">
                <div className="flex items-center justify-between mb-4 px-2">
                  <h4 className="font-semibold text-slate-700 text-sm">{stage}</h4>
                  <span className="bg-slate-200/70 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-full">{appsInStage.length}</span>
                </div>
                
                <div className="flex-1 space-y-3">
                  {appsInStage.map(app => {
                    const candidate = candidates.find(c => c.id === app.candidateId);
                    if (!candidate) return null;
                    return (
                      <div key={app.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start mb-2">
                            <Link to={`/candidates/${candidate.id}`} className="font-semibold text-slate-800 hover:text-blue-600 truncate mr-2">
                            {candidate.fullName}
                            </Link>
                            {app.matchScore && (
                                <span className={cn(
                                    "text-[10px] font-bold px-1.5 py-0.5 rounded",
                                    app.matchScore >= 90 ? "bg-green-100 text-green-700" :
                                    app.matchScore >= 75 ? "bg-blue-100 text-blue-700" :
                                    "bg-amber-100 text-amber-700"
                                )}>
                                    {app.matchScore}%
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-slate-500 mb-1 truncate">{candidate.currentRole} • {candidate.totalExperience}</p>
                        <p className="text-xs text-slate-400 mb-4 flex items-center gap-1 truncate"><MapPin className="w-3 h-3"/>{candidate.currentLocation} • {app.source}</p>
                        
                        <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                          <span className="text-[10px] text-slate-400 font-medium">{formatDate(app.appliedDate)}</span>
                          <select 
                            className="text-xs border-slate-200 rounded-md text-slate-700 font-medium outline-none p-1.5 bg-slate-50 hover:bg-slate-100 focus:ring-2 focus:ring-blue-100 transition-colors"
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
                    <div className="h-28 rounded-xl border-2 border-dashed border-slate-200/70 bg-slate-50/50 flex flex-col items-center justify-center text-sm text-slate-400 gap-2">
                      <span className="font-medium">No Candidates</span>
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
