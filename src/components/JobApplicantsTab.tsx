import React, { useState, useMemo, useEffect } from 'react';
import { Application, Candidate, CANONICAL_SOURCES } from '../types';
import { useApp } from '../context/AppContext';
import { FileText, Eye, CheckCircle2, XCircle, ArrowRight, SearchX, RefreshCw, UserPlus, AlertTriangle, X } from 'lucide-react';
import ResumeModal from './ResumeModal';
import { cn, formatDate } from '../lib/utils';
import ApplicantFilterToolbar, { ApplicantFilters, createEmptyFilters } from './ApplicantFilterToolbar';
import { isDateInPreset } from '../lib/dateUtils';
import SourceBadge from './SourceBadge';

interface JobApplicantsTabProps {
  jobId: string;
  applications: Application[];
  candidates: Candidate[];
}

export default function JobApplicantsTab({ jobId, applications, candidates }: JobApplicantsTabProps) {
  const { updateApplicationStage, setQuickViewCandidateId } = useApp();
  const [viewResumeId, setViewResumeId] = useState<string | null>(null);
  const [filters, setFilters] = useState<ApplicantFilters>(createEmptyFilters());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [applicantToMove, setApplicantToMove] = useState<{ app: Application; candidate: Candidate } | null>(null);
  const [applicantToReject, setApplicantToReject] = useState<{ app: Application; candidate: Candidate } | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('Skills Mismatch');
  const [rejectionNotes, setRejectionNotes] = useState<string>('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Reset filters when changing jobs
  useEffect(() => {
    setFilters(createEmptyFilters());
  }, [jobId]);

  // Compute available locations, statuses and sources based on current applicants
  const availableSources = useMemo(() => {
    const s = new Set<string>();
    CANONICAL_SOURCES.forEach(src => s.add(src));
    applications.forEach(app => {
      if (app.source) s.add(app.source);
    });
    return Array.from(s);
  }, [applications]);

  const availableLocations = useMemo(() => {
    const locs = new Set<string>();
    applications.forEach(app => {
      const candidate = candidates.find(c => c.id === app.candidateId);
      if (candidate?.currentLocation) locs.add(candidate.currentLocation);
    });
    return Array.from(locs).sort();
  }, [applications, candidates]);

  const availableStatuses = useMemo(() => {
    const sts = new Set<string>();
    applications.forEach(app => {
      const isMovedToPipeline = !['New', 'Under Review', 'Application Rejected'].includes(app.currentStage);
      sts.add(isMovedToPipeline ? 'Moved to Pipeline' : app.currentStage);
    });
    return Array.from(sts).sort();
  }, [applications]);

  // Filter applications
  const filteredApplications = useMemo(() => {
    return applications.filter(app => {
      const candidate = candidates.find(c => c.id === app.candidateId);
      if (!candidate) return false;

      // Search (Name, Email, Phone)
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        const name = (candidate.fullName || '').toLowerCase();
        const email = (candidate.email || '').toLowerCase();
        const phone = (candidate.phone || '').toLowerCase();
        if (!name.includes(q) && !email.includes(q) && !phone.includes(q)) {
          return false;
        }
      }

      // Source
      if (filters.sources && filters.sources.length > 0) {
        if (!filters.sources.includes(app.source)) {
          return false;
        }
      }

      // Location
      if (filters.locations.length > 0) {
        if (!candidate.currentLocation || !filters.locations.includes(candidate.currentLocation)) {
          return false;
        }
      }

      // Status
      if (filters.statuses.length > 0) {
        const isMovedToPipeline = !['New', 'Under Review', 'Application Rejected'].includes(app.currentStage);
        const displayStatus = isMovedToPipeline ? 'Moved to Pipeline' : app.currentStage;
        if (!filters.statuses.includes(displayStatus)) {
          return false;
        }
      }

      // Applied On
      if (filters.appliedOn) {
        if (!isDateInPreset(app.appliedDate, filters.appliedOn, filters.customStartDate, filters.customEndDate)) {
          return false;
        }
      }

      return true;
    });
  }, [applications, candidates, filters]);

  // We only show website applications in this tab. The logic to filter them can be handled here or in JobDetail,
  // but to be safe we'll show whatever applications are passed in.
  
  const handleMarkUnderReview = (appId: string) => {
    updateApplicationStage(appId, 'Under Review');
  };

  const handleConfirmMoveToPipeline = () => {
    if (!applicantToMove) return;
    updateApplicationStage(applicantToMove.app.id, 'Sourced');
    setToast({ message: `${applicantToMove.candidate.fullName} has been moved to Pipeline (Sourced).`, type: 'success' });
    setApplicantToMove(null);
    setTimeout(() => setToast(null), 3500);
  };

  const handleConfirmReject = () => {
    if (!applicantToReject) return;
    const fullReason = rejectionNotes.trim() ? `${rejectionReason}: ${rejectionNotes.trim()}` : rejectionReason;
    updateApplicationStage(applicantToReject.app.id, 'Application Rejected', undefined, fullReason);
    setToast({ message: `${applicantToReject.candidate.fullName}'s application has been rejected.`, type: 'success' });
    setApplicantToReject(null);
    setRejectionNotes('');
    setTimeout(() => setToast(null), 3500);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate database check
    await new Promise(r => setTimeout(r, 1200));
    setIsRefreshing(false);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      <ApplicantFilterToolbar 
        filters={filters} 
        onChange={setFilters} 
        availableLocations={availableLocations} 
        availableStatuses={availableStatuses}
        availableSources={availableSources}
      />
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-medium text-slate-500">
          Showing {filteredApplications.length} of {applications.length} applicants
        </span>
        <button 
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={cn("w-4 h-4", isRefreshing ? "animate-spin text-blue-500" : "text-slate-400")} />
          Refresh
        </button>
      </div>
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-xs">
            <tr>
              <th className="px-4 py-4 pl-6">Candidate Details</th>
              <th className="px-4 py-4">Source</th>
              <th className="px-4 py-4">Applied On</th>
              <th className="px-4 py-4">Application Status</th>
              <th className="px-4 py-4 text-right pr-6">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredApplications.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-500">
                    <SearchX className="w-10 h-10 text-slate-300 mb-3" />
                    <p className="text-sm font-medium text-slate-900 mb-1">No applicants found</p>
                    <p className="text-xs text-slate-500 mb-4">Try adjusting your filters or search query.</p>
                    {(filters.searchQuery || filters.locations.length > 0 || filters.statuses.length > 0 || (filters.sources && filters.sources.length > 0) || filters.appliedOn) && (
                      <button 
                        onClick={() => setFilters(createEmptyFilters())}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Clear all filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredApplications.map((app) => {
                const candidate = candidates.find((c) => c.id === app.candidateId);
                if (!candidate) return null;

                const isMovedToPipeline = !['New', 'Under Review', 'Application Rejected'].includes(app.currentStage);

                return (
                  <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4 pl-6 align-top">
                      <div className="font-medium text-slate-900 mb-1">{candidate.fullName}</div>
                      <div className="text-xs text-slate-500 space-y-0.5">
                        <div className="flex gap-2">
                          <span className="truncate max-w-[150px]" title={candidate.email}>{candidate.email}</span>
                          <span>•</span>
                          <span>{candidate.phone}</span>
                        </div>
                        <div>{candidate.currentLocation}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <SourceBadge source={app.source} />
                    </td>
                    <td className="px-4 py-4 align-top">
                      <span className="font-medium text-slate-700">{formatDate(app.appliedDate)}</span>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <span
                        className={cn(
                          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
                          app.currentStage === 'New'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : app.currentStage === 'Under Review'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : app.currentStage === 'Application Rejected'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-purple-50 text-purple-700 border-purple-200'
                        )}
                      >
                        {isMovedToPipeline ? 'Moved to Pipeline' : app.currentStage}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-top text-right pr-6">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setQuickViewCandidateId(candidate.id)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setViewResumeId(candidate.id)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Resume"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        
                        {!isMovedToPipeline && app.currentStage !== 'Application Rejected' && (
                          <>
                            <div className="w-px h-4 bg-slate-200 mx-1" />
                            {app.currentStage === 'New' && (
                              <button
                                onClick={() => handleMarkUnderReview(app.id)}
                                className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                title="Mark Under Review"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                            )}
                            {!isMovedToPipeline && (
                              <button 
                                onClick={() => setApplicantToMove({ app, candidate })}
                                className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors border border-blue-200"
                                title="Move to Pipeline"
                              >
                                <ArrowRight className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setApplicantToReject({ app, candidate });
                                setRejectionReason('Skills Mismatch');
                                setRejectionNotes('');
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Reject Application"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      </div>

      {viewResumeId && (
        <ResumeModal candidateId={viewResumeId} onClose={() => setViewResumeId(null)} />
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-[70] animate-slide-in-right">
          <div className={cn(
            "flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium",
            toast.type === 'success' 
              ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
              : "bg-red-50 border-red-200 text-red-800"
          )}>
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Move to Pipeline Confirmation Modal */}
      {applicantToMove && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Move Applicant to Pipeline</h3>
                  <p className="text-xs text-slate-500">Advance to active recruitment</p>
                </div>
              </div>
              <button 
                onClick={() => setApplicantToMove(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600">
                Are you sure you want to move <strong className="text-slate-900">{applicantToMove.candidate.fullName}</strong> into the active pipeline?
              </p>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-xs text-slate-500">Applicant</div>
                    <div className="text-sm font-semibold text-slate-900">{applicantToMove.candidate.fullName}</div>
                    <div className="text-xs text-slate-600">{applicantToMove.candidate.email} • {applicantToMove.candidate.phone}</div>
                  </div>
                  <SourceBadge source={applicantToMove.app.source} compact />
                </div>
                <div className="text-xs text-slate-500 pt-2 border-t border-slate-200">
                  Location: <span className="text-slate-800 font-medium">{applicantToMove.candidate.currentLocation || 'N/A'}</span> • Experience: <span className="text-slate-800 font-medium">{applicantToMove.candidate.totalExperience || 'N/A'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-blue-50/50 border border-blue-100 rounded-lg p-2.5">
                <div>
                  <span className="text-slate-500 block">Current Stage:</span>
                  <span className="font-semibold text-slate-700">{applicantToMove.app.currentStage}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Target Stage:</span>
                  <span className="font-semibold text-blue-700">Sourced</span>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setApplicantToMove(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmMoveToPipeline}
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm inline-flex items-center gap-1.5"
              >
                <ArrowRight className="w-4 h-4" />
                Confirm & Move to Pipeline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Applicant Confirmation Modal */}
      {applicantToReject && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center font-bold">
                  <XCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Reject Application</h3>
                  <p className="text-xs text-slate-500">Record rejection reason</p>
                </div>
              </div>
              <button 
                onClick={() => setApplicantToReject(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600">
                Are you sure you want to reject the application for <strong className="text-slate-900">{applicantToReject.candidate.fullName}</strong>?
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Rejection Reason *
                </label>
                <select
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-100 focus:border-red-400 outline-none"
                >
                  <option value="Skills Mismatch">Skills Mismatch</option>
                  <option value="Experience Inadequate">Experience Inadequate</option>
                  <option value="Location Incompatible">Location Incompatible</option>
                  <option value="Notice Period Too Long">Notice Period Too Long</option>
                  <option value="Salary Expectations Unaligned">Salary Expectations Unaligned</option>
                  <option value="Incomplete Application">Incomplete Application</option>
                  <option value="Candidate Withdrew">Candidate Withdrew</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={rejectionNotes}
                  onChange={e => setRejectionNotes(e.target.value)}
                  placeholder="Provide context or internal feedback..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-100 focus:border-red-400 outline-none resize-none"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setApplicantToReject(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-sm"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
