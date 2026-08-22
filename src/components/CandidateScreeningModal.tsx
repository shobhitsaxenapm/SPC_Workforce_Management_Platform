import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { X, CheckCircle2, HelpCircle, AlertCircle, Clock, MapPin, Briefcase, GraduationCap, DollarSign, Target, FileText, MessageSquare, Copy } from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { ScreeningData } from '../types';
import RequestInformationModal from './RequestInformationModal';
import RecordResponseModal from './RecordResponseModal';

interface CandidateScreeningModalProps {
  applicationId: string;
  isOpen: boolean;
  onClose: () => void;
  onProceedToInterview?: () => void;
}

export default function CandidateScreeningModal({ applicationId, isOpen, onClose, onProceedToInterview }: CandidateScreeningModalProps) {
  const { applications, candidates, jobs, clients, updateApplicationStage, updateApplicationScreening, informationRequests, resolveInformationRequest, cancelInformationRequest, currentUser } = useApp();
  
  const application = applications.find(a => a.id === applicationId);
  const candidate = candidates.find(c => c.id === application?.candidateId);
  const job = jobs.find(j => j.id === application?.jobId);
  const client = clients.find(c => c.id === job?.clientId);

  const [formData, setFormData] = useState<Partial<ScreeningData>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProceeding, setIsProceeding] = useState(false);
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [attemptedProceed, setAttemptedProceed] = useState(false);
  const [showRequestInfoModal, setShowRequestInfoModal] = useState(false);
  const [showRecordResponseModal, setShowRecordResponseModal] = useState(false);

  const activeInfoRequest = informationRequests.find(r => r.applicationId === application?.id && (r.status === 'Draft' || r.status === 'Awaiting Response' || r.status === 'Response Received'));

  // Load existing screening data
  useEffect(() => {
    if (application?.screeningData) {
      setFormData(application.screeningData);
    } else {
      setFormData({
        status: 'Pending',
        candidateInterested: undefined,
        availabilityConfirmed: undefined,
        noticePeriodConfirmed: undefined,
        locationConfirmed: undefined,
        compensationConfirmed: undefined,
        minQualificationVerified: undefined,
        skillsReviewed: undefined,
        communicationNotes: '',
        recruiterNotes: ''
      });
    }
    setRejectMode(false);
    setRejectionReason('');
    setAttemptedProceed(false);
  }, [application, isOpen]);

  if (!isOpen || !application || !candidate || !job) return null;

  const isSourced = application.currentStage === 'Sourced';
  const isScreening = application.currentStage === 'Screening';

  const handleCheckboxChange = (field: keyof ScreeningData) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field] === true ? false : true
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleStartScreening = async () => {
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 600)); // Simulate API
    updateApplicationStage(application.id, 'Screening');
    updateApplicationScreening(application.id, { ...formData, status: 'Pending' });
    setIsProcessing(false);
    onClose();
  };

  const handleSaveScreening = async () => {
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 600));
    updateApplicationScreening(application.id, formData);
    setIsProcessing(false);
    onClose();
  };

  const handleRequestInfo = async () => {
    setShowRequestInfoModal(true);
  };

  const handleCopyRequestMessage = () => {
    if (activeInfoRequest) {
      navigator.clipboard.writeText(activeInfoRequest.candidateMessage);
    }
  };

  const handleProceedToInterview = async () => {
    if (activeInfoRequest) {
      setAttemptedProceed(true);
      return; // Validation error handled in UI
    }

    const requiredFields: (keyof ScreeningData)[] = [
      'candidateInterested', 'availabilityConfirmed', 'noticePeriodConfirmed',
      'locationConfirmed', 'compensationConfirmed', 'minQualificationVerified',
      'skillsReviewed'
    ];
    
    const isComplete = requiredFields.every(field => formData[field] === true);
    if (!isComplete) {
      setAttemptedProceed(true);
      alert("Complete the required screening checks before proceeding.");
      return;
    }

    setIsProceeding(true);
    await new Promise(r => setTimeout(r, 600));
    updateApplicationScreening(application.id, { ...formData, status: 'Passed' });
    if (application.currentStage === 'Applied' || application.currentStage === 'Sourced') {
      updateApplicationStage(application.id, 'Screening');
    }
    setIsProceeding(false);
    if (onProceedToInterview) {
      onProceedToInterview();
    }
    onClose();
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert("Please provide a rejection reason.");
      return;
    }
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 600));
    updateApplicationStage(application.id, 'Rejected', rejectionReason);
    updateApplicationScreening(application.id, { ...formData, status: 'Pending' });
    setIsProcessing(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Candidate Screening</h2>
            <div className="text-sm text-slate-500 mt-1 flex items-center gap-2">
              <span className="font-medium text-slate-700">{candidate.fullName}</span> 
              <span className="text-slate-300">•</span>
              <span>{job.title}</span>
              <span className="text-slate-300">•</span>
              <span>{client?.name}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Current Stage</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200 mt-1">
                {application.currentStage}
              </span>
            </div>
            {application.matchScore && (
              <div className="flex flex-col items-end border-l border-slate-200 pl-4">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Match Score</span>
                <span className="text-sm font-bold text-green-600 mt-1">{application.matchScore}%</span>
              </div>
            )}
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg ml-2">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50 flex flex-col md:flex-row gap-6">
          
          {/* Left Column: Summary */}
          <div className="w-full md:w-1/3 space-y-6">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-600" /> Compare Details
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                  <div className="text-xs text-slate-500 flex items-center gap-1.5 w-1/3"><MapPin className="w-3.5 h-3.5" /> Location</div>
                  <div className="text-xs font-medium text-slate-700 text-right">{candidate.currentLocation}</div>
                  <div className="text-xs text-slate-500 text-right w-1/3">{job.location}</div>
                </div>
                
                <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                  <div className="text-xs text-slate-500 flex items-center gap-1.5 w-1/3"><Briefcase className="w-3.5 h-3.5" /> Experience</div>
                  <div className="text-xs font-medium text-slate-700 text-right">{candidate.totalExperience}</div>
                  <div className="text-xs text-slate-500 text-right w-1/3">{job.experience}</div>
                </div>
                
                <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                  <div className="text-xs text-slate-500 flex items-center gap-1.5 w-1/3"><GraduationCap className="w-3.5 h-3.5" /> Qualification</div>
                  <div className="text-xs font-medium text-slate-700 text-right">{candidate.education}</div>
                  <div className="text-xs text-slate-500 text-right w-1/3">{job.education}</div>
                </div>

                <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                  <div className="text-xs text-slate-500 flex items-center gap-1.5 w-1/3"><DollarSign className="w-3.5 h-3.5" /> Comp.</div>
                  <div className="text-xs font-medium text-slate-700 text-right">{candidate.expectedSalary}</div>
                  <div className="text-xs text-slate-500 text-right w-1/3">{job.salaryRange}</div>
                </div>
                
                <div className="flex justify-between items-start">
                  <div className="text-xs text-slate-500 flex items-center gap-1.5 w-1/3"><Clock className="w-3.5 h-3.5" /> Notice</div>
                  <div className="text-xs font-medium text-slate-700 text-right">{candidate.noticePeriod}</div>
                  <div className="text-xs text-slate-500 text-right w-1/3">-</div>
                </div>
              </div>
            </div>

            {application.matchStrengths && application.matchStrengths.length > 0 && (
              <div className="bg-green-50 p-4 rounded-xl border border-green-100 space-y-2">
                <h4 className="text-xs font-semibold text-green-800 uppercase tracking-wider">Match Strengths</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  {application.matchStrengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-1.5"><CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" /> {s}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {application.matchGaps && application.matchGaps.length > 0 && (
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 space-y-2">
                <h4 className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Missing / Unverified</h4>
                <ul className="text-sm text-amber-700 space-y-1">
                  {application.matchGaps.map((s, i) => (
                    <li key={i} className="flex items-start gap-1.5"><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {s}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Right Column: Form */}
          <div className="w-full md:w-2/3 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-8">
            
            {!isScreening && !isSourced && (
               <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-sm text-blue-700 flex gap-2">
                 <AlertCircle className="w-5 h-5 shrink-0"/>
                 This candidate is currently at <strong>{application.currentStage}</strong> stage. You can still update screening notes.
               </div>
            )}

            <div>
              {activeInfoRequest ? (
                <div className="bg-white border-2 border-amber-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-amber-50 px-4 py-3 border-b border-amber-200 flex justify-between items-center">
                    <h3 className="font-semibold text-amber-800 flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Awaiting Candidate Information
                    </h3>
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
                      {activeInfoRequest.status}
                    </span>
                  </div>
                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Requested By</div>
                        <div className="font-medium text-slate-800">{activeInfoRequest.requestedBy === currentUser?.id ? 'You' : activeInfoRequest.requestedBy}</div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Requested On</div>
                        <div className="font-medium text-slate-800">{formatDate(activeInfoRequest.requestedAt)}</div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Communication</div>
                        <div className="font-medium text-slate-800">{activeInfoRequest.communicationMethod} <span className="text-slate-400 font-normal">({activeInfoRequest.communicationStatus})</span></div>
                      </div>
                      <div>
                         <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Due Date</div>
                        <div className="font-medium text-red-600">{formatDate(activeInfoRequest.dueDate)}</div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">Requested Questions</div>
                      <ul className="list-decimal pl-5 space-y-1 text-sm text-slate-700">
                        {activeInfoRequest.questions.map((q, i) => (
                          <li key={i}>{q}</li>
                        ))}
                      </ul>
                    </div>

                    {activeInfoRequest.internalNote && (
                      <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 text-sm">
                        <div className="text-yellow-800 font-semibold mb-1">Internal Note</div>
                        <div className="text-yellow-700">{activeInfoRequest.internalNote}</div>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100">
                      <button onClick={handleCopyRequestMessage} className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors">
                        <Copy className="w-4 h-4" /> Copy Message
                      </button>
                      <button onClick={() => setShowRecordResponseModal(true)} className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm">
                        <MessageSquare className="w-4 h-4" /> Record Response
                      </button>
                      <button onClick={() => resolveInformationRequest(activeInfoRequest.id)} className="px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg flex items-center gap-1.5 transition-colors ml-auto">
                        <CheckCircle2 className="w-4 h-4" /> Mark Resolved
                      </button>
                      <button onClick={() => {
                        const reason = prompt("Optional reason for cancelling request:");
                        if (reason !== null) cancelInformationRequest(activeInfoRequest.id, reason);
                      }} className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-1.5 transition-colors">
                         Cancel Request
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                    <CheckCircle2 className="w-5 h-5 text-blue-600" />
                    Verification Checklist
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { id: 'candidateInterested', label: 'Candidate Interested' },
                      { id: 'availabilityConfirmed', label: 'Availability Confirmed' },
                      { id: 'noticePeriodConfirmed', label: 'Notice Period Confirmed' },
                      { id: 'locationConfirmed', label: 'Location/Work-mode Compatible' },
                      { id: 'compensationConfirmed', label: 'Compensation Expected Confirmed' },
                      { id: 'minQualificationVerified', label: 'Minimum Qualification Verified' },
                      { id: 'skillsReviewed', label: 'Required Skills Reviewed' },
                    ].map(field => (
                      <label key={field.id} className={cn("flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all", formData[field.id as keyof ScreeningData] === true ? "bg-blue-50 border-blue-200" : attemptedProceed && !formData[field.id as keyof ScreeningData] ? "bg-red-50 border-red-200" : "bg-white border-slate-200 hover:bg-slate-50")}>
                        <input type="checkbox" checked={formData[field.id as keyof ScreeningData] === true} onChange={() => handleCheckboxChange(field.id as keyof ScreeningData)} className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                        <span className="text-sm font-medium text-slate-700">{field.label}</span>
                      </label>
                    ))}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2 mt-6">Screening Notes</label>
                    <textarea name="communicationNotes" value={formData.communicationNotes || ''} onChange={handleChange} rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="Notes on communication skills, professionalism, etc." />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2 mt-4">Recruiter Internal Notes</label>
                    <textarea name="recruiterNotes" value={formData.recruiterNotes || ''} onChange={handleChange} rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="Private notes, red flags, recommendations..." />
                  </div>
                </>
              )}
            </div>

            {rejectMode && (
              <div className="bg-red-50 p-4 rounded-xl border border-red-200 animate-fade-in">
                <label className="block text-sm font-semibold text-red-800 mb-2">Rejection Reason *</label>
                <textarea 
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm bg-white"
                  placeholder="Why is this candidate being rejected?"
                />
                <div className="flex justify-end gap-2 mt-3">
                  <button onClick={() => setRejectMode(false)} className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-red-100 rounded-lg transition-colors">Cancel</button>
                  <button onClick={handleReject} disabled={!rejectionReason.trim() || isProcessing} className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400 rounded-lg transition-colors flex items-center gap-2">
                    {isProcessing && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>}
                    Confirm Rejection
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between sticky bottom-0 z-10">
          <div className="flex items-center gap-2">
            {!rejectMode && (
              <button onClick={() => setRejectMode(true)} disabled={isProcessing || isProceeding} className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                Reject
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <button onClick={onClose} disabled={isProcessing || isProceeding} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm transition-colors">
              Close
            </button>
            
            {isSourced ? (
              <button 
                onClick={handleStartScreening} 
                disabled={isProcessing}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm transition-colors flex items-center gap-2 min-w-[140px] justify-center disabled:bg-blue-400"
              >
                {isProcessing ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Starting...</> : 'Start Screening'}
              </button>
            ) : (
              <>
                <button 
                  onClick={handleRequestInfo}
                  disabled={isProcessing || isProceeding}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm transition-colors flex items-center gap-2"
                >
                  <HelpCircle className="w-4 h-4" /> Request Information
                </button>
                <button 
                  onClick={handleSaveScreening}
                  disabled={isProcessing || isProceeding}
                  className="px-4 py-2 text-sm font-medium text-white bg-slate-800 rounded-lg hover:bg-slate-900 shadow-sm transition-colors flex items-center gap-2"
                >
                  {isProcessing && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>}
                  Save Screening
                </button>
                <button 
                  onClick={handleProceedToInterview}
                  disabled={isProcessing || isProceeding}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isProceeding ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving screening...
                    </>
                  ) : 'Proceed to Interview'}
                </button>
              </>
            )}
          </div>
        </div>
        
        {/* Render Proceed Validation Warning below footer if attempted */}
        {attemptedProceed && activeInfoRequest && (
           <div className="absolute bottom-20 left-0 right-0 mx-auto w-fit bg-red-600 text-white text-sm px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-20 animate-fade-in">
             <AlertCircle className="w-4 h-4" /> Resolve the outstanding candidate information request before proceeding to interview.
           </div>
        )}
      </div>

      <RequestInformationModal 
        isOpen={showRequestInfoModal} 
        onClose={() => setShowRequestInfoModal(false)}
        applicationId={application.id}
      />
      {activeInfoRequest && (
        <RecordResponseModal 
          isOpen={showRecordResponseModal}
          onClose={() => setShowRecordResponseModal(false)}
          request={activeInfoRequest}
        />
      )}
    </div>
  );
}
