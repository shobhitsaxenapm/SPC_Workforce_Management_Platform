import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Search, AlertCircle, X, CheckCircle2, Calendar, Clock, 
  User, DollarSign, Briefcase, FileText, ArrowRight, Eye, 
  RefreshCw, Send, Check, ShieldAlert, AlertTriangle, Users, HelpCircle
} from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { Link } from 'react-router-dom';
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
    onboardings,
    updateOfferStatus, 
    extendOfferExpiry, 
    startOnboardingFromOffer 
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
  // 'view' | 'onboarding_confirm' | 'reject_confirm' | 'extend_expiry' | 'hold_confirm' | null
  const [activeModal, setActiveModal] = useState<'view' | 'onboarding_confirm' | 'reject_confirm' | 'extend_expiry' | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);

  // Form states
  const [rejectionReason, setRejectionReason] = useState('');
  const [newExpiryDate, setNewExpiryDate] = useState('');
  const [formError, setFormError] = useState('');

  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Expiry Risk Calculator
  const getExpiryRisk = (offer: Offer): 'Expired' | 'Expiring in 7 Days' | 'Expiring in 30 Days' | 'No Immediate Risk' => {
    if (offer.status === 'Expired') return 'Expired';
    if (!offer.expiryDate) return 'No Immediate Risk';
    
    const expiryTime = new Date(offer.expiryDate).getTime();
    const now = Date.now();
    const diffMs = expiryTime - now;
    
    if (diffMs < 0) return 'Expired';
    
    const diffDays = diffMs / (24 * 3600 * 1000);
    if (diffDays <= 7) return 'Expiring in 7 Days';
    if (diffDays <= 30) return 'Expiring in 30 Days';
    return 'No Immediate Risk';
  };

  // Unique lists for Filter Options
  const uniqueClients = Array.from(new Set(offers.map(o => o.clientId))).map(id => clients.find(c => c.id === id)).filter(Boolean);
  const uniqueJobs = Array.from(new Set(offers.map(o => o.jobId))).map(id => jobs.find(j => j.id === id)).filter(Boolean);

  const filterFields: FilterField[] = [
    { key: 'status', label: 'Offer Status', options: ['Draft', 'Approval Pending', 'Approved', 'Sent', 'Viewed', 'Accepted', 'Declined', 'Expired', 'Withdrawn'].map(s => ({ value: s, label: s })) },
    { key: 'clientId', label: 'Client', options: uniqueClients.map(c => ({ value: c!.id, label: c!.name })) },
    { key: 'jobId', label: 'Role / Job', options: uniqueJobs.map(j => ({ value: j!.id, label: j!.title })) },
    { key: 'expiryRisk', label: 'Expiry Risk', options: ['Expired', 'Expiring in 7 Days', 'Expiring in 30 Days', 'No Immediate Risk'].map(r => ({ value: r, label: r })) }
  ];

  // Composite search and filtering
  const filtered = offers.filter(offer => {
    const candidate = candidates.find(c => c.id === offer.candidateId);
    const client = clients.find(c => c.id === offer.clientId);
    const job = jobs.find(j => j.id === offer.jobId);

    // Search query matches
    const matchSearch = !searchTerm || 
      candidate?.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      client?.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      offer.offeredRole.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (job && job.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      offer.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
      offer.offeredCompensation.toLowerCase().includes(searchTerm.toLowerCase());

    // Filter values matches
    const matchStatus = !filters.status || offer.status === filters.status;
    const matchClient = !filters.clientId || offer.clientId === filters.clientId;
    const matchJob = !filters.jobId || offer.jobId === filters.jobId;
    
    // Expiry Risk filter matching
    const risk = getExpiryRisk(offer);
    const matchRisk = !filters.expiryRisk || risk === filters.expiryRisk;

    // Date range preset matches
    const matchDate = isDateInPreset(offer.proposedJoiningDate, datePreset, customStart, customEnd);

    return matchSearch && matchStatus && matchClient && matchJob && matchRisk && matchDate;
  });

  const activeFiltersCount = Object.values(filters).filter(Boolean).length + (datePreset !== 'All Time' ? 1 : 0);

  // Mark Accepted Handler
  const handleMarkAccepted = (offerId: string) => {
    updateOfferStatus(offerId, 'Accepted');
    triggerToast('Offer status updated to Accepted!');
    
    if (selectedOffer && selectedOffer.id === offerId) {
      setSelectedOffer(prev => prev ? { ...prev, status: 'Accepted' } : null);
    }
  };

  // Mark Withdrawn Handler
  const handleMarkWithdrawn = (offerId: string) => {
    updateOfferStatus(offerId, 'Withdrawn');
    triggerToast('Offer has been withdrawn.');
    
    if (selectedOffer && selectedOffer.id === offerId) {
      setSelectedOffer(prev => prev ? { ...prev, status: 'Withdrawn' } : null);
    }
  };

  // Reopen Offer Handler
  const handleReopenOffer = (offerId: string) => {
    updateOfferStatus(offerId, 'Draft');
    triggerToast('Offer status reverted to Draft.');
    
    if (selectedOffer && selectedOffer.id === offerId) {
      setSelectedOffer(prev => prev ? { ...prev, status: 'Draft' } : null);
    }
  };

  // Reject Submit Handler
  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOffer) return;
    if (!rejectionReason.trim()) {
      setFormError('Rejection reason is required.');
      return;
    }

    updateOfferStatus(selectedOffer.id, 'Declined', { 
      rejectionReason: rejectionReason.trim(),
      rejectedAt: new Date().toISOString()
    });

    triggerToast('Offer has been marked as Rejected.');
    setActiveModal(null);
    setSelectedOffer(null);
    setRejectionReason('');
    setFormError('');
  };

  // Expiry Extension Submit Handler
  const handleExtendExpirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOffer) return;
    if (!newExpiryDate) {
      setFormError('New expiry date is required.');
      return;
    }
    
    const selectedDate = new Date(newExpiryDate);
    const today = new Date();
    today.setHours(0,0,0,0);
    
    if (selectedDate < today) {
      setFormError('Expiry date must be in the future.');
      return;
    }

    extendOfferExpiry(selectedOffer.id, newExpiryDate + 'T23:59:59Z');
    triggerToast('Offer expiry date extended successfully!');
    setActiveModal(null);
    setSelectedOffer(null);
    setNewExpiryDate('');
    setFormError('');
  };

  // Start Onboarding Submit Handler
  const handleStartOnboardingSubmit = () => {
    if (!selectedOffer) return;
    
    const res = startOnboardingFromOffer(selectedOffer.id);
    if (!res.success) {
      triggerToast(res.error || 'Onboarding start failed.', 'error');
      setFormError(res.error || 'Onboarding start failed.');
      return;
    }

    triggerToast('Onboarding created and linked successfully!');
    setActiveModal(null);
    setSelectedOffer(null);
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

      <div className="flex justify-between items-center">
        <p className="text-slate-600">Track offer approvals, sent offers, expiry risk, and accepted client-deployment offers.</p>
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
              Proposed Joining Date: {datePreset === 'Custom' ? `${customStart || 'Any'} to ${customEnd || 'Any'}` : datePreset}
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
                <th className="px-6 py-4">Candidate & Client</th>
                <th className="px-6 py-4">Offered Role</th>
                <th className="px-6 py-4">Compensation</th>
                <th className="px-6 py-4">Joining Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(offer => {
                const candidate = candidates.find(c => c.id === offer.candidateId);
                const job = jobs.find(j => j.id === offer.jobId);
                const client = clients.find(c => c.id === offer.clientId);
                const risk = getExpiryRisk(offer);

                return (
                  <tr key={offer.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{candidate?.fullName}</div>
                      <div className="text-xs text-slate-500 mt-1">{client?.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-800 font-medium">{offer.offeredRole}</div>
                      <div className="text-xs text-slate-500 mt-1">{offer.contractDuration}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-800 font-semibold">
                      {offer.offeredCompensation}
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {formatDate(offer.proposedJoiningDate)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={cn(
                          "inline-flex items-center w-fit px-2.5 py-0.5 rounded text-xs font-semibold border",
                          offer.status === 'Accepted' ? "bg-green-50 text-green-700 border-green-200" :
                          offer.status === 'Sent' || offer.status === 'Viewed' ? "bg-blue-50 text-blue-700 border-blue-200" :
                          offer.status === 'Approval Pending' ? "bg-amber-50 text-amber-700 border-amber-200" :
                          offer.status === 'Declined' || offer.status === 'Expired' ? "bg-red-50 text-red-700 border-red-200" :
                          "bg-slate-50 text-slate-600 border-slate-200"
                        )}>
                          {offer.status}
                        </span>
                        {offer.status === 'Sent' && offer.expiryDate && (
                          <span className={cn(
                            "inline-flex items-center w-fit gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded",
                            risk === 'Expired' ? "bg-red-50 text-red-600 border border-red-100" :
                            risk === 'Expiring in 7 Days' ? "bg-amber-50 text-amber-700 border border-amber-100 animate-pulse" :
                            "text-slate-500"
                          )}>
                            <AlertCircle className="w-3 h-3" /> Exp: {formatDate(offer.expiryDate)}
                          </span>
                        )}
                        {offer.onboardingStarted && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-green-600 font-semibold">
                            <CheckCircle2 className="w-3 h-3" /> Onboarding Started
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <button 
                          onClick={() => {
                            setSelectedOffer(offer);
                            setActiveModal('view');
                          }} 
                          className="text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 bg-white px-2.5 py-1.5 rounded flex items-center gap-1 shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </button>
                        
                        {offer.status === 'Accepted' && (
                          offer.onboardingStarted ? (
                            <Link 
                              to="/onboarding" 
                              className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1.5 border border-blue-200 rounded shadow-sm inline-flex items-center"
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
                              className="text-xs font-medium text-white bg-green-600 hover:bg-green-700 px-2.5 py-1.5 rounded shadow-sm"
                            >
                              Start Onboarding
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
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
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

              {/* Status Action Buttons */}
              <div className="pt-6 border-t border-slate-100 flex flex-wrap gap-2 justify-end bg-white">
                {selectedOffer.status === 'Draft' && (
                  <button 
                    onClick={() => {
                      updateOfferStatus(selectedOffer.id, 'Approval Pending');
                      triggerToast('Offer submitted for approvals review.');
                      setSelectedOffer(prev => prev ? { ...prev, status: 'Approval Pending' } : null);
                    }}
                    className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                  >
                    Submit for Approval
                  </button>
                )}

                {selectedOffer.status === 'Approval Pending' && (
                  <>
                    <button 
                      onClick={() => {
                        updateOfferStatus(selectedOffer.id, 'Approved', { approvedBy: 'Priya Desai' });
                        triggerToast('Offer approved successfully!');
                        setSelectedOffer(prev => prev ? { ...prev, status: 'Approved', approvedBy: 'Priya Desai' } : null);
                      }}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-sm"
                    >
                      Approve Offer
                    </button>
                    <button 
                      onClick={() => setActiveModal('reject_confirm')}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg"
                    >
                      Reject Offer
                    </button>
                  </>
                )}

                {selectedOffer.status === 'Approved' && (
                  <button 
                    onClick={() => {
                      updateOfferStatus(selectedOffer.id, 'Sent', { sentDate: new Date().toISOString() });
                      triggerToast('Offer letter sent to candidate!');
                      setSelectedOffer(prev => prev ? { ...prev, status: 'Sent', sentDate: new Date().toISOString() } : null);
                    }}
                    className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" /> Dispatch Offer
                  </button>
                )}

                {selectedOffer.status === 'Sent' && (
                  <>
                    <button 
                      onClick={() => handleMarkAccepted(selectedOffer.id)}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-sm"
                    >
                      Mark Accepted
                    </button>
                    <button 
                      onClick={() => setActiveModal('reject_confirm')}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg shadow-sm"
                    >
                      Mark Rejected
                    </button>
                    <button 
                      onClick={() => setActiveModal('extend_expiry')}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-sm"
                    >
                      Extend Expiry
                    </button>
                    <button 
                      onClick={() => handleMarkWithdrawn(selectedOffer.id)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                    >
                      Withdraw
                    </button>
                  </>
                )}

                {selectedOffer.status === 'Accepted' && (
                  <>
                    {selectedOffer.onboardingStarted ? (
                      <Link 
                        to="/onboarding" 
                        className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm inline-flex items-center gap-1.5"
                      >
                        View Onboarding Folder
                      </Link>
                    ) : (
                      <button 
                        onClick={() => {
                          setFormError('');
                          setActiveModal('onboarding_confirm');
                        }}
                        className="px-4 py-2 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-sm"
                      >
                        Start Onboarding Case
                      </button>
                    )}
                  </>
                )}

                {['Declined', 'Expired', 'Withdrawn'].includes(selectedOffer.status) && (
                  <button 
                    onClick={() => handleReopenOffer(selectedOffer.id)}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-350 hover:bg-slate-50 rounded-lg shadow-sm flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Reopen / Reset to Draft
                  </button>
                )}

                <button 
                  onClick={() => { setActiveModal(null); setSelectedOffer(null); }}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Close
                </button>
              </div>
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

      {/* REJECT OFFER MODAL */}
      {activeModal === 'reject_confirm' && selectedOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Decline / Reject Offer</h3>
            </div>
            
            <form onSubmit={handleRejectSubmit} className="space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" />
                  {formError}
                </div>
              )}
              
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Reason for Rejection / Declining *
                </label>
                <textarea 
                  rows={3} 
                  required
                  value={rejectionReason} 
                  onChange={e => setRejectionReason(e.target.value)} 
                  placeholder="Explain why the candidate declined or why the offer was rejected..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-sm resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => { setActiveModal(null); setRejectionReason(''); setFormError(''); }}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                >
                  Reject Offer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EXTEND EXPIRY MODAL */}
      {activeModal === 'extend_expiry' && selectedOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Extend Offer Expiry</h3>
            </div>
            
            <form onSubmit={handleExtendExpirySubmit} className="space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" />
                  {formError}
                </div>
              )}
              
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  New Expiry Date *
                </label>
                <input 
                  type="date" 
                  required
                  value={newExpiryDate} 
                  onChange={e => setNewExpiryDate(e.target.value)} 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => { setActiveModal(null); setNewExpiryDate(''); setFormError(''); }}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Save Expiry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
