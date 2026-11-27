import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  Search, Video, Users, Phone, X, Calendar, Clock, 
  MapPin, User, Check, AlertCircle, Edit, Star, Eye, History, Plus, MoreHorizontal
} from 'lucide-react';
import { cn, formatDateTime, formatDate } from '../lib/utils';
import FilterPanel, { FilterField } from './FilterPanel';
import DateRangeFilter from './DateRangeFilter';
import { DatePreset, isDateInPreset } from '../lib/dateUtils';
import { Interview, InterviewStatus, InterviewActionRecommendation } from '../types';
import ScheduleInterviewModal from './ScheduleInterviewModal';
import { getInterviewFeedbackSummary, getInterviewEndTime, normalizeInterviewers } from '../lib/interviewUtils';
import InterviewHistoryDrawer from './InterviewHistoryDrawer';
import RecruiterOutcomeModal from './RecruiterOutcomeModal';
import Pagination from './Pagination';
import Toast from './Toast';
import { mockUsers } from '../data/mockData';

type SummaryTab = 'All Interviews' | 'Upcoming' | 'Today' | 'Feedback Pending' | 'Overdue' | 'Completed' | 'No Show' | 'Cancelled';

const SUMMARY_TABS: SummaryTab[] = [
  'All Interviews',
  'Upcoming',
  'Today',
  'Feedback Pending',
  'Overdue',
  'Completed',
  'No Show',
  'Cancelled',
];

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
    updateApplicationStage,
    sendFeedbackReminder
  } = useApp();

  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({
    clientId: '',
    jobId: '',
    interviewerName: '',
    assignedRecruiterId: '',
    mode: '',
    interviewType: '',
    recruiterOutcome: '',
    noShowWho: '',
  });
  const [datePreset, setDatePreset] = useState<DatePreset>('All Time');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [activeTab, setActiveTab] = useState<SummaryTab>('All Interviews');

  // Primary Quick Filters
  const [interviewStatusFilter, setInterviewStatusFilter] = useState<string>('All');
  const [roundFilter, setRoundFilter] = useState<string>('All');
  const [feedbackStatusFilter, setFeedbackStatusFilter] = useState<string>('All');

  const [historyDrawerAppId, setHistoryDrawerAppId] = useState<string | null>(null);
  const [historyDrawerInterviewId, setHistoryDrawerInterviewId] = useState<string | null>(null);
  const [selectedInterviewForOutcome, setSelectedInterviewForOutcome] = useState<Interview | null>(null);
  const [nextRoundToSchedule, setNextRoundToSchedule] = useState<number | undefined>(undefined);

  const openHistoryDrawer = (applicationId: string, interviewId?: string) => {
    setHistoryDrawerAppId(applicationId);
    setHistoryDrawerInterviewId(interviewId || null);
  };

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
    recommendation: '' as InterviewActionRecommendation | ''
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

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // Map over interviews to derive precise status, panelist list, and recruiter properties for UI & filtering
  const enrichedInterviews = useMemo(() => {
    return interviews.map(iv => {
      const start = new Date(iv.scheduledAt);
      const end = getInterviewEndTime(iv);
      const rawFbSummary = getInterviewFeedbackSummary(iv, now);
      const panelists = normalizeInterviewers(iv);
      const job = jobs.find(j => j.id === iv.jobId);
      const app = applications.find(a => a.id === iv.applicationId);
      const assignedRecruiterId = app?.assignedRecruiterId || job?.assignedRecruiterId || '';
      const isRescheduled = iv.status === 'Rescheduled' || Boolean(iv.rescheduledAt);
      let isOverdue = false;

      if ((iv.status === 'Scheduled' || iv.status === 'Rescheduled') && end < now) {
        isOverdue = true;
      }

      // Feedback becomes due only after the interview is marked Completed
      const isCompleted = iv.status === 'Completed';
      const fbSummary = isCompleted || rawFbSummary.submittedCount > 0
        ? rawFbSummary
        : {
            ...rawFbSummary,
            status: 'Not Due' as const,
            displayCount: isOverdue ? 'Not Due until completed' : 'Not Due',
            badgeText: isOverdue ? 'Not Due until completed' : 'Not Due'
          };

      return {
        ...iv,
        start,
        end,
        isOverdue,
        isRescheduled,
        fbSummary,
        panelists,
        assignedRecruiterId,
        derivedDisplayStatus: isOverdue ? 'Overdue' : iv.status
      };
    });
  }, [interviews, jobs, applications, now]);

  // Unique options derived from actual interviews + cascading Client -> Job logic
  const uniqueClients = useMemo(() => {
    const ids = Array.from(new Set(interviews.map(i => i.clientId)));
    return ids.map(id => clients.find(c => c.id === id)).filter(Boolean) as typeof clients;
  }, [interviews, clients]);

  const scopedJobs = useMemo(() => {
    const jobIds = Array.from(
      new Set(
        interviews
          .filter(i => !filters.clientId || i.clientId === filters.clientId)
          .map(i => i.jobId)
      )
    );
    return jobIds.map(id => jobs.find(j => j.id === id)).filter(Boolean) as typeof jobs;
  }, [interviews, jobs, filters.clientId]);

  const uniqueInterviewers = useMemo(() => {
    const names = new Set<string>();
    enrichedInterviews.forEach(iv => {
      if (iv.interviewerName) names.add(iv.interviewerName);
      iv.panelists.forEach(p => {
        if (p.name) names.add(p.name);
      });
    });
    return Array.from(names);
  }, [enrichedInterviews]);

  const uniqueRecruiters = useMemo(() => {
    const recIds = Array.from(new Set(enrichedInterviews.map(iv => iv.assignedRecruiterId).filter(Boolean)));
    return recIds
      .map(id => mockUsers.find(u => u.id === id))
      .filter(Boolean) as typeof mockUsers;
  }, [enrichedInterviews]);

  const uniqueTypes = useMemo(() => {
    return Array.from(new Set(interviews.map(i => i.interviewType).filter(Boolean))) as string[];
  }, [interviews]);

  const uniqueModes = useMemo(() => {
    const defaultModes = ['Video', 'In-person', 'Phone', 'Manual Link'];
    const dataModes = interviews.map(i => i.mode).filter(Boolean);
    return Array.from(new Set([...defaultModes, ...dataModes]));
  }, [interviews]);

  const filterFields: FilterField[] = useMemo(() => [
    {
      key: 'clientId',
      label: 'Client',
      options: uniqueClients.map(c => ({ value: c.id, label: c.name })),
    },
    {
      key: 'jobId',
      label: filters.clientId ? 'Job / Role (Selected Client)' : 'Job / Role',
      options: scopedJobs.map(j => ({ value: j.id, label: `${j.title} (${j.code})` })),
      getLabel: (draftVals) => draftVals.clientId ? 'Job / Role (Selected Client)' : 'Job / Role',
      getOptions: (draftVals) => {
        const jobIds = Array.from(
          new Set(
            interviews
              .filter(i => !draftVals.clientId || i.clientId === draftVals.clientId)
              .map(i => i.jobId)
          )
        );
        return jobIds
          .map(id => jobs.find(j => j.id === id))
          .filter(Boolean)
          .map(j => ({ value: j!.id, label: `${j!.title} (${j!.code})` }));
      },
    },
    {
      key: 'status',
      label: 'Interview Status',
      options: [
        { value: 'Scheduled', label: 'Scheduled' },
        { value: 'Rescheduled', label: 'Rescheduled' },
        { value: 'Overdue', label: 'Overdue (Action Needed)' },
        { value: 'Completed', label: 'Completed' },
        { value: 'No Show', label: 'No Show' },
        { value: 'Cancelled', label: 'Cancelled' },
      ],
    },
    {
      key: 'round',
      label: 'Interview Round',
      options: [
        { value: 'Round 1', label: 'Round 1' },
        { value: 'Round 2', label: 'Round 2' },
        { value: 'Round 3+', label: 'Round 3+' },
      ],
    },
    {
      key: 'feedbackStatus',
      label: 'Feedback Status',
      options: [
        { value: 'Not Due', label: 'Not Due' },
        { value: 'Pending', label: 'Pending' },
        { value: 'Partially Received', label: 'Partially Received' },
        { value: 'Received', label: 'Received' },
      ],
    },
    {
      key: 'datePreset',
      label: 'Schedule Date',
      options: [
        { value: 'Today', label: 'Today' },
        { value: 'Last 7 Days', label: 'Last 7 Days' },
        { value: 'Last 30 Days', label: 'Last 30 Days' },
        { value: 'This Month', label: 'This Month' },
        { value: 'Last Quarter', label: 'Last Quarter' },
      ],
    },
    {
      key: 'interviewerName',
      label: 'Interviewer / Panelist',
      options: uniqueInterviewers.map(i => ({ value: i, label: i })),
    },
    {
      key: 'assignedRecruiterId',
      label: 'Assigned Recruiter',
      options: uniqueRecruiters.map(u => ({ value: u.id, label: u.name })),
    },
    {
      key: 'mode',
      label: 'Interview Mode',
      options: uniqueModes.map(m => ({ value: m, label: m })),
    },
    {
      key: 'interviewType',
      label: 'Interview Type',
      options: uniqueTypes.map(t => ({ value: t, label: t })),
    },
    {
      key: 'recruiterOutcome',
      label: 'Recruiter Outcome',
      options: [
        { value: 'Pending Decision', label: 'Outcome Pending (Completed)' },
        { value: 'Next Round', label: 'Next Round' },
        { value: 'Selected', label: 'Selected' },
        { value: 'Rejected', label: 'Rejected' },
        { value: 'On Hold', label: 'On Hold' },
        { value: 'Additional Discussion Required', label: 'Discussion Required' },
      ],
    },
    {
      key: 'noShowWho',
      label: 'No-Show Party',
      options: [
        { value: 'Candidate', label: 'Candidate No-Show' },
        { value: 'Interviewer', label: 'Interviewer No-Show' },
        { value: 'Both', label: 'Both' },
      ],
    },
  ], [uniqueClients, filters.clientId, scopedJobs, uniqueInterviewers, uniqueRecruiters, uniqueModes, uniqueTypes]);

  // Permutation-safe state transitions so tabs and filters never conflict
  const handleTabSelect = (tab: SummaryTab) => {
    setActiveTab(tab);

    // Sync status filter with selected tab
    if (tab === 'Completed') {
      setInterviewStatusFilter('Completed');
    } else if (tab === 'No Show') {
      setInterviewStatusFilter('No Show');
    } else if (tab === 'Cancelled') {
      setInterviewStatusFilter('Cancelled');
    } else if (tab === 'Overdue') {
      setInterviewStatusFilter('Overdue');
    } else {
      setInterviewStatusFilter('All');
    }

    // Clear incompatible sub-filters to prevent impossible 0-result permutations
    setFilters(prev => {
      const next = { ...prev };
      if (tab !== 'No Show' && tab !== 'All Interviews') {
        next.noShowWho = '';
      }
      if (tab === 'Upcoming' || tab === 'Today' || tab === 'No Show' || tab === 'Cancelled') {
        next.recruiterOutcome = '';
      }
      return next;
    });

    if (tab === 'No Show' || tab === 'Cancelled') {
      setFeedbackStatusFilter('All');
    } else if ((tab === 'Upcoming' || tab === 'Today') && feedbackStatusFilter !== 'All' && feedbackStatusFilter !== 'Not Due') {
      setFeedbackStatusFilter('All');
    } else if (tab === 'Feedback Pending' && (feedbackStatusFilter === 'Not Due' || feedbackStatusFilter === 'Received')) {
      setFeedbackStatusFilter('All');
    } else if (tab === 'Completed' && feedbackStatusFilter === 'Not Due') {
      setFeedbackStatusFilter('All');
    }

    if (tab === 'Today' && datePreset !== 'All Time' && datePreset !== 'Today') {
      setDatePreset('All Time');
      setCustomStart('');
      setCustomEnd('');
    }
  };

  const handleStatusFilterChange = (status: string) => {
    setInterviewStatusFilter(status);
    if (status === 'Completed') {
      setActiveTab('Completed');
    } else if (status === 'No Show') {
      setActiveTab('No Show');
    } else if (status === 'Cancelled') {
      setActiveTab('Cancelled');
    } else if (status === 'Overdue') {
      setActiveTab('Overdue');
    } else {
      setActiveTab('All Interviews');
    }

    setFilters(prev => {
      const next = { ...prev };
      if (status !== 'No Show' && status !== 'All') {
        next.noShowWho = '';
      }
      if (status === 'No Show' || status === 'Cancelled' || status === 'Scheduled') {
        next.recruiterOutcome = '';
      }
      return next;
    });

    if (status === 'No Show' || status === 'Cancelled') {
      setFeedbackStatusFilter('All');
    }
  };

  const handleFeedbackFilterChange = (fbStatus: string) => {
    setFeedbackStatusFilter(fbStatus);
    if (fbStatus !== 'All') {
      if (
        activeTab === 'No Show' ||
        activeTab === 'Cancelled' ||
        ((activeTab === 'Upcoming' || activeTab === 'Today') && fbStatus !== 'Not Due') ||
        (activeTab === 'Feedback Pending' && (fbStatus === 'Not Due' || fbStatus === 'Received')) ||
        (activeTab === 'Completed' && fbStatus === 'Not Due')
      ) {
        setActiveTab('All Interviews');
      }
      if (interviewStatusFilter === 'No Show' || interviewStatusFilter === 'Cancelled') {
        setInterviewStatusFilter('All');
      }
      if (fbStatus === 'Received' || fbStatus === 'Partially Received') {
        setFilters(prev => ({ ...prev, noShowWho: '' }));
      }
    }
  };

  const handleClientFilterChange = (clientId: string) => {
    setFilters(prev => {
      const next = { ...prev, clientId };
      if (clientId && prev.jobId) {
        const selectedJob = jobs.find(j => j.id === prev.jobId);
        if (selectedJob && selectedJob.clientId !== clientId) {
          next.jobId = '';
        }
      }
      return next;
    });
  };

  const handleAdvancedFilterChange = (key: string, value: string) => {
    if (key === 'status') {
      handleStatusFilterChange(value || 'All');
      return;
    }
    if (key === 'clientId') {
      handleClientFilterChange(value);
      return;
    }
    if (key === 'round') {
      setRoundFilter(value || 'All');
      return;
    }
    if (key === 'feedbackStatus') {
      handleFeedbackFilterChange(value || 'All');
      return;
    }
    if (key === 'datePreset') {
      const nextPreset = (value || 'All Time') as DatePreset;
      setDatePreset(nextPreset);
      setCustomStart('');
      setCustomEnd('');
      if (nextPreset !== 'All Time' && (activeTab === 'Today' || activeTab === 'Upcoming')) {
        setActiveTab('All Interviews');
      }
      return;
    }

    setFilters(prev => {
      const next = { ...prev, [key]: value };

      // Cascading Job -> Client check
      if (key === 'jobId' && value) {
        const job = jobs.find(j => j.id === value);
        if (job && prev.clientId && prev.clientId !== job.clientId) {
          next.clientId = job.clientId;
        }
      }

      // Selecting a No-Show Party automatically switches to No Show status/tab
      if (key === 'noShowWho' && value) {
        setInterviewStatusFilter('No Show');
        setActiveTab('No Show');
        setFeedbackStatusFilter('All');
        next.recruiterOutcome = '';
      }

      // Selecting a Recruiter Outcome ensures status/tab allows completed/evaluated rounds
      if (key === 'recruiterOutcome' && value) {
        next.noShowWho = '';
        if (activeTab === 'Upcoming' || activeTab === 'Today' || activeTab === 'No Show' || activeTab === 'Cancelled') {
          setActiveTab('All Interviews');
        }
        if (interviewStatusFilter === 'No Show' || interviewStatusFilter === 'Cancelled' || interviewStatusFilter === 'Scheduled') {
          setInterviewStatusFilter('All');
        }
      }

      return next;
    });
  };

  const resetAllFilters = () => {
    setFilters({
      clientId: '',
      jobId: '',
      interviewerName: '',
      assignedRecruiterId: '',
      mode: '',
      interviewType: '',
      recruiterOutcome: '',
      noShowWho: '',
    });
    setDatePreset('All Time');
    setCustomStart('');
    setCustomEnd('');
    setInterviewStatusFilter('All');
    setRoundFilter('All');
    setFeedbackStatusFilter('All');
    setSearchTerm('');
    setActiveTab('All Interviews');
  };

  // Base contextual filter (Search + Client + Job + Interviewer + Recruiter + Round + Mode + Type + Date)
  // Used so Summary Tab counts reflect the user's active filter context!
  const contextFilteredInterviews = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return enrichedInterviews.filter(iv => {
      const candidate = candidates.find(c => c.id === iv.candidateId);
      const job = jobs.find(j => j.id === iv.jobId);
      const client = clients.find(c => c.id === iv.clientId);

      const matchSearch = !q ||
        candidate?.fullName.toLowerCase().includes(q) ||
        candidate?.code?.toLowerCase().includes(q) ||
        job?.title.toLowerCase().includes(q) ||
        job?.code?.toLowerCase().includes(q) ||
        client?.name.toLowerCase().includes(q) ||
        iv.interviewerName.toLowerCase().includes(q) ||
        iv.panelists.some(p => p.name.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q)) ||
        (iv.interviewType && iv.interviewType.toLowerCase().includes(q)) ||
        (iv.roundName && iv.roundName.toLowerCase().includes(q)) ||
        (iv.recruiterOutcome && iv.recruiterOutcome.toLowerCase().includes(q));

      const matchClient = !filters.clientId || iv.clientId === filters.clientId;
      const matchJob = !filters.jobId || iv.jobId === filters.jobId;
      const matchInterviewer = !filters.interviewerName ||
        iv.interviewerName === filters.interviewerName ||
        iv.panelists.some(p => p.name === filters.interviewerName);
      const matchRecruiter = !filters.assignedRecruiterId || iv.assignedRecruiterId === filters.assignedRecruiterId;
      const matchMode = !filters.mode || iv.mode === filters.mode;
      const matchType = !filters.interviewType || iv.interviewType === filters.interviewType;

      const matchRoundNumber = roundFilter === 'All' ||
        (roundFilter === 'Round 1' && (iv.roundNumber === 1 || (!iv.roundNumber && iv.roundName === 'Round 1') || !iv.roundNumber)) ||
        (roundFilter === 'Round 2' && (iv.roundNumber === 2 || iv.roundName === 'Round 2')) ||
        (roundFilter === 'Round 3+' && ((iv.roundNumber || 0) >= 3));

      // Support both prototype dataset reference date and live system date
      const matchDate = datePreset === 'All Time' ||
        isDateInPreset(iv.scheduledAt, datePreset, customStart, customEnd) ||
        isDateInPreset(iv.scheduledAt, datePreset, customStart, customEnd, now);

      return matchSearch && matchClient && matchJob && matchInterviewer && matchRecruiter && matchMode && matchType && matchRoundNumber && matchDate;
    });
  }, [enrichedInterviews, candidates, jobs, clients, searchTerm, filters, roundFilter, datePreset, customStart, customEnd, now]);

  const matchesTabRule = (iv: typeof enrichedInterviews[number], tab: SummaryTab) => {
    switch (tab) {
      case 'Upcoming':
        return (iv.status === 'Scheduled' || iv.status === 'Rescheduled') && !iv.isOverdue && iv.start > now;
      case 'Today':
        return (iv.status === 'Scheduled' || iv.status === 'Rescheduled') && iv.scheduledAt.startsWith(todayStr);
      case 'Feedback Pending':
        return iv.status === 'Completed' && (iv.fbSummary.status === 'Pending' || iv.fbSummary.status === 'Partially Received');
      case 'Overdue':
        return iv.isOverdue && (iv.status === 'Scheduled' || iv.status === 'Rescheduled');
      case 'No Show':
        return iv.status === 'No Show';
      case 'Completed':
        return iv.status === 'Completed';
      case 'Cancelled':
        return iv.status === 'Cancelled';
      case 'All Interviews':
      default:
        return true;
    }
  };

  const summaryCounts = useMemo(() => {
    const counts = {} as Record<SummaryTab, number>;
    SUMMARY_TABS.forEach(tab => {
      counts[tab] = contextFilteredInterviews.filter(iv => matchesTabRule(iv, tab)).length;
    });
    return counts;
  }, [contextFilteredInterviews, now, todayStr]);

  const filtered = useMemo(() => {
    return contextFilteredInterviews.filter(iv => {
      const matchStatus =
        interviewStatusFilter === 'All' ||
        (interviewStatusFilter === 'Overdue' ? iv.isOverdue :
         interviewStatusFilter === 'Rescheduled' ? iv.isRescheduled :
         iv.status === interviewStatusFilter);

      const matchFeedbackStatus = feedbackStatusFilter === 'All' || iv.fbSummary.status === feedbackStatusFilter;

      const matchNoShow = !filters.noShowWho ||
        (iv.status === 'No Show' && (iv.noShowWho === filters.noShowWho || (!iv.noShowWho && filters.noShowWho === 'Candidate')));

      const matchOutcome = !filters.recruiterOutcome ||
        (iv.status === 'Completed' && (
          filters.recruiterOutcome === 'Pending Decision'
            ? !iv.recruiterOutcome
            : iv.recruiterOutcome === filters.recruiterOutcome
        ));

      const matchTab = matchesTabRule(iv, activeTab);

      return matchStatus && matchFeedbackStatus && matchNoShow && matchOutcome && matchTab;
    }).sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
  }, [contextFilteredInterviews, interviewStatusFilter, feedbackStatusFilter, filters.noShowWho, filters.recruiterOutcome, activeTab, now, todayStr]);

  // Pagination state (10 interviews per page)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters, activeTab, interviewStatusFilter, roundFilter, feedbackStatusFilter, datePreset, customStart, customEnd]);

  const paginatedInterviews = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);

  // Values passed into FilterPanel (all filters unified inside Filters button)
  const filterPanelValues = useMemo(() => ({
    clientId: filters.clientId,
    jobId: filters.jobId,
    status: interviewStatusFilter === 'All' ? '' : interviewStatusFilter,
    round: roundFilter === 'All' ? '' : roundFilter,
    feedbackStatus: feedbackStatusFilter === 'All' ? '' : feedbackStatusFilter,
    datePreset: datePreset === 'All Time' ? '' : datePreset,
    interviewerName: filters.interviewerName,
    assignedRecruiterId: filters.assignedRecruiterId,
    mode: filters.mode,
    interviewType: filters.interviewType,
    recruiterOutcome: filters.recruiterOutcome,
    noShowWho: filters.noShowWho,
  }), [filters, interviewStatusFilter, roundFilter, feedbackStatusFilter, datePreset]);

  // Build active filter pills for transparent one-click removal
  const activeFilterChips = useMemo(() => {
    const chips: { key: string; label: string; onRemove: () => void }[] = [];

    if (filters.clientId) {
      const cName = clients.find(c => c.id === filters.clientId)?.name || filters.clientId;
      chips.push({ key: 'clientId', label: `Client: ${cName}`, onRemove: () => handleClientFilterChange('') });
    }
    if (filters.jobId) {
      const jTitle = jobs.find(j => j.id === filters.jobId)?.title || filters.jobId;
      chips.push({ key: 'jobId', label: `Job: ${jTitle}`, onRemove: () => setFilters(prev => ({ ...prev, jobId: '' })) });
    }
    if (interviewStatusFilter !== 'All') {
      chips.push({
        key: 'status',
        label: `Status: ${interviewStatusFilter}`,
        onRemove: () => handleStatusFilterChange('All'),
      });
    }
    if (roundFilter !== 'All') {
      chips.push({ key: 'round', label: `Round: ${roundFilter}`, onRemove: () => setRoundFilter('All') });
    }
    if (feedbackStatusFilter !== 'All') {
      chips.push({ key: 'feedback', label: `Feedback: ${feedbackStatusFilter}`, onRemove: () => setFeedbackStatusFilter('All') });
    }
    if (filters.interviewerName) {
      chips.push({ key: 'interviewerName', label: `Interviewer: ${filters.interviewerName}`, onRemove: () => setFilters(prev => ({ ...prev, interviewerName: '' })) });
    }
    if (filters.assignedRecruiterId) {
      const rName = mockUsers.find(u => u.id === filters.assignedRecruiterId)?.name || filters.assignedRecruiterId;
      chips.push({ key: 'assignedRecruiterId', label: `Recruiter: ${rName}`, onRemove: () => setFilters(prev => ({ ...prev, assignedRecruiterId: '' })) });
    }
    if (filters.mode) {
      chips.push({ key: 'mode', label: `Mode: ${filters.mode}`, onRemove: () => setFilters(prev => ({ ...prev, mode: '' })) });
    }
    if (filters.interviewType) {
      chips.push({ key: 'interviewType', label: `Type: ${filters.interviewType}`, onRemove: () => setFilters(prev => ({ ...prev, interviewType: '' })) });
    }
    if (filters.recruiterOutcome) {
      chips.push({ key: 'recruiterOutcome', label: `Outcome: ${filters.recruiterOutcome}`, onRemove: () => setFilters(prev => ({ ...prev, recruiterOutcome: '' })) });
    }
    if (filters.noShowWho) {
      chips.push({ key: 'noShowWho', label: `No-Show: ${filters.noShowWho}`, onRemove: () => setFilters(prev => ({ ...prev, noShowWho: '' })) });
    }
    if (datePreset !== 'All Time') {
      const dateLabel = datePreset === 'Custom' ? `${customStart || 'Any'} to ${customEnd || 'Any'}` : datePreset;
      chips.push({
        key: 'datePreset',
        label: `Schedule Date: ${dateLabel}`,
        onRemove: () => {
          setDatePreset('All Time');
          setCustomStart('');
          setCustomEnd('');
        },
      });
    }

    return chips;
  }, [filters, interviewStatusFilter, roundFilter, feedbackStatusFilter, datePreset, customStart, customEnd, clients, jobs]);

  const activeFiltersCount = activeFilterChips.length + (searchTerm.trim() ? 1 : 0);

  // Handlers
  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInterview) return;

    if (!feedbackForm.overallResult) {
      setFeedbackError('Evaluation recommendation is required.');
      return;
    }
    if (!feedbackForm.recommendation) {
      setFeedbackError('Recommended next step is required.');
      return;
    }
    if (!feedbackForm.feedbackNotes.trim()) {
      setFeedbackError('Detailed assessment notes are required.');
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
    const candidate = candidates.find(c => c.id === selectedInterview.candidateId);
    const job = jobs.find(j => j.id === selectedInterview.jobId);

    updateApplicationStage(selectedInterview.applicationId, 'Selected');
    setActiveModal(null);
    setSelectedInterview(null);

    if (candidate && job) {
      navigate('/offers', {
        state: {
          candidateId: candidate.id,
          candidateName: candidate.fullName,
          jobId: job.id,
          jobTitle: job.title,
          clientId: job.clientId,
          projectId: job.projectId,
          applicationId: selectedInterview.applicationId
        }
      });
    } else {
      triggerToast('Candidate selected for the job.');
    }
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
      {/* Shared Toast Notification */}
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <p className="text-slate-600">Schedule and manage Candidate interviews across active Jobs and Clients.</p>
        <button 
          onClick={() => {
            setSelectedInterview(null);
            setNextRoundToSchedule(undefined);
            setIsScheduleModalOpen(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg font-medium hover:bg-blue-700 transition-all flex items-center gap-2 shadow-sm"
        >
          <Calendar className="w-4 h-4" />
          Schedule Interview
        </button>
      </div>

      {/* Summary Tabs (Workflow Queues) */}
      <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
        {SUMMARY_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => handleTabSelect(tab)}
            className={cn(
              "whitespace-nowrap px-3.5 py-2 rounded-lg text-sm font-medium transition-colors border flex items-center gap-1.5",
              activeTab === tab
                ? "bg-blue-50 text-blue-700 border-blue-200 shadow-2xs"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            )}
          >
            <span>{tab}</span>
            <span className={cn(
              "px-1.5 py-0.5 rounded text-xs font-semibold",
              activeTab === tab ? "bg-blue-200/80 text-blue-800" : "bg-slate-100 text-slate-500"
            )}>
              {summaryCounts[tab]}
            </span>
          </button>
        ))}
      </div>

      {/* Unified Search & Filters Toolbar (Consistent SPC Design Pattern) */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          {/* Search Input (Fixed generous width on sm+ screens, never stretches full card width on large screens) */}
          <div className="relative w-full sm:w-[380px] md:w-[440px] shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search by candidate, job, client, interviewer, or round..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Single Unified Filters Button */}
          <div className="flex items-center justify-end">
            <FilterPanel
              fields={filterFields}
              values={filterPanelValues}
              onChange={handleAdvancedFilterChange}
              onClear={resetAllFilters}
            />
          </div>
        </div>

        {/* Active Filter Chips */}
        {activeFilterChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {activeFilterChips.map(chip => (
              <span
                key={chip.key}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200"
              >
                {chip.label}
                <button
                  type="button"
                  onClick={chip.onRemove}
                  className="hover:text-blue-900 focus:outline-none"
                  aria-label={`Remove ${chip.label} filter`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={resetAllFilters}
              className="text-xs text-slate-500 hover:text-blue-600 font-medium px-2 py-1 rounded hover:bg-slate-100 transition-colors"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Footer Count & Active Queue Indicator */}
        <div className="text-xs text-slate-500 font-medium flex items-center justify-between pt-2 border-t border-slate-100">
          <span>
            {(activeFiltersCount > 0 || activeTab !== 'All Interviews') ? (
              filtered.length > 0 ? (
                <>Showing <span className="font-semibold text-slate-700">{filtered.length}</span> of <span className="font-semibold text-slate-700">{interviews.length}</span> interviews</>
              ) : (
                <>0 of <span className="font-semibold text-slate-700">{interviews.length}</span> interviews found</>
              )
            ) : (
              <>Total: <span className="font-semibold text-slate-700">{interviews.length}</span> interviews</>
            )}
            {activeTab !== 'All Interviews' && (
              <span className="text-slate-400 ml-1.5">• Queue: <strong className="text-slate-600">{activeTab}</strong></span>
            )}
          </span>
          {(activeFiltersCount > 0 || activeTab !== 'All Interviews') && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              Reset View
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-visible">
        <div className="overflow-x-auto min-h-[420px]">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-medium whitespace-nowrap">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Candidate &amp; Role</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Round &amp; Format</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Schedule</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Interviewer Panel</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Status &amp; Outcome</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">
                  <div className="w-[276px] ml-auto text-left">Actions</div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedInterviews.map((interview, rowIdx) => {
                const candidate = candidates.find(c => c.id === interview.candidateId);
                const job = jobs.find(j => j.id === interview.jobId);
                const client = clients.find(c => c.id === interview.clientId);
                const isCompleted = interview.status === 'Completed';
                const isScheduledOrRescheduled = interview.status === 'Scheduled' || interview.status === 'Rescheduled';
                const isFeedbackComplete = interview.fbSummary.status === 'Received';
                const pendingPanelists = interview.panelists.filter(p => p.feedbackStatus !== 'Submitted');
                const pendingPanelist = pendingPanelists[0];
                const openTooltipDownward = rowIdx < 2;

                // Determine single primary action per row based on current interview state
                let primaryActionLabel = 'Reschedule';
                let handlePrimaryAction = () => openRescheduleModal(interview);
                let isUrgentPrimaryAction = false;

                if (isScheduledOrRescheduled && interview.isOverdue) {
                  primaryActionLabel = 'Mark Completed';
                  handlePrimaryAction = () => handleStatusChange(interview.id, 'Completed');
                  isUrgentPrimaryAction = true;
                } else if (isScheduledOrRescheduled) {
                  primaryActionLabel = 'Reschedule';
                  handlePrimaryAction = () => openRescheduleModal(interview);
                  isUrgentPrimaryAction = false;
                } else if (isCompleted && !isFeedbackComplete) {
                  primaryActionLabel = 'Submit Feedback';
                  handlePrimaryAction = () => openFeedbackModal(interview);
                  isUrgentPrimaryAction = !interview.recruiterOutcome;
                } else if (isCompleted && isFeedbackComplete) {
                  primaryActionLabel = interview.recruiterOutcome ? 'Update Outcome' : 'Confirm Outcome';
                  handlePrimaryAction = () => setSelectedInterviewForOutcome(interview);
                  isUrgentPrimaryAction = !interview.recruiterOutcome;
                } else {
                  // No Show or Cancelled
                  primaryActionLabel = 'Reschedule';
                  handlePrimaryAction = () => openRescheduleModal(interview);
                  isUrgentPrimaryAction = false;
                }

                const scheduledDateObj = new Date(interview.scheduledAt);
                const formattedTime = isNaN(scheduledDateObj.getTime())
                  ? ''
                  : scheduledDateObj.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
                
                return (
                  <tr key={interview.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* 1. Candidate, Job Role & Client */}
                    <td className="px-4 py-3.5 align-middle">
                      <div className="font-semibold text-slate-900 leading-snug">{candidate?.fullName}</div>
                      <div className="text-xs text-slate-600 mt-0.5 leading-snug font-medium">
                        {job?.title}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 leading-snug truncate max-w-[220px]" title={client?.name}>
                        {client?.name}
                      </div>
                    </td>

                    {/* 2. Round & Format */}
                    <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {interview.roundName || `Round ${interview.roundNumber || 1}`}
                        </span>
                        <span className="text-xs font-medium text-slate-800">
                          {interview.interviewType}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
                        {interview.mode === 'Video' ? <Video className="w-3.5 h-3.5 text-slate-400" /> : 
                         interview.mode === 'Phone' ? <Phone className="w-3.5 h-3.5 text-slate-400" /> : 
                         <Users className="w-3.5 h-3.5 text-slate-400" />}
                        <span>{interview.mode}</span>
                        <span>•</span>
                        <span>{interview.durationMinutes} mins</span>
                      </div>
                    </td>

                    {/* 3. Schedule (Date & Time) */}
                    <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                      <div className="text-slate-800 font-medium leading-snug">
                        {formatDate(interview.scheduledAt)}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {formattedTime} • {interview.timezone || 'Local'}
                      </div>
                    </td>

                    {/* 4. Interviewer Panel & Hoverable Breakdown Popover */}
                    <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                      <div className="relative group/panel inline-block">
                        <div className="flex items-center gap-1.5 cursor-pointer">
                          <span className="text-slate-800 font-medium group-hover/panel:text-blue-600 transition-colors">
                            {interview.interviewerName}
                          </span>
                          {interview.panelists.length > 1 && (
                            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              +{interview.panelists.length - 1} more
                            </span>
                          )}
                        </div>

                        {/* Sub-line explaining panel status or who is pending */}
                        <div className="mt-0.5 text-[11px]">
                          {isCompleted && interview.fbSummary.status === 'Partially Received' && pendingPanelists.length > 0 ? (
                            <span className="text-amber-700 font-medium flex items-center gap-1">
                              <Clock className="w-3 h-3 shrink-0 text-amber-600" />
                              Waiting on {pendingPanelists.map(p => p.name.split(' ')[0]).join(', ')}
                            </span>
                          ) : isCompleted && interview.fbSummary.status === 'Pending' ? (
                            <span className="text-rose-600 font-medium">
                              Awaiting evaluator submission
                            </span>
                          ) : isCompleted && interview.fbSummary.status === 'Received' ? (
                            <span className="text-emerald-700 font-medium">
                              {interview.panelists.length > 1 ? `All ${interview.panelists.length} panelists submitted` : 'Evaluation submitted'}
                            </span>
                          ) : (
                            <span className="text-slate-400">
                              {interview.panelists[0]?.role || 'Assigned Evaluator'}
                            </span>
                          )}
                        </div>

                        {/* Interactive Hoverable Card showing each Panelist's Feedback Status */}
                        {interview.panelists.length > 0 && (
                          <div
                            className={cn(
                              "absolute left-0 w-72 whitespace-normal opacity-0 invisible group-hover/panel:opacity-100 group-hover/panel:visible transition-all duration-150 z-40 pointer-events-auto",
                              openTooltipDownward ? "top-full pt-2" : "bottom-full pb-2"
                            )}
                          >
                            <div className="bg-slate-900 text-white rounded-xl p-3.5 shadow-xl border border-slate-800">
                              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2.5 pb-2 border-b border-slate-800 flex items-center justify-between gap-3">
                                <span className="shrink-0">
                                  Panel Feedback ({interview.fbSummary.submittedCount}/{interview.fbSummary.totalCount})
                                </span>
                                <span className={cn(
                                  "px-1.5 py-0.5 rounded text-[9px] font-bold tracking-normal uppercase shrink-0",
                                  interview.status === 'No Show' || interview.status === 'Cancelled'
                                    ? "bg-slate-800 text-slate-400"
                                    : interview.fbSummary.status === 'Received'
                                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                    : interview.fbSummary.status === 'Partially Received'
                                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                    : interview.fbSummary.status === 'Pending'
                                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                    : "bg-slate-800 text-slate-300"
                                )}>
                                  {interview.status === 'No Show' || interview.status === 'Cancelled'
                                    ? 'N/A'
                                    : interview.fbSummary.status}
                                </span>
                              </div>
                              <div className="space-y-2">
                                {interview.panelists.map(p => {
                                  const submitted = p.feedbackStatus === 'Submitted';
                                  const isCancelledOrNoShow = interview.status === 'No Show' || interview.status === 'Cancelled';
                                  return (
                                    <div key={p.id} className="flex items-center justify-between gap-2.5 text-xs">
                                      <div className="min-w-0 flex-1">
                                        <span className="font-medium text-white block truncate">{p.name}</span>
                                        {p.role && <span className="text-[10px] text-slate-400 block truncate">{p.role}</span>}
                                      </div>
                                      <span className={cn(
                                        "px-2 py-0.5 rounded text-[10px] font-semibold shrink-0",
                                        isCancelledOrNoShow
                                          ? "bg-slate-800 text-slate-400 border border-slate-700"
                                          : submitted
                                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                          : isCompleted
                                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                          : "bg-slate-800 text-slate-300 border border-slate-700"
                                      )}>
                                        {isCancelledOrNoShow
                                          ? 'N/A'
                                          : submitted
                                          ? (p.overallResult ? `✓ ${p.overallResult}` : '✓ Submitted')
                                          : isCompleted
                                          ? '⏳ Pending'
                                          : 'Not Due'}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* 5. Status & Outcome (Max 1 status row + 1 clean sub-status line) */}
                    <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        {/* Line 1: Single Primary Session Badge + Distinct Feedback Progress Pill when Completed */}
                        <div className="flex items-center gap-1.5">
                          {interview.isOverdue && isScheduledOrRescheduled ? (
                            <span className="inline-flex items-center gap-1 w-fit px-2 py-0.5 rounded text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                              Overdue
                            </span>
                          ) : (
                            <span className={cn(
                              "inline-flex items-center w-fit px-2 py-0.5 rounded text-xs font-bold border",
                              interview.status === 'Completed' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                              interview.status === 'Scheduled' ? "bg-blue-50 text-blue-700 border-blue-200" :
                              interview.status === 'Rescheduled' ? "bg-purple-50 text-purple-700 border-purple-200" :
                              interview.status === 'No Show' ? "bg-rose-50 text-rose-800 border-rose-200" :
                              "bg-slate-100 text-slate-600 border-slate-200"
                            )}>
                              {interview.status === 'No Show' 
                                ? `No Show (${interview.noShowWho || 'Candidate'})` 
                                : interview.status}
                            </span>
                          )}

                          {/* When Completed: Distinct color-coded Feedback Pill (Complete vs Partial vs Pending) */}
                          {isCompleted && (
                            <span
                              title={`Feedback: ${interview.fbSummary.displayCount}`}
                              className={cn(
                                "inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-full border",
                                interview.fbSummary.status === 'Received'
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                  : interview.fbSummary.status === 'Partially Received'
                                  ? "bg-amber-50 text-amber-800 border-amber-300"
                                  : "bg-rose-50 text-rose-700 border-rose-200"
                              )}
                            >
                              <span className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                interview.fbSummary.status === 'Received' ? "bg-emerald-600" :
                                interview.fbSummary.status === 'Partially Received' ? "bg-amber-600" :
                                "bg-rose-600"
                              )} />
                              {interview.fbSummary.status === 'Received'
                                ? `Feedback ${interview.fbSummary.submittedCount}/${interview.fbSummary.totalCount}`
                                : interview.fbSummary.status === 'Partially Received'
                                ? `Partial ${interview.fbSummary.submittedCount}/${interview.fbSummary.totalCount}`
                                : `Pending 0/${interview.fbSummary.totalCount}`}
                            </span>
                          )}
                        </div>

                        {/* Line 2: Clean Plain-Text Sub-Status / Outcome */}
                        {isScheduledOrRescheduled && (
                          <span className="text-[11px] text-slate-400 font-medium">
                            Feedback: {interview.fbSummary.displayCount}
                          </span>
                        )}

                        {isCompleted && (
                          <div className="text-[11px] font-semibold flex items-center gap-1">
                            <span className="text-slate-500 font-medium">Outcome:</span>
                            {interview.recruiterOutcome ? (
                              <span className={cn(
                                "font-bold",
                                interview.recruiterOutcome === 'Selected' ? "text-emerald-700" :
                                interview.recruiterOutcome === 'Rejected' ? "text-rose-700" :
                                interview.recruiterOutcome === 'Next Round' ? "text-blue-700" :
                                "text-amber-700"
                              )}>
                                {interview.recruiterOutcome}
                              </span>
                            ) : (
                              <span className="text-amber-700 font-semibold">
                                Decision Pending
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* 6. Actions (Aligned directly under 'ACTIONS' header with uniform button widths) */}
                    <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                      <div className="w-[276px] ml-auto flex gap-1.5 items-center justify-start">
                        {/* Uniform-Width Context-Driven Primary Action */}
                        <button
                          type="button"
                          onClick={handlePrimaryAction}
                          className={cn(
                            "w-[132px] py-1.5 px-2.5 text-xs font-semibold rounded-lg shadow-2xs transition-colors inline-flex items-center justify-center text-center shrink-0",
                            isUrgentPrimaryAction
                              ? "text-white bg-blue-600 hover:bg-blue-700"
                              : "text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200"
                          )}
                        >
                          {primaryActionLabel}
                        </button>

                        {/* Uniform-Width View History Button */}
                        <button
                          type="button"
                          onClick={() => openHistoryDrawer(interview.applicationId, interview.id)}
                          className="w-[100px] py-1.5 px-2 text-xs font-medium text-slate-700 hover:text-slate-900 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg shadow-2xs transition-colors inline-flex items-center justify-center text-center shrink-0"
                          title="View interview details, round history, and feedback"
                        >
                          View History
                        </button>

                        {/* Three-Dot Menu with all valid stage actions */}
                        <div className="relative group shrink-0">
                          <button
                            type="button"
                            aria-label="More actions"
                            className="p-1.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-slate-500 hover:text-slate-700 shadow-2xs transition-colors"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                          <div className="absolute right-0 top-full pt-1 w-52 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-30">
                            <div className="bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 flex flex-col text-left">
                              {/* 1. Interview Actions (Scheduled / Rescheduled / Overdue) */}
                              {isScheduledOrRescheduled && (
                                <>
                                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Interview Actions
                                  </div>
                                  {(interview.mode === 'Video' || interview.mode === 'Manual Link') && interview.meetingLink && (
                                    <a
                                      href={interview.meetingLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="w-full block text-left px-3.5 py-1.5 text-xs text-blue-600 hover:bg-blue-50 font-medium"
                                    >
                                      Join Meeting
                                    </a>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleStatusChange(interview.id, 'Completed')}
                                    className="w-full block text-left px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                                  >
                                    Mark Completed
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => openRescheduleModal(interview)}
                                    className="w-full block text-left px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                                  >
                                    Reschedule
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => { setSelectedInterview(interview); setNoShowForm({ who: 'Candidate', note: '' }); setActiveModal('no_show'); }}
                                    className="w-full block text-left px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                                  >
                                    Mark No-Show
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => { setSelectedInterview(interview); setCancelReason(''); setActiveModal('cancel'); }}
                                    className="w-full block text-left px-3.5 py-1.5 text-xs text-red-600 hover:bg-red-50 font-medium"
                                  >
                                    Cancel Interview
                                  </button>
                                </>
                              )}

                            {/* 2. Feedback & Outcome Actions (Only for Completed interviews) */}
                            {isCompleted && (
                              <>
                                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                  Feedback Actions
                                </div>
                                <button
                                  type="button"
                                  onClick={() => openFeedbackModal(interview, isFeedbackComplete)}
                                  className="w-full block text-left px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                                >
                                  {isFeedbackComplete ? 'Edit Feedback' : 'Submit Feedback'}
                                </button>
                                {pendingPanelist && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const link = `${window.location.origin}/interview-feedback/${pendingPanelist.secureFeedbackToken}`;
                                        navigator.clipboard?.writeText(link);
                                        triggerToast('Secure feedback link copied to clipboard!');
                                      }}
                                      className="w-full block text-left px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                                    >
                                      Copy Feedback Link
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const res = sendFeedbackReminder?.(
                                          interview.id,
                                          pendingPanelist.id || pendingPanelist.email || pendingPanelist.secureFeedbackToken
                                        );
                                        triggerToast(res?.message || `Feedback reminder sent to ${pendingPanelist.name}.`);
                                      }}
                                      className="w-full block text-left px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                                    >
                                      Send Feedback Reminder
                                    </button>
                                  </>
                                )}
                                <div className="my-1 border-t border-slate-100" />
                                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                  Outcomes
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setSelectedInterviewForOutcome(interview)}
                                  className="w-full block text-left px-3.5 py-1.5 text-xs text-blue-700 hover:bg-blue-50 font-medium"
                                >
                                  {interview.recruiterOutcome ? 'Update Outcome' : 'Confirm Outcome'}
                                </button>
                              </>
                            )}

                            {/* 3. No Show / Cancelled fallback actions */}
                            {!isScheduledOrRescheduled && !isCompleted && (
                              <>
                                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                  Interview Actions
                                </div>
                                <button
                                  type="button"
                                  onClick={() => openRescheduleModal(interview)}
                                  className="w-full block text-left px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                                >
                                  Reschedule
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(interview.id, 'Completed')}
                                  className="w-full block text-left px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                                >
                                  Mark Completed
                                </button>
                                {interview.status === 'No Show' && (
                                  <button
                                    type="button"
                                    onClick={() => { setSelectedInterview(interview); setCancelReason(''); setActiveModal('cancel'); }}
                                    className="w-full block text-left px-3.5 py-1.5 text-xs text-red-600 hover:bg-red-50 font-medium"
                                  >
                                    Cancel Interview
                                  </button>
                                )}
                              </>
                            )}
                            </div>
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
                    <div className="flex flex-col items-center gap-2">
                      <span>No interviews found matching your criteria.</span>
                      {(activeFiltersCount > 0 || activeTab !== 'All Interviews') && (
                        <button
                          type="button"
                          onClick={resetAllFilters}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors"
                        >
                          View All Interviews ({interviews.length})
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Unified Pagination */}
        <Pagination
          currentPage={currentPage}
          totalItems={filtered.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          itemLabel="interviews"
        />
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
              {/* Form fields: Option A - Clear separation of Evaluation Result and Recommended Next Step */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Evaluation Recommendation *</label>
                  <select 
                    required 
                    value={feedbackForm.overallResult} 
                    onChange={e => setFeedbackForm({...feedbackForm, overallResult: e.target.value as any})} 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select recommendation...</option>
                    <option value="Strong Hire">Strong Hire (Exceeds bar; top candidate)</option>
                    <option value="Hire">Hire (Meets bar; recommended)</option>
                    <option value="Hold">Hold (Borderline / discussion needed)</option>
                    <option value="Reject">Reject (Does not meet bar)</option>
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
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Key Strengths</label>
                  <textarea 
                    rows={2} 
                    value={feedbackForm.strengths} 
                    onChange={e => setFeedbackForm({...feedbackForm, strengths: e.target.value})} 
                    placeholder="Candidate strengths, highlights, relevant competencies..." 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Areas of Concern</label>
                  <textarea 
                    rows={2} 
                    value={feedbackForm.concerns} 
                    onChange={e => setFeedbackForm({...feedbackForm, concerns: e.target.value})} 
                    placeholder="Potential concerns, red flags, or skill gaps..." 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Detailed Assessment Notes *</label>
                  <textarea 
                    rows={3} 
                    required 
                    value={feedbackForm.feedbackNotes} 
                    onChange={e => setFeedbackForm({...feedbackForm, feedbackNotes: e.target.value})} 
                    placeholder="Comprehensive interview notes and evaluation reasoning... *" 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Recommended Next Step *</label>
                  <select 
                    required 
                    value={feedbackForm.recommendation} 
                    onChange={e => setFeedbackForm({...feedbackForm, recommendation: e.target.value as any})} 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select recommended next step...</option>
                    <option value="Advance to Next Round">Advance to Next Round</option>
                    <option value="Proceed to Offer">Proceed to Offer</option>
                    <option value="Keep on Hold">Keep on Hold / Review Later</option>
                    <option value="Reject Application">Reject Application</option>
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Your recommendation assists the recruiter. Feedback submission records your assessment and does not alter the candidate's stage directly.
                  </p>
                </div>
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
              <div className="space-y-3 text-sm">
                <p><strong>Evaluation Result:</strong> {selectedInterview.overallResult || '—'}</p>
                <p><strong>Rating:</strong> {selectedInterview.overallRating || 3}/5</p>
                <p><strong>Recommended Next Step:</strong> {selectedInterview.recommendation || '—'}</p>
                {selectedInterview.strengths && (
                  <div>
                    <span className="font-semibold text-slate-700">Key Strengths:</span>
                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200 mt-1">{selectedInterview.strengths}</p>
                  </div>
                )}
                {selectedInterview.concerns && (
                  <div>
                    <span className="font-semibold text-slate-700">Areas of Concern:</span>
                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200 mt-1">{selectedInterview.concerns}</p>
                  </div>
                )}
                <div>
                  <span className="font-semibold text-slate-700">Assessment Notes:</span>
                  <p className="text-xs text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-200 mt-1 whitespace-pre-wrap">{selectedInterview.feedbackNotes}</p>
                </div>
              </div>
              <div className="flex flex-col gap-3 border-t pt-4">
                {(selectedInterview.recommendation === 'Advance to Next Round' || selectedInterview.recommendation === 'Hold' || selectedInterview.recommendation === 'Keep on Hold') && (
                  <div className="flex flex-wrap gap-2 justify-center mb-2">
                    <button onClick={() => handleScheduleNextRound(selectedInterview)} className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm">Schedule Next Round</button>
                    <button onClick={() => setActiveModal('confirm_selection')} className="px-4 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-sm">Confirm Selection</button>
                    <button onClick={() => setActiveModal('confirm_rejection')} className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm">Confirm Rejection</button>
                  </div>
                )}
                {(selectedInterview.recommendation === 'Proceed to Offer' || selectedInterview.recommendation === 'Hire') && (
                  <div className="flex flex-wrap gap-2 justify-center mb-2">
                    <button onClick={() => setActiveModal('confirm_selection')} className="px-4 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-sm">Confirm Selection</button>
                    <button onClick={() => handleScheduleNextRound(selectedInterview)} className="px-4 py-2 text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg shadow-sm">Schedule Next Round Instead</button>
                  </div>
                )}
                {(selectedInterview.recommendation === 'Reject Application' || selectedInterview.recommendation === 'Reject') && (
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
                            "inline-flex items-center w-fit px-2 py-0.5 rounded text-xs font-bold border",
                            round.status === 'Completed' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                            round.status === 'Scheduled' ? "bg-blue-50 text-blue-700 border-blue-200" :
                            round.status === 'Rescheduled' ? "bg-purple-50 text-purple-700 border-purple-200" :
                            round.status === 'No Show' ? "bg-rose-50 text-rose-800 border-rose-200" :
                            "bg-slate-100 text-slate-600 border-slate-200"
                          )}>
                            {round.status === 'No Show' ? `No Show (${round.noShowWho || 'Candidate'})` : round.status}
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
          setNextRoundToSchedule(undefined);
        }}
        initialCandidateId={selectedInterview?.candidateId}
        initialJobId={selectedInterview?.jobId}
        initialRoundNumber={nextRoundToSchedule}
      />

      {/* Interview History Drawer */}
      {historyDrawerAppId && (
        <InterviewHistoryDrawer
          isOpen={!!historyDrawerAppId}
          onClose={() => {
            setHistoryDrawerAppId(null);
            setHistoryDrawerInterviewId(null);
          }}
          applicationId={historyDrawerAppId}
          selectedInterviewId={historyDrawerInterviewId}
          onSubmitFeedback={(interviewToEdit) => {
            setHistoryDrawerAppId(null);
            setHistoryDrawerInterviewId(null);
            openFeedbackModal(interviewToEdit, interviewToEdit.feedbackStatus === 'Submitted');
          }}
          onScheduleNextRound={(candidateId, jobId, nextRoundNum) => {
            setSelectedInterview({ candidateId, jobId } as any);
            setNextRoundToSchedule(nextRoundNum);
            setIsScheduleModalOpen(true);
            setHistoryDrawerAppId(null);
            setHistoryDrawerInterviewId(null);
          }}
        />
      )}

      {/* Recruiter Outcome Modal */}
      {selectedInterviewForOutcome && (
        <RecruiterOutcomeModal
          isOpen={!!selectedInterviewForOutcome}
          onClose={() => setSelectedInterviewForOutcome(null)}
          interview={selectedInterviewForOutcome}
          candidateName={candidates.find(c => c.id === selectedInterviewForOutcome.candidateId)?.fullName || 'Candidate'}
          onNextRoundSelected={(nextRound) => {
            setSelectedInterview({
              candidateId: selectedInterviewForOutcome.candidateId,
              jobId: selectedInterviewForOutcome.jobId
            } as any);
            setNextRoundToSchedule(nextRound);
            setSelectedInterviewForOutcome(null);
            setIsScheduleModalOpen(true);
          }}
        />
      )}
    </div>
  );
}
