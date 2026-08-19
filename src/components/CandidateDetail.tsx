import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { mockJobs, mockClients, mockUsers } from '../data/mockData';
import { getMatchingJobsForCandidate } from '../data/mockCandidateJobInsights';
import { Mail, Phone, MapPin, Building2, Briefcase, FileText, Sparkles, AlertTriangle, Search, Filter, MoreHorizontal } from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import AIInsightCard from './AIInsightCard';
import { useApp } from '../context/AppContext';
import CandidateFormModal from './CandidateFormModal';
import MatchInsightModal from './MatchInsightModal';

type TabType = 'Overview' | 'Matching Jobs' | 'Applications & Pipeline' | 'Activity' | 'Documents';

export default function CandidateDetail() {
  const { id } = useParams();
  const { candidates, applications } = useApp();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('Overview');
  
  // Local state for prototype functionality
  const [addedPipelineJobs, setAddedPipelineJobs] = useState<Array<{jobId: string; stage: string; origin: string; date: string}>>([]);
  const [dismissedMatches, setDismissedMatches] = useState<string[]>([]);
  
  const [selectedInsight, setSelectedInsight] = useState<any>(null);
  const [showPipelineConfirmModal, setShowPipelineConfirmModal] = useState<string | null>(null); // jobId
  
  // Filters for Matching Jobs
  const [minScore, setMinScore] = useState<number>(70);
  const [locationFilter, setLocationFilter] = useState('');
  const [employmentFilter, setEmploymentFilter] = useState('');

  const candidate = candidates.find(c => c.id === id);
  if (!candidate) return <div>Candidate not found</div>;

  // Existing Applications
  const existingCandidateApps = applications.filter(a => a.candidateId === candidate.id);
  
  // Pipeline Jobs
  const pipelineJobs = addedPipelineJobs.map(p => ({
    id: `local-${p.jobId}`,
    jobId: p.jobId,
    currentStage: p.stage,
    appliedDate: p.date,
    assignedRecruiterId: 'u3', // Assuming Amit Kumar
    source: candidate.source,
    associationOrigin: p.origin,
    isLocal: true,
  }));

  // Combine for Applications & Pipeline tab
  const allAssociatedJobIds = [...existingCandidateApps.map(a => a.jobId), ...pipelineJobs.map(p => p.jobId)];
  const combinedApplications = [...existingCandidateApps, ...pipelineJobs];

  // All Candidate Match Insights
  const candidateInsights = getMatchingJobsForCandidate(candidate.id);

  // Eligible Matching Jobs List
  const matchingJobs = candidateInsights.filter(insight => {
    // Must be >= 70 score
    if (insight.matchScore < 70) return false;
    // Must not be dismissed
    if (dismissedMatches.includes(insight.jobId)) return false;
    // Must not have an existing relationship
    if (allAssociatedJobIds.includes(insight.jobId)) return false;
    
    // Check job status & openings
    const job = mockJobs.find(j => j.id === insight.jobId);
    if (!job) return false;
    if (job.status !== 'Published') return false; // Or 'Open' but JobStatus in mock is 'Published'
    if (job.openings - job.filled <= 0) return false;

    // Apply active filters
    if (minScore > 70 && insight.matchScore < minScore) return false;
    if (locationFilter && job.location !== locationFilter) return false;
    if (employmentFilter && job.employmentType !== employmentFilter) return false;

    return true;
  }).sort((a, b) => b.matchScore - a.matchScore);

  const topMatches = matchingJobs.slice(0, 3);

  // Handlers
  const handleAddToPipeline = (jobId: string) => {
    setAddedPipelineJobs([...addedPipelineJobs, {
      jobId,
      stage: 'Sourced',
      origin: 'Recruiter Added from Candidate Profile',
      date: new Date().toISOString()
    }]);
    setShowPipelineConfirmModal(null);
  };

  const handleDismiss = (jobId: string) => {
    if (window.confirm('Are you sure you want to dismiss this match? It will be hidden from the matching jobs list.')) {
      setDismissedMatches([...dismissedMatches, jobId]);
    }
  };

  const renderStageActions = (stage: string) => {
    switch(stage) {
      case 'Sourced': return (
        <>
          <button className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">Begin Screening</button>
          <button className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">Remove from Pipeline</button>
        </>
      );
      case 'Applied': return (
        <>
          <button className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">Begin Screening</button>
          <button className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">Reject</button>
        </>
      );
      case 'Ready for Onboarding': return (
        <>
          <button className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">Start Onboarding</button>
          <button className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">View Application</button>
        </>
      );
      default: return (
        <>
          <button className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">View Match</button>
          <button className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">Advance Stage</button>
        </>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
          <div className="flex gap-5">
            <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-2xl font-semibold shrink-0">
              {candidate.fullName.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-slate-800">{candidate.fullName}</h2>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-medium rounded">
                  {candidate.code}
                </span>
                {candidate.duplicateStatus !== 'None' && (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-medium rounded">
                    <AlertTriangle className="w-3 h-3" />
                    {candidate.duplicateStatus}
                  </span>
                )}
              </div>
              <p className="text-slate-600 mt-1">{candidate.currentRole || 'No Role'} at {candidate.currentCompany || 'No Company'}</p>
              
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-500">
                <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" /> {candidate.email}</span>
                <span className="flex items-center gap-1.5"><Phone className="w-4 h-4" /> {candidate.phone}</span>
                <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {candidate.currentLocation}</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button onClick={() => setIsEditModalOpen(true)} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
              Edit Profile
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2">
              <FileText className="w-4 h-4" />
              View Resume
            </button>
          </div>
        </div>
      </div>

      {candidate.duplicateStatus !== 'None' && (
        <AIInsightCard 
          title="Duplicate Candidate Warning"
          severity="warning"
          explanation="This profile has strong similarities with another candidate in the database."
          evidence={[
            "Same phone number: +91 9876543210",
            "Highly similar resume text (92% overlap)",
            "Previous profile: CAN-2023-088 (Applied 2 months ago)"
          ]}
          actionLabel="Merge Profiles"
          onAction={() => {}}
        />
      )}

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200 overflow-x-auto hide-scrollbar">
        <div className="flex gap-6 min-w-max px-2">
          {(['Overview', 'Matching Jobs', 'Applications & Pipeline', 'Activity', 'Documents'] as TabType[]).map(tab => {
            let label = tab as string;
            if (tab === 'Matching Jobs') label = `Matching Jobs (${matchingJobs.length})`;
            if (tab === 'Applications & Pipeline') label = `Applications & Pipeline (${combinedApplications.length})`;
            
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                  activeTab === tab 
                    ? "border-blue-600 text-blue-600" 
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'Overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-800 mb-4">Professional Details</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Total Experience</p>
                  <p className="text-sm font-medium text-slate-800">{candidate.totalExperience}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Current CTC</p>
                    <p className="text-sm font-medium text-slate-800">{candidate.currentSalary}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Expected CTC</p>
                    <p className="text-sm font-medium text-slate-800">{candidate.expectedSalary}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Notice Period</p>
                    <p className="text-sm font-medium text-slate-800">{candidate.noticePeriod}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Availability</p>
                    <p className="text-sm font-medium text-slate-800">{candidate.availableFrom ? formatDate(candidate.availableFrom) : '-'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Candidate Source</p>
                  <p className="text-sm font-medium text-slate-800">{candidate.source}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-800 mb-4">Skills & Languages</h3>
              <div className="mb-4">
                <div className="flex flex-wrap gap-2">
                  {candidate.skills.map((skill, index) => (
                    <span key={index} className="px-3 py-1 bg-slate-50 text-slate-700 text-sm font-medium rounded-lg border border-slate-200">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              {candidate.languages && candidate.languages.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-2">Languages</p>
                  <div className="flex flex-wrap gap-2">
                    {candidate.languages.map((lang, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg border border-blue-200">
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-6 shadow-sm">
               <div className="flex justify-between items-center mb-4">
                 <h3 className="font-semibold text-slate-800">Top Matching Jobs</h3>
                 <button onClick={() => setActiveTab('Matching Jobs')} className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                   View all matching jobs
                 </button>
               </div>
               
               {topMatches.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   {topMatches.map(insight => {
                     const job = mockJobs.find(j => j.id === insight.jobId);
                     const client = mockClients.find(c => c.id === job?.clientId);
                     if (!job || !client) return null;
                     
                     return (
                       <div key={job.id} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col hover:border-blue-300 transition-colors">
                         <div className="flex justify-between items-start mb-2">
                            <span className="inline-flex items-center justify-center bg-indigo-100 text-indigo-700 font-bold text-sm px-2 py-0.5 rounded shadow-sm">
                              {insight.matchScore}%
                            </span>
                            <span className="text-xs text-slate-500">{job.openings - job.filled} open</span>
                         </div>
                         <h4 className="font-bold text-slate-800 text-sm mb-1 leading-tight">{job.title}</h4>
                         <p className="text-xs text-slate-500 mb-3">{client.name} • {job.location}</p>
                         
                         <div className="mt-auto space-y-2">
                           <ul className="text-xs text-slate-600 space-y-1">
                             {insight.strengths.slice(0, 2).map((s, i) => (
                               <li key={i} className="flex items-start gap-1"><span className="text-green-500 font-bold">•</span> <span className="truncate">{s}</span></li>
                             ))}
                             {insight.missingCriteria.length > 0 && (
                               <li className="flex items-start gap-1"><span className="text-amber-500 font-bold">•</span> <span className="truncate">{insight.missingCriteria[0]}</span></li>
                             )}
                           </ul>
                           
                           <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
                              <button onClick={() => setSelectedInsight({ job, client, insight })} className="text-xs font-medium text-slate-600 hover:text-slate-900 px-2 py-1.5 border border-slate-200 rounded hover:bg-slate-50">
                                View Match
                              </button>
                              <button onClick={() => setShowPipelineConfirmModal(job.id)} className="text-xs font-medium text-blue-600 hover:text-blue-800 px-2 py-1.5 border border-blue-200 rounded bg-blue-50 hover:bg-blue-100 text-center">
                                Pipeline
                              </button>
                           </div>
                         </div>
                       </div>
                     );
                   })}
                 </div>
               ) : (
                 <div className="bg-white/60 p-6 rounded-lg text-center text-slate-600 text-sm">
                   No new matching jobs found for this candidate.
                 </div>
               )}
            </div>

            {candidate.professionalSummary && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <h3 className="font-semibold text-slate-800 mb-3">Professional Summary</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{candidate.professionalSummary}</p>
              </div>
            )}

            {candidate.employmentHistory && candidate.employmentHistory.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <h3 className="font-semibold text-slate-800 mb-6">Employment History</h3>
                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-slate-200">
                  {candidate.employmentHistory.map((exp, index) => (
                    <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-slate-100 text-slate-500 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10 ml-[2px] md:ml-0">
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-200 bg-white shadow-sm ml-4 md:ml-0">
                        <div className="flex items-start justify-between mb-1">
                          <h4 className="font-semibold text-slate-800 text-sm">{exp.role}</h4>
                          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{exp.startDate} - {exp.endDate}</span>
                        </div>
                        <p className="text-sm text-slate-600 mb-3">{exp.company} {exp.location && `• ${exp.location}`}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Matching Jobs Tab */}
      {activeTab === 'Matching Jobs' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-4 flex-wrap">
             <div className="flex gap-4 flex-1">
               <label className="flex items-center gap-2 text-sm text-slate-600">
                 Min Score:
                 <select value={minScore} onChange={(e) => setMinScore(Number(e.target.value))} className="border-slate-300 rounded px-2 py-1">
                   <option value={70}>70%</option>
                   <option value={80}>80%</option>
                   <option value={90}>90%</option>
                 </select>
               </label>
               <label className="flex items-center gap-2 text-sm text-slate-600">
                 Location:
                 <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} className="border-slate-300 rounded px-2 py-1">
                   <option value="">All Locations</option>
                   <option value="Delhi">Delhi</option>
                   <option value="Noida">Noida</option>
                   <option value="Gurugram">Gurugram</option>
                 </select>
               </label>
             </div>
          </div>
          
          <div className="divide-y divide-slate-100">
            {matchingJobs.length > 0 ? matchingJobs.map(insight => {
              const job = mockJobs.find(j => j.id === insight.jobId);
              const client = mockClients.find(c => c.id === job?.clientId);
              if (!job || !client) return null;

              return (
                <div key={job.id} className="p-6 flex flex-col md:flex-row gap-6 hover:bg-slate-50/50 transition-colors group">
                   <div className="flex flex-col items-center justify-start md:w-24 shrink-0">
                      <div className="w-16 h-16 rounded-full bg-indigo-50 border-2 border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xl shadow-sm">
                        {insight.matchScore}
                      </div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-2">Score</span>
                   </div>
                   
                   <div className="flex-1 space-y-3">
                     <div>
                       <Link to={`/job-desk/${job.id}`} className="font-bold text-lg text-slate-800 hover:text-blue-600">
                         {job.title}
                       </Link>
                       <div className="flex items-center gap-4 text-sm text-slate-600 mt-1">
                         <span className="font-medium text-slate-700 flex items-center gap-1.5"><Building2 className="w-4 h-4"/> {client.name}</span>
                         <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4"/> {job.location}</span>
                         <span className="flex items-center gap-1.5"><Briefcase className="w-4 h-4"/> {job.employmentType}</span>
                         <span className="text-slate-400">•</span>
                         <span className="font-medium text-blue-600">{job.openings - job.filled} Openings</span>
                       </div>
                     </div>
                     
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white border border-slate-100 rounded-lg p-4 shadow-sm">
                        <div>
                          <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Strengths</p>
                          <ul className="text-sm text-slate-600 space-y-1">
                            {insight.strengths.slice(0,3).map((s, i) => <li key={i} className="flex items-start gap-1"><span className="text-green-500 mt-0.5">•</span> {s}</li>)}
                          </ul>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Missing / Unverified</p>
                          <ul className="text-sm text-slate-600 space-y-1">
                            {insight.missingCriteria.slice(0,3).map((g, i) => <li key={i} className="flex items-start gap-1"><span className="text-amber-500 mt-0.5">•</span> {g}</li>)}
                            {insight.missingCriteria.length === 0 && <li className="text-slate-400 italic">None</li>}
                          </ul>
                        </div>
                     </div>
                   </div>
                   
                   <div className="flex flex-col gap-2 shrink-0 md:w-40">
                     <button onClick={() => setShowPipelineConfirmModal(job.id)} className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-center">
                       Add to Pipeline
                     </button>
                     <button onClick={() => setSelectedInsight({ job, client, insight })} className="w-full px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors text-center">
                       View Match
                     </button>
                     <button onClick={() => window.open(`/job-desk/${job.id}`)} className="w-full px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors text-center">
                       View Job
                     </button>
                     <button onClick={() => handleDismiss(job.id)} className="w-full px-4 py-2 mt-2 text-slate-500 hover:text-red-600 text-sm font-medium transition-colors text-center">
                       Dismiss Match
                     </button>
                   </div>
                </div>
              );
            }) : (
              <div className="p-12 text-center text-slate-500">
                 No jobs match the current criteria.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Applications & Pipeline Tab Content */}
      {activeTab === 'Applications & Pipeline' && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-slate-800">Applications & Pipeline Associations</h3>
          
          {combinedApplications.length > 0 ? combinedApplications.map(app => {
            const job = mockJobs.find(j => j.id === app.jobId);
            const client = mockClients.find(c => c.id === job?.clientId);
            const recruiter = mockUsers.find(u => u.id === app.assignedRecruiterId);
            const insight = getMatchingJobsForCandidate(candidate.id).find(i => i.jobId === app.jobId);
            
            // Determine origin label
            let originLabel = 'Direct Application';
            let relationshipLabel = 'Existing Application';
            if ('associationOrigin' in app && app.associationOrigin) {
              originLabel = app.associationOrigin as string;
              relationshipLabel = 'Pipeline';
            }

            return (
              <div key={'id' in app ? app.id : `app-${app.jobId}`} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden relative">
                {'isLocal' in app && app.isLocal && <div className="absolute top-0 left-0 w-1 h-full bg-amber-400"></div>}
                <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Link to={`/job-desk/${job?.id}`} className="font-semibold text-slate-800 hover:text-blue-600 text-lg">
                        {job?.title}
                      </Link>
                      <span className="text-slate-400">•</span>
                      <Link to={`/clients/${client?.id}`} className="text-sm text-slate-600 hover:text-blue-600">
                        {client?.name}
                      </Link>
                    </div>
                    <div className="text-xs text-slate-500 space-y-1">
                      <p><span className="font-medium text-slate-700">{relationshipLabel}</span> • Since {formatDate(app.appliedDate)} • Recruiter: {recruiter?.name}</p>
                      <p>Origin: {originLabel} • Source: {candidate.source}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="px-3 py-1 rounded-full text-sm font-medium border bg-blue-50 text-blue-700 border-blue-200">
                      {app.currentStage}
                    </span>
                    {insight && (
                      <span 
                        onClick={() => setSelectedInsight({ job, client, insight })}
                        className="text-xs font-bold text-indigo-600 flex items-center gap-1 cursor-pointer hover:underline"
                      >
                        <Sparkles className="w-3 h-3" /> {insight.matchScore}% Match Insights
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
                  {renderStageActions(app.currentStage as string)}
                  <button className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          }) : (
            <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500">
              No active applications or pipeline associations found.
            </div>
          )}
        </div>
      )}

      {/* Activity & Documents */}
      {(activeTab === 'Activity' || activeTab === 'Documents') && (
        <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500 italic">
          {activeTab} view not implemented in this prototype.
        </div>
      )}

      {/* Modals */}
      <CandidateFormModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        initialData={candidate}
        isEditMode={true}
      />
      
      {selectedInsight && (
        <MatchInsightModal 
          isOpen={!!selectedInsight}
          onClose={() => setSelectedInsight(null)}
          job={selectedInsight.job}
          client={selectedInsight.client}
          candidate={candidate}
          insight={selectedInsight.insight}
        />
      )}

      {/* Pipeline Confirmation Modal */}
      {showPipelineConfirmModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
             <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
               <h3 className="font-bold text-slate-800">Add to Pipeline</h3>
             </div>
             <div className="p-6">
                <p className="text-slate-600 text-sm mb-4">You are adding <strong>{candidate.fullName}</strong> to the pipeline for:</p>
                
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-6">
                  <p className="font-semibold text-slate-800 text-sm">{mockJobs.find(j => j.id === showPipelineConfirmModal)?.title}</p>
                  <p className="text-xs text-slate-500">{mockClients.find(c => c.id === mockJobs.find(j => j.id === showPipelineConfirmModal)?.clientId)?.name}</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Initial Stage</label>
                    <div className="font-medium text-sm text-slate-800">Sourced</div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Association Origin</label>
                    <div className="font-medium text-sm text-slate-800">Recruiter Added from Candidate Profile</div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Candidate Source</label>
                    <div className="font-medium text-sm text-slate-800">{candidate.source} <span className="text-slate-400 font-normal">(Preserved)</span></div>
                  </div>
                </div>
             </div>
             <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3 bg-slate-50">
                <button onClick={() => setShowPipelineConfirmModal(null)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">
                  Cancel
                </button>
                <button onClick={() => handleAddToPipeline(showPipelineConfirmModal)} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                  Confirm Addition
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
