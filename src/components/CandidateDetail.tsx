import { useParams, Link } from 'react-router-dom';
import { mockCandidates, mockApplications, mockJobs, mockClients, mockUsers } from '../data/mockData';
import { Mail, Phone, MapPin, Building2, Briefcase, FileText, Sparkles, ChevronRight, AlertTriangle } from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import AIInsightCard from './AIInsightCard';

export default function CandidateDetail() {
  const { id } = useParams();
  const candidate = mockCandidates.find(c => c.id === id);
  
  if (!candidate) return <div>Candidate not found</div>;

  const applications = mockApplications.filter(a => a.candidateId === candidate.id);

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
            <button className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details & Skills */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-4">Professional Details</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">Total Experience</p>
                <p className="text-sm font-medium text-slate-800">{candidate.totalExperience}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Education</p>
                <p className="text-sm font-medium text-slate-800">{candidate.education}</p>
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
              <div>
                <p className="text-xs text-slate-500 mb-1">Notice Period</p>
                <p className="text-sm font-medium text-slate-800">{candidate.noticePeriod}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Source</p>
                <p className="text-sm font-medium text-slate-800">{candidate.source}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-4">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {candidate.skills.map(skill => (
                <span key={skill} className="px-3 py-1 bg-slate-50 text-slate-700 text-sm font-medium rounded-lg border border-slate-200">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Applications */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-lg font-semibold text-slate-800">Applications</h3>
          
          {applications.length > 0 ? applications.map(app => {
            const job = mockJobs.find(j => j.id === app.jobId);
            const client = mockClients.find(c => c.id === job?.clientId);
            const recruiter = mockUsers.find(u => u.id === app.assignedRecruiterId);
            
            return (
              <div key={app.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
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
                    <p className="text-xs text-slate-500">Applied on {formatDate(app.appliedDate)} • Assigned to {recruiter?.name}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-sm font-medium border bg-blue-50 text-blue-700 border-blue-200 self-start md:self-auto">
                    {app.currentStage}
                  </span>
                </div>
                
                {/* AI Insights */}
                {app.matchScore && (
                  <div className="p-5 bg-gradient-to-br from-indigo-50/50 to-white">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 border border-indigo-200">
                        <span className="font-bold text-indigo-700">{app.matchScore}%</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Sparkles className="w-4 h-4 text-indigo-500" />
                          <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">AI Match Insights · Advisory Only</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-semibold text-slate-700 mb-1">Strengths</p>
                            <ul className="text-sm text-slate-600 space-y-1">
                              {app.matchStrengths?.map((s, i) => <li key={i} className="flex items-start gap-1"><span className="text-green-500 mt-0.5">✓</span> {s}</li>)}
                            </ul>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-700 mb-1">Gaps / Risks</p>
                            <ul className="text-sm text-slate-600 space-y-1">
                              {app.matchGaps?.length ? app.matchGaps.map((g, i) => <li key={i} className="flex items-start gap-1"><span className="text-amber-500 mt-0.5">⚠</span> {g}</li>) : <li className="text-slate-400">None identified</li>}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
                  <button className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">
                    Reject
                  </button>
                  <button className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">
                    Schedule Interview
                  </button>
                  <button className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                    Advance Stage
                  </button>
                </div>
              </div>
            );
          }) : (
            <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500">
              No active applications found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
