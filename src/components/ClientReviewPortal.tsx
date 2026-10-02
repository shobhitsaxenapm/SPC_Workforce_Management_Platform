import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Building2, MapPin, Briefcase, ChevronRight, CheckCircle2, AlertCircle, Calendar, GraduationCap } from 'lucide-react';

export default function ClientReviewPortal() {
  const { token } = useParams();
  const { clientReviewBatches, jobs, clients, candidates, applications, submitClientReviewFeedback, markClientReviewBatchViewed } = useApp();
  
  const batch = clientReviewBatches.find(b => b.token === token);
  
  useEffect(() => {
    if (batch && !batch.viewedAt) {
      markClientReviewBatchViewed(batch.id);
    }
  }, [batch?.id, batch?.viewedAt]);
  
  const [decisions, setDecisions] = useState<Record<string, { status: string; comment?: string }>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!batch) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Review link is invalid or unavailable</h2>
          <p className="text-slate-500 mb-6">The requested candidate review batch could not be found or has expired.</p>
        </div>
      </div>
    );
  }

  const job = jobs.find(j => j.id === batch.jobId);
  const client = clients.find(c => c.id === batch.clientId);
  const apps = applications.filter(a => batch.applicationIds.includes(a.id));

  const handleDecision = (appId: string, status: string, comment?: string) => {
    setDecisions(prev => ({
      ...prev,
      [appId]: { status, comment: comment ?? prev[appId]?.comment }
    }));
  };

  const handleSubmit = async () => {
    if (Object.keys(decisions).length === 0) return;
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 800));
    submitClientReviewFeedback(batch.id, decisions);
    setIsSubmitting(false);
    setSubmitted(true);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'Shortlisted': return <span className="text-green-700 bg-green-50 border border-green-200 px-3 py-1 rounded-full text-sm font-semibold">Shortlisted</span>;
      case 'Client Rejected': return <span className="text-red-700 bg-red-50 border border-red-200 px-3 py-1 rounded-full text-sm font-semibold">Rejected</span>;
      case 'More Info Requested': return <span className="text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full text-sm font-semibold">More Info Requested</span>;
      case 'On Hold': return <span className="text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full text-sm font-semibold">On Hold</span>;
      default: return <span className="text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full text-sm font-semibold">Pending Review</span>;
    }
  };

  const pendingCount = batch.applicationIds.length - Object.keys(decisions).length - Object.values(batch.candidateStatuses).filter(s => s !== 'Submitted' && s !== 'Feedback Pending').length;

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Client Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Candidate Review</h1>
            <p className="text-sm text-slate-400 mt-1">{client?.name} • {job?.title}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-slate-300">
              {batch.applicationIds.length} Candidates Submitted
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {batch.message && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Message from SPC</h3>
            <p className="text-slate-600 whitespace-pre-wrap">{batch.message}</p>
          </div>
        )}

        {submitted && (
          <div className="bg-green-50 border border-green-200 p-6 rounded-xl flex items-start gap-4 animate-fade-in shadow-sm">
            <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-green-800 text-lg">Feedback Submitted Successfully</h3>
              <p className="text-green-700 mt-1">Thank you for your feedback. SPC will process your decisions shortly.</p>
              {pendingCount > 0 && (
                <button 
                  onClick={() => setSubmitted(false)}
                  className="mt-4 px-4 py-2 bg-white border border-green-300 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
                >
                  Continue Reviewing ({pendingCount} pending)
                </button>
              )}
            </div>
          </div>
        )}

        {!submitted && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50 p-4 px-6 flex justify-between items-center">
              <h2 className="font-bold text-slate-800 text-lg">Candidate List</h2>
              <span className="text-sm font-medium text-slate-500">{batch.applicationIds.length} candidates</span>
            </div>
            <div className="divide-y divide-slate-100">
              {apps.map(app => {
                const candidate = candidates.find(c => c.id === app.candidateId);
                if (!candidate) return null;
                
                const existingStatus = batch.candidateStatuses[app.id];
                const isPreviouslySubmitted = existingStatus && existingStatus !== 'Submitted' && existingStatus !== 'Feedback Pending';
                const draftDecision = decisions[app.id];
                
                return (
                  <div key={app.id} className="p-6 hover:bg-slate-50 transition-colors">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex-1 space-y-4">
                        <div>
                          <h3 className="text-xl font-bold text-slate-900">{candidate.fullName}</h3>
                          <p className="text-slate-600 font-medium text-base mt-1">{candidate.currentRole} at {candidate.currentCompany}</p>
                          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-slate-500">
                            <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4"/> {candidate.currentLocation}</span>
                            <span className="flex items-center gap-1.5"><Briefcase className="w-4 h-4"/> {candidate.totalExperience}</span>
                          </div>
                        </div>

                        {candidate.professionalSummary && (
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 mb-2">Professional Summary</h4>
                            <p className="text-sm text-slate-600 leading-relaxed">{candidate.professionalSummary}</p>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2"><Briefcase className="w-4 h-4 text-slate-400"/> Experience</h4>
                            <div className="space-y-3">
                              {candidate.employmentHistory?.slice(0, 2).map((exp, i) => (
                                <div key={i} className="text-sm">
                                  <div className="font-semibold text-slate-800">{exp.title}</div>
                                  <div className="text-slate-600">{exp.company}</div>
                                  <div className="text-slate-400 text-xs mt-0.5">{exp.startDate} - {exp.endDate}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2"><GraduationCap className="w-4 h-4 text-slate-400"/> Education</h4>
                            <div className="space-y-3">
                              {candidate.educationEntries?.slice(0, 2).map((edu, i) => (
                                <div key={i} className="text-sm">
                                  <div className="font-semibold text-slate-800">{edu.degree}</div>
                                  <div className="text-slate-600">{edu.institution}</div>
                                  <div className="text-slate-400 text-xs mt-0.5">{edu.yearOfPassing}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        <div className="pt-4 border-t border-slate-100">
                          <h4 className="text-sm font-bold text-slate-900 mb-2">Top Skills</h4>
                          <div className="flex flex-wrap gap-2">
                            {candidate.skills.slice(0, 5).map(skill => (
                              <span key={skill} className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs rounded-md border border-slate-200">
                                {skill}
                              </span>
                            ))}
                            {candidate.skills.length > 5 && (
                              <span className="px-2.5 py-1 bg-slate-50 text-slate-500 text-xs rounded-md border border-slate-200">
                                +{candidate.skills.length - 5} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="w-full md:w-72 shrink-0">
                        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm sticky top-24">
                          <h4 className="text-sm font-bold text-slate-900 mb-4">Your Decision</h4>
                          
                          {isPreviouslySubmitted ? (
                            <div className="space-y-4">
                              <div>{getStatusLabel(existingStatus)}</div>
                              {app.clientReviewStatus === existingStatus && ( // Assume client comment wasn't added to generic interface but if we did we could render it. We'll render from currentSubstate or similar if we added comments to the Application. But since comments aren't in App, we will just show status.
                                <p className="text-sm text-slate-500 italic mt-2">Decision submitted.</p>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <select
                                value={draftDecision?.status || ''}
                                onChange={e => handleDecision(app.id, e.target.value)}
                                className="w-full text-sm border-slate-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                              >
                                <option value="" disabled>Select a decision...</option>
                                <option value="Shortlisted">Shortlist for Interview</option>
                                <option value="Client Rejected">Reject</option>
                                <option value="More Info Requested">Request More Information</option>
                                <option value="On Hold">Keep on Hold</option>
                              </select>

                              {draftDecision?.status && (
                                <textarea
                                  placeholder="Optional comments for SPC..."
                                  value={draftDecision.comment || ''}
                                  onChange={e => handleDecision(app.id, draftDecision.status, e.target.value)}
                                  className="w-full text-sm border-slate-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                  rows={3}
                                />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Floating Action Bar */}
      {!submitted && Object.keys(decisions).length > 0 && (
        <div className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] p-4 z-30 animate-fade-in">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="text-sm text-slate-600 font-medium">
              <span className="font-bold text-slate-900">{Object.keys(decisions).length}</span> decision(s) ready to submit
            </div>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting...</>
              ) : (
                'Submit Feedback'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
