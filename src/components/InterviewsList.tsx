import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Search, Video, Users, Phone, X, Calendar, Clock, 
  MapPin, User, Check, AlertCircle, Edit, Star, Eye, History, Plus, MoreHorizontal
} from 'lucide-react';
import { cn, formatDateTime, formatDate } from '../lib/utils';
import FilterPanel, { FilterField } from './FilterPanel';
import DateRangeFilter from './DateRangeFilter';
import { DatePreset, isDateInPreset } from '../lib/dateUtils';
import { Interview, InterviewStatus } from '../types';
import ScheduleInterviewModal from './ScheduleInterviewModal';

type SummaryTab = 'Upcoming' | 'Today' | 'Feedback Pending' | 'Overdue' | 'No Show' | 'Completed' | 'Cancelled' | 'All Interviews';

export default function InterviewsList() {
  const { 
    interviews, 
    candidates, 
    jobs, 
    clients,
    applications,
    submitInterviewFeedback, 
    rescheduleInterview, 
    updateInterviewStatus,
    markInterviewNoShow,
    cancelInterview,
    updateApplicationStage
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({ clientId: '', jobId: '', interviewerName: '', interviewType: '', roundName: '' });
  const [datePreset, setDatePreset] = useState<DatePreset>('All Time');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [activeTab, setActiveTab] = useState<SummaryTab>('Upcoming');

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  // Toast / notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Modals state
  const [activeModal, setActiveModal] = useState<'feedback' | 'view_feedback' | 'reschedule' | 'view_detail' | 'cancel' | 'no_show' | 'confirm_selection' | 'confirm_rejection' | null>(null);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [isEditingFeedback, setIsEditingFeedback] = useState(false);

  // Form states
  const [feedbackForm, setFeedbackForm] = useState({
    overallResult: '' as 'Strong Hire' | 'Hire' | 'Hold' | 'Reject' | '',
    overallRating: 3,
    strengths: '',
    concerns: '',
    feedbackNotes: '',
    recommendation: '' as 'Hire' | 'Hold' | 'Reject' | ''
  });
  const [feedbackError, setFeedbackError] = useState('');

  const [rescheduleForm, setRescheduleForm] = useState({
    date: '',
    time: '',
    durationMinutes: 45,
    interviewerName: '',
    mode: 'Video' as 'Phone' | 'Video' | 'In-person' | 'Manual Link',
    meetingLink: '',
    rescheduleReason: ''
  });
  const [rescheduleError, setRescheduleError] = useState('');

  const [cancelReason, setCancelReason] = useState('');
  
  const [noShowForm, setNoShowForm] = useState({ who: 'Candidate' as 'Candidate' | 'Interviewer' | 'Both', note: '' });
  const [rejectionReason, setRejectionReason] = useState('');

  const uniqueTypes = Array.from(new Set(interviews.map(i => i.interviewType))).filter(Boolean) as string[];
  const uniqueClients = Array.from(new Set(interviews.map(i => i.clientId))).map(id => clients.find(c => c.id === id)).filter(Boolean);
  const uniqueJobs = Array.from(new Set(interviews.map(i => i.jobId))).map(id => jobs.find(j => j.id === id)).filter(Boolean);
  const uniqueInterviewers = Array.from(new Set(interviews.map(i => i.interviewerName))).filter(Boolean) as string[];
  const uniqueRounds = Array.from(new Set(interviews.map(i => i.roundName))).filter(Boolean) as string[];

  const filterFields: FilterField[] = [
    { key: 'clientId', label: 'Client', options: uniqueClients.map(c => ({ value: c!.id, label: c!.name })) },
    { key: 'jobId', label: 'Job', options: uniqueJobs.map(j => ({ value: j!.id, label: j!.title })) },
    { key: 'interviewerName', label: 'Interviewer', options: uniqueInterviewers.map(i => ({ value: i, label: i })) },
    { key: 'interviewType', label: 'Interview Type', options: uniqueTypes.map(t => ({ value: t, label: t })) },
    { key: 'roundName', label: 'Interview Round', options: uniqueRounds.map(r => ({ value: r, label: r })) },
  ];

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // Map over interviews to derive precise status properties for UI
  const enrichedInterviews = useMemo(() => {
    return interviews.map(iv => {
      const start = new Date(iv.scheduledAt);
      const end = new Date(start.getTime() + iv.durationMinutes * 60000);
      let derivedStatus = iv.status;
      let isOverdue = false;

      if (iv.status === 'Scheduled' && end < now) {
        isOverdue = true;
      }

      return {
        ...iv,
        start,
        end,
        isOverdue,
        derivedDisplayStatus: isOverdue ? 'Overdue' : iv.status
      };
    });
  }, [interviews, now]);

  const summaryCounts = useMemo(() => {
    return {
      'Upcoming': enrichedInterviews.filter(iv => iv.status === 'Scheduled' && !iv.isOverdue && iv.start > now && !iv.scheduledAt.startsWith(todayStr)).length,
      'Today': enrichedInterviews.filter(iv => iv.status === 'Scheduled' && iv.scheduledAt.startsWith(todayStr)).length,
      'Feedback Pending': enrichedInterviews.filter(iv => iv.status === 'Completed' && iv.feedbackStatus !== 'Submitted').length,
      'Overdue': enrichedInterviews.filter(iv => iv.isOverdue && iv.status === 'Scheduled').length,
      'No Show': enrichedInterviews.filter(iv => iv.status === 'No Show').length,
      'Completed': enrichedInterviews.filter(iv => iv.status === 'Completed').length,
      'Cancelled': enrichedInterviews.filter(iv => iv.status === 'Cancelled').length,
      'All Interviews': enrichedInterviews.length,
    };
  }, [enrichedInterviews, now, todayStr]);

  const filtered = enrichedInterviews.filter(iv => {
    const candidate = candidates.find(c => c.id === iv.candidateId);
    const job = jobs.find(j => j.id === iv.jobId);
    const client = clients.find(c => c.id === iv.clientId);

    const matchSearch = !searchTerm || 
      candidate?.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      job?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      iv.interviewerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      iv.interviewType.toLowerCase().includes(searchTerm.toLowerCase());

    const matchClient = !filters.clientId || iv.clientId === filters.clientId;
    const matchJob = !filters.jobId || iv.jobId === filters.jobId;
    const matchInterviewer = !filters.interviewerName || iv.interviewerName === filters.interviewerName;
    const matchType = !filters.interviewType || iv.interviewType === filters.interviewType;
    const matchRound = !filters.roundName || iv.roundName === filters.roundName;
    
    const matchDate = isDateInPreset(iv.scheduledAt, datePreset, customStart, customEnd);

    let matchTab = true;
    switch(activeTab) {
      case 'Upcoming': matchTab = iv.status === 'Scheduled' && !iv.isOverdue && iv.start > now && !iv.scheduledAt.startsWith(todayStr); break;
      case 'Today': matchTab = iv.status === 'Scheduled' && iv.scheduledAt.startsWith(todayStr); break;
      case 'Feedback Pending': matchTab = iv.status === 'Completed' && iv.feedbackStatus !== 'Submitted'; break;
      case 'Overdue': matchTab = iv.isOverdue && iv.status === 'Scheduled'; break;
      case 'No Show': matchTab = iv.status === 'No Show'; break;
      case 'Completed': matchTab = iv.status === 'Completed'; break;
      case 'Cancelled': matchTab = iv.status === 'Cancelled'; break;
      default: matchTab = true;
    }

    return matchSearch && matchClient && matchJob && matchInterviewer && matchType && matchRound && matchDate && matchTab;
  }).sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  const activeFiltersCount = Object.values(filters).filter(Boolean).length + (datePreset !== 'All Time' ? 1 : 0);

  // Handlers
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
      recommendation: feedbackForm.recommendation,
      feedbackStatus: 'Submitted'
    });

    triggerToast(isEditingFeedback ? 'Interview feedback updated successfully!' : 'Interview feedback submitted successfully!');
    setActiveModal(null);
    setSelectedInterview(null);
    setIsEditingFeedback(false);
  };

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

  const openViewFeedbackModal = (interview: Interview) => {
    setSelectedInterview(interview);
    setActiveModal('view_feedback');
  };

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
      rescheduleReason: ''
    });
    setRescheduleError('');
    setActiveModal('reschedule');
  };

  const handleRescheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInterview) return;

    if (!rescheduleForm.date || !rescheduleForm.time) {
      setRescheduleError('Date and Time are required.');
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
      rescheduleReason: rescheduleForm.rescheduleReason.trim(),
      rescheduledAt: new Date().toISOString()
    });

    triggerToast('Interview rescheduled successfully!');
    setActiveModal(null);
    setSelectedInterview(null);
  };

  const handleStatusChange = (interviewId: string, status: InterviewStatus) => {
    updateInterviewStatus(interviewId, status);
    triggerToast(`Interview marked as ${status}`);
    if (selectedInterview && selectedInterview.id === interviewId) {
      setSelectedInterview(null);
      setActiveModal(null);
    }
  };

  const handleCancelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInterview) return;
    if (!cancelReason.trim()) return;
    cancelInterview(selectedInterview.id, cancelReason.trim());
    triggerToast('Interview cancelled.');
    setActiveModal(null);
    setSelectedInterview(null);
  };

  const handleNoShowSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInterview) return;
    markInterviewNoShow(selectedInterview.id, noShowForm.who, noShowForm.note);
    triggerToast('Interview marked as No Show.');
    setActiveModal(null);
    setSelectedInterview(null);
  };

  const handleConfirmSelection = () => {
    if (!selectedInterview) return;
    updateApplicationStage(selectedInterview.applicationId, 'Selected');
    triggerToast('Candidate selected for the job.');
    setActiveModal(null);
    setSelectedInterview(null);
  };

  const handleConfirmRejection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInterview) return;
    updateApplicationStage(selectedInterview.applicationId, 'Rejected', undefined, rejectionReason);
    triggerToast('Candidate rejected.');
    setActiveModal(null);
    setSelectedInterview(null);
  };

  const handleScheduleNextRound = (interview: Interview) => {
    setSelectedInterview(interview);
    setIsScheduleModalOpen(true);
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

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Interviews</h1>
          <p className="text-slate-600 mt-1">Schedule and manage Candidate interviews across active Jobs and Clients.</p>
        </div>
        <button 
          onClick={() => setIsScheduleModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
        >
          <Calendar className="w-4 h-4" />
          <Plus className="w-4 h-4 -ml-1" />
          Schedule Interview
        </button>
      </div>

      {/* Summary Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
        {(Object.keys(summaryCounts) as SummaryTab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-colors border",
              activeTab === tab
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            )}
          >
            {tab} <span className={cn(
              "ml-1.5 px-1.5 py-0.5 rounded text-xs",
              activeTab === tab ? "bg-blue-200 text-blue-800" : "bg-slate-100 text-slate-500"
            )}>{summaryCounts[tab]}</span>
          </button>
        ))}
      </div>

      {/* Filters */}
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
              setFilters({ clientId: '', jobId: '', interviewerName: '', interviewType: '', roundName: '' });
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
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-h-[400px]">
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
                        {interview.roundName} • {interview.mode === 'Video' ? <Video className="w-3.5 h-3.5" /> : 
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
                      <div className="text-xs text-slate-500 mt-1">{interview.durationMinutes} mins • {interview.timezone || 'Local'}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {interview.interviewerName}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        <span className={cn(
                          "inline-flex items-center w-fit px-2.5 py-0.5 rounded text-xs font-medium border",
                          interview.derivedDisplayStatus === 'Completed' ? "bg-green-50 text-green-700 border-green-200" :
                          interview.derivedDisplayStatus === 'Scheduled' ? "bg-blue-50 text-blue-700 border-blue-200" :
                          interview.derivedDisplayStatus === 'Overdue' ? "bg-amber-50 text-amber-700 border-amber-200" :
                          interview.derivedDisplayStatus === 'No Show' ? "bg-red-50 text-red-700 border-red-200" :
                          "bg-slate-50 text-slate-600 border-slate-200"
                        )}>
                          {interview.derivedDisplayStatus}
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
                      <div className="flex gap-2 justify-end items-center">
                        <button 
                          onClick={() => {
                            setSelectedInterview(interview);
                            setActiveModal('view_detail');
                          }} 
                          className="text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 bg-white px-2.5 py-1 rounded shadow-sm"
                        >
                          View
                        </button>

                        {(interview.mode === 'Video' || interview.mode === 'Manual Link') && interview.meetingLink && interview.status === 'Scheduled' && (
                           <a 
                             href={interview.meetingLink}
                             target="_blank"
                             rel="noopener noreferrer"
                             className="text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 px-2.5 py-1 rounded shadow-sm flex items-center gap-1"
                           >
                             <Video className="w-3.5 h-3.5" /> Join
                           </a>
                        )}

                        {interview.status === 'Scheduled' && (
                           <button 
                             onClick={() => openRescheduleModal(interview)} 
                             className="text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 bg-white px-2.5 py-1 rounded shadow-sm"
                           >
                             Reschedule
                           </button>
                        )}
                        
                        {interview.isOverdue && (
                           <button 
                             onClick={() => handleStatusChange(interview.id, 'Completed')} 
                             className="text-xs font-medium text-white bg-green-600 hover:bg-green-700 px-2.5 py-1 rounded shadow-sm"
                           >
                             Mark Completed
                           </button>
                        )}

                        {interview.status === 'Completed' && interview.feedbackStatus !== 'Submitted' && (
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

                        <div className="relative group">
                           <button className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600">
                             <MoreHorizontal className="w-4 h-4" />
                           </button>
                           <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 py-1 flex flex-col">
                              {interview.status === 'Scheduled' && (
                                <button 
                                  onClick={() => { setSelectedInterview(interview); setCancelReason(''); setActiveModal('cancel'); }}
                                  className="w-full block text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 font-medium"
                                >
                                  Cancel Interview
                                </button>
                              )}
                              {(interview.status === 'Scheduled' || interview.isOverdue) && (
                                <button 
                                  onClick={() => { setSelectedInterview(interview); setNoShowForm({ who: 'Candidate', note: '' }); setActiveModal('no_show'); }}
                                  className="w-full block text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
                                >
                                  Mark No-Show
                                </button>
                              )}
                              <button 
                                onClick={() => { setSelectedInterview(interview); setActiveModal('view_detail'); }}
                                className="w-full block text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
                              >
                                View History
                              </button>
                           </div>
                        </div>
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
              <button onClick={() => setActiveModal(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleFeedbackSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              {feedbackError && <div className="text-red-700 text-sm bg-red-50 p-3 rounded-lg">{feedbackError}</div>}
              {/* Form fields identical to original */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Overall Result Recommendation *</label>
                  <select required value={feedbackForm.overallResult} onChange={e => setFeedbackForm({...feedbackForm, overallResult: e.target.value as any})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
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
                      <button key={star} type="button" onClick={() => setFeedbackForm({...feedbackForm, overallRating: star})} className="focus:outline-none">
                        <Star className={cn("w-6 h-6", feedbackForm.overallRating >= star ? "text-amber-400 fill-amber-400" : "text-slate-300")} />
                      </button>
                    ))}
                    <span className="text-xs font-semibold text-slate-500 ml-2">({feedbackForm.overallRating}/5)</span>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <textarea rows={2} value={feedbackForm.strengths} onChange={e => setFeedbackForm({...feedbackForm, strengths: e.target.value})} placeholder="Candidate strengths..." className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm resize-none" />
                <textarea rows={2} value={feedbackForm.concerns} onChange={e => setFeedbackForm({...feedbackForm, concerns: e.target.value})} placeholder="Potential concerns..." className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm resize-none" />
                <textarea rows={3} required value={feedbackForm.feedbackNotes} onChange={e => setFeedbackForm({...feedbackForm, feedbackNotes: e.target.value})} placeholder="Detailed assessment notes... *" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm resize-none" />
                <select required value={feedbackForm.recommendation} onChange={e => setFeedbackForm({...feedbackForm, recommendation: e.target.value as any})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                  <option value="">Select action recommendation...</option>
                  <option value="Hire">Proceed to Offer</option>
                  <option value="Hold">Keep in Pipeline / Hold</option>
                  <option value="Reject">Reject Application</option>
                </select>
              </div>
              <div className="pt-4 border-t flex justify-end gap-3 bg-white sticky bottom-0">
                <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW FEEDBACK MODAL (READ ONLY) */}
      {activeModal === 'view_feedback' && selectedInterview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between">
              <h2 className="text-lg font-bold text-slate-800">Interview Feedback Summary</h2>
              <button onClick={() => setActiveModal(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="space-y-4 text-sm">
                <p><strong>Result:</strong> {selectedInterview.overallResult}</p>
                <p><strong>Rating:</strong> {selectedInterview.overallRating}/5</p>
                <p><strong>Notes:</strong> {selectedInterview.feedbackNotes}</p>
              </div>
              <div className="flex flex-col gap-3 border-t pt-4">
                {selectedInterview.recommendation === 'Hold' && (
                  <div className="flex flex-wrap gap-2 justify-center mb-2">
                    <button onClick={() => handleScheduleNextRound(selectedInterview)} className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm">Schedule Next Round</button>
                    <button onClick={() => setActiveModal('confirm_selection')} className="px-4 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-sm">Confirm Selection</button>
                    <button onClick={() => setActiveModal('confirm_rejection')} className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm">Confirm Rejection</button>
                  </div>
                )}
                {selectedInterview.recommendation === 'Hire' && (
                  <div className="flex flex-wrap gap-2 justify-center mb-2">
                    <button onClick={() => setActiveModal('confirm_selection')} className="px-4 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-sm">Confirm Selection</button>
                    <button onClick={() => handleScheduleNextRound(selectedInterview)} className="px-4 py-2 text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg shadow-sm">Schedule Next Round Instead</button>
                  </div>
                )}
                {selectedInterview.recommendation === 'Reject' && (
                  <div className="flex flex-wrap gap-2 justify-center mb-2">
                    <button onClick={() => setActiveModal('confirm_rejection')} className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm">Confirm Rejection</button>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <button onClick={() => openFeedbackModal(selectedInterview, true)} className="px-4 py-2 text-sm border text-blue-600 border-blue-200 bg-blue-50 rounded-lg">Edit Feedback</button>
                  <button onClick={() => setActiveModal(null)} className="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50">Close</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RESCHEDULE MODAL */}
      {activeModal === 'reschedule' && selectedInterview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between">
              <h2 className="text-lg font-bold text-slate-800">Reschedule Interview</h2>
              <button onClick={() => setActiveModal(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleRescheduleSubmit} className="p-6 space-y-4 overflow-y-auto">
              {rescheduleError && <div className="text-red-700 text-sm bg-red-50 p-3 rounded-lg">{rescheduleError}</div>}
              <input type="date" required value={rescheduleForm.date} onChange={e => setRescheduleForm({...rescheduleForm, date: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <input type="time" required value={rescheduleForm.time} onChange={e => setRescheduleForm({...rescheduleForm, time: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <input type="number" required value={rescheduleForm.durationMinutes} onChange={e => setRescheduleForm({...rescheduleForm, durationMinutes: parseInt(e.target.value)})} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <input type="text" required value={rescheduleForm.interviewerName} onChange={e => setRescheduleForm({...rescheduleForm, interviewerName: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <select required value={rescheduleForm.mode} onChange={e => setRescheduleForm({...rescheduleForm, mode: e.target.value as any})} className="w-full px-3 py-2 border rounded-lg text-sm">
                <option value="Phone">Phone</option>
                <option value="Video">Video</option>
                <option value="In-person">In-person</option>
                <option value="Manual Link">Manual Link</option>
              </select>
              <textarea required rows={2} value={rescheduleForm.rescheduleReason} onChange={e => setRescheduleForm({...rescheduleForm, rescheduleReason: e.target.value})} placeholder="Reason for Rescheduling *" className="w-full px-3 py-2 border rounded-lg text-sm resize-none" />
              <div className="pt-4 border-t flex justify-end gap-3">
                <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg">Save Reschedule</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CANCEL MODAL */}
      {activeModal === 'cancel' && selectedInterview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between">
              <h2 className="text-lg font-bold text-red-600 flex items-center gap-2"><AlertCircle className="w-5 h-5"/> Cancel Interview</h2>
              <button onClick={() => setActiveModal(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCancelSubmit} className="p-6 space-y-4">
              <p className="text-sm text-slate-600">Are you sure you want to cancel the interview for <strong>{candidates.find(c => c.id === selectedInterview.candidateId)?.fullName}</strong>?</p>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Reason for Cancellation *</label>
                <textarea 
                  required
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Provide a reason..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm resize-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50">Keep Interview</button>
                <button type="submit" className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg">Confirm Cancellation</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL (VIEW DETAIL / HISTORY) */}
      {activeModal === 'view_detail' && selectedInterview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between">
              <h2 className="text-lg font-bold text-slate-800">Interview History</h2>
              <button onClick={() => setActiveModal(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="text-sm border border-slate-200 rounded-lg p-4 bg-slate-50">
                <div className="font-semibold text-slate-800 mb-2">Application Context</div>
                <div><strong>Candidate:</strong> {candidates.find(c => c.id === selectedInterview.candidateId)?.fullName}</div>
                <div><strong>Job:</strong> {jobs.find(j => j.id === selectedInterview.jobId)?.title}</div>
                <div><strong>Current Stage:</strong> {applications.find(a => a.id === selectedInterview.applicationId)?.currentStage}</div>
              </div>

              <div>
                <h3 className="font-semibold text-slate-800 mb-3 text-sm">All Rounds</h3>
                <div className="space-y-3">
                  {interviews
                    .filter(i => i.applicationId === selectedInterview.applicationId)
                    .sort((a, b) => (a.roundNumber || 0) - (b.roundNumber || 0))
                    .map(round => (
                      <div key={round.id} className={cn(
                        "p-4 border rounded-lg text-sm",
                        round.id === selectedInterview.id ? "border-blue-400 bg-blue-50/50 shadow-sm" : "border-slate-200 bg-white"
                      )}>
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-semibold text-slate-800">{round.roundName} - {round.interviewType}</div>
                          <span className={cn(
                            "inline-flex items-center w-fit px-2 py-0.5 rounded text-xs font-medium border",
                            round.status === 'Completed' ? "bg-green-50 text-green-700 border-green-200" :
                            round.status === 'Scheduled' ? "bg-blue-50 text-blue-700 border-blue-200" :
                            round.status === 'Cancelled' ? "bg-slate-100 text-slate-700 border-slate-300" :
                            "bg-red-50 text-red-700 border-red-200"
                          )}>
                            {round.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                          <div><strong>Date & Time:</strong> {formatDateTime(round.scheduledAt)} ({round.timezone || 'Local'})</div>
                          <div><strong>Interviewer:</strong> {round.interviewerName}</div>
                          <div><strong>Mode:</strong> {round.mode} - {round.provider || 'No provider'}</div>
                        </div>
                        {round.feedbackStatus === 'Submitted' && (
                          <div className="mt-3 pt-3 border-t border-slate-200 text-xs">
                            <div className="font-semibold text-slate-700 mb-1">Feedback</div>
                            <div><strong>Result:</strong> {round.overallResult} ({round.overallRating}/5)</div>
                            <div><strong>Recommendation:</strong> {round.recommendation}</div>
                          </div>
                        )}
                      </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <button onClick={() => setActiveModal(null)} className="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NO SHOW MODAL */}
      {activeModal === 'no_show' && selectedInterview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">Mark No-Show</h2>
              <button onClick={() => setActiveModal(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleNoShowSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Who did not attend? *</label>
                <select required value={noShowForm.who} onChange={e => setNoShowForm({...noShowForm, who: e.target.value as any})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                  <option value="Candidate">Candidate</option>
                  <option value="Interviewer">Interviewer</option>
                  <option value="Both">Both</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Optional Note</label>
                <textarea 
                  rows={3}
                  value={noShowForm.note}
                  onChange={(e) => setNoShowForm({...noShowForm, note: e.target.value})}
                  placeholder="Provide a note..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm resize-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg">Confirm No-Show</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM SELECTION MODAL */}
      {activeModal === 'confirm_selection' && selectedInterview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">Confirm Selection</h2>
              <button onClick={() => setActiveModal(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600">Are you sure you want to select <strong>{candidates.find(c => c.id === selectedInterview.candidateId)?.fullName}</strong> for the job <strong>{jobs.find(j => j.id === selectedInterview.jobId)?.title}</strong>?</p>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button onClick={() => setActiveModal(null)} className="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50">Cancel</button>
                <button onClick={handleConfirmSelection} className="px-4 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-lg">Confirm Selection</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM REJECTION MODAL */}
      {activeModal === 'confirm_rejection' && selectedInterview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between">
              <h2 className="text-lg font-bold text-red-600 flex items-center gap-2">Confirm Rejection</h2>
              <button onClick={() => setActiveModal(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleConfirmRejection} className="p-6 space-y-4">
              <p className="text-sm text-slate-600">Are you sure you want to reject <strong>{candidates.find(c => c.id === selectedInterview.candidateId)?.fullName}</strong>?</p>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Reason for Rejection *</label>
                <textarea 
                  required
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Provide a reason..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm resize-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg">Confirm Rejection</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Schedule Interview Modal */}
      <ScheduleInterviewModal 
        isOpen={isScheduleModalOpen}
        onClose={() => {
          setIsScheduleModalOpen(false);
          setSelectedInterview(null);
        }}
        initialCandidateId={selectedInterview?.candidateId}
        initialJobId={selectedInterview?.jobId}
      />
    </div>
  );
}
