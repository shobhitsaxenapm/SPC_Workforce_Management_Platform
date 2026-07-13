import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Search, Video, Users, Phone, X, Calendar, Clock, 
  MapPin, User, Check, AlertCircle, Edit, Star, Sparkles, Eye, History
} from 'lucide-react';
import { cn, formatDateTime, formatDate } from '../lib/utils';
import FilterPanel, { FilterField } from './FilterPanel';
import DateRangeFilter from './DateRangeFilter';
import { DatePreset, isDateInPreset } from '../lib/dateUtils';
import { Interview, InterviewStatus } from '../types';

export default function InterviewsList() {
  const { 
    interviews, 
    candidates, 
    jobs, 
    clients, 
    submitInterviewFeedback, 
    rescheduleInterview, 
    updateInterviewStatus 
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({ status: '', interviewType: '', mode: '' });
  const [datePreset, setDatePreset] = useState<DatePreset>('All Time');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Toast / notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Modals state
  const [activeModal, setActiveModal] = useState<'feedback' | 'view_feedback' | 'reschedule' | 'view_detail' | null>(null);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [isEditingFeedback, setIsEditingFeedback] = useState(false);

  // Form states
  // Feedback form
  const [feedbackForm, setFeedbackForm] = useState({
    overallResult: '' as 'Strong Hire' | 'Hire' | 'Hold' | 'Reject' | '',
    overallRating: 3,
    strengths: '',
    concerns: '',
    feedbackNotes: '',
    recommendation: '' as 'Hire' | 'Hold' | 'Reject' | ''
  });
  const [feedbackError, setFeedbackError] = useState('');

  // Reschedule form
  const [rescheduleForm, setRescheduleForm] = useState({
    date: '',
    time: '',
    durationMinutes: 45,
    interviewerName: '',
    mode: 'Video' as 'Phone' | 'Video' | 'In-person',
    meetingLink: '',
    rescheduleReason: ''
  });
  const [rescheduleError, setRescheduleError] = useState('');

  const uniqueTypes = Array.from(new Set(interviews.map(i => i.interviewType))).filter(Boolean) as string[];
  const filterFields: FilterField[] = [
    { key: 'status', label: 'Status', options: ['Scheduled', 'Completed', 'Cancelled', 'No Show'].map(s => ({ value: s, label: s })) },
    { key: 'interviewType', label: 'Type', options: uniqueTypes.map(t => ({ value: t, label: t })) },
    { key: 'mode', label: 'Mode', options: ['Phone', 'Video', 'In-person'].map(m => ({ value: m, label: m })) },
  ];

  const filtered = interviews.filter(iv => {
    const candidate = candidates.find(c => c.id === iv.candidateId);
    const job = jobs.find(j => j.id === iv.jobId);
    const client = clients.find(c => c.id === iv.clientId);

    const matchSearch = !searchTerm || 
      candidate?.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      job?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      iv.interviewerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      iv.interviewType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      iv.status.toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus = !filters.status || iv.status === filters.status;
    const matchType = !filters.interviewType || iv.interviewType === filters.interviewType;
    const matchMode = !filters.mode || iv.mode === filters.mode;
    const matchDate = isDateInPreset(iv.scheduledAt, datePreset, customStart, customEnd);

    return matchSearch && matchStatus && matchType && matchMode && matchDate;
  });

  const activeFiltersCount = Object.values(filters).filter(Boolean).length + (datePreset !== 'All Time' ? 1 : 0);

  // Submit Feedback Handler
  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInterview) return;

    if (!feedbackForm.overallResult) {
      setFeedbackError('Overall result recommendation is required.');
      return;
    }
    if (!feedbackForm.recommendation) {
      setFeedbackError('Action recommendation is required.');
      return;
    }
    if (!feedbackForm.feedbackNotes.trim()) {
      setFeedbackError('Interview notes and recommendations details are required.');
      return;
    }

    submitInterviewFeedback(selectedInterview.id, {
      overallResult: feedbackForm.overallResult,
      overallRating: feedbackForm.overallRating,
      strengths: feedbackForm.strengths.trim(),
      concerns: feedbackForm.concerns.trim(),
      feedbackNotes: feedbackForm.feedbackNotes.trim(),
      recommendation: feedbackForm.recommendation
    });

    triggerToast(isEditingFeedback ? 'Interview feedback updated successfully!' : 'Interview feedback submitted successfully!');
    setActiveModal(null);
    setSelectedInterview(null);
    setIsEditingFeedback(false);
  };

  // Open Feedback Modal
  const openFeedbackModal = (interview: Interview, isEdit = false) => {
    setSelectedInterview(interview);
    setFeedbackForm({
      overallResult: interview.overallResult || '',
      overallRating: interview.overallRating || 3,
      strengths: interview.strengths || '',
      concerns: interview.concerns || '',
      feedbackNotes: interview.feedbackNotes || '',
      recommendation: interview.recommendation || ''
    });
    setFeedbackError('');
    setIsEditingFeedback(isEdit);
    setActiveModal('feedback');
  };

  // Open View Feedback
  const openViewFeedbackModal = (interview: Interview) => {
    setSelectedInterview(interview);
    setActiveModal('view_feedback');
  };

  // Open Reschedule Modal
  const openRescheduleModal = (interview: Interview) => {
    setSelectedInterview(interview);
    const dateObj = new Date(interview.scheduledAt);
    const localDate = dateObj.getFullYear() + '-' + String(dateObj.getMonth() + 1).padStart(2, '0') + '-' + String(dateObj.getDate()).padStart(2, '0');
    const localTime = String(dateObj.getHours()).padStart(2, '0') + ':' + String(dateObj.getMinutes()).padStart(2, '0');

    setRescheduleForm({
      date: localDate,
      time: localTime,
      durationMinutes: interview.durationMinutes,
      interviewerName: interview.interviewerName,
      mode: interview.mode,
      meetingLink: interview.meetingLink || '',
      rescheduleReason: interview.rescheduleReason || ''
    });
    setRescheduleError('');
    setActiveModal('reschedule');
  };

  // Reschedule Submit Handler
  const handleRescheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInterview) return;

    if (!rescheduleForm.date) {
      setRescheduleError('Date is required.');
      return;
    }
    if (!rescheduleForm.time) {
      setRescheduleError('Time is required.');
      return;
    }
    if (rescheduleForm.durationMinutes <= 0) {
      setRescheduleError('Duration must be greater than zero.');
      return;
    }
    if (!rescheduleForm.interviewerName.trim()) {
      setRescheduleError('Interviewer name is required.');
      return;
    }
    if (!rescheduleForm.rescheduleReason.trim()) {
      setRescheduleError('Reschedule reason is required.');
      return;
    }

    const scheduledAt = new Date(`${rescheduleForm.date}T${rescheduleForm.time}:00`).toISOString();

    rescheduleInterview(selectedInterview.id, {
      scheduledAt,
      durationMinutes: rescheduleForm.durationMinutes,
      interviewerName: rescheduleForm.interviewerName.trim(),
      mode: rescheduleForm.mode,
      meetingLink: rescheduleForm.meetingLink.trim(),
      rescheduleReason: rescheduleForm.rescheduleReason.trim()
    });

    triggerToast('Interview rescheduled successfully!');
    setActiveModal(null);
    setSelectedInterview(null);
  };

  // Change Status Handler
  const handleStatusChange = (interviewId: string, status: InterviewStatus) => {
    updateInterviewStatus(interviewId, status);
    triggerToast(`Interview status updated to ${status}`);
    
    // Sync the selected interview modal context if open
    if (selectedInterview && selectedInterview.id === interviewId) {
      setSelectedInterview(prev => prev ? { ...prev, status } : null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 bg-slate-900 text-white rounded-xl shadow-lg border border-slate-800 animate-slide-in text-sm font-medium">
          <Check className="w-4 h-4 text-green-400" />
          {toast.message}
        </div>
      )}

      <div className="flex justify-between items-center">
        <p className="text-slate-600">Monitor scheduled, completed, overdue, and no-show interviews across client deployments.</p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search interviews..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
            />
          </div>
          <DateRangeFilter
            preset={datePreset}
            customStart={customStart}
            customEnd={customEnd}
            onChange={(preset, start, end) => {
              setDatePreset(preset);
              setCustomStart(start);
              setCustomEnd(end);
            }}
          />
          <FilterPanel
            fields={filterFields}
            values={filters}
            onChange={(k, v) => setFilters({ ...filters, [k]: v })}
            onClear={() => {
              setFilters({ status: '', interviewType: '', mode: '' });
              setDatePreset('All Time');
              setCustomStart('');
              setCustomEnd('');
            }}
          />
          {activeFiltersCount > 0 && (
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
              {activeFiltersCount} Filter{activeFiltersCount > 1 ? 's' : ''} Active
            </span>
          )}
        </div>

        {datePreset !== 'All Time' && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              Scheduled Date: {datePreset === 'Custom' ? `${customStart || 'Any'} to ${customEnd || 'Any'}` : datePreset}
              <button 
                onClick={() => {
                  setDatePreset('All Time');
                  setCustomStart('');
                  setCustomEnd('');
                }} 
                className="hover:text-blue-900 focus:outline-none"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
              <tr>
                <th className="px-6 py-4">Candidate & Role</th>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Date & Time</th>
                <th className="px-6 py-4">Interviewer</th>
                <th className="px-6 py-4">Status & Feedback</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(interview => {
                const candidate = candidates.find(c => c.id === interview.candidateId);
                const job = jobs.find(j => j.id === interview.jobId);
                const client = clients.find(c => c.id === interview.clientId);
                
                return (
                  <tr key={interview.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{candidate?.fullName}</div>
                      <div className="text-xs text-slate-500 mt-1">{job?.title}</div>
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
                        {interview.mode === 'Video' ? <Video className="w-3.5 h-3.5" /> : 
                         interview.mode === 'Phone' ? <Phone className="w-3.5 h-3.5" /> : 
                         <Users className="w-3.5 h-3.5" />}
                        {interview.interviewType}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-700">{client?.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-700">{formatDateTime(interview.scheduledAt)}</div>
                      <div className="text-xs text-slate-500 mt-1">{interview.durationMinutes} mins</div>
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {interview.interviewerName}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        <span className={cn(
                          "inline-flex items-center w-fit px-2.5 py-0.5 rounded text-xs font-medium border",
                          interview.status === 'Completed' ? "bg-green-50 text-green-700 border-green-200" :
                          interview.status === 'Scheduled' ? "bg-blue-50 text-blue-700 border-blue-200" :
                          interview.status === 'No Show' ? "bg-red-50 text-red-700 border-red-200" :
                          interview.status === 'Cancelled' ? "bg-slate-50 text-slate-600 border-slate-200" :
                          "bg-slate-50 text-slate-700 border-slate-200"
                        )}>
                          {interview.status}
                        </span>
                        {interview.status === 'Completed' && (
                          <span className={cn(
                            "inline-flex w-fit px-2 py-0.5 text-[11px] font-medium rounded-full",
                            interview.feedbackStatus === 'Submitted' ? "bg-slate-100 text-slate-600" : "bg-amber-100 text-amber-700"
                          )}>
                            Feedback {interview.feedbackStatus}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <button 
                          onClick={() => {
                            setSelectedInterview(interview);
                            setActiveModal('view_detail');
                          }} 
                          className="text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 bg-white px-2.5 py-1 rounded flex items-center gap-1 shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </button>

                        {interview.status === 'Scheduled' && (
                          <button 
                            onClick={() => openRescheduleModal(interview)} 
                            className="text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 bg-white px-2.5 py-1 rounded shadow-sm"
                          >
                            Reschedule
                          </button>
                        )}
                        {interview.status === 'Completed' && interview.feedbackStatus === 'Pending' && (
                          <button 
                            onClick={() => openFeedbackModal(interview)} 
                            className="text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 px-2.5 py-1 rounded shadow-sm"
                          >
                            Submit Feedback
                          </button>
                        )}
                        {interview.status === 'Completed' && interview.feedbackStatus === 'Submitted' && (
                          <button 
                            onClick={() => openViewFeedbackModal(interview)} 
                            className="text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 bg-white px-2.5 py-1 rounded shadow-sm"
                          >
                            View Feedback
                          </button>
                        )}
                        {interview.status === 'No Show' && (
                          <button 
                            onClick={() => openRescheduleModal(interview)} 
                            className="text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 bg-white px-2.5 py-1 rounded shadow-sm"
                          >
                            Reschedule
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No interviews found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FEEDBACK MODAL (SUBMIT / EDIT) */}
      {activeModal === 'feedback' && selectedInterview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">
                {isEditingFeedback ? 'Edit Interview Feedback' : 'Submit Interview Feedback'}
              </h2>
              <button 
                onClick={() => { setActiveModal(null); setSelectedInterview(null); }} 
                className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleFeedbackSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              {feedbackError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {feedbackError}
                </div>
              )}

              {/* Context Summary */}
              <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 grid grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-4 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Candidate</span>
                  <span className="font-semibold text-slate-700">
                    {candidates.find(c => c.id === selectedInterview.candidateId)?.fullName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Role</span>
                  <span className="font-semibold text-slate-700">
                    {jobs.find(j => j.id === selectedInterview.jobId)?.title}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Client</span>
                  <span className="font-semibold text-slate-700">
                    {clients.find(c => c.id === selectedInterview.clientId)?.name}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Type</span>
                  <span className="font-semibold text-slate-700">{selectedInterview.interviewType}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Interviewer</span>
                  <span className="font-semibold text-slate-700">{selectedInterview.interviewerName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Date & Time</span>
                  <span className="font-semibold text-slate-700">{formatDateTime(selectedInterview.scheduledAt)}</span>
                </div>
              </div>

              {/* Decision Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Overall Result Recommendation *</label>
                  <select 
                    required 
                    value={feedbackForm.overallResult} 
                    onChange={e => setFeedbackForm({...feedbackForm, overallResult: e.target.value as any})} 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                  >
                    <option value="">Select recommendation...</option>
                    <option value="Strong Hire">Strong Hire</option>
                    <option value="Hire">Hire</option>
                    <option value="Hold">Hold</option>
                    <option value="Reject">Reject</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Rating (1 to 5) *</label>
                  <div className="flex items-center gap-1.5 mt-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFeedbackForm({...feedbackForm, overallRating: star})}
                        className="focus:outline-none"
                      >
                        <Star className={cn(
                          "w-6 h-6 transition-colors",
                          feedbackForm.overallRating >= star ? "text-amber-400 fill-amber-400" : "text-slate-300"
                        )} />
                      </button>
                    ))}
                    <span className="text-xs font-semibold text-slate-500 ml-2">({feedbackForm.overallRating}/5)</span>
                  </div>
                </div>
              </div>

              {/* Form Details */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Strengths</label>
                  <textarea 
                    rows={2} 
                    value={feedbackForm.strengths} 
                    onChange={e => setFeedbackForm({...feedbackForm, strengths: e.target.value})} 
                    placeholder="Candidate strengths..." 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Concerns</label>
                  <textarea 
                    rows={2} 
                    value={feedbackForm.concerns} 
                    onChange={e => setFeedbackForm({...feedbackForm, concerns: e.target.value})} 
                    placeholder="Potential concerns..." 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Notes / Action Details *</label>
                  <textarea 
                    rows={3} 
                    required
                    value={feedbackForm.feedbackNotes} 
                    onChange={e => setFeedbackForm({...feedbackForm, feedbackNotes: e.target.value})} 
                    placeholder="Detailed assessment notes..." 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Recommendation Action *</label>
                  <select 
                    required 
                    value={feedbackForm.recommendation} 
                    onChange={e => setFeedbackForm({...feedbackForm, recommendation: e.target.value as any})} 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                  >
                    <option value="">Select action recommendation...</option>
                    <option value="Hire">Proceed to Offer</option>
                    <option value="Hold">Keep in Pipeline / Hold</option>
                    <option value="Reject">Reject Application</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 bg-white sticky bottom-0 z-10">
                <button 
                  type="button" 
                  onClick={() => { setActiveModal(null); setSelectedInterview(null); }}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {isEditingFeedback ? 'Save Changes' : 'Submit Feedback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW FEEDBACK MODAL (READ ONLY) */}
      {activeModal === 'view_feedback' && selectedInterview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">Interview Feedback Summary</h2>
              <button 
                onClick={() => { setActiveModal(null); setSelectedInterview(null); }} 
                className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Decision Badge */}
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200/60 rounded-xl p-4">
                <div>
                  <span className="text-xs text-slate-400 block mb-0.5">Interviewer Decision</span>
                  <span className={cn(
                    "text-sm font-bold",
                    selectedInterview.overallResult === 'Strong Hire' || selectedInterview.overallResult === 'Hire' ? "text-green-600" :
                    selectedInterview.overallResult === 'Hold' ? "text-amber-600" : "text-red-600"
                  )}>
                    {selectedInterview.overallResult || 'N/A'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block mb-0.5">Rating Given</span>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star key={star} className={cn(
                        "w-4 h-4",
                        (selectedInterview.overallRating || 0) >= star ? "text-amber-400 fill-amber-400" : "text-slate-200"
                      )} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Assessment details */}
              <div className="space-y-4">
                <div>
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">Strengths</span>
                  <div className="text-slate-700 text-sm bg-slate-50 p-3 rounded-lg border border-slate-100">
                    {selectedInterview.strengths || 'No strengths recorded.'}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">Concerns</span>
                  <div className="text-slate-700 text-sm bg-slate-50 p-3 rounded-lg border border-slate-100">
                    {selectedInterview.concerns || 'No concerns recorded.'}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">Detailed Notes & recommendations</span>
                  <div className="text-slate-700 text-sm bg-slate-50 p-3 rounded-lg border border-slate-100 whitespace-pre-wrap">
                    {selectedInterview.feedbackNotes || 'No notes available.'}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">System Recommendation Action</span>
                  <span className="text-sm font-semibold text-slate-700">
                    {selectedInterview.recommendation === 'Hire' ? 'Proceed to Offer' :
                     selectedInterview.recommendation === 'Hold' ? 'Hold' : 'Reject Application'}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-between gap-3 bg-white">
                <button 
                  onClick={() => openFeedbackModal(selectedInterview, true)}
                  className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1.5"
                >
                  <Edit className="w-4 h-4" /> Edit Feedback
                </button>
                <button 
                  onClick={() => { setActiveModal(null); setSelectedInterview(null); }}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RESCHEDULE MODAL */}
      {activeModal === 'reschedule' && selectedInterview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">Reschedule Interview</h2>
              <button 
                onClick={() => { setActiveModal(null); setSelectedInterview(null); }} 
                className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleRescheduleSubmit} className="p-6 space-y-4 overflow-y-auto">
              {rescheduleError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {rescheduleError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">New Date *</label>
                <input 
                  type="date" 
                  required 
                  value={rescheduleForm.date} 
                  onChange={e => setRescheduleForm({...rescheduleForm, date: e.target.value})} 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Start Time *</label>
                <input 
                  type="time" 
                  required 
                  value={rescheduleForm.time} 
                  onChange={e => setRescheduleForm({...rescheduleForm, time: e.target.value})} 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Duration (Minutes) *</label>
                <input 
                  type="number" 
                  min="1" 
                  required 
                  value={rescheduleForm.durationMinutes} 
                  onChange={e => setRescheduleForm({...rescheduleForm, durationMinutes: parseInt(e.target.value) || 0})} 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Interviewer Name *</label>
                <input 
                  type="text" 
                  required 
                  value={rescheduleForm.interviewerName} 
                  onChange={e => setRescheduleForm({...rescheduleForm, interviewerName: e.target.value})} 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Mode *</label>
                <select 
                  required 
                  value={rescheduleForm.mode} 
                  onChange={e => setRescheduleForm({...rescheduleForm, mode: e.target.value as any})} 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                >
                  <option value="Phone">Phone</option>
                  <option value="Video">Video</option>
                  <option value="In-person">In-person</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Meeting Link or Location</label>
                <input 
                  type="text" 
                  value={rescheduleForm.meetingLink} 
                  onChange={e => setRescheduleForm({...rescheduleForm, meetingLink: e.target.value})} 
                  placeholder="e.g. Teams link or Conference room"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Reason for Rescheduling *</label>
                <textarea 
                  rows={2} 
                  required
                  value={rescheduleForm.rescheduleReason} 
                  onChange={e => setRescheduleForm({...rescheduleForm, rescheduleReason: e.target.value})} 
                  placeholder="State the reason..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm resize-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => { setActiveModal(null); setSelectedInterview(null); }}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Reschedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL (VIEW DETAIL) */}
      {activeModal === 'view_detail' && selectedInterview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">Interview Details</h2>
              <button 
                onClick={() => { setActiveModal(null); setSelectedInterview(null); }} 
                className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                <div>
                  <span className="text-slate-400 block mb-0.5">Candidate Name</span>
                  <span className="font-semibold text-slate-800">
                    {candidates.find(c => c.id === selectedInterview.candidateId)?.fullName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Target Role / Job</span>
                  <span className="font-semibold text-slate-800">
                    {jobs.find(j => j.id === selectedInterview.jobId)?.title}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Client</span>
                  <span className="font-semibold text-slate-800">
                    {clients.find(c => c.id === selectedInterview.clientId)?.name}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Interview Type</span>
                  <span className="font-semibold text-slate-800">{selectedInterview.interviewType}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Scheduled Date & Time</span>
                  <span className="font-semibold text-slate-800">{formatDateTime(selectedInterview.scheduledAt)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Duration</span>
                  <span className="font-semibold text-slate-800">{selectedInterview.durationMinutes} minutes</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Interviewer</span>
                  <span className="font-semibold text-slate-800">{selectedInterview.interviewerName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Meeting Mode</span>
                  <span className="font-semibold text-slate-800">{selectedInterview.mode}</span>
                </div>
                {selectedInterview.meetingLink && (
                  <div className="col-span-2">
                    <span className="text-slate-400 block mb-0.5">Meeting Link or Location</span>
                    <a 
                      href={selectedInterview.meetingLink.startsWith('http') ? selectedInterview.meetingLink : '#'} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="font-semibold text-blue-600 hover:underline break-all"
                    >
                      {selectedInterview.meetingLink}
                    </a>
                  </div>
                )}
                <div>
                  <span className="text-slate-400 block mb-0.5">Status</span>
                  <span className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border",
                    selectedInterview.status === 'Completed' ? "bg-green-50 text-green-700 border-green-200" :
                    selectedInterview.status === 'Scheduled' ? "bg-blue-50 text-blue-700 border-blue-200" :
                    selectedInterview.status === 'No Show' ? "bg-red-50 text-red-700 border-red-200" :
                    "bg-slate-50 text-slate-600 border-slate-200"
                  )}>
                    {selectedInterview.status}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Feedback Status</span>
                  <span className="font-semibold text-slate-800">{selectedInterview.feedbackStatus}</span>
                </div>
              </div>

              {/* Reschedule Reason Timeline view */}
              {selectedInterview.rescheduleReason && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm flex items-start gap-2.5">
                  <History className="w-4 h-4 text-amber-600 mt-0.5" />
                  <div>
                    <span className="font-semibold text-amber-800 block mb-0.5">Rescheduled History Log</span>
                    <p className="text-amber-700 text-xs">{selectedInterview.rescheduleReason}</p>
                    {selectedInterview.rescheduledAt && (
                      <span className="text-[10px] text-amber-500 block mt-1">Logged on {formatDateTime(selectedInterview.rescheduledAt)}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Modal footer containing context-aware actions */}
              <div className="pt-6 border-t border-slate-100 flex flex-wrap gap-3 justify-between bg-white">
                <div className="flex gap-2">
                  {selectedInterview.status === 'Scheduled' && (
                    <>
                      <button 
                        onClick={() => handleStatusChange(selectedInterview.id, 'Completed')}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-sm"
                      >
                        Mark Completed
                      </button>
                      <button 
                        onClick={() => handleStatusChange(selectedInterview.id, 'No Show')}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg shadow-sm"
                      >
                        Mark No-Show
                      </button>
                      <button 
                        onClick={() => handleStatusChange(selectedInterview.id, 'Cancelled')}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
                
                <div className="flex gap-2 ml-auto">
                  {selectedInterview.status === 'Scheduled' && (
                    <button 
                      onClick={() => openRescheduleModal(selectedInterview)}
                      className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg"
                    >
                      Reschedule
                    </button>
                  )}
                  {selectedInterview.status === 'Completed' && selectedInterview.feedbackStatus === 'Pending' && (
                    <button 
                      onClick={() => openFeedbackModal(selectedInterview)}
                      className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                    >
                      Submit Feedback
                    </button>
                  )}
                  {selectedInterview.status === 'Completed' && selectedInterview.feedbackStatus === 'Submitted' && (
                    <button 
                      onClick={() => openViewFeedbackModal(selectedInterview)}
                      className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg"
                    >
                      View Feedback
                    </button>
                  )}
                  <button 
                    onClick={() => { setActiveModal(null); setSelectedInterview(null); }}
                    className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
