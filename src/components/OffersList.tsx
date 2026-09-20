import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Search, AlertCircle, X, CheckCircle2, CheckCircle, Calendar, Clock, 
  User, DollarSign, Briefcase, FileText, ArrowRight, Eye, 
  RefreshCw, Send, Check, ShieldAlert, AlertTriangle, Users, HelpCircle, Save
} from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { Link, useLocation } from 'react-router-dom';
import FilterPanel, { FilterField } from './FilterPanel';
import DateRangeFilter from './DateRangeFilter';
import { DatePreset, isDateInPreset } from '../lib/dateUtils';
import { Offer, OfferStatus } from '../types';

export default function OffersList() {
  const { 
    offers, 
    candidates, 
    jobs, 
    clients, 
    projects,
    onboardings,
    updateOfferStatus,
    submitOfferForApproval,
    approveOffer,
    issueOffer,
    recordOfferResponse,
    extendOfferExpiry, 
    startOnboardingFromOffer,
    createOffer,
    updateOffer,
    startNegotiation,
    createRevisedOffer
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({ 
    status: '', 
    clientId: '', 
    jobId: '', 
    assignedRecruiterId: '',
    expiryRisk: ''
  });

  const [datePreset, setDatePreset] = useState<DatePreset>('All Time');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Active Modals
  const [activeModal, setActiveModal] = useState<'view' | 'onboarding_confirm' | 'draft_form' | 'return_comment' | 'letter_preview' | 'start_negotiation' | 'create_revision' | 'record_response' | 'submit_approval' | null>(null);
  const [approvalEmail, setApprovalEmail] = useState('');
  const [previewSource, setPreviewSource] = useState<'view' | 'draft_form' | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [returnComment, setReturnComment] = useState('');
  const [negotiationNote, setNegotiationNote] = useState('');
  const [responseOutcome, setResponseOutcome] = useState<'Accepted' | 'Declined' | ''>('');
  const [responseDate, setResponseDate] = useState(new Date().toISOString().split('T')[0]);
  const [responseNote, setResponseNote] = useState('');
  const [draftData, setDraftData] = useState({
    offeredCompensation: '',
    employmentType: 'Full-time',
    contractDuration: '',
    proposedJoiningDate: '',
    expiryDate: '',
    notes: ''
  });

  const location = useLocation();
  const [handoffState, setHandoffState] = useState<any>(null);

  useEffect(() => {
    if (location.state) {
      if (location.state.openOfferId) {
        const offerToOpen = offers.find(o => o.id === location.state.openOfferId);
        if (offerToOpen) {
          setSelectedOffer(offerToOpen);
          setActiveModal('view');
        }
      } else if (location.state.candidateId) {
        setHandoffState(location.state);
        // Reset draft data for new cases
        if (location.state.forceNewCase || !offers.find(o => o.applicationId === location.state.applicationId)) {
          setDraftData({
            offeredCompensation: '',
            employmentType: 'Full-time',
            contractDuration: '',
            proposedJoiningDate: '',
            expiryDate: '',
            notes: ''
          });
        }
      }
      // Clear state from history so it doesn't trigger on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state, offers]);

  // Form states
  const [formError, setFormError] = useState('');

  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Status Formatter
  const getDisplayStatus = (status: OfferStatus): string => {
    if (status === 'Offer Draft') return 'Draft';
    if (status === 'Pending Approval') return 'Pending Approval';
    if (status === 'Approved') return 'Approved';
    if (['Offer Issued', 'Sent', 'Viewed'].includes(status)) return 'Sent';
    if (['Negotiating', 'Revised Draft', 'Revised Offer Issued'].includes(status)) return 'Negotiating';
    if (status === 'Accepted') return 'Accepted';
    if (status === 'Declined') return 'Declined';
    if (status === 'Expired') return 'Expired';
    if (['Withdrawn', 'Superseded'].includes(status)) return 'Withdrawn';
    return status;
  };

  // Last Activity Calculator
  const getLastActivity = (offer: Offer): string | null => {
    const activityDates = (offer.activities || []).map(a => a.date);
    const dates = [
      offer.sentDate, offer.rejectedAt, offer.acceptedAt, 
      offer.withdrawnAt, offer.extendedAt, offer.offerDate,
      ...activityDates
    ].filter(Boolean) as string[];
    
    if (dates.length === 0) return null;
    return new Date(Math.max(...dates.map(d => new Date(d).getTime()))).toISOString();
  };

  // Expiry Risk Calculator
  const getExpiryRisk = (offer: Offer): 'Expired' | 'Expiring soon' | 'No expiry date' | 'No Immediate Risk' => {
    if (offer.status === 'Expired') return 'Expired';
    if (!offer.expiryDate) return 'No expiry date';
    
    const expiryTime = new Date(offer.expiryDate).getTime();
    const now = Date.now();
    const diffMs = expiryTime - now;
    
    if (diffMs < 0) return 'Expired';
    
    const diffDays = diffMs / (24 * 3600 * 1000);
    if (diffDays <= 7) return 'Expiring soon';
    return 'No Immediate Risk';
  };

  // Unique lists for Filter Options
  const uniqueClients = Array.from(new Set(offers.map(o => o.clientId))).map(id => clients.find(c => c.id === id)).filter(Boolean);
  const uniqueJobs = Array.from(new Set(offers.map(o => o.jobId))).map(id => jobs.find(j => j.id === id)).filter(Boolean);

  const filterFields: FilterField[] = [
    { key: 'status', label: 'Status', options: ['Draft', 'Pending Approval', 'Approved', 'Sent', 'Negotiating', 'Accepted', 'Declined', 'Expired', 'Withdrawn'].map(s => ({ value: s, label: s })) },
    { key: 'clientId', label: 'Client', options: uniqueClients.map(c => ({ value: c!.id, label: c!.name })) },
    { key: 'jobId', label: 'Role / Job', options: uniqueJobs.map(j => ({ value: j!.id, label: j!.title })) },
    { key: 'expiryRisk', label: 'Expiry Risk', options: ['Expiring soon', 'Expired', 'No expiry date'].map(r => ({ value: r, label: r })) }
  ];

  // Deduplicate offers by case identity, taking the latest version
  const latestOffersMap = new Map<string, Offer>();
  offers.forEach(o => {
    const caseId = o.parentOfferId || o.id;
    const existing = latestOffersMap.get(caseId);
    if (!existing || (o.version || 1) > (existing.version || 1)) {
      latestOffersMap.set(caseId, o);
    }
  });
  const latestOffers = Array.from(latestOffersMap.values());

  // Composite search and filtering
  const filtered = latestOffers.filter(offer => {
    const candidate = candidates.find(c => c.id === offer.candidateId);
    const client = clients.find(c => c.id === offer.clientId);
    const job = jobs.find(j => j.id === offer.jobId);

    // Search query matches
    const matchSearch = !searchTerm || 
      candidate?.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      client?.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      offer.offeredRole.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (job && job.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      getDisplayStatus(offer.status).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (offer.offerReference && offer.offerReference.toLowerCase().includes(searchTerm.toLowerCase()));

    // Filter values matches
    const matchStatus = !filters.status || getDisplayStatus(offer.status) === filters.status;
    const matchClient = !filters.clientId || offer.clientId === filters.clientId;
    const matchJob = !filters.jobId || offer.jobId === filters.jobId;
    
    // Expiry Risk filter matching
    const risk = getExpiryRisk(offer);
    const matchRisk = !filters.expiryRisk || risk === filters.expiryRisk;

    // Date range preset matches
    const lastActivity = getLastActivity(offer);
    const matchDate = lastActivity ? isDateInPreset(lastActivity, datePreset, customStart, customEnd) : (datePreset === 'All Time');

    return matchSearch && matchStatus && matchClient && matchJob && matchRisk && matchDate;
  });

  const activeFiltersCount = Object.values(filters).filter(Boolean).length + (datePreset !== 'All Time' ? 1 : 0);

  // Start Onboarding Submit Handler
  const handleStartOnboardingSubmit = () => {
    if (!selectedOffer) return;
    const result = startOnboardingFromOffer(selectedOffer.id);
    if (result.success) {
      triggerToast('Onboarding created and linked successfully!');
      setActiveModal(null);
      setSelectedOffer(null);
    } else {
      const errorMsg = result.error || 'Failed to start onboarding';
      triggerToast(errorMsg, 'error');
      setFormError(errorMsg);
    }
  };

  const handleSaveDraft = () => {
    if (!draftData.offeredCompensation.trim() || !draftData.proposedJoiningDate || !draftData.expiryDate) {
      setFormError('Compensation, joining date, and expiry date are required.');
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const joiningDate = new Date(draftData.proposedJoiningDate);
    if (joiningDate < today) {
      setFormError('Joining date cannot be in the past.');
      return;
    }

    const validUntil = new Date(draftData.expiryDate);
    if (validUntil < today) {
      setFormError('Expiry date cannot be in the past.');
      return;
    }

    if (selectedOffer && selectedOffer.status === 'Offer Draft') {
      // Edit existing draft
      updateOffer(selectedOffer.id, { 
        ...draftData,
        activities: [
          ...(selectedOffer.activities || []),
          {
            id: Date.now().toString(),
            action: 'Draft updated',
            date: new Date().toISOString(),
            actor: 'Current user'
          }
        ]
      });
      triggerToast('Offer draft updated successfully!');
    } else if (handoffState) {
      // Create new draft
      createOffer({
        candidateId: handoffState.candidateId,
        applicationId: handoffState.applicationId,
        jobId: handoffState.jobId,
        clientId: handoffState.clientId,
        projectId: handoffState.projectId,
        offeredRole: handoffState.jobTitle,
        offeredCompensation: draftData.offeredCompensation,
        employmentType: draftData.employmentType as any,
        contractDuration: draftData.contractDuration,
        proposedJoiningDate: draftData.proposedJoiningDate,
        expiryDate: draftData.expiryDate,
        notes: draftData.notes,
        approvalRequired: false,
        version: 1,
        activities: [
          {
            id: Date.now().toString(),
            action: 'Draft saved',
            date: new Date().toISOString(),
            actor: 'Current user'
          }
        ]
      });
      triggerToast('Offer draft created successfully!');
      setHandoffState(null);
    }

    setActiveModal(null);
    setSelectedOffer(null);
    setFormError('');
  };

  const handleSubmitForApproval = () => {
    if (!selectedOffer) return;
    if (!selectedOffer.offeredCompensation || !selectedOffer.employmentType || !selectedOffer.proposedJoiningDate || !selectedOffer.expiryDate) {
      setFormError('Cannot submit: Compensation, employment type, joining date, and expiry date are required.');
      return;
    }
    setApprovalEmail('');
    setFormError('');
    setActiveModal('submit_approval');
  };

  const confirmSubmitForApproval = () => {
    if (!selectedOffer) return;
    if (!approvalEmail) {
      setFormError('Please enter an email address for approval.');
      return;
    }
    updateOffer(selectedOffer.id, {
      status: 'Pending Approval',
      activities: [
        ...(selectedOffer.activities || []),
        {
          id: Date.now().toString(),
          action: `Submitted for approval to ${approvalEmail}`,
          date: new Date().toISOString(),
          actor: 'Current user'
        }
      ]
    });
    triggerToast('Offer submitted for approval.');
    setActiveModal(null);
    setSelectedOffer(null);
  };

  const handleApproveOffer = () => {
    if (!selectedOffer) return;
    if (window.confirm('Are you sure you want to approve this offer?')) {
      updateOffer(selectedOffer.id, {
        status: 'Approved',
        activities: [
          ...(selectedOffer.activities || []),
          {
            id: Date.now().toString(),
            action: 'Offer approved',
            date: new Date().toISOString(),
            actor: 'Current user'
          }
        ]
      });
      triggerToast('Offer approved successfully.');
      setActiveModal(null);
      setSelectedOffer(null);
    }
  };

  const handleReturnToDraft = () => {
    if (!selectedOffer) return;
    updateOffer(selectedOffer.id, {
      status: 'Offer Draft',
      activities: [
        ...(selectedOffer.activities || []),
        {
          id: Date.now().toString(),
          action: 'Returned to draft',
          date: new Date().toISOString(),
          actor: 'Current user',
          comment: returnComment.trim() || undefined
        }
      ]
    });
    triggerToast('Offer returned to draft.');
    setActiveModal(null);
    setSelectedOffer(null);
    setReturnComment('');
  };

  const handleIssueOffer = () => {
    if (!selectedOffer) return;
    if (window.confirm('Are you sure you want to issue this offer to the candidate?')) {
      issueOffer(selectedOffer.id);
      triggerToast('Offer sent to candidate.');
      setActiveModal(null);
      setSelectedOffer(null);
    }
  };

  const handleStartNegotiation = () => {
    if (!selectedOffer) return;
    if (!negotiationNote.trim()) {
      setFormError('Please provide a note for this negotiation.');
      return;
    }
    startNegotiation(selectedOffer.id, negotiationNote);
    triggerToast('Negotiation started.');
    setActiveModal(null);
    setSelectedOffer(null);
    setNegotiationNote('');
    setFormError('');
  };

  const handleCreateRevision = () => {
    if (!selectedOffer) return;
    // We create a revised offer passing the parentOfferId, copying the previous data
    const { id, status, version, parentOfferId, activities, ...offerData } = selectedOffer;
    createRevisedOffer(selectedOffer.id, offerData);
    triggerToast('Revised Draft created. Previous version is now superseded.');
    setActiveModal(null);
    setSelectedOffer(null);
  };

  const handleRecordResponse = () => {
    if (!selectedOffer) return;
    if (!responseOutcome) {
      setFormError('Please select a response outcome.');
      return;
    }
    
    const issueDate = new Date(selectedOffer.sentDate || selectedOffer.activities?.find(a => a.action === 'Offer issued')?.date || Date.now());
    const selectedDate = new Date(responseDate);
    
    if (selectedDate < new Date(issueDate.setHours(0,0,0,0))) {
      setFormError('Response date cannot be before the offer was issued.');
      return;
    }
    
    if (selectedDate > new Date()) {
      setFormError('Response date cannot be in the future.');
      return;
    }

    recordOfferResponse(selectedOffer.id, responseOutcome as 'Accepted' | 'Declined', responseNote);
    
    if (responseOutcome === 'Accepted') {
      triggerToast('Candidate Accepted! Application moved to Completed Outcomes.');
    } else {
      triggerToast('Candidate Declined. Recorded successfully.');
    }
    
    setActiveModal(null);
    setSelectedOffer(null);
    setResponseOutcome('');
    setResponseDate(new Date().toISOString().split('T')[0]);
    setResponseNote('');
    setFormError('');
  };

  return (
    <div className="space-y-6">
      {/* Toast popup */}
      {toast && (
        <div className={cn(
          "fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 text-white rounded-xl shadow-lg border text-sm font-medium animate-slide-in",
          toast.type === 'error' ? "bg-red-600 border-red-500" : "bg-slate-900 border-slate-800"
        )}>
          {toast.type === 'error' ? <ShieldAlert className="w-4 h-4 text-red-300" /> : <Check className="w-4 h-4 text-green-400" />}
          {toast.message}
        </div>
      )}

      {handoffState && handoffState.candidateId && !handoffState.openOfferId && (() => {
        const appOffers = offers.filter(o => o.applicationId === handoffState.applicationId);
        
        const caseMap = new Map<string, Offer>();
        appOffers.forEach(o => {
          const caseId = o.parentOfferId || o.id;
          const existing = caseMap.get(caseId);
          if (!existing || (o.version || 1) > (existing.version || 1)) {
            caseMap.set(caseId, o);
          }
        });
        
        const cases = Array.from(caseMap.values());
        const activeOffer = cases[0] || null;
        
        const forceNewCase = (handoffState as any).forceNewCase;
        
        return (
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex justify-between items-center shadow-sm">
            <div>
              <h3 className="text-sm font-semibold text-indigo-900 mb-1">
                Ready to prepare an offer for {handoffState.candidateName}
              </h3>
              <p className="text-xs text-indigo-700 max-w-2xl">
                {handoffState.jobTitle} {handoffState.clientId ? `· ${clients.find(c => c.id === handoffState.clientId)?.name || handoffState.clientId}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {activeOffer && !forceNewCase ? (
                <button
                  onClick={() => {
                    setSelectedOffer(activeOffer);
                    setActiveModal('view');
                  }}
                  className="px-4 py-2 text-xs font-semibold text-indigo-600 bg-white border border-indigo-200 hover:bg-indigo-50 rounded-lg shadow-sm"
                >
                  View Offer
                </button>
              ) : (
                <button
                  onClick={() => {
                    setDraftData({
                      offeredCompensation: '',
                      employmentType: 'Full-time',
                      contractDuration: '',
                      proposedJoiningDate: '',
                      expiryDate: '',
                      notes: ''
                    });
                    setActiveModal('draft_form');
                  }}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                >
                  Prepare Offer
                </button>
              )}
              <button 
                onClick={() => setHandoffState(null)} 
                className="text-indigo-400 hover:text-indigo-600 transition-colors bg-white rounded-full p-1 border border-indigo-100 shadow-sm"
                aria-label="Dismiss banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })()}

      <div className="flex justify-between items-center">
        <p className="text-slate-600">Manage offer drafts, approvals, issued offers, expiry risk and candidate responses.</p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search offers..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
            />
          </div>
          <DateRangeFilter
            preset={datePreset}
            customStart={customStart}
            customEnd={customEnd}
            label="Last Activity"
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
              setFilters({ status: '', clientId: '', jobId: '', assignedRecruiterId: '', expiryRisk: '' });
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
              Last Activity: {datePreset === 'Custom' ? `${customStart || 'Any'} to ${customEnd || 'Any'}` : datePreset}
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
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
              <tr>
                <th className="px-6 py-4">Candidate</th>
                <th className="px-6 py-4">Job & Client</th>
                <th className="px-6 py-4">Current Offer</th>
                <th className="px-6 py-4 whitespace-nowrap">Joining Date</th>
                <th className="px-6 py-4 whitespace-nowrap">Status</th>
                <th className="px-6 py-4 whitespace-nowrap">Last Activity</th>
                <th className="px-6 py-4 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(offer => {
                const candidate = candidates.find(c => c.id === offer.candidateId);
                const job = jobs.find(j => j.id === offer.jobId);
                const client = clients.find(c => c.id === offer.clientId);
                const risk = getExpiryRisk(offer);
                const displayStatus = getDisplayStatus(offer.status);
                const lastActivityDate = getLastActivity(offer);

                return (
                  <tr key={offer.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{candidate?.fullName}</div>
                      {candidate?.phone && <div className="text-xs text-slate-500 mt-1">{candidate.phone}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-800 font-medium">{offer.offeredRole}</div>
                      <div className="text-xs text-slate-500 mt-1">{client?.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-800 font-medium">{offer.offeredCompensation}</div>
                      <div className="text-xs text-slate-500 mt-1">{offer.contractDuration}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {offer.proposedJoiningDate ? formatDate(offer.proposedJoiningDate) : <span className="text-slate-400 italic">Not set</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className={cn(
                          "inline-flex items-center w-fit px-2.5 py-0.5 rounded text-xs font-semibold border",
                          displayStatus === 'Accepted' ? "bg-green-50 text-green-700 border-green-200" :
                          displayStatus === 'Sent' ? "bg-blue-50 text-blue-700 border-blue-200" :
                          displayStatus === 'Pending Approval' || displayStatus === 'Negotiating' ? "bg-amber-50 text-amber-700 border-amber-200" :
                          displayStatus === 'Declined' || displayStatus === 'Expired' ? "bg-red-50 text-red-700 border-red-200" :
                          "bg-slate-50 text-slate-600 border-slate-200"
                        )}>
                          {displayStatus}
                        </span>
                        {(displayStatus === 'Sent' || displayStatus === 'Negotiating') && offer.expiryDate && (
                          <span className={cn(
                            "inline-flex items-center w-fit gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded",
                            risk === 'Expired' ? "bg-red-50 text-red-600 border border-red-100" :
                            risk === 'Expiring soon' ? "bg-amber-50 text-amber-700 border border-amber-100 animate-pulse" :
                            "text-slate-500"
                          )}>
                            <AlertCircle className="w-3 h-3 shrink-0" /> <span className="truncate">Offer expires: {formatDate(offer.expiryDate)}</span>
                          </span>
                        )}
                        {offer.onboardingStarted && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-green-600 font-semibold">
                            <CheckCircle2 className="w-3 h-3 shrink-0" /> <span className="truncate">Onboarding Started</span>
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-700 whitespace-nowrap">
                      {lastActivityDate ? formatDate(lastActivityDate) : <span className="text-slate-400 italic">Not available</span>}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex gap-2 justify-end">
                        <button 
                          onClick={() => {
                            setSelectedOffer(offer);
                            setActiveModal('view');
                          }}
                          className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors text-xs font-medium border border-blue-200 flex items-center gap-1 whitespace-nowrap shrink-0"
                          title="View Offer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View Offer
                        </button>
                        
                        {displayStatus === 'Accepted' && (
                          offer.onboardingStarted ? (
                            <Link 
                              to="/onboarding" 
                              className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1.5 border border-blue-200 rounded shadow-sm inline-flex items-center shrink-0 whitespace-nowrap"
                            >
                              View Onboarding
                            </Link>
                          ) : (
                            <button 
                              onClick={() => {
                                setSelectedOffer(offer);
                                setFormError('');
                                setActiveModal('onboarding_confirm');
                              }} 
                              className="text-xs font-medium text-white bg-green-600 hover:bg-green-700 px-2.5 py-1.5 rounded shadow-sm flex items-center gap-1 shrink-0 whitespace-nowrap"
                            >
                              <ArrowRight className="w-3.5 h-3.5 shrink-0" /> Start Onboarding
                            </button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    No offers found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* VIEW OFFER MODAL */}
      {activeModal === 'view' && selectedOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">Offer details Profile</h2>
              <button 
                onClick={() => { setActiveModal(null); setSelectedOffer(null); }} 
                className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
              <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                <div>
                  <span className="text-slate-400 block mb-0.5 text-xs">Candidate Name</span>
                  <span className="font-semibold text-slate-800">
                    {candidates.find(c => c.id === selectedOffer.candidateId)?.fullName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5 text-xs">Client Target</span>
                  <span className="font-semibold text-slate-800">
                    {clients.find(c => c.id === selectedOffer.clientId)?.name}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5 text-xs">Offered Role</span>
                  <span className="font-semibold text-slate-800">{selectedOffer.offeredRole}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5 text-xs">Contract Duration</span>
                  <span className="font-semibold text-slate-800">{selectedOffer.contractDuration}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5 text-xs">Compensation Package</span>
                  <span className="font-bold text-slate-800 text-base">{selectedOffer.offeredCompensation}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5 text-xs">Proposed Joining Date</span>
                  <span className="font-semibold text-slate-800">{formatDate(selectedOffer.proposedJoiningDate)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5 text-xs">Offer Sent Date</span>
                  <span className="font-semibold text-slate-800">
                    {selectedOffer.sentDate ? formatDate(selectedOffer.sentDate) : 'Not Sent yet'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5 text-xs">Expiry Date</span>
                  <span className="font-semibold text-slate-800">
                    {selectedOffer.expiryDate ? formatDate(selectedOffer.expiryDate) : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5 text-xs">Offer Status</span>
                  <span className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border",
                    selectedOffer.status === 'Accepted' ? "bg-green-50 text-green-700 border-green-200" :
                    selectedOffer.status === 'Sent' || selectedOffer.status === 'Viewed' ? "bg-blue-50 text-blue-700 border-blue-200" :
                    selectedOffer.status === 'Declined' || selectedOffer.status === 'Expired' ? "bg-red-50 text-red-700 border-red-200" :
                    "bg-slate-50 text-slate-700 border-slate-200"
                  )}>
                    {selectedOffer.status}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5 text-xs">Approval Required</span>
                  <span className="font-semibold text-slate-800">
                    {selectedOffer.approvalRequired ? `Required (Approved by ${selectedOffer.approvedBy || 'Pending'})` : 'No'}
                  </span>
                </div>
                {selectedOffer.notes && (
                  <div className="col-span-2">
                    <span className="text-slate-400 block mb-0.5 text-xs">Offer Notes / Conditions</span>
                    <p className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs text-slate-700">
                      {selectedOffer.notes}
                    </p>
                  </div>
                )}
                {selectedOffer.rejectionReason && (
                  <div className="col-span-2">
                    <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-red-800 text-xs">
                      <span className="font-bold block mb-1">Rejection Reason Declared:</span>
                      {selectedOffer.rejectionReason}
                      {selectedOffer.rejectedAt && (
                        <span className="text-[10px] text-red-500 block mt-1">Logged on {formatDate(selectedOffer.rejectedAt)}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Offer Versions History */}
              {(() => {
                const offerVersions = offers
                  .filter(o => o.applicationId === selectedOffer.applicationId)
                  .sort((a, b) => (a.version || 1) - (b.version || 1));
                
                if (offerVersions.length > 1) {
                  return (
                    <div className="mt-8 border-t border-slate-100 pt-6">
                      <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-500" /> Offer Versions
                      </h3>
                      <div className="space-y-3">
                        {offerVersions.map(version => (
                          <div key={version.id} className={cn(
                            "flex items-center justify-between p-3 rounded-lg border",
                            version.id === selectedOffer.id 
                              ? "bg-indigo-50 border-indigo-200" 
                              : "bg-slate-50 border-slate-200"
                          )}>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded bg-white border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-500">
                                v{version.version || 1}
                              </div>
                              <div>
                                <span className="font-semibold text-slate-800 block text-xs">
                                  {version.id === selectedOffer.id ? "Current View" : (version.status === 'Superseded' ? "Superseded" : "Active")}
                                </span>
                                <span className="text-[10px] text-slate-500">
                                  {version.status} · {version.offeredCompensation} · {formatDate(version.proposedJoiningDate || '')}
                                </span>
                              </div>
                            </div>
                            {version.id !== selectedOffer.id && (
                              <button 
                                onClick={() => setSelectedOffer(version)}
                                className="px-3 py-1.5 text-xs font-medium text-indigo-600 bg-white border border-indigo-200 rounded hover:bg-indigo-50 transition-colors"
                              >
                                View Version
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Activity Timeline */}
              {selectedOffer.activities && selectedOffer.activities.length > 0 && (
                <div className="mt-8 border-t border-slate-100 pt-6">
                  <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-500" /> Activity Timeline
                  </h3>
                  <div className="space-y-4">
                    {selectedOffer.activities.map(activity => (
                      <div key={activity.id} className="flex gap-3">
                        <div className="w-1.5 rounded-full bg-indigo-100 flex-shrink-0" />
                        <div className="flex-1 bg-slate-50 border border-slate-100 rounded-lg p-3 text-xs">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-semibold text-slate-800">{activity.action}</span>
                            <span className="text-slate-400">{formatDate(activity.date)}</span>
                          </div>
                          <span className="text-slate-500 block">by {activity.actor}</span>
                          {activity.comment && (
                            <div className="mt-2 text-slate-700 italic bg-white p-2 rounded border border-slate-100">
                              "{activity.comment}"
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Action Buttons */}
              <div className="pt-6 mt-6 border-t border-slate-100 flex flex-wrap gap-2 justify-end bg-white items-center">
                <button
                  onClick={() => {
                    setPreviewSource('view');
                    setActiveModal('letter_preview');
                  }}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" /> Preview Offer Letter
                </button>
                <div className="flex-1" />
                {selectedOffer.status === 'Offer Draft' && (
                  <>
                    <button
                      onClick={() => {
                        setDraftData({
                          offeredCompensation: selectedOffer.offeredCompensation || '',
                          employmentType: selectedOffer.employmentType || 'Full-time',
                          contractDuration: selectedOffer.contractDuration || '',
                          proposedJoiningDate: selectedOffer.proposedJoiningDate || '',
                          expiryDate: selectedOffer.expiryDate || '',
                          notes: selectedOffer.notes || ''
                        });
                        setActiveModal('draft_form');
                      }}
                      className="px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
                    >
                      Continue Draft
                    </button>
                    <button
                      onClick={handleSubmitForApproval}
                      className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Submit for Approval
                    </button>
                  </>
                )}
                {selectedOffer.status === 'Pending Approval' && (
                  <>
                    <button
                      onClick={() => setActiveModal('return_comment')}
                      className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      Return to Draft
                    </button>
                    <button
                      onClick={handleApproveOffer}
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Approve Offer
                    </button>
                  </>
                )}
                {selectedOffer.status === 'Approved' && (
                  <button
                    onClick={handleIssueOffer}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Issue Offer
                  </button>
                )}
                {selectedOffer.status === 'Sent' && (
                  <>
                    {(() => {
                      const isExpired = selectedOffer.expiryDate && new Date(selectedOffer.expiryDate) < new Date(new Date().setHours(0,0,0,0));
                      return isExpired ? (
                        <div className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" /> Validity Expired
                        </div>
                      ) : (
                        <button
                          onClick={() => setActiveModal('record_response')}
                          className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" /> Record Candidate Response
                        </button>
                      );
                    })()}
                    <button
                      onClick={() => setActiveModal('start_negotiation')}
                      className="px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" /> Start Negotiation
                    </button>
                  </>
                )}
                {selectedOffer.status === 'Negotiating' && (
                  <button
                    onClick={() => setActiveModal('create_revision')}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" /> Create Revised Offer
                  </button>
                )}
                {(selectedOffer.status === 'Declined' || selectedOffer.status === 'Expired') && (() => {
                  const appOffers = offers.filter(o => o.applicationId === selectedOffer.applicationId);
                  const caseMap = new Map<string, Offer>();
                  appOffers.forEach(o => {
                    const caseId = o.parentOfferId || o.id;
                    const existing = caseMap.get(caseId);
                    if (!existing || (o.version || 1) > (existing.version || 1)) {
                      caseMap.set(caseId, o);
                    }
                  });
                  const cases = Array.from(caseMap.values());
                  const activeOffer = cases[0] || null;
                  
                  const isLatestCase = activeOffer && (activeOffer.parentOfferId || activeOffer.id) === (selectedOffer.parentOfferId || selectedOffer.id);
                  
                  if (isLatestCase) {
                    return (
                      <button
                        onClick={() => {
                          const candidate = candidates.find(c => c.id === selectedOffer.candidateId);
                          const job = jobs.find(j => j.id === selectedOffer.jobId);
                          setHandoffState({
                            candidateId: candidate?.id || '',
                            candidateName: candidate?.fullName || '',
                            jobId: job?.id || '',
                            jobTitle: job?.title || '',
                            clientId: selectedOffer.clientId || '',
                            projectId: selectedOffer.projectId || '',
                            applicationId: selectedOffer.applicationId,
                            forceNewCase: true
                          } as any);
                          setDraftData({
                            offeredCompensation: '',
                            employmentType: 'Full-time',
                            contractDuration: '',
                            proposedJoiningDate: '',
                            expiryDate: '',
                            notes: ''
                          });
                          setActiveModal('draft_form');
                          setSelectedOffer(null);
                        }}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4" /> Prepare New Offer
                      </button>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* START NEGOTIATION MODAL */}
      {activeModal === 'start_negotiation' && selectedOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <RefreshCw className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Start Negotiation</h3>
            </div>
            
            {formError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" />
                {formError}
              </div>
            )}
            <p className="text-sm text-slate-600 mb-4">
              Record a short note about the candidate's request. This will set the offer status to <span className="font-semibold text-slate-800">Negotiating</span> but will keep the issued version active until a revision is created.
            </p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-1">Negotiation Note <span className="text-red-500">*</span></label>
              <textarea
                value={negotiationNote}
                onChange={(e) => setNegotiationNote(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow resize-none text-sm"
                placeholder="E.g., Candidate requested higher base salary..."
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setActiveModal(null);
                  setNegotiationNote('');
                  setFormError('');
                }}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStartNegotiation}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
              >
                Start Negotiation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE REVISED OFFER MODAL */}
      {activeModal === 'create_revision' && selectedOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Create Revised Offer</h3>
            </div>
            
            <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm p-4 rounded-xl mb-6 flex gap-3 items-start">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-1">This will invalidate the current version.</p>
                <p>Creating a revision will mark the currently issued version as <strong>Superseded</strong> and it will no longer be valid for acceptance.</p>
                <p className="mt-2">A new draft (Version {(selectedOffer.version || 1) + 1}) will be created with the terms copied from the previous version.</p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRevision}
                className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors"
              >
                Confirm & Create Draft
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECORD CANDIDATE RESPONSE MODAL */}
      {activeModal === 'record_response' && selectedOffer && (() => {
        const candidate = candidates.find(c => c.id === selectedOffer.candidateId);
        const job = jobs.find(j => j.id === selectedOffer.jobId);
        const client = clients.find(c => c.id === selectedOffer.clientId);
        
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 border border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Record Candidate Response</h3>
              </div>
              
              {formError && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" />
                  {formError}
                </div>
              )}
              
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-xs mb-5 space-y-2 text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-400">Candidate</span>
                  <span className="font-semibold">{candidate?.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Job & Client</span>
                  <span className="font-semibold">{job?.title} at {client?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Offer Version</span>
                  <span className="font-semibold">Version {selectedOffer.version || 1} ({selectedOffer.offerReference})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Validity Date</span>
                  <span className="font-semibold">{selectedOffer.expiryDate ? formatDate(selectedOffer.expiryDate) : 'Not specified'}</span>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Candidate's Decision <span className="text-red-500">*</span></label>
                  <div className="flex gap-3">
                    <label className={cn("flex-1 cursor-pointer border rounded-lg p-3 text-sm font-medium transition-colors flex items-center gap-2", responseOutcome === 'Accepted' ? "bg-green-50 border-green-200 text-green-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50")}>
                      <input type="radio" name="response" value="Accepted" checked={responseOutcome === 'Accepted'} onChange={(e) => setResponseOutcome('Accepted')} className="sr-only" />
                      <div className={cn("w-4 h-4 rounded-full border flex items-center justify-center", responseOutcome === 'Accepted' ? "border-green-600" : "border-slate-300")}>
                        {responseOutcome === 'Accepted' && <div className="w-2 h-2 rounded-full bg-green-600" />}
                      </div>
                      Accepted
                    </label>
                    <label className={cn("flex-1 cursor-pointer border rounded-lg p-3 text-sm font-medium transition-colors flex items-center gap-2", responseOutcome === 'Declined' ? "bg-red-50 border-red-200 text-red-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50")}>
                      <input type="radio" name="response" value="Declined" checked={responseOutcome === 'Declined'} onChange={(e) => setResponseOutcome('Declined')} className="sr-only" />
                      <div className={cn("w-4 h-4 rounded-full border flex items-center justify-center", responseOutcome === 'Declined' ? "border-red-600" : "border-slate-300")}>
                        {responseOutcome === 'Declined' && <div className="w-2 h-2 rounded-full bg-red-600" />}
                      </div>
                      Declined
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Response Date <span className="text-red-500">*</span></label>
                  <input type="date" value={responseDate} onChange={e => setResponseDate(e.target.value)} max={new Date().toISOString().split('T')[0]} className="w-full h-10 px-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Response Note (Optional)</label>
                  <textarea
                    value={responseNote}
                    onChange={(e) => setResponseNote(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow resize-none text-sm"
                    placeholder="E.g., Candidate signed via email..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setActiveModal(null);
                    setResponseOutcome('');
                    setResponseNote('');
                    setFormError('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRecordResponse}
                  disabled={!responseOutcome}
                  className={cn("px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors", responseOutcome ? "bg-indigo-600 hover:bg-indigo-700" : "bg-slate-300 cursor-not-allowed")}
                >
                  Confirm Response
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* SUBMIT FOR APPROVAL MODAL */}
      {activeModal === 'submit_approval' && selectedOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Send className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Submit for Approval</h3>
            </div>
            
            {formError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" />
                {formError}
              </div>
            )}
            
            <p className="text-sm text-slate-600 mb-4">Please enter the email address of the person who needs to approve this offer.</p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-1">Approver Email <span className="text-red-500">*</span></label>
              <input
                type="email"
                value={approvalEmail}
                onChange={(e) => setApprovalEmail(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                placeholder="e.g. manager@example.com"
                required
              />
            </div>
            <div className="flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => { setActiveModal('view'); setApprovalEmail(''); setFormError(''); }}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={confirmSubmitForApproval}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2"
              >
                <Check className="w-4 h-4" /> Submit Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* START ONBOARDING CONFIRMATION MODAL */}
      {activeModal === 'onboarding_confirm' && selectedOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Start Candidate Onboarding</h3>
            </div>
            
            {formError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" />
                {formError}
              </div>
            )}

            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs mb-6">
              <div className="flex justify-between">
                <span className="text-slate-400">Candidate:</span>
                <span className="font-semibold text-slate-700">
                  {candidates.find(c => c.id === selectedOffer.candidateId)?.fullName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Offered Role:</span>
                <span className="font-semibold text-slate-700">{selectedOffer.offeredRole}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Client:</span>
                <span className="font-semibold text-slate-700">
                  {clients.find(c => c.id === selectedOffer.clientId)?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Joining Date:</span>
                <span className="font-semibold text-slate-700">{formatDate(selectedOffer.proposedJoiningDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Offer Status:</span>
                <span className="font-semibold text-green-700">{selectedOffer.status}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => { setActiveModal(null); setFormError(''); }}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleStartOnboardingSubmit}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors shadow-sm"
              >
                Confirm & Create Folder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DRAFT FORM MODAL */}
      {activeModal === 'draft_form' && (handoffState || selectedOffer) && (() => {
        const context = selectedOffer || handoffState;
        const candidateName = selectedOffer ? candidates.find(c => c.id === selectedOffer.candidateId)?.fullName : context.candidateName;
        const jobTitle = selectedOffer ? selectedOffer.offeredRole : context.jobTitle;
        const clientId = selectedOffer ? selectedOffer.clientId : context.clientId;
        const clientName = clientId ? clients.find(c => c.id === clientId)?.name || clientId : '';
        const projectId = selectedOffer ? selectedOffer.projectId : context.projectId;
        const projectName = projectId ? projects.find(p => p.id === projectId)?.name || projectId : '';
        const appId = selectedOffer ? selectedOffer.applicationId : context.applicationId;
        
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden flex max-h-[90vh]">
              {/* Draft Form */}
              <div className="flex-1 overflow-y-auto p-6 border-r border-slate-100 flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-slate-800">
                    {selectedOffer ? 'Edit Offer Draft' : 'Create Offer Draft'}
                  </h2>
                  <button 
                    onClick={() => { setActiveModal(null); setFormError(''); }}
                    className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {formError && (
                  <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 shrink-0" />
                    {formError}
                  </div>
                )}

                <div className="space-y-6 flex-1">
                  {/* Locked Context */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-slate-500 block text-xs mb-0.5">Candidate</span>
                      <span className="font-semibold text-slate-800">{candidateName}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-xs mb-0.5">Job</span>
                      <span className="font-semibold text-slate-800">{jobTitle}</span>
                    </div>
                    {clientName && (
                      <div>
                        <span className="text-slate-500 block text-xs mb-0.5">Client</span>
                        <span className="font-semibold text-slate-800">{clientName}</span>
                      </div>
                    )}
                    {projectName && (
                      <div>
                        <span className="text-slate-500 block text-xs mb-0.5">Project</span>
                        <span className="font-semibold text-slate-800">{projectName}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-slate-500 block text-xs mb-0.5">Application Ref</span>
                      <span className="font-semibold text-slate-800 text-xs font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">{appId}</span>
                    </div>
                  </div>

                  {/* Editable Fields */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Compensation <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="text"
                        placeholder="e.g. $120,000/year"
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none text-sm"
                        value={draftData.offeredCompensation}
                        onChange={(e) => setDraftData({ ...draftData, offeredCompensation: e.target.value })}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                          Employment Type <span className="text-red-500">*</span>
                        </label>
                        <select 
                          className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none text-sm bg-white"
                          value={draftData.employmentType}
                          onChange={(e) => setDraftData({ ...draftData, employmentType: e.target.value })}
                        >
                          <option value="Full-time">Full-time</option>
                          <option value="Part-time">Part-time</option>
                          <option value="Contract">Contract</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                          Contract Duration
                        </label>
                        <input 
                          type="text"
                          placeholder="e.g. 12 Months"
                          className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none text-sm"
                          value={draftData.contractDuration}
                          onChange={(e) => setDraftData({ ...draftData, contractDuration: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                          Proposed Joining Date <span className="text-red-500">*</span>
                        </label>
                        <input 
                          type="date"
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none text-sm"
                          value={draftData.proposedJoiningDate}
                          onChange={(e) => setDraftData({ ...draftData, proposedJoiningDate: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                          Offer Valid Until <span className="text-red-500">*</span>
                        </label>
                        <input 
                          type="date"
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none text-sm"
                          value={draftData.expiryDate}
                          onChange={(e) => setDraftData({ ...draftData, expiryDate: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Notes / Terms
                      </label>
                      <textarea 
                        rows={3}
                        placeholder="Additional conditions, sign-on bonuses, relocation, etc."
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none text-sm resize-none"
                        value={draftData.notes}
                        onChange={(e) => setDraftData({ ...draftData, notes: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-100 flex justify-end gap-3">
                  {selectedOffer && (
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewSource('draft_form');
                        setActiveModal('letter_preview');
                      }}
                      className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2 mr-auto"
                    >
                      <Eye className="w-4 h-4" /> Preview Offer Letter
                    </button>
                  )}
                  <button 
                    type="button" 
                    onClick={() => { setActiveModal(null); setFormError(''); }}
                    className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    onClick={handleSaveDraft}
                    className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" /> Save Draft
                  </button>
                </div>
              </div>
              
              {/* Structured Summary Preview */}
              <div className="w-80 bg-slate-50 border-l border-slate-200 p-6 overflow-y-auto">
                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-500" /> Offer Summary
                </h3>
                
                <div className="space-y-4 text-sm">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-0.5">Candidate</span>
                      <span className="font-semibold text-slate-700 block truncate" title={candidateName}>{candidateName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-0.5">Job</span>
                      <span className="font-semibold text-slate-700 block truncate" title={jobTitle}>{jobTitle}</span>
                    </div>
                    {clientName && (
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-0.5">Client</span>
                        <span className="font-semibold text-slate-700 block truncate" title={clientName}>{clientName}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-0.5">Compensation</span>
                      <span className="font-bold text-indigo-700 block break-words">
                        {draftData.offeredCompensation || <span className="text-slate-300 italic">Not set</span>}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-0.5">Type</span>
                        <span className="font-medium text-slate-700 block">{draftData.employmentType}</span>
                      </div>
                      {draftData.contractDuration && (
                        <div>
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-0.5">Duration</span>
                          <span className="font-medium text-slate-700 block">{draftData.contractDuration}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-0.5">Joining Date</span>
                      <span className="font-medium text-slate-700 block">
                        {draftData.proposedJoiningDate ? formatDate(draftData.proposedJoiningDate) : <span className="text-slate-300 italic">Not set</span>}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-0.5">Valid Until</span>
                      <span className="font-medium text-slate-700 block">
                        {draftData.expiryDate ? formatDate(draftData.expiryDate) : <span className="text-slate-300 italic">Not set</span>}
                      </span>
                    </div>
                  </div>

                  {draftData.notes && (
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">Notes / Terms</span>
                      <p className="font-medium text-slate-700 text-xs whitespace-pre-wrap">{draftData.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* RETURN TO DRAFT COMMENT MODAL */}
      {activeModal === 'return_comment' && selectedOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Return to Draft</h3>
            <p className="text-sm text-slate-600 mb-4">Please provide a reason for returning this offer to draft status (optional).</p>
            <textarea
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none text-sm resize-none"
              rows={4}
              placeholder="Enter reason..."
              value={returnComment}
              onChange={e => setReturnComment(e.target.value)}
            />
            <div className="flex justify-end gap-3 mt-6">
              <button 
                type="button" 
                onClick={() => { setActiveModal('view'); setReturnComment(''); }}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleReturnToDraft}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-sm"
              >
                Return to Draft
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LETTER PREVIEW MODAL */}
      {activeModal === 'letter_preview' && selectedOffer && (() => {
        const candidate = candidates.find(c => c.id === selectedOffer.candidateId);
        const clientName = clients.find(c => c.id === selectedOffer.clientId)?.name || 'Not provided';
        const reference = `REF-${selectedOffer.id.substring(0, 8).toUpperCase()}`;
        
        let statusBadge = '';
        if (selectedOffer.status === 'Offer Draft') statusBadge = 'Draft — Not issued';
        else if (selectedOffer.status === 'Sent') statusBadge = `Issued (Version ${selectedOffer.version || 1})`;
        else statusBadge = selectedOffer.status;

        const dateUpdated = selectedOffer.activities?.length 
          ? selectedOffer.activities[selectedOffer.activities.length - 1].date 
          : selectedOffer.offerDate;

        return (
          <div className="fixed inset-0 z-50 flex flex-col items-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            {/* Header Actions */}
            <div className="w-full max-w-3xl flex justify-between items-center mb-4 sticky top-0 bg-slate-900/40 p-4 rounded-xl shadow-sm z-10 backdrop-blur-md">
              <h2 className="text-white font-bold text-lg">Offer Letter Preview</h2>
              <button 
                onClick={() => {
                  if (previewSource === 'draft_form') setActiveModal('draft_form');
                  else if (previewSource === 'view') setActiveModal('view');
                  else { setActiveModal(null); setSelectedOffer(null); }
                }}
                className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <X className="w-4 h-4" /> Close Preview
              </button>
            </div>
            
            {/* Document Body */}
            <div className="w-full max-w-3xl bg-white shadow-2xl rounded-sm mb-12">
              <div className="p-12 md:p-16">
                
                {/* Branding & Header */}
                <div className="flex justify-between items-start border-b-2 border-slate-900 pb-8 mb-8">
                  <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">SPC WORKFORCE</h1>
                    <p className="text-sm text-slate-500 font-medium mt-1">Recruitment & Talent Management</p>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <span className={cn(
                      "inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border mb-3",
                      selectedOffer.status === 'Offer Draft' ? "bg-amber-100 text-amber-800 border-amber-200" :
                      selectedOffer.status === 'Sent' ? "bg-blue-100 text-blue-800 border-blue-200" :
                      "bg-slate-100 text-slate-800 border-slate-200"
                    )}>
                      {statusBadge}
                    </span>
                    <p className="text-sm text-slate-600">Ref: <strong>{reference}</strong></p>
                    <p className="text-sm text-slate-600 mt-1">Date: {dateUpdated ? formatDate(dateUpdated) : 'Not provided'}</p>
                  </div>
                </div>

                {/* Candidate Address Block */}
                <div className="mb-10 text-slate-800">
                  <p className="font-bold text-lg mb-1">{candidate?.fullName}</p>
                  <p className="text-sm">{candidate?.email}</p>
                  <p className="text-sm">{candidate?.phone || 'Phone not provided'}</p>
                </div>

                {/* Subject */}
                <div className="mb-8">
                  <p className="font-bold text-slate-900 underline underline-offset-4">Subject: Offer for {selectedOffer.offeredRole}</p>
                </div>

                {/* Body Text */}
                <div className="space-y-4 text-slate-700 text-sm leading-relaxed mb-10">
                  <p>Dear {candidate?.fullName?.split(' ')[0] || 'Candidate'},</p>
                  <p>
                    We are pleased to offer you the position of <strong>{selectedOffer.offeredRole}</strong>. 
                    This position is in connection with our client engagement at <strong>{clientName}</strong>.
                  </p>
                  <p>
                    Your employment terms and conditions are outlined in the summary below. Please review these details carefully.
                  </p>
                </div>

                {/* Terms Summary Table */}
                <div className="mb-10 border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <tbody className="divide-y divide-slate-200">
                      <tr>
                        <th className="bg-slate-50 py-3 px-4 font-semibold text-slate-700 w-1/3">Job Title</th>
                        <td className="py-3 px-4 text-slate-900 font-medium">{selectedOffer.offeredRole}</td>
                      </tr>
                      <tr>
                        <th className="bg-slate-50 py-3 px-4 font-semibold text-slate-700">Client / Assignment</th>
                        <td className="py-3 px-4 text-slate-900">{clientName}</td>
                      </tr>
                      <tr>
                        <th className="bg-slate-50 py-3 px-4 font-semibold text-slate-700">Employment Type</th>
                        <td className="py-3 px-4 text-slate-900">{selectedOffer.employmentType || 'Not provided'}</td>
                      </tr>
                      {selectedOffer.contractDuration && (
                        <tr>
                          <th className="bg-slate-50 py-3 px-4 font-semibold text-slate-700">Contract Duration</th>
                          <td className="py-3 px-4 text-slate-900">{selectedOffer.contractDuration}</td>
                        </tr>
                      )}
                      <tr>
                        <th className="bg-slate-50 py-3 px-4 font-semibold text-slate-700">Compensation</th>
                        <td className="py-3 px-4 text-slate-900 font-bold">{selectedOffer.offeredCompensation || 'Not provided'}</td>
                      </tr>
                      <tr>
                        <th className="bg-slate-50 py-3 px-4 font-semibold text-slate-700">Proposed Joining Date</th>
                        <td className="py-3 px-4 text-slate-900">{selectedOffer.proposedJoiningDate ? formatDate(selectedOffer.proposedJoiningDate) : 'Not provided'}</td>
                      </tr>
                      <tr>
                        <th className="bg-slate-50 py-3 px-4 font-semibold text-slate-700">Offer Valid Until</th>
                        <td className="py-3 px-4 text-slate-900">{selectedOffer.expiryDate ? formatDate(selectedOffer.expiryDate) : 'Not provided'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Notes/Terms */}
                {selectedOffer.notes && (
                  <div className="mb-12 space-y-2">
                    <h4 className="font-bold text-slate-900 text-sm">Additional Terms & Conditions:</h4>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {selectedOffer.notes}
                    </p>
                  </div>
                )}

                {/* Signatures */}
                <div className="mt-16 pt-8 border-t border-slate-100 flex justify-between">
                  <div className="w-64">
                    <div className="border-b border-slate-400 pb-8 mb-2">
                      <span className="text-slate-400 italic text-sm">Authorized Signature</span>
                    </div>
                    <p className="font-bold text-slate-900 text-sm">SPC Workforce Management</p>
                    <p className="text-xs text-slate-500">Authorized Signatory</p>
                  </div>
                  <div className="w-64">
                    <div className="border-b border-slate-400 pb-8 mb-2">
                      <span className="text-slate-400 italic text-sm">Candidate Signature</span>
                    </div>
                    <p className="font-bold text-slate-900 text-sm">{candidate?.fullName}</p>
                    <p className="text-xs text-slate-500">Date: ________________</p>
                  </div>
                </div>
                
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
