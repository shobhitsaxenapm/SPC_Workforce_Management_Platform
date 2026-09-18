import React, { useState, useMemo, useEffect } from 'react';
import { Application, Candidate } from '../types';
import { useApp } from '../context/AppContext';
import { FileText, Eye, CheckCircle2, XCircle, ArrowRightCircle } from 'lucide-react';
import ResumeModal from './ResumeModal';
import { cn, formatDate } from '../lib/utils';
import ApplicantFilterToolbar, { ApplicantFilters, createEmptyFilters } from './ApplicantFilterToolbar';
import { isDateInPreset } from '../lib/dateUtils';
import { SearchX } from 'lucide-react';

interface JobApplicantsTabProps {
  jobId: string;
  applications: Application[];
  candidates: Candidate[];
}

export default function JobApplicantsTab({ jobId, applications, candidates }: JobApplicantsTabProps) {
  const { updateApplicationStage, setQuickViewCandidateId } = useApp();
  const [viewResumeId, setViewResumeId] = useState<string | null>(null);
  const [filters, setFilters] = useState<ApplicantFilters>(createEmptyFilters());

  // Reset filters when changing jobs
  useEffect(() => {
    setFilters(createEmptyFilters());
  }, [jobId]);

  // Compute available locations and statuses based on current applicants
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

  const handleMoveToScreening = (appId: string) => {
    updateApplicationStage(appId, 'Screening');
  };

  const handleReject = (appId: string) => {
    const confirmed = window.confirm('Are you sure you want to reject this applicant?');
    if (confirmed) {
      updateApplicationStage(appId, 'Application Rejected');
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      <ApplicantFilterToolbar 
        filters={filters} 
        onChange={setFilters} 
        availableLocations={availableLocations} 
        availableStatuses={availableStatuses} 
      />
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-medium text-slate-500">
          Showing {filteredApplications.length} of {applications.length} applicants
        </span>
      </div>
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-xs">
            <tr>
              <th className="px-4 py-4 pl-6">Candidate Details</th>
              <th className="px-4 py-4">Applied On</th>
              <th className="px-4 py-4">Application Status</th>
              <th className="px-4 py-4 text-right pr-6">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredApplications.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-500">
                    <SearchX className="w-10 h-10 text-slate-300 mb-3" />
                    <p className="text-sm font-medium text-slate-900 mb-1">No applicants found</p>
                    <p className="text-xs text-slate-500 mb-4">Try adjusting your filters or search query.</p>
                    {(filters.searchQuery || filters.locations.length > 0 || filters.statuses.length > 0 || filters.appliedOn) && (
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
                      {formatDate(app.appliedDate)}
                      <div className="text-xs text-slate-400 mt-1">{app.source}</div>
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
                            <button
                              onClick={() => handleMoveToScreening(app.id)}
                              className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                              title="Move to Screening"
                            >
                              <ArrowRightCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleReject(app.id)}
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
    </div>
  );
}
