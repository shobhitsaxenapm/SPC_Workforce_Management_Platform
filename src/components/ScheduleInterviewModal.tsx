import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { X, Calendar, Clock, Video, Phone, Users, Check, AlertCircle, Link as LinkIcon, AlertTriangle } from 'lucide-react';
import { cn, formatDateTime } from '../lib/utils';
import { Interview } from '../types';

interface ScheduleInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCandidateId?: string;
  initialJobId?: string;
}

export default function ScheduleInterviewModal({ isOpen, onClose, initialCandidateId, initialJobId }: ScheduleInterviewModalProps) {
  const { candidates, jobs, clients, applications, scheduleInterview, addMatchToPipeline, setQuickViewJobId } = useApp();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);

  // Form State
  const [selectedCandidateId, setSelectedCandidateId] = useState(initialCandidateId || '');
  const [selectedJobId, setSelectedJobId] = useState(initialJobId || '');
  const [stagedNewJobLink, setStagedNewJobLink] = useState('');
  const [showJobLinkPanel, setShowJobLinkPanel] = useState(false);
  const [jobSearchQuery, setJobSearchQuery] = useState('');
  
  const [details, setDetails] = useState({
    interviewType: 'HR Screening',
    date: '',
    time: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    durationMinutes: 45,
    interviewerName: '',
    interviewerEmail: '',
    candidateInstructions: '',
    internalNotes: ''
  });

  const [modeConfig, setModeConfig] = useState({
    mode: 'Video' as 'Phone' | 'Video' | 'In-person' | 'Manual Link',
    provider: 'None' as 'Google Meet' | 'Microsoft Teams' | 'Zoom' | 'None',
    meetingLink: '',
    location: '',
  });

  // Derived state
  const selectedCandidate = candidates.find(c => c.id === selectedCandidateId);
  
  // A candidate's active applications to filter jobs
  const candidateApplications = applications.filter(a => a.candidateId === selectedCandidateId);
  const availableJobs = jobs.filter(j => candidateApplications.some(a => a.jobId === j.id));
  
  const isNewlyLinked = !!stagedNewJobLink && stagedNewJobLink === selectedJobId;
  const selectedJob = isNewlyLinked ? jobs.find(j => j.id === selectedJobId) : availableJobs.find(j => j.id === selectedJobId);
  const selectedClient = clients.find(c => c.id === selectedJob?.clientId);
  const currentApplication = candidateApplications.find(a => a.jobId === selectedJobId);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setError('');
      setSelectedCandidateId(initialCandidateId || '');
      setSelectedJobId(initialJobId || '');
      setStagedNewJobLink('');
      setShowJobLinkPanel(false);
      setJobSearchQuery('');
      setDetails({
        interviewType: 'HR Screening',
        date: '',
        time: '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        durationMinutes: 45,
        interviewerName: '',
        interviewerEmail: '',
        candidateInstructions: '',
        internalNotes: ''
      });
      setModeConfig({
        mode: 'Video',
        provider: 'None',
        meetingLink: '',
        location: '',
      });
    }
  }, [isOpen, initialCandidateId, initialJobId]);

  if (!isOpen) return null;

  const validateStep1 = () => {
    if (!selectedCandidateId) return 'Please select a candidate.';
    if (!selectedJobId) return 'Please select a job relationship.';
    
    // Check eligibility based on stage
    const ineligibleStages = ['Offered', 'Offer Accepted', 'Offer Declined', 'Ready for Onboarding', 'Onboarding', 'Joined', 'Rejected', 'Withdrawn'];
    if (currentApplication && ineligibleStages.includes(currentApplication.currentStage)) {
      return `Candidate is currently in stage "${currentApplication.currentStage}" which is ineligible for interview scheduling.`;
    }
    
    return null;
  };

  const validateStep2 = () => {
    if (!details.interviewType) return 'Interview round is required.';
    if (!details.date) return 'Date is required.';
    if (!details.time) return 'Start time is required.';
    if (!details.interviewerName) return 'Interviewer is required.';
    if (!details.interviewerEmail) return 'Interviewer email is required.';
    if (details.interviewerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.interviewerEmail)) {
      return 'Please enter a valid interviewer email address.';
    }
    if (details.durationMinutes <= 0) return 'Duration must be greater than 0.';
    
    const scheduledDateTime = new Date(`${details.date}T${details.time}:00`);
    if (scheduledDateTime < new Date()) {
      return 'The selected date and time is in the past. Please select a future time.';
    }
    return null;
  };

  const validateStep3 = () => {
    if (modeConfig.mode === 'Manual Link') {
      if (!modeConfig.meetingLink) return 'Meeting link is required.';
      if (!modeConfig.meetingLink.startsWith('https://')) return 'Meeting link must be a valid HTTPS URL.';
    }
    if (modeConfig.mode === 'In-person' && !modeConfig.location) {
      return 'Location address is required for in-person interviews.';
    }
    if (modeConfig.mode === 'Video' && modeConfig.provider === 'None') {
      return 'Please choose a provider or use a Manual Link.';
    }
    return null;
  };

  const handleNext = () => {
    let err = null;
    if (step === 1) err = validateStep1();
    if (step === 2) err = validateStep2();
    if (step === 3) err = validateStep3();

    if (err) {
      setError(err);
    } else {
      setError('');
      setStep(s => s + 1);
    }
  };

  const handleSchedule = () => {
    setIsScheduling(true);
    setError('');

    // Simulate safe creation sequence with idempotency
    setTimeout(() => {
      const scheduledAt = new Date(`${details.date}T${details.time}:00`).toISOString();
      const finalMeetingLink = modeConfig.mode === 'Manual Link' ? modeConfig.meetingLink : modeConfig.location;

      let finalApplicationId = currentApplication?.id || '';
      if (isNewlyLinked) {
        const linkResult = addMatchToPipeline(selectedJobId, selectedCandidateId, 'Added by recruiter during interview scheduling');
        if (!linkResult.success) {
          setError(linkResult.error || 'Failed to link candidate to the selected job.');
          setIsScheduling(false);
          return;
        }
        finalApplicationId = linkResult.applicationId || '';
      }

      const result = scheduleInterview({
        applicationId: finalApplicationId,
        candidateId: selectedCandidateId,
        jobId: selectedJobId,
        clientId: selectedJob?.clientId || '',
        interviewType: details.interviewType,
        scheduledAt,
        durationMinutes: details.durationMinutes,
        interviewerName: details.interviewerName,
        interviewerEmail: details.interviewerEmail,
        mode: modeConfig.mode,
        timezone: details.timezone,
        provider: modeConfig.provider,
        meetingLink: finalMeetingLink,
        candidateInstructions: details.candidateInstructions,
        internalNotes: details.internalNotes
      });

      if (!result.success) {
        setError(result.error || 'Scheduling failed. Please try again.');
        setIsScheduling(false);
      } else {
        alert("Interview scheduled successfully.");
        setIsScheduling(false);
        onClose();
      }
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Schedule Interview
          </h2>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-lg transition-colors"
            title="Close without saving"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="flex bg-slate-100 border-b border-slate-200">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className="flex-1 relative">
              <div className={cn(
                "h-1 transition-all",
                step >= s ? "bg-blue-600" : "bg-transparent"
              )}></div>
              <div className={cn(
                "py-2 text-center text-xs font-semibold uppercase tracking-wider transition-colors",
                step === s ? "text-blue-700 bg-blue-50/50" : (step > s ? "text-slate-600" : "text-slate-400")
              )}>
                {s === 1 ? 'Relationship' : s === 2 ? 'Details' : s === 3 ? 'Mode' : 'Review'}
              </div>
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <div>{error}</div>
            </div>
          )}

          {/* STEP 1: Relationship */}
          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Candidate *</label>
                <select
                  value={selectedCandidateId}
                  onChange={(e) => {
                    setSelectedCandidateId(e.target.value);
                    setSelectedJobId(''); // reset job when candidate changes
                    setError('');
                  }}
                  disabled={!!initialCandidateId}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm disabled:bg-slate-50 disabled:text-slate-500"
                >
                  <option value="">Select a candidate...</option>
                  {candidates.map(c => (
                    <option key={c.id} value={c.id}>{c.fullName} ({c.code})</option>
                  ))}
                </select>
              </div>

              {selectedCandidateId && !showJobLinkPanel && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Associated Job Process *</label>
                  {availableJobs.length === 0 && !stagedNewJobLink ? (
                    <div className="text-sm text-slate-700 bg-slate-50 p-4 rounded-lg border border-slate-200 text-center">
                      <p className="mb-3">This Candidate is not currently linked to an eligible Job. Select a Job to continue scheduling the interview.</p>
                      <button onClick={() => setShowJobLinkPanel(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">Select and Link Job</button>
                    </div>
                  ) : (
                    <div className="flex gap-2 items-center">
                      <select
                        value={selectedJobId}
                        onChange={(e) => {
                          setSelectedJobId(e.target.value);
                          setStagedNewJobLink('');
                          setError('');
                        }}
                        disabled={!!initialJobId}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm disabled:bg-slate-50 disabled:text-slate-500"
                      >
                        <option value="">Select associated job...</option>
                        {stagedNewJobLink && (
                          <option value={stagedNewJobLink}>
                            {jobs.find(j => j.id === stagedNewJobLink)?.title} (New Link)
                          </option>
                        )}
                        {availableJobs.map(j => {
                          const app = candidateApplications.find(a => a.jobId === j.id);
                          return (
                            <option key={j.id} value={j.id}>
                              {j.title} (Stage: {app?.currentStage})
                            </option>
                          );
                        })}
                      </select>
                      {!initialJobId && (
                        <button onClick={() => setShowJobLinkPanel(true)} className="px-3 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 whitespace-nowrap transition-colors">Link New Job</button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {selectedCandidateId && showJobLinkPanel && (
                <div className="border border-slate-200 rounded-lg overflow-hidden flex flex-col">
                  <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="font-semibold text-slate-800 text-sm">Select and Link Job</h3>
                    <button onClick={() => setShowJobLinkPanel(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="w-4 h-4"/></button>
                  </div>
                  <div className="p-4 bg-white space-y-4">
                    <input 
                      type="text" 
                      placeholder="Search jobs by title, ID, client, or location..."
                      value={jobSearchQuery}
                      onChange={e => setJobSearchQuery(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
                      {jobs.filter(j => 
                        (j.status === 'Published' || j.status === 'Open') &&
                        !availableJobs.some(aj => aj.id === j.id) &&
                        (j.title.toLowerCase().includes(jobSearchQuery.toLowerCase()) || 
                         j.code.toLowerCase().includes(jobSearchQuery.toLowerCase()) ||
                         j.location.toLowerCase().includes(jobSearchQuery.toLowerCase()) ||
                         clients.find(c => c.id === j.clientId)?.name.toLowerCase().includes(jobSearchQuery.toLowerCase()))
                      ).map(j => {
                        const cClient = clients.find(c => c.id === j.clientId);
                        return (
                          <div key={j.id} className="p-3 border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/30 transition-colors flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
                            <div>
                              <div className="font-medium text-slate-800 text-sm">{j.title} <span className="text-slate-500 font-normal text-xs ml-1">{j.code}</span></div>
                              <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                                <span>{cClient?.name}</span>
                                <span>{j.location}</span>
                                <span>{j.openings} Openings</span>
                              </div>
                            </div>
                            <div className="flex gap-2 shrink-0">
                              <button onClick={() => setQuickViewJobId(j.id)} className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors">View Details</button>
                              <button onClick={() => {
                                setStagedNewJobLink(j.id);
                                setSelectedJobId(j.id);
                                setShowJobLinkPanel(false);
                                setError('');
                              }} className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors">Select Job</button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Details */}
          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Interview Round *</label>
                  <select
                    value={details.interviewType}
                    onChange={(e) => setDetails({...details, interviewType: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  >
                    <option value="HR Screening">HR Screening</option>
                    <option value="Skill Assessment">Skill Assessment</option>
                    <option value="Hiring Manager Interview">Hiring Manager Interview</option>
                    <option value="Client Interview">Client Interview</option>
                    <option value="Final Interview">Final Interview</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Interviewer Name *</label>
                  <input
                    type="text"
                    value={details.interviewerName}
                    onChange={(e) => setDetails({...details, interviewerName: e.target.value})}
                    placeholder="E.g., John Doe"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Interviewer Email *</label>
                  <input
                    type="email"
                    value={details.interviewerEmail}
                    onChange={(e) => setDetails({...details, interviewerEmail: e.target.value})}
                    placeholder="john@example.com"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    value={details.date}
                    onChange={(e) => setDetails({...details, date: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Start Time *</label>
                  <input
                    type="time"
                    value={details.time}
                    onChange={(e) => setDetails({...details, time: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Duration (Mins) *</label>
                  <input
                    type="number"
                    min="15"
                    step="15"
                    value={details.durationMinutes}
                    onChange={(e) => setDetails({...details, durationMinutes: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Time Zone *</label>
                <select
                  value={details.timezone}
                  onChange={(e) => setDetails({...details, timezone: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                >
                  <option value={Intl.DateTimeFormat().resolvedOptions().timeZone}>
                    {Intl.DateTimeFormat().resolvedOptions().timeZone} (Local)
                  </option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time (US & Canada)</option>
                  <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
                  <option value="Europe/London">London</option>
                  <option value="Asia/Kolkata">India Standard Time</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Instructions for Candidate</label>
                  <textarea
                    rows={3}
                    value={details.candidateInstructions}
                    onChange={(e) => setDetails({...details, candidateInstructions: e.target.value})}
                    placeholder="E.g., Please have your portfolio ready."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Internal Notes (Hidden)</label>
                  <textarea
                    rows={3}
                    value={details.internalNotes}
                    onChange={(e) => setDetails({...details, internalNotes: e.target.value})}
                    placeholder="Visible only to recruitment team."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Mode */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-4 gap-3">
                {(['Video', 'Phone', 'In-person', 'Manual Link'] as const).map(mode => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => {
                      setModeConfig({...modeConfig, mode, provider: mode === 'Video' ? 'Google Meet' : 'None', meetingLink: '', location: ''});
                      setError('');
                    }}
                    className={cn(
                      "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all",
                      modeConfig.mode === mode 
                        ? "border-blue-600 bg-blue-50 text-blue-700" 
                        : "border-slate-200 hover:border-slate-300 text-slate-600"
                    )}
                  >
                    {mode === 'Video' && <Video className="w-6 h-6 mb-2" />}
                    {mode === 'Phone' && <Phone className="w-6 h-6 mb-2" />}
                    {mode === 'In-person' && <Users className="w-6 h-6 mb-2" />}
                    {mode === 'Manual Link' && <LinkIcon className="w-6 h-6 mb-2" />}
                    <span className="text-sm font-semibold">{mode}</span>
                  </button>
                ))}
              </div>

              {modeConfig.mode === 'Video' && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    <span className="text-sm font-medium text-slate-800">Provider Integration: Not Connected</span>
                  </div>
                  <p className="text-sm text-slate-600">
                    Active directory / Calendar integration is required to automatically generate Google Meet, Teams, or Zoom links. 
                    Please use <button className="text-blue-600 font-semibold underline" onClick={() => setModeConfig({...modeConfig, mode: 'Manual Link'})}>Manual Link</button> for this prototype session.
                  </p>
                </div>
              )}

              {modeConfig.mode === 'Manual Link' && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Meeting URL *</label>
                  <input
                    type="url"
                    value={modeConfig.meetingLink}
                    onChange={(e) => setModeConfig({...modeConfig, meetingLink: e.target.value})}
                    placeholder="https://zoom.us/j/..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                  <p className="text-xs text-slate-500 mt-2">Paste a pre-generated HTTPS meeting link.</p>
                </div>
              )}

              {modeConfig.mode === 'Phone' && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                  <p className="text-sm text-slate-700 mb-3">
                    Interviewer will call the candidate at: <br/>
                    <strong>{selectedCandidate?.phone}</strong>
                  </p>
                  <p className="text-xs text-slate-500">
                    If this number is incorrect, please update the candidate profile before proceeding.
                  </p>
                </div>
              )}

              {modeConfig.mode === 'In-person' && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Office Location / Address *</label>
                  <textarea
                    rows={2}
                    value={modeConfig.location}
                    onChange={(e) => setModeConfig({...modeConfig, location: e.target.value})}
                    placeholder="E.g., 4th Floor, SPC Tech Hub, Bangalore"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
                  />
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Review */}
          {step === 4 && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-4">
                <h3 className="font-bold text-slate-800 text-base border-b border-slate-200 pb-2">Review Summary</h3>
                
                <div className="grid grid-cols-2 gap-y-4 text-sm">
                  <div>
                    <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Candidate</span>
                    <span className="font-medium text-slate-800">{selectedCandidate?.fullName}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Job / Client</span>
                    <span className="font-medium text-slate-800 flex flex-col items-start gap-1">
                      <span>{selectedJob?.title} <span className="text-slate-400 font-normal">at {selectedClient?.name}</span></span>
                      {isNewlyLinked ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          <LinkIcon className="w-3 h-3" /> Will be newly linked on schedule
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          <Check className="w-3 h-3" /> Already linked
                        </span>
                      )}
                    </span>
                  </div>
                  
                  <div>
                    <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Round & Interviewer</span>
                    <span className="font-medium text-slate-800">{details.interviewType} (with {details.interviewerName})</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Mode</span>
                    <span className="font-medium text-slate-800 flex items-center gap-1.5">
                      {modeConfig.mode === 'Video' && <Video className="w-4 h-4"/>}
                      {modeConfig.mode === 'Phone' && <Phone className="w-4 h-4"/>}
                      {modeConfig.mode === 'In-person' && <Users className="w-4 h-4"/>}
                      {modeConfig.mode === 'Manual Link' && <LinkIcon className="w-4 h-4"/>}
                      {modeConfig.mode}
                    </span>
                  </div>

                  <div>
                    <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Date & Time</span>
                    <span className="font-medium text-slate-800">
                      {details.date} at {details.time} ({details.durationMinutes}m)
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Time Zone</span>
                    <span className="font-medium text-slate-800">{details.timezone}</span>
                  </div>
                </div>

                {modeConfig.mode === 'Manual Link' && (
                  <div className="pt-2 border-t border-slate-200">
                    <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Join URL</span>
                    <a href={modeConfig.meetingLink} target="_blank" rel="noreferrer" className="text-blue-600 font-medium break-all">{modeConfig.meetingLink}</a>
                  </div>
                )}
                {modeConfig.mode === 'In-person' && (
                  <div className="pt-2 border-t border-slate-200">
                    <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Location</span>
                    <span className="font-medium text-slate-800">{modeConfig.location}</span>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-bold mb-1">Notice: Calendar integration not connected.</p>
                  <p>SPC will record this interview and update the candidate's hiring stage to <span className="font-semibold">Interview Scheduled</span>, but <strong>calendar invitations will not be sent automatically</strong>.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-between bg-slate-50">
          <button
            onClick={step === 1 ? onClose : () => setStep(s => s - 1)}
            disabled={isScheduling}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </button>
          
          {step < 4 ? (
            <button
              onClick={handleNext}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Next Step
            </button>
          ) : (
            <button
              onClick={handleSchedule}
              disabled={isScheduling}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isScheduling ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Scheduling...
                </>
              ) : (
                'Schedule Interview'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
