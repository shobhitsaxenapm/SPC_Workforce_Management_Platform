import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Building2, MapPin, Briefcase, CheckCircle2, AlertCircle, Calendar, GraduationCap, FileText, X } from 'lucide-react';
import { cn } from '../lib/utils';

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
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);
  
  const apps = applications.filter(a => batch?.applicationIds.includes(a.id));
  const [selectedAppId, setSelectedAppId] = useState<string | null>(apps[0]?.id || null);
  const [resumeModalAppId, setResumeModalAppId] = useState<string | null>(null);

  useEffect(() => {
    if (apps.length > 0 && !selectedAppId) {
      setSelectedAppId(apps[0].id);
    }
  }, [apps, selectedAppId]);

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

  const handleDecision = (appId: string, status: string, comment?: string) => {
    setDecisions(prev => ({
      ...prev,
      [appId]: { status, comment: comment ?? prev[appId]?.comment }
    }));
  };

  const totalApps = batch.applicationIds.length;
  const previouslySubmittedCount = Object.values(batch.candidateStatuses).filter(s => s !== 'Submitted' && s !== 'Feedback Pending').length;
  const unsubmittedDecisionsCount = Object.keys(decisions).length;
  const reviewedCount = previouslySubmittedCount + unsubmittedDecisionsCount;
  const pendingCount = totalApps - reviewedCount;
  const progressPercent = Math.round((reviewedCount / totalApps) * 100);

  const handleSubmit = async () => {
    if (Object.keys(decisions).length === 0) return;
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 800));
    submitClientReviewFeedback(batch.id, decisions);
    
    const count = Object.keys(decisions).length;
    setDecisions({});
    
    const newPendingCount = pendingCount;
    if (newPendingCount === 0) {
      setSubmittedMessage('Review completed. Feedback has been shared with SPC.');
    } else {
      setSubmittedMessage(`Feedback submitted for ${count} candidate${count > 1 ? 's' : ''}. ${newPendingCount} candidate${newPendingCount > 1 ? 's remain' : ' remains'} pending.`);
    }
    
    setIsSubmitting(false);
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

  const selectedApp = apps.find(a => a.id === selectedAppId);
  const selectedCandidate = selectedApp ? candidates.find(c => c.id === selectedApp.candidateId) : null;
  const selectedAppExistingStatus = selectedApp ? batch.candidateStatuses[selectedApp.id] : null;
  const isSelectedPreviouslySubmitted = selectedAppExistingStatus && selectedAppExistingStatus !== 'Submitted' && selectedAppExistingStatus !== 'Feedback Pending';
  const selectedAppDraftDecision = selectedApp ? decisions[selectedApp.id] : null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <header className="bg-slate-900 text-white border-b border-slate-800 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Candidate Review</h1>
            <p className="text-sm text-slate-400 mt-1">{client?.name} • {job?.title}</p>
          </div>
          <div className="w-full md:w-64">
            <div className="flex justify-between text-xs font-medium text-slate-300 mb-1.5">
              <span>{reviewedCount} of {totalApps} reviewed</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div className="bg-blue-500 h-2 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[10px] text-slate-400">{pendingCount} pending</span>
              {previouslySubmittedCount > 0 && (
                <span className="text-[10px] text-slate-400">{previouslySubmittedCount} submitted</span>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <div className="max-w-7xl mx-auto w-full flex flex-col lg:flex-row overflow-hidden">
          
          <div className="lg:w-80 border-r border-slate-200 bg-white flex flex-col shrink-0 overflow-y-auto">
            {apps.map(app => {
              const candidate = candidates.find(c => c.id === app.candidateId);
              if (!candidate) return null;
              
              const existingStatus = batch.candidateStatuses[app.id];
              const isPreviouslySubmitted = existingStatus && existingStatus !== 'Submitted' && existingStatus !== 'Feedback Pending';
              const draftDecision = decisions[app.id];
              const isSelected = selectedAppId === app.id;
              
              let statusIndicator = <span className="w-2 h-2 rounded-full bg-slate-300" title="Pending" />;
              if (isPreviouslySubmitted) statusIndicator = <CheckCircle2 className="w-3.5 h-3.5 text-green-500" title="Submitted" />;
              else if (draftDecision) statusIndicator = <span className="w-2 h-2 rounded-full bg-blue-500" title="Ready to submit" />;

              return (
                <button
                  key={app.id}
                  onClick={() => setSelectedAppId(app.id)}
                  className={cn(
                    "flex flex-col text-left p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors relative",
                    isSelected && "bg-blue-50 hover:bg-blue-50"
                  )}
                >
                  {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600" />}
                  <div className="flex justify-between items-start w-full mb-1">
                    <span className="font-bold text-slate-900 text-sm">{candidate.fullName}</span>
                    <div className="mt-1">{statusIndicator}</div>
                  </div>
                  {(candidate.currentRole || candidate.currentCompany) && (
                    <span className="text-xs text-slate-500 truncate w-full">
                      {candidate.currentRole || 'Not provided'} {candidate.currentCompany ? `at ${candidate.currentCompany}` : ''}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex-1 bg-slate-50 flex flex-col overflow-y-auto">
            {submittedMessage && (
              <div className="m-6 mb-0 bg-green-50 border border-green-200 p-4 rounded-xl flex justify-between items-center animate-fade-in shadow-sm">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                  <span className="font-medium text-green-800">{submittedMessage}</span>
                </div>
                <button onClick={() => setSubmittedMessage(null)} className="text-green-600 hover:text-green-800 p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            
            {selectedCandidate && selectedApp ? (
              <div className="p-6 flex flex-col lg:flex-row gap-6">
                
                <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">{selectedCandidate.fullName}</h2>
                      {(selectedCandidate.currentRole || selectedCandidate.currentCompany) && (
                        <p className="text-slate-600 font-medium mt-1">
                          {selectedCandidate.currentRole || 'Not provided'} {selectedCandidate.currentCompany ? `at ${selectedCandidate.currentCompany}` : ''}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-slate-500">
                        {selectedCandidate.currentLocation && <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4"/> {selectedCandidate.currentLocation}</span>}
                        {selectedCandidate.totalExperience && <span className="flex items-center gap-1.5"><Briefcase className="w-4 h-4"/> {selectedCandidate.totalExperience}</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => setResumeModalAppId(selectedApp.id)}
                      className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 border border-blue-200"
                    >
                      <FileText className="w-4 h-4" /> View Resume
                    </button>
                  </div>

                  {selectedCandidate.professionalSummary && (
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 mb-2">Professional Summary</h4>
                      <p className="text-sm text-slate-600 leading-relaxed">{selectedCandidate.professionalSummary}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                    {selectedCandidate.employmentHistory && selectedCandidate.employmentHistory.length > 0 && (
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2"><Briefcase className="w-4 h-4 text-slate-400"/> Experience</h4>
                        <div className="space-y-4">
                          {selectedCandidate.employmentHistory.slice(0, 3).map((exp, i) => (
                            <div key={i} className="text-sm">
                              <div className="font-semibold text-slate-800">{exp.title}</div>
                              <div className="text-slate-600">{exp.company}</div>
                              <div className="text-slate-400 text-xs mt-0.5">{exp.startDate} - {exp.endDate}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedCandidate.educationEntries && selectedCandidate.educationEntries.length > 0 && (
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2"><GraduationCap className="w-4 h-4 text-slate-400"/> Education</h4>
                        <div className="space-y-4">
                          {selectedCandidate.educationEntries.slice(0, 3).map((edu, i) => (
                            <div key={i} className="text-sm">
                              <div className="font-semibold text-slate-800">{edu.degree}</div>
                              <div className="text-slate-600">{edu.institution}</div>
                              <div className="text-slate-400 text-xs mt-0.5">{edu.yearOfPassing}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {selectedCandidate.skills && selectedCandidate.skills.length > 0 && (
                    <div className="pt-4 border-t border-slate-100">
                      <h4 className="text-sm font-bold text-slate-900 mb-3">Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedCandidate.skills.map(skill => (
                          <span key={skill} className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-md border border-slate-200">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedCandidate.languages && selectedCandidate.languages.length > 0 && (
                    <div className="pt-4 border-t border-slate-100">
                      <h4 className="text-sm font-bold text-slate-900 mb-3">Languages</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedCandidate.languages.map(lang => (
                          <span key={lang} className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-md border border-slate-200">
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="w-full lg:w-72 shrink-0">
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm sticky top-6">
                    <h4 className="text-sm font-bold text-slate-900 mb-4">Your Decision</h4>
                    
                    {isSelectedPreviouslySubmitted ? (
                      <div className="space-y-4">
                        <div>{getStatusLabel(selectedAppExistingStatus)}</div>
                        <div className="bg-slate-50 border border-slate-100 rounded p-3 mt-4">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Feedback Submitted</span>
                          {selectedApp.clientReviewComment && (
                            <p className="text-sm text-slate-700 italic">"{selectedApp.clientReviewComment}"</p>
                          )}
                          <p className="text-xs text-slate-400 mt-2">{selectedApp.lastActivity ? new Date(selectedApp.lastActivity).toLocaleDateString() : 'Date not recorded'}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <select
                          value={selectedAppDraftDecision?.status || ''}
                          onChange={e => handleDecision(selectedApp.id, e.target.value)}
                          className="w-full text-sm border-slate-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="" disabled>Select a decision...</option>
                          <option value="Shortlisted">Shortlist for Interview</option>
                          <option value="Client Rejected">Reject</option>
                          <option value="More Info Requested">Request More Information</option>
                          <option value="On Hold">Keep on Hold</option>
                        </select>

                        {selectedAppDraftDecision?.status && (
                          <textarea
                            placeholder="Optional comments for SPC..."
                            value={selectedAppDraftDecision.comment || ''}
                            onChange={e => handleDecision(selectedApp.id, selectedAppDraftDecision.status, e.target.value)}
                            className="w-full text-sm border-slate-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            rows={4}
                          />
                        )}
                        {selectedAppDraftDecision && (
                          <p className="text-xs text-blue-600 bg-blue-50 px-2 py-1.5 rounded flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Ready to submit
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
                <p>Select a candidate to review</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Floating Action Bar */}
      {Object.keys(decisions).length > 0 && (
        <div className="shrink-0 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] p-4 z-30 animate-fade-in relative">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
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
      
      {resumeModalAppId && (() => {
        const modalApp = apps.find(a => a.id === resumeModalAppId);
        const modalCandidate = modalApp ? candidates.find(c => c.id === modalApp.candidateId) : null;
        if (!modalCandidate) return null;
        
        return (
          <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 md:p-6 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-full flex flex-col overflow-hidden">
              <div className="border-b border-slate-200 px-6 py-4 flex justify-between items-center bg-slate-50">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><FileText className="w-5 h-5 text-blue-600"/> Resume View</h3>
                <button onClick={() => setResumeModalAppId(null)} className="text-slate-400 hover:text-slate-600 p-1 bg-white border border-slate-200 rounded-md hover:bg-slate-100 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 md:p-8 overflow-y-auto bg-slate-100/50">
                <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-8 max-w-3xl mx-auto">
                  <div className="border-b-2 border-slate-800 pb-6 mb-6">
                    <h1 className="text-3xl font-bold text-slate-900">{modalCandidate.fullName}</h1>
                    {(modalCandidate.currentRole || modalCandidate.currentCompany) && (
                      <p className="text-lg text-slate-600 mt-2">
                        {modalCandidate.currentRole || 'Not provided'} {modalCandidate.currentCompany ? `at ${modalCandidate.currentCompany}` : ''}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-4 mt-4 text-sm text-slate-500">
                      {modalCandidate.currentLocation && <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4"/> {modalCandidate.currentLocation}</span>}
                      {modalCandidate.totalExperience && <span className="flex items-center gap-1.5"><Briefcase className="w-4 h-4"/> {modalCandidate.totalExperience}</span>}
                    </div>
                  </div>
                  
                  {modalCandidate.professionalSummary && (
                    <div className="mb-8">
                      <h2 className="text-lg font-bold text-slate-800 mb-3 border-b border-slate-200 pb-2">Professional Summary</h2>
                      <p className="text-sm text-slate-600 leading-relaxed">{modalCandidate.professionalSummary}</p>
                    </div>
                  )}

                  {modalCandidate.employmentHistory && modalCandidate.employmentHistory.length > 0 && (
                    <div className="mb-8">
                      <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">Work Experience</h2>
                      <div className="space-y-6">
                        {modalCandidate.employmentHistory.map((exp, i) => (
                          <div key={i}>
                            <div className="flex justify-between items-start mb-1">
                              <h3 className="font-bold text-slate-900">{exp.title}</h3>
                              <span className="text-sm text-slate-500 font-medium whitespace-nowrap ml-4">{exp.startDate} - {exp.endDate}</span>
                            </div>
                            <div className="text-slate-700 font-medium text-sm mb-2">{exp.company}</div>
                            {exp.description && <p className="text-sm text-slate-600 mt-2 whitespace-pre-wrap">{exp.description}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {modalCandidate.educationEntries && modalCandidate.educationEntries.length > 0 && (
                    <div className="mb-8">
                      <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">Education</h2>
                      <div className="space-y-4">
                        {modalCandidate.educationEntries.map((edu, i) => (
                          <div key={i} className="flex justify-between items-start">
                            <div>
                              <h3 className="font-bold text-slate-900">{edu.degree}</h3>
                              <div className="text-slate-600 text-sm">{edu.institution}</div>
                            </div>
                            <span className="text-sm text-slate-500 font-medium">{edu.yearOfPassing}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(modalCandidate.skills?.length > 0 || modalCandidate.languages?.length > 0) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {modalCandidate.skills && modalCandidate.skills.length > 0 && (
                        <div>
                          <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">Skills</h2>
                          <div className="flex flex-wrap gap-2">
                            {modalCandidate.skills.map(skill => (
                              <span key={skill} className="bg-slate-100 text-slate-700 px-3 py-1 rounded text-sm font-medium">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {modalCandidate.languages && modalCandidate.languages.length > 0 && (
                        <div>
                          <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">Languages</h2>
                          <div className="flex flex-wrap gap-2">
                            {modalCandidate.languages.map(lang => (
                              <span key={lang} className="bg-slate-100 text-slate-700 px-3 py-1 rounded text-sm font-medium">
                                {lang}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
