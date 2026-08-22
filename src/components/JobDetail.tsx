import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { mockUsers } from '../data/mockData';
import { Briefcase, Building2, MapPin, Calendar, CheckCircle2, ChevronRight, Share, Eye, LayoutGrid, List, Search, UserPlus } from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { ApplicationStage } from '../types';
import { useApp } from '../context/AppContext';
import JobMatchesTab from './JobMatchesTab';
import CandidateMatchProfileDrawer from './CandidateMatchProfileDrawer';
import JobFormModal from './JobFormModal';
import ScheduleInterviewModal from './ScheduleInterviewModal';

export default function JobDetail() {
  const { id } = useParams();
  const { jobs, requirements, clients, applications, candidates, offers, updateApplicationStage, matchRuns, runJobMatching, currentUser, addMatchToPipeline, updateJobStatus, setQuickViewRequirementId, setQuickViewCandidateId } = useApp();
  const job = jobs.find(j => j.id === id);
  const [activeTab, setActiveTab] = useState<'Overview' | 'Matches' | 'Pipeline' | 'Activity'>('Overview');
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [scheduleCandidateId, setScheduleCandidateId] = useState<string | null>(null);
  
  if (!job) return <div>Job not found</div>;

  const req = requirements.find(r => r.id === job.requirementId);
  const client = clients.find(c => c.id === job.clientId);
  const recruiter = mockUsers.find(u => u.id === job.assignedRecruiterId);
  const jobApplications = applications.filter(a => a.jobId === job.id);
  
  const progress = (job.filled / job.openings) * 100;

  const currentMatchRun = matchRuns.find(r => r.jobId === job.id);
  const activeMatches = currentMatchRun?.matches.filter(m => !m.dismissed) || [];
  
  const canRunMatching = currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER' || currentUser?.id === job.assignedRecruiterId;
  const canAction = canRunMatching;

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

  const handleRefreshMatches = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      runJobMatching(job.id);
      setIsRefreshing(false);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 text-sm">
          <Link to="/requirements" className="text-slate-500 hover:text-slate-800">Reqs</Link>
          <ChevronRight className="w-4 h-4 text-slate-400" />
          <button onClick={() => req && setQuickViewRequirementId(req.id)} className="text-slate-500 hover:text-slate-800 outline-none focus-visible:underline">{req?.code}</button>
          <ChevronRight className="w-4 h-4 text-slate-400" />
          <span className="font-medium text-slate-800 font-mono">{job.code}</span>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsEditModalOpen(true)}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
            Edit Job
          </button>
          
          {job.status === 'Published' ? (
            <button 
              onClick={() => updateJobStatus(job.id, 'Draft')}
              className="px-4 py-2 bg-white border border-slate-300 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors shadow-sm"
            >
              Unpublish
            </button>
          ) : (
            <button 
              onClick={() => updateJobStatus(job.id, 'Published')}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              Publish
            </button>
          )}
        </div>
      </div>


      <div className="flex border-b border-gray-200">
        <button 
          onClick={() => setActiveTab('Overview')} 
          className={cn("px-6 py-3 font-medium text-sm border-b-2 transition-colors", activeTab === 'Overview' ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700")}
        >
          Job Overview
        </button>
        <button 
          onClick={() => setActiveTab('Matches')} 
          className={cn("px-6 py-3 font-medium text-sm border-b-2 transition-colors", activeTab === 'Matches' ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700")}
        >
          Matches ({activeMatches.length})
        </button>
        <button 
          onClick={() => setActiveTab('Pipeline')} 
          className={cn("px-6 py-3 font-medium text-sm border-b-2 transition-colors", activeTab === 'Pipeline' ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700")}
        >
          Pipeline ({jobApplications.length})
        </button>
        <button 
          onClick={() => setActiveTab('Activity')} 
          className={cn("px-6 py-3 font-medium text-sm border-b-2 transition-colors", activeTab === 'Activity' ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700")}
        >
          Activity
        </button>
      </div>

      {activeTab === 'Overview' && (
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

            {/* Top Candidate Matches Preview */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-800">Top Candidate Matches</h3>
                <button onClick={() => setActiveTab('Matches')} className="text-sm font-medium text-blue-600 hover:text-blue-700">View all matches</button>
              </div>
              
              {!currentMatchRun ? (
                <div className="text-sm text-gray-500 py-4 text-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  Matching engine has not been run for this job yet.
                </div>
              ) : activeMatches.length === 0 ? (
                <div className="text-sm text-gray-500 py-4 text-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  No active matches found.
                </div>
              ) : (
                <div className="space-y-4">
                  {activeMatches.slice(0, 3).map(match => {
                    const candidate = candidates.find(c => c.id === match.candidateId);
                    if (!candidate) return null;
                    const inPipeline = applications.some(a => a.jobId === job.id && a.candidateId === match.candidateId);
                    return (
                      <div key={match.candidateId} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 hover:bg-gray-50 rounded-xl border border-gray-100 gap-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                            {candidate.fullName.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <button onClick={() => setSelectedProfileId(candidate.id)} className="font-semibold text-slate-800 hover:text-blue-600 text-left text-sm">{candidate.fullName}</button>
                            <span className="text-xs text-gray-500 mt-0.5">{candidate.currentRole} • {candidate.currentLocation}</span>
                            <span className="text-xs text-gray-500 mt-0.5">Exp: {candidate.totalExperience} • Avail: {candidate.noticePeriod}</span>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {match.matchStrengths.slice(0, 3).map((s, i) => (
                                <span key={i} className="text-[10px] px-1.5 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded">
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                            Score <span className={cn("px-2 py-0.5 rounded-full font-bold", match.score >= 85 ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700")}>{match.score}%</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <button onClick={() => setSelectedProfileId(candidate.id)} className="text-xs font-medium text-slate-600 hover:text-blue-600 px-2 py-1">
                              View Profile
                            </button>
                            {inPipeline ? (
                              <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg border border-gray-200">In Pipeline</span>
                            ) : canAction ? (
                              <button 
                                onClick={() => addMatchToPipeline(job.id, candidate.id)}
                                className="px-3 py-1 bg-blue-600 text-white hover:bg-blue-700 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                              >
                                <UserPlus className="w-3.5 h-3.5" />
                                Add to Pipeline
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
                  <span className="text-gray-500">Applicants</span>
                  <span className="font-medium text-gray-800">{jobApplications.filter(a => a.source !== 'Internal Match').length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Active Pipeline</span>
                  <span className="font-medium text-gray-800">
                    {jobApplications.filter(a => a.currentStage !== 'Rejected' && a.currentStage !== 'Withdrawn' && a.currentStage !== 'Offer Declined').length}
                  </span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
                  <span className="text-gray-500">Database Matches</span>
                  <span className="font-medium text-gray-800">{activeMatches.length}</span>
                </div>
                <div className="flex justify-between text-xs pb-2">
                  <span className="text-gray-400">Last Match Run</span>
                  <span className="text-gray-500">{currentMatchRun ? formatDate(currentMatchRun.timestamp) : 'Never'}</span>
                </div>
                
                {canRunMatching && (
                  <button 
                    onClick={handleRefreshMatches}
                    disabled={isRefreshing}
                    className="w-full mt-2 py-2 flex items-center justify-center gap-2 bg-white border border-blue-200 rounded-lg text-sm font-medium text-blue-700 hover:bg-blue-50 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isRefreshing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        Refreshing matches...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4" />
                        Refresh Matches
                      </>
                    )}
                  </button>
                )}
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
                  <button onClick={() => req && setQuickViewRequirementId(req.id)} className="text-sm font-medium text-blue-600 hover:underline outline-none">{req?.title}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'Matches' && <JobMatchesTab job={job} />}

      {activeTab === 'Pipeline' && (
        <div className="bg-gray-50/50 rounded-xl border border-gray-200 p-6 overflow-x-auto shadow-inner flex gap-6 min-h-[500px]">
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
                            <button onClick={() => setQuickViewCandidateId(candidate.id)} className="font-semibold text-slate-800 hover:text-blue-600 truncate mr-2 outline-none text-left">
                            {candidate.fullName}
                            </button>
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
                        <p className="text-xs text-slate-400 mb-2 flex items-center gap-1 truncate"><MapPin className="w-3 h-3"/>{candidate.currentLocation} • {app.source}</p>
                        
                        {(() => {
                           const existingOffer = offers.find(o => o.applicationId === app.id);
                           if (existingOffer) {
                              return (
                                <div className="mb-3 px-2 py-1 bg-indigo-50 border border-indigo-100 rounded-md text-[10px] font-medium text-indigo-700 flex justify-between items-center">
                                  <span>Offer: {existingOffer.status}</span>
                                </div>
                              );
                           }
                           return null;
                        })()}

                        <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                          <span className="text-[10px] text-slate-400 font-medium">{formatDate(app.appliedDate)}</span>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => setScheduleCandidateId(candidate.id)}
                              className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                              title="Schedule Interview"
                            >
                              <Calendar className="w-3.5 h-3.5" />
                            </button>
                            <select 
                              className="text-xs border-slate-200 rounded-md text-slate-700 font-medium outline-none p-1.5 bg-slate-50 hover:bg-slate-100 focus:ring-2 focus:ring-blue-100 transition-colors"
                              value={app.currentStage}
                              onChange={(e) => updateStage(app.id, e.target.value as ApplicationStage)}
                            >
                              {pipelineStages.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
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

      {activeTab === 'Activity' && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
          Activity log coming soon.
        </div>
      )}

      <CandidateMatchProfileDrawer 
        isOpen={!!selectedProfileId}
        onClose={() => setSelectedProfileId(null)}
        candidate={candidates.find(c => c.id === selectedProfileId) || null}
        match={currentMatchRun?.matches.find(m => m.candidateId === selectedProfileId) || null}
      />

      <JobFormModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        job={job}
      />

      <ScheduleInterviewModal 
        isOpen={!!scheduleCandidateId}
        onClose={() => setScheduleCandidateId(null)}
        initialCandidateId={scheduleCandidateId || ''}
        initialJobId={job.id}
      />
    </div>
  );
}
