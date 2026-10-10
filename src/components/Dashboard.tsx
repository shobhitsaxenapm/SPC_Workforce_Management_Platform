import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Link } from 'react-router-dom';
import { 
  Briefcase,
  X, 
  Users, 
  AlertTriangle, 
  CalendarDays, 
  CheckCircle2, 
  Filter,
  UserCheck,
  TrendingUp,
  Clock,
  ArrowRight
} from 'lucide-react';
import { cn } from '../lib/utils';
import { mockUsers } from '../data/mockData';

function formatDays(ms: number) {
  const days = Math.floor(Math.abs(ms) / (1000 * 60 * 60 * 24));
  return days === 1 ? '1 day' : `${days} days`;
}

function safeTime(dateStr: string | undefined): number {
  if (!dateStr) return NaN;
  return new Date(dateStr).getTime();
}

export default function Dashboard() {
  const { 
    currentUser, 
    jobs, 
    applications, 
    candidates, 
    clients, 
    interviews, 
    offers, 
    clientReviewBatches 
  } = useApp();

  const isManagerOrAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER';
  const defaultScope = isManagerOrAdmin ? 'Team' : 'My Work';
  
  const [scope, setScope] = useState<'My Work' | 'Team'>(defaultScope);
  const [filterClientId, setFilterClientId] = useState('');
  const [filterRecruiterId, setFilterRecruiterId] = useState(defaultScope === 'My Work' ? currentUser?.id || '' : '');
  const [filterJobId, setFilterJobId] = useState('');
  const [activityPeriod, setActivityPeriod] = useState<'Today' | 'Last 7 Days' | 'Last 30 Days' | 'Custom'>('Last 7 Days');
  const [upcomingPeriod, setUpcomingPeriod] = useState<'Next 7 Days' | 'Next 14 Days' | 'Next 30 Days' | 'Custom'>('Next 7 Days');
  const [attentionFilter, setAttentionFilter] = useState<'All' | 'Critical' | 'Overdue' | 'Pending' | 'Warning'>('All');
  const [jobHealthFilter, setJobHealthFilter] = useState<'All' | 'Has Bottlenecks' | 'On Track'>('All');
  const [isAttentionDrawerOpen, setIsAttentionDrawerOpen] = useState(false);

  const handleScopeChange = (newScope: 'My Work' | 'Team') => {
    setScope(newScope);
    if (newScope === 'My Work') {
      setFilterRecruiterId(currentUser?.id || '');
    } else {
      setFilterRecruiterId('');
    }
  };

  // Base Data Filtering
  const baseJobs = useMemo(() => {
    return jobs.filter(j => {
      if (filterClientId && j.clientId !== filterClientId) return false;
      if (filterRecruiterId && j.assignedRecruiterId !== filterRecruiterId) return false;
      if (filterJobId && j.id !== filterJobId) return false;
      return true;
    });
  }, [jobs, filterClientId, filterRecruiterId, filterJobId]);

  const baseJobIds = new Set(baseJobs.map(j => j.id));

  const baseApps = useMemo(() => {
    return applications.filter(a => baseJobIds.has(a.jobId));
  }, [applications, baseJobIds]);

  const now = new Date().getTime();

  // ── 1. KPI Calculations ──
  const openJobsCount = baseJobs.filter(j => j.status === 'Open').length;

  const positionsRemaining = baseJobs.reduce((acc, job) => {
    const joined = applications.filter(a => a.jobId === job.id && (a.currentStage === 'Joined' || a.currentStage === 'Hired')).length;
    return acc + Math.max(job.openings - joined, 0);
  }, 0);

  const activePipelineApps = baseApps.filter(a => !['Application Rejected', 'Withdrawn', 'Hired', 'Joined'].includes(a.currentStage));
  const activePipelineCount = new Set(activePipelineApps.map(a => `${a.candidateId}-${a.jobId}`)).size;

  const overdueBatches = clientReviewBatches.filter(b => {
    if (b.status === 'Submitted') return false;
    const createdAt = safeTime(b.createdAt);
    return !isNaN(createdAt) && (now - createdAt) > 48 * 60 * 60 * 1000;
  });
  const feedbackOverdueCount = baseApps.filter(a => 
    a.currentStage === 'Client Review' && overdueBatches.some(b => b.applicationIds.includes(a.id))
  ).length;

  const upcomingDaysMap: Record<string, number> = { 'Next 7 Days': 7, 'Next 14 Days': 14, 'Next 30 Days': 30, 'Custom': 90 };
  const upcomingDays = upcomingDaysMap[upcomingPeriod] || 7;
  
  const upcomingInterviewsCount = interviews.filter(i => {
    if (!baseJobIds.has(i.jobId)) return false;
    const dt = safeTime(i.scheduledAt);
    return !isNaN(dt) && dt > now && dt <= now + upcomingDays * 24 * 60 * 60 * 1000;
  }).length;

  const joiningPendingCount = offers.filter(o => {
    if (!baseJobIds.has(o.jobId) || o.status !== 'Accepted') return false;
    const app = applications.find(a => a.id === o.applicationId);
    return app && app.currentStage !== 'Joined';
  }).length;

  // ── 2. Current Pipeline Distribution ──
  const distSourced = new Set(activePipelineApps.filter(a => a.currentStage === 'Sourced' || a.currentStage === 'New' || a.currentStage === 'Under Review').map(a => `${a.candidateId}-${a.jobId}`)).size;
  const distScreening = new Set(activePipelineApps.filter(a => a.currentStage === 'Screening').map(a => `${a.candidateId}-${a.jobId}`)).size;
  const distClientReview = new Set(activePipelineApps.filter(a => a.currentStage === 'Client Review').map(a => `${a.candidateId}-${a.jobId}`)).size;
  const distInterviewing = new Set(activePipelineApps.filter(a => a.currentStage === 'Interviewing').map(a => `${a.candidateId}-${a.jobId}`)).size;
  const distSelected = new Set(activePipelineApps.filter(a => ['Selected', 'Offer', 'Offer Accepted', 'Joining Pending'].includes(a.currentStage)).map(a => `${a.candidateId}-${a.jobId}`)).size;

  const distJoinedPlaced = new Set(baseApps.filter(a => ['Hired', 'Joined'].includes(a.currentStage)).map(a => `${a.candidateId}-${a.jobId}`)).size;
  const distRejected = new Set(baseApps.filter(a => a.currentStage === 'Application Rejected').map(a => `${a.candidateId}-${a.jobId}`)).size;
  const distWithdrawn = new Set(baseApps.filter(a => a.currentStage === 'Withdrawn').map(a => `${a.candidateId}-${a.jobId}`)).size;

  // ── 3. Recruitment Activity ──
  const periodMs = activityPeriod === 'Today' ? 24 * 60 * 60 * 1000 : 
                   activityPeriod === 'Last 7 Days' ? 7 * 24 * 60 * 60 * 1000 : 
                   activityPeriod === 'Last 30 Days' ? 30 * 24 * 60 * 60 * 1000 : Infinity;
                   
  const isInPeriod = (dateStr?: string) => {
    const dt = safeTime(dateStr);
    return !isNaN(dt) && (now - dt) <= periodMs && (now - dt) >= 0;
  };

  const activityMetrics = {
    sourced: baseApps.filter(a => isInPeriod(a.appliedAt)).length,
    cvsSent: baseApps.filter(a => a.currentStage === 'Client Review' && isInPeriod(a.lastActivity)).length,
    clientShortlisted: clientReviewBatches.flatMap(b => Object.entries(b.candidateStatuses))
      .filter(([id, status]) => status === 'Shortlisted' && baseApps.some(a => a.id === id)).length,
    interviewsScheduled: interviews.filter(i => baseJobIds.has(i.jobId) && isInPeriod(i.createdAt)).length,
    offersIssued: offers.filter(o => baseJobIds.has(o.jobId) && isInPeriod(o.sentDate)).length,
    offersAccepted: offers.filter(o => baseJobIds.has(o.jobId) && o.status === 'Accepted' && isInPeriod(o.acceptedAt)).length,
    candidatesJoined: baseApps.filter(a => (a.currentStage === 'Joined' || a.currentStage === 'Hired') && isInPeriod(a.lastActivity)).length,
  };
  const totalActivity = Object.values(activityMetrics).reduce((a, b) => a + b, 0);

  // ── 4. Attention Required ──
  type AttentionItem = { id: string; subject: string; clientName: string; recruiterName: string; issue: string; durationLabel: string; actionText: string; actionLink: string; priority: number; label: string };
  const attentionItems: AttentionItem[] = [];

  baseApps.forEach(a => {
    const job = jobs.find(j => j.id === a.jobId);
    const candidate = candidates.find(c => c.id === a.candidateId);
    const client = clients.find(c => c.id === job?.clientId);
    const recruiter = mockUsers.find(u => u.id === job?.assignedRecruiterId);
    if (!job || !candidate || !client) return;

    const baseItem = { subject: `${candidate.fullName} — ${job.title}`, clientName: client.name, recruiterName: recruiter?.name || 'Unassigned' };

    // 1. Client feedback overdue
    if (a.currentStage === 'Client Review') {
      const batch = overdueBatches.find(b => b.applicationIds.includes(a.id));
      if (batch) {
        const dt = safeTime(batch.createdAt);
        attentionItems.push({ ...baseItem, id: `fb-${a.id}`, issue: `Feedback overdue by ${formatDays(now - dt)}`, durationLabel: 'Overdue', priority: 1, label: 'Overdue', actionText: 'Review', actionLink: `/candidates/${candidate.id}` });
      }
    }

    // 3. Interview pending feedback or no-show
    if (a.currentStage === 'Interviewing') {
      const pastInt = interviews.find(i => i.applicationId === a.id && safeTime(i.scheduledAt) < now && i.status === 'Scheduled');
      if (pastInt) {
        attentionItems.push({ ...baseItem, id: `int-${pastInt.id}`, issue: `Interview feedback pending`, durationLabel: 'Pending', priority: 3, label: 'Critical', actionText: 'Update', actionLink: '/interviews' });
      }
    }
  });

  offers.filter(o => baseJobIds.has(o.jobId)).forEach(o => {
    const app = applications.find(a => a.id === o.applicationId);
    const job = jobs.find(j => j.id === o.jobId);
    const candidate = candidates.find(c => c.id === app?.candidateId);
    if (!app || !job || !candidate) return;
    const client = clients.find(c => c.id === job.clientId);
    const recruiter = mockUsers.find(u => u.id === job.assignedRecruiterId);
    const baseItem = { subject: `${candidate.fullName} — ${job.title}`, clientName: client?.name || '', recruiterName: recruiter?.name || 'Unassigned' };

    // 2. Offer expired or awaiting response
    if (o.status === 'Sent') {
      const expiry = safeTime(o.expiryDate);
      if (!isNaN(expiry) && expiry < now) {
        attentionItems.push({ ...baseItem, id: `off-exp-${o.id}`, issue: `Offer expired by ${formatDays(now - expiry)}`, durationLabel: 'Overdue', priority: 2, label: 'Overdue', actionText: 'View', actionLink: '/offers' });
      } else {
        attentionItems.push({ ...baseItem, id: `off-wait-${o.id}`, issue: `Offer awaiting response`, durationLabel: 'Pending', priority: 2, label: 'Pending', actionText: 'View', actionLink: '/offers' });
      }
    }

    // 4. Joining overdue
    if (o.status === 'Accepted' && app.currentStage !== 'Joined') {
      const joinDt = safeTime(o.proposedJoiningDate);
      if (!isNaN(joinDt) && joinDt < now) {
        attentionItems.push({ ...baseItem, id: `join-${o.id}`, issue: `Joining overdue by ${formatDays(now - joinDt)}`, durationLabel: 'Overdue', priority: 4, label: 'Critical', actionText: 'Update', actionLink: `/candidates/${candidate.id}` });
      }
    }
  });

  baseJobs.filter(j => j.status === 'Open').forEach(j => {
    const client = clients.find(c => c.id === j.clientId);
    const recruiter = mockUsers.find(u => u.id === j.assignedRecruiterId);
    const baseItem = { subject: j.title, clientName: client?.name || '', recruiterName: recruiter?.name || 'Unassigned' };

    // 5. Target fill date overdue
    const targetDt = safeTime(j.targetJoiningDate);
    if (!isNaN(targetDt) && targetDt < now) {
      attentionItems.push({ ...baseItem, id: `tgt-${j.id}`, issue: `Target fill date overdue by ${formatDays(now - targetDt)}`, durationLabel: 'Overdue', priority: 5, label: 'Overdue', actionText: 'View Job', actionLink: `/job-desk/${j.id}` });
    }

    // 6. No recent activity
    const lastApp = applications.filter(a => a.jobId === j.id).sort((a, b) => safeTime(b.lastActivity) - safeTime(a.lastActivity))[0];
    const dt = lastApp ? safeTime(lastApp.lastActivity) : NaN;
    if (!isNaN(dt) && (now - dt) > 15 * 24 * 60 * 60 * 1000) {
      attentionItems.push({ ...baseItem, id: `inact-${j.id}`, issue: `No activity for ${formatDays(now - dt)}`, durationLabel: 'Inactive', priority: 6, label: 'Warning', actionText: 'View Job', actionLink: `/job-desk/${j.id}` });
    }
  });

  attentionItems.sort((a, b) => a.priority - b.priority);
  const topAttention = attentionItems.slice(0, 5);
  const hasMoreAttention = attentionItems.length > 5;

  // ── 5. Upcoming Work ──
  type UpcomingItem = { type: string; title: string; dateDt: number; link: string };
  const upcomingWorkList: UpcomingItem[] = [];

  interviews.filter(i => baseJobIds.has(i.jobId)).forEach(i => {
    const dt = safeTime(i.scheduledAt);
    if (!isNaN(dt) && dt > now && dt <= now + 7 * 24 * 60 * 60 * 1000) {
      const job = jobs.find(j => j.id === i.jobId);
      const app = applications.find(a => a.id === i.applicationId);
      const candidate = candidates.find(c => c.id === app?.candidateId);
      upcomingWorkList.push({ type: 'Interview', title: `${candidate?.fullName} — ${job?.title}`, dateDt: dt, link: '/interviews' });
    }
  });

  offers.filter(o => o.status === 'Sent' && baseJobIds.has(o.jobId)).forEach(o => {
    const dt = safeTime(o.expiryDate);
    if (!isNaN(dt) && dt > now && dt <= now + 7 * 24 * 60 * 60 * 1000) {
      const app = applications.find(a => a.id === o.applicationId);
      const candidate = candidates.find(c => c.id === app?.candidateId);
      upcomingWorkList.push({ type: 'Offer Expiry', title: `${candidate?.fullName} Offer`, dateDt: dt, link: '/offers' });
    }
  });

  offers.filter(o => o.status === 'Accepted' && baseJobIds.has(o.jobId)).forEach(o => {
    const app = applications.find(a => a.id === o.applicationId);
    if (app?.currentStage !== 'Joined') {
      const dt = safeTime(o.proposedJoiningDate);
      if (!isNaN(dt) && dt > now && dt <= now + 7 * 24 * 60 * 60 * 1000) {
        const candidate = candidates.find(c => c.id === app?.candidateId);
        const job = jobs.find(j => j.id === o.jobId);
        upcomingWorkList.push({ type: 'Candidate Joining', title: `${candidate?.fullName} — ${job?.title}`, dateDt: dt, link: `/candidates/${candidate?.id}` });
      }
    }
  });

  baseJobs.filter(j => j.status === 'Open').forEach(j => {
    const dt = safeTime(j.targetJoiningDate);
    if (!isNaN(dt) && dt > now && dt <= now + 7 * 24 * 60 * 60 * 1000) {
      upcomingWorkList.push({ type: 'Job Target Date', title: j.title, dateDt: dt, link: `/job-desk/${j.id}` });
    }
  });

  upcomingWorkList.sort((a, b) => a.dateDt - b.dateDt);

  // ── 6. Job Health ──
  const jobHealth = baseJobs.map(job => {
    const client = clients.find(c => c.id === job.clientId);
    const recruiter = mockUsers.find(u => u.id === job.assignedRecruiterId);
    const joined = applications.filter(a => a.jobId === job.id && (a.currentStage === 'Joined' || a.currentStage === 'Hired')).length;
    const positionsRem = Math.max(job.openings - joined, 0);
    const actPipe = applications.filter(a => a.jobId === job.id && !['Application Rejected', 'Withdrawn', 'Hired', 'Joined'].includes(a.currentStage)).length;
    
    const lastApp = applications.filter(a => a.jobId === job.id).sort((a, b) => safeTime(b.lastActivity) - safeTime(a.lastActivity))[0];
    const dt = lastApp ? safeTime(lastApp.lastActivity) : NaN;
    const inactiveDays = !isNaN(dt) ? Math.floor((now - dt) / (1000 * 60 * 60 * 24)) : 0;
    
    let bottleneck = 'None';
    if (applications.some(a => a.jobId === job.id && a.currentStage === 'Client Review' && overdueBatches.some(b => b.applicationIds.includes(a.id)))) bottleneck = 'Client Feedback Pending';
    else if (applications.some(a => a.jobId === job.id && a.currentStage === 'Interviewing' && interviews.some(i => i.applicationId === a.id && safeTime(i.scheduledAt) < now && i.status === 'Scheduled'))) bottleneck = 'Interview Feedback Pending';
    else if (offers.some(o => o.jobId === job.id && o.status === 'Sent')) bottleneck = 'Offer Response Pending';
    else if (offers.some(o => o.jobId === job.id && o.status === 'Accepted' && applications.find(a => a.id === o.applicationId)?.currentStage !== 'Joined')) bottleneck = 'Joining Pending';
    else if (inactiveDays > 15) bottleneck = `No Recent Activity (${inactiveDays} days)`;
    else if (applications.filter(a => a.jobId === job.id).length === 0) bottleneck = 'No Candidates Sourced';

    const targetDt = safeTime(job.targetJoiningDate);
    const isOverdue = !isNaN(targetDt) && targetDt < now;
    const targetLabel = !isNaN(targetDt) ? (isOverdue ? `${formatDays(now - targetDt)} overdue` : new Date(targetDt).toLocaleDateString()) : 'N/A';

    return {
      id: job.id, title: job.title, clientName: client?.name || 'Unknown', recruiterName: recruiter?.name || 'Unassigned',
      lifecycle: job.status, published: job.isPublished, positionsRem, actPipe, bottleneck,
      lastActivityDt: dt, isOverdue, targetLabel
    };
  });

  // ── 7. Team Workload / My Workload ──
  const relevantRecruiters = scope === 'Team' ? mockUsers.filter(u => u.role === 'RECRUITER' || (u.role === 'MANAGER' && jobs.some(j => j.assignedRecruiterId === u.id))) : [currentUser].filter(Boolean);
  
  const workloadList = relevantRecruiters.map(u => {
    const rJobs = jobs.filter(j => j.assignedRecruiterId === u?.id && (!filterClientId || j.clientId === filterClientId) && (!filterJobId || j.id === filterJobId));
    const rOpenJobs = rJobs.filter(j => j.status === 'Open').length;
    const rPositionsRem = rJobs.reduce((acc, job) => {
      const joined = applications.filter(a => a.jobId === job.id && (a.currentStage === 'Joined' || a.currentStage === 'Hired')).length;
      return acc + Math.max(job.openings - joined, 0);
    }, 0);
    const rApps = applications.filter(a => rJobs.some(j => j.id === a.jobId));
    const rActPipe = rApps.filter(a => !['Application Rejected', 'Withdrawn', 'Hired', 'Joined'].includes(a.currentStage)).length;
    const rFbOverdue = rApps.filter(a => a.currentStage === 'Client Review' && overdueBatches.some(b => b.applicationIds.includes(a.id))).length;
    const rIntPending = rApps.filter(a => a.currentStage === 'Interviewing' && interviews.some(i => i.applicationId === a.id && safeTime(i.scheduledAt) < now && i.status === 'Scheduled')).length;
    
    const inactiveJobs = rJobs.filter(j => {
      const lastApp = applications.filter(a => a.jobId === j.id).sort((a, b) => safeTime(b.lastActivity) - safeTime(a.lastActivity))[0];
      const dt = lastApp ? safeTime(lastApp.lastActivity) : NaN;
      return j.status === 'Open' && !isNaN(dt) && (now - dt) > 15 * 24 * 60 * 60 * 1000;
    }).length;

    return { id: u?.id || 'unassigned', name: u?.name || 'Unassigned', openJobs: rOpenJobs, positionsRem: rPositionsRem, actPipe: rActPipe, fbOverdue: rFbOverdue, intPending: rIntPending, inactiveJobs, hasJobs: rJobs.length > 0 };
  }).filter(w => w.hasJobs || scope === 'Team');

  // Add Unassigned if in Team mode
  if (scope === 'Team') {
    const uJobs = jobs.filter(j => !j.assignedRecruiterId && (!filterClientId || j.clientId === filterClientId) && (!filterJobId || j.id === filterJobId));
    if (uJobs.length > 0) {
      const rOpenJobs = uJobs.filter(j => j.status === 'Open').length;
      const rPositionsRem = uJobs.reduce((acc, job) => {
        const joined = applications.filter(a => a.jobId === job.id && (a.currentStage === 'Joined' || a.currentStage === 'Hired')).length;
        return acc + Math.max(job.openings - joined, 0);
      }, 0);
      const rApps = applications.filter(a => uJobs.some(j => j.id === a.jobId));
      const rActPipe = rApps.filter(a => !['Application Rejected', 'Withdrawn', 'Hired', 'Joined'].includes(a.currentStage)).length;
      const rFbOverdue = rApps.filter(a => a.currentStage === 'Client Review' && overdueBatches.some(b => b.applicationIds.includes(a.id))).length;
      const rIntPending = rApps.filter(a => a.currentStage === 'Interviewing' && interviews.some(i => i.applicationId === a.id && safeTime(i.scheduledAt) < now && i.status === 'Scheduled')).length;
      const inactiveJobs = uJobs.filter(j => {
        const lastApp = applications.filter(a => a.jobId === j.id).sort((a, b) => safeTime(b.lastActivity) - safeTime(a.lastActivity))[0];
        const dt = lastApp ? safeTime(lastApp.lastActivity) : NaN;
        return j.status === 'Open' && !isNaN(dt) && (now - dt) > 15 * 24 * 60 * 60 * 1000;
      }).length;
      workloadList.push({ id: 'unassigned', name: 'Unassigned', openJobs: rOpenJobs, positionsRem: rPositionsRem, actPipe: rActPipe, fbOverdue: rFbOverdue, intPending: rIntPending, inactiveJobs, hasJobs: true });
    }
  }

  const jobOptions = jobs.filter(j => !filterClientId || j.clientId === filterClientId);

  return (
    <div className="space-y-6">
      {/* ── Global Filters ── */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-500 font-medium whitespace-nowrap">
          <Filter className="w-4 h-4" /> Filters:
        </div>
        
        {isManagerOrAdmin && (
          <select 
            value={scope} 
            onChange={e => handleScopeChange(e.target.value as 'My Work' | 'Team')}
            className="text-sm border-gray-300 rounded-lg bg-gray-50 flex-1 min-w-[120px] max-w-[200px]"
          >
            <option value="My Work">My Work</option>
            <option value="Team">Team</option>
          </select>
        )}

        {scope === 'Team' && (
          <select 
            value={filterRecruiterId} 
            onChange={e => setFilterRecruiterId(e.target.value)}
            className="text-sm border-gray-300 rounded-lg bg-gray-50 flex-1 min-w-[120px] max-w-[200px]"
          >
            <option value="">All Recruiters</option>
            {mockUsers.filter(u => u.role === 'RECRUITER' || (u.role === 'MANAGER' && jobs.some(j => j.assignedRecruiterId === u.id))).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        )}

        <select 
          value={filterClientId} 
          onChange={e => { setFilterClientId(e.target.value); setFilterJobId(''); }}
          className="text-sm border-gray-300 rounded-lg bg-gray-50 flex-1 min-w-[120px] max-w-[200px]"
        >
          <option value="">All Clients</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <select 
          value={filterJobId} 
          onChange={e => setFilterJobId(e.target.value)}
          className="text-sm border-gray-300 rounded-lg bg-gray-50 flex-1 min-w-[120px] max-w-[200px]"
        >
          <option value="">All Jobs</option>
          {jobOptions.map(j => <option key={j.id} value={j.id}>{j.code} - {j.title}</option>)}
        </select>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Open Jobs', value: openJobsCount, icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50', link: '/job-desk' },
          { label: 'Positions Remaining', value: positionsRemaining, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50', link: '/job-desk' },
          { label: 'Active Pipeline', value: activePipelineCount, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50', link: '/candidates' },
          { label: 'Feedback Overdue', value: feedbackOverdueCount, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50', link: '/candidates' },
          { label: `Interviews ${upcomingPeriod}`, value: upcomingInterviewsCount, icon: CalendarDays, color: 'text-amber-600', bg: 'bg-amber-50', link: '/interviews' },
          { label: 'Joining Pending', value: joiningPendingCount, icon: CheckCircle2, color: 'text-cyan-600', bg: 'bg-cyan-50', link: '/offers' },
        ].map((kpi, idx) => (
          <Link to={kpi.link} key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:border-gray-300 transition-colors block group">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider leading-tight w-2/3">{kpi.label}</span>
              <div className={cn("p-1.5 rounded-lg shrink-0 transition-colors group-hover:bg-white group-hover:shadow-sm", kpi.bg, kpi.color)}>
                <kpi.icon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-1">{kpi.value}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* ── Attention Required ── */}
        <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-rose-50/40">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              Attention Required
            </h2>
            {hasMoreAttention && <button onClick={() => setIsAttentionDrawerOpen(true)} className="text-xs font-medium text-blue-600 hover:underline cursor-pointer">View all ({attentionItems.length})</button>}
          </div>
          <div className="divide-y divide-gray-50 flex-1">
            {topAttention.length > 0 ? topAttention.map(item => (
              <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide shrink-0 mt-0.5", 
                    item.label === 'Critical' ? "bg-rose-100 text-rose-700" :
                    item.label === 'Overdue' ? "bg-amber-100 text-amber-700" :
                    item.label === 'Warning' ? "bg-orange-100 text-orange-700" :
                    "bg-blue-100 text-blue-700"
                  )}>{item.label}</div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{item.subject}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {item.clientName} <span className="mx-1">•</span> {item.recruiterName} <span className="mx-1">•</span> 
                      <span className="text-gray-900 font-medium">{item.issue}</span>
                    </p>
                  </div>
                </div>
                <Link to={item.actionLink} className="shrink-0 text-xs font-medium text-gray-700 border border-gray-200 hover:bg-gray-50 hover:text-gray-900 px-3 py-1.5 rounded-lg transition-colors">
                  {item.actionText}
                </Link>
              </div>
            )) : (
              <div className="p-8 h-full flex flex-col justify-center items-center text-sm text-gray-500">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mb-3" />
                <p className="font-medium text-gray-900">All caught up!</p>
                <p>No urgent items require your attention.</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Upcoming Work ── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-blue-500" />
              Upcoming
            </h2>
          </div>
          <div className="divide-y divide-gray-50 flex-1">
            {upcomingWorkList.length > 0 ? upcomingWorkList.slice(0, 5).map((item, idx) => (
              <div key={idx} className="p-4 flex items-start gap-3 hover:bg-slate-50/50 transition-colors">
                <div className="mt-1.5 w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 line-clamp-1">
                    <Link to={item.link} className="hover:text-blue-600">{item.title}</Link>
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-medium text-gray-500">{item.type}</span>
                    <span className="text-xs text-gray-300">•</span>
                    <span className="text-xs font-medium text-gray-700">{new Date(item.dateDt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            )) : (
              <div className="p-8 h-full flex flex-col justify-center items-center text-sm text-gray-500 text-center">
                <CalendarDays className="w-8 h-8 text-gray-300 mb-3" />
                No upcoming recruitment events in the next seven days.
              </div>
            )}
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* ── Current Pipeline Distribution ── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Current Pipeline Distribution</h2>
          </div>
          <div className="p-6 flex-1 flex flex-col justify-center gap-8">
            <div className="flex justify-between items-center text-sm bg-gray-50/80 rounded-xl border border-gray-100 p-4 relative">
              <div className="absolute top-1/2 left-8 right-8 h-px bg-gray-200 -translate-y-1/2" />
              
              <div className="text-center w-full z-10">
                <div className="w-10 h-10 mx-auto bg-white border border-gray-200 rounded-full flex items-center justify-center font-semibold text-gray-900 shadow-sm">{distSourced}</div>
                <div className="text-[11px] font-semibold text-gray-600 uppercase mt-2">Sourced</div>
              </div>
              <div className="text-center w-full z-10">
                <div className="w-10 h-10 mx-auto bg-white border border-gray-200 rounded-full flex items-center justify-center font-semibold text-gray-900 shadow-sm">{distScreening}</div>
                <div className="text-[11px] font-semibold text-gray-600 uppercase mt-2">Screening</div>
              </div>
              <div className="text-center w-full z-10">
                <div className="w-10 h-10 mx-auto bg-white border border-gray-200 rounded-full flex items-center justify-center font-semibold text-gray-900 shadow-sm">{distClientReview}</div>
                <div className="text-[11px] font-semibold text-gray-600 uppercase mt-2">Client Rev.</div>
              </div>
              <div className="text-center w-full z-10">
                <div className="w-10 h-10 mx-auto bg-white border border-gray-200 rounded-full flex items-center justify-center font-semibold text-gray-900 shadow-sm">{distInterviewing}</div>
                <div className="text-[11px] font-semibold text-gray-600 uppercase mt-2">Interviewing</div>
              </div>
              <div className="text-center w-full z-10">
                <div className="w-10 h-10 mx-auto bg-white border-2 border-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold shadow-sm">{distSelected}</div>
                <div className="text-[11px] font-bold text-indigo-700 uppercase mt-2">Selected</div>
              </div>
            </div>
            
            <div className="flex justify-center gap-8">
              <div className="text-center bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-100 min-w-[100px]">
                <div className="text-lg font-bold text-emerald-700">{distJoinedPlaced}</div>
                <div className="text-[11px] font-semibold text-emerald-700 uppercase">Joined/Placed</div>
              </div>
              <div className="text-center bg-rose-50 px-4 py-2 rounded-lg border border-rose-100 min-w-[100px]">
                <div className="text-lg font-bold text-rose-700">{distRejected}</div>
                <div className="text-[11px] font-semibold text-rose-700 uppercase">Rejected</div>
              </div>
              <div className="text-center bg-gray-100 px-4 py-2 rounded-lg border border-gray-200 min-w-[100px]">
                <div className="text-lg font-bold text-gray-700">{distWithdrawn}</div>
                <div className="text-[11px] font-semibold text-gray-600 uppercase">Withdrawn</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Recruitment Activity ── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="text-sm font-semibold text-gray-900">Recruitment Activity <span className="text-gray-400 font-normal ml-1">· {activityPeriod}</span></h2>
            <select 
              value={activityPeriod} 
              onChange={e => setActivityPeriod(e.target.value as any)}
              className="text-xs border-gray-300 rounded-md bg-white py-1 pl-2 pr-6 shadow-sm"
            >
              <option>Today</option>
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>Custom</option>
            </select>
          </div>
          <div className="p-6 flex-1 flex flex-col justify-center">
            {totalActivity > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="text-center p-3 bg-white rounded-xl border border-gray-200 shadow-sm">
                  <div className="text-xl font-bold text-gray-900">{activityMetrics.sourced}</div>
                  <div className="text-[10px] font-semibold text-gray-500 uppercase mt-1">Candidates Sourced</div>
                </div>
                <div className="text-center p-3 bg-white rounded-xl border border-gray-200 shadow-sm">
                  <div className="text-xl font-bold text-gray-900">{activityMetrics.cvsSent}</div>
                  <div className="text-[10px] font-semibold text-gray-500 uppercase mt-1">CVs Sent</div>
                </div>
                <div className="text-center p-3 bg-white rounded-xl border border-gray-200 shadow-sm">
                  <div className="text-xl font-bold text-gray-900">{activityMetrics.clientShortlisted}</div>
                  <div className="text-[10px] font-semibold text-gray-500 uppercase mt-1">Client Shortlisted</div>
                </div>
                <div className="text-center p-3 bg-white rounded-xl border border-gray-200 shadow-sm">
                  <div className="text-xl font-bold text-gray-900">{activityMetrics.interviewsScheduled}</div>
                  <div className="text-[10px] font-semibold text-gray-500 uppercase mt-1">Interviews Sch.</div>
                </div>
                <div className="text-center p-3 bg-white rounded-xl border border-gray-200 shadow-sm col-span-2 sm:col-span-1">
                  <div className="text-xl font-bold text-gray-900">{activityMetrics.offersIssued}</div>
                  <div className="text-[10px] font-semibold text-gray-500 uppercase mt-1">Offers Issued</div>
                </div>
                <div className="text-center p-3 bg-white rounded-xl border border-gray-200 shadow-sm col-span-2 sm:col-span-1">
                  <div className="text-xl font-bold text-gray-900">{activityMetrics.offersAccepted}</div>
                  <div className="text-[10px] font-semibold text-gray-500 uppercase mt-1">Offers Accepted</div>
                </div>
                <div className="text-center p-3 bg-emerald-50 rounded-xl border border-emerald-100 col-span-2 sm:col-span-2 shadow-sm">
                  <div className="text-xl font-bold text-emerald-700">{activityMetrics.candidatesJoined}</div>
                  <div className="text-[10px] font-bold text-emerald-700 uppercase mt-1">Candidates Joined/Placed</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-gray-500 flex flex-col items-center">
                <Clock className="w-8 h-8 text-gray-300 mb-3" />
                <p>No recruitment activity recorded during the selected period.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ── Job Health Table ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-sm font-semibold text-gray-900">Job Health</h2>
          <select 
            value={jobHealthFilter} 
            onChange={e => setJobHealthFilter(e.target.value as any)}
            className="text-xs border-gray-300 rounded-md bg-white py-1 pl-2 pr-6 shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option>All</option>
            <option>Has Bottlenecks</option>
            <option>On Track</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Job</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Recruiter</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Lifecycle / Publication</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Positions Remaining</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Candidates</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Bottleneck</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Activity</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Target Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {jobHealth.filter(job => {
                if (jobHealthFilter === 'All') return true;
                if (jobHealthFilter === 'Has Bottlenecks') return job.bottleneck !== 'None';
                if (jobHealthFilter === 'On Track') return job.bottleneck === 'None';
                return true;
              }).map(job => (
                <tr key={job.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3">
                    <Link to={`/job-desk/${job.id}`} className="text-sm font-semibold text-blue-600 hover:underline">{job.title}</Link>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-700 whitespace-nowrap">{job.clientName}</td>
                  <td className="px-5 py-3 text-sm text-gray-700 whitespace-nowrap">{job.recruiterName}</td>
                  <td className="px-5 py-3">
                    <div className="flex flex-col gap-1 w-max">
                      <span className={cn(
                        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
                        job.lifecycle === 'Open' ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20" :
                        job.lifecycle === 'Draft' ? "bg-gray-50 text-gray-700 ring-gray-600/20" :
                        "bg-amber-50 text-amber-700 ring-amber-600/20"
                      )}>
                        {job.lifecycle}
                      </span>
                      <span className={cn("text-[10px] font-medium tracking-wide uppercase px-1", job.published ? "text-blue-600" : "text-gray-400")}>
                        {job.published ? 'Published' : 'Unpublished'}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm font-bold text-gray-900 text-center">{job.positionsRem}</td>
                  <td className="px-5 py-3 text-sm font-bold text-gray-900 text-center">{job.actPipe}</td>
                  <td className="px-5 py-3">
                    <span className={cn("text-xs font-medium px-2 py-1 rounded-md", 
                      job.bottleneck !== 'None' ? "bg-rose-50 text-rose-700 border border-rose-100" : "text-gray-500"
                    )}>
                      {job.bottleneck}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-600 whitespace-nowrap">
                    {!isNaN(job.lastActivityDt) ? new Date(job.lastActivityDt).toLocaleDateString() : 'None'}
                  </td>
                  <td className="px-5 py-3 text-sm whitespace-nowrap">
                    <span className={job.isOverdue ? "text-rose-600 font-semibold" : "text-gray-700 font-medium"}>
                      {job.targetLabel}
                    </span>
                  </td>
                </tr>
              ))}
              {jobHealth.filter(job => {
                if (jobHealthFilter === 'All') return true;
                if (jobHealthFilter === 'Has Bottlenecks') return job.bottleneck !== 'None';
                if (jobHealthFilter === 'On Track') return job.bottleneck === 'None';
                return true;
              }).length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-8 text-center text-sm text-gray-500">
                    No jobs found matching the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Team Workload / My Workload ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-indigo-500" />
            {scope === 'Team' ? 'Team Workload' : 'My Workload'}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Recruiter</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Open Jobs</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Positions Remaining</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Candidates</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Feedback Overdue</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Interviews Pending Feedback</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Inactive Jobs (15+ Days)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {workloadList.map(mw => (
                <tr key={mw.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3 text-sm font-semibold text-gray-900 whitespace-nowrap">{mw.name}</td>
                  <td className="px-5 py-3 text-sm font-medium text-center text-gray-700">{mw.openJobs}</td>
                  <td className="px-5 py-3 text-sm font-medium text-center text-gray-700">{mw.positionsRem}</td>
                  <td className="px-5 py-3 text-sm font-medium text-center text-gray-700">{mw.actPipe}</td>
                  <td className="px-5 py-3 text-sm text-center">
                    <span className={mw.fbOverdue > 0 ? "text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded-full" : "text-gray-400 font-medium"}>{mw.fbOverdue}</span>
                  </td>
                  <td className="px-5 py-3 text-sm text-center">
                    <span className={mw.intPending > 0 ? "text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-full" : "text-gray-400 font-medium"}>{mw.intPending}</span>
                  </td>
                  <td className="px-5 py-3 text-sm text-center">
                    <span className={mw.inactiveJobs > 0 ? "text-orange-700 font-bold bg-orange-50 px-2 py-0.5 rounded-full" : "text-gray-400 font-medium"}>{mw.inactiveJobs}</span>
                  </td>
                </tr>
              ))}
              {workloadList.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-sm text-gray-500">
                    No workload data found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>


      {/* ── Attention Required Drawer ── */}
      {isAttentionDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={() => setIsAttentionDrawerOpen(false)} />
          <div className="relative w-full max-w-md bg-white shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-300">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-rose-50/40">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
                All Attention Required ({attentionItems.length})
              </h2>
              <button onClick={() => setIsAttentionDrawerOpen(false)} className="p-2 text-gray-400 hover:bg-white hover:text-gray-600 rounded-lg transition-colors shadow-sm border border-transparent hover:border-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
              {attentionItems.map(item => (
                <div key={item.id} className="p-5 flex flex-col gap-3 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-start gap-3 justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{item.subject}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {item.clientName} <span className="mx-1">•</span> {item.recruiterName}
                      </p>
                    </div>
                    <div className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide shrink-0", 
                      item.label === 'Critical' ? "bg-rose-100 text-rose-700" :
                      item.label === 'Overdue' ? "bg-amber-100 text-amber-700" :
                      item.label === 'Warning' ? "bg-orange-100 text-orange-700" :
                      "bg-blue-100 text-blue-700"
                    )}>{item.label}</div>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm text-gray-900 font-medium">{item.issue}</span>
                    <Link onClick={() => setIsAttentionDrawerOpen(false)} to={item.actionLink} className="shrink-0 text-xs font-medium text-gray-700 border border-gray-200 hover:bg-gray-50 hover:text-gray-900 px-3 py-1.5 rounded-lg transition-colors">
                      {item.actionText}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
