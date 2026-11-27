import React, { useState } from 'react';
import { Search, AlertTriangle, Plus, X, CheckCircle2, Sparkles } from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { mockUsers } from '../data/mockData';
import FilterPanel, { FilterField } from './FilterPanel';
import SmartCandidateUpload from './SmartCandidateUpload';
import CandidateFormModal from './CandidateFormModal';
import { FileText, UserPlus, FileCheck, Trash2 } from 'lucide-react';
import Pagination from './Pagination';
import AiSparkleBadge from './AiSparkleBadge';

export default function CandidatesList() {
  const navigate = useNavigate();
  const { candidates, applications, jobs, clients, createCandidate, deleteCandidate } = useApp();
  const [showUpload, setShowUpload] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [candidateToDelete, setCandidateToDelete] = useState<any>(null);
  const [activePopoverId, setActivePopoverId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({
    stage: '',
    location: '',
    availability: '',
    designation: ''
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;



  const sources = [...new Set(candidates.map(c => c.source).filter(Boolean))] as string[];
  const locations = [...new Set(candidates.map(c => c.currentLocation).filter(Boolean))] as string[];
  const availabilities = [...new Set(candidates.map(c => c.noticePeriod).filter(Boolean))] as string[];



  const designations = [...new Set(candidates.map(c => c.currentRole).filter(Boolean))] as string[];

  const canonicalStages = ['Sourced', 'Screening', 'Interviewing', 'Selected', 'Offered', 'Hired', 'Joined', 'Rejected', 'Withdrawn'];

  const filterFields: FilterField[] = [
    { key: 'stage', label: 'Stage', options: canonicalStages.map(s => ({ value: s, label: s })) },
    { key: 'location', label: 'Location', options: locations.map(l => ({ value: l, label: l })) },
    { key: 'availability', label: 'Availability', options: availabilities.map(a => ({ value: a, label: a })) },
    { key: 'designation', label: 'Designation', options: designations.map(d => ({ value: d, label: d })) },
  ];

  const filteredCandidates = candidates.filter(c => {
    const candidateApps = applications.filter(a => a.candidateId === c.id);

    const matchSearch = !searchTerm ||
      c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.currentRole && c.currentRole.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.currentCompany && c.currentCompany.toLowerCase().includes(searchTerm.toLowerCase())) ||
      c.skills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase())) ||
      c.currentLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase());

    const matchLocation = !filters.location || c.currentLocation === filters.location;
    const matchAvailability = !filters.availability || c.noticePeriod === filters.availability;
    const matchStage = !filters.stage || candidateApps.some(a => a.currentStage === filters.stage);
    const matchDesignation = !filters.designation || c.currentRole === filters.designation;

    return matchSearch && matchLocation && matchAvailability && matchStage && matchDesignation;
  });

  const totalPages = Math.ceil(filteredCandidates.length / itemsPerPage);
  const paginatedCandidates = filteredCandidates.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters]);

  return (
    <div className="space-y-6 pt-2">
      <div className="flex justify-between items-center">
        <p className="text-slate-600">View candidate profiles and their applications across client jobs.</p>
        <button
          onClick={() => setShowUpload(true)}
          className="group flex items-center gap-2 pl-4 pr-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all shadow-sm hover:shadow"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Candidate</span>
          <AiSparkleBadge />
        </button>
      </div>

      {/* Search and Filters Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          <div className="relative w-full sm:w-[380px] md:w-[440px] shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, skills, role, location..."
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
          <div className="flex items-center justify-end">
            <FilterPanel
              fields={filterFields}
              values={filters}
              onChange={(k, v) => setFilters(prev => ({ ...prev, [k]: v }))}
              onClear={() => {
                setFilters({ stage: '', location: '', availability: '', designation: '' });
              }}
            />
          </div>
        </div>

        {Object.values(filters).some(Boolean) && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {filterFields.map(field => {
              const val = filters[field.key];
              if (!val) return null;
              return (
                <span
                  key={field.key}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200"
                >
                  {field.label}: {val}
                  <button
                    type="button"
                    onClick={() => setFilters({ ...filters, [field.key]: '' })}
                    className="hover:text-blue-900 focus:outline-none"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}
            <button
              type="button"
              onClick={() => setFilters({ stage: '', location: '', availability: '', designation: '' })}
              className="text-xs text-slate-500 hover:text-blue-600 font-medium px-2 py-1 rounded hover:bg-slate-100 transition-colors"
            >
              Clear all
            </button>
          </div>
        )}

        <div className="text-xs text-slate-500 font-medium flex items-center justify-between pt-2 border-t border-slate-100">
          <span>
            {(Object.values(filters).some(Boolean) || searchTerm.trim()) ? (
              filteredCandidates.length > 0 ? (
                <>Showing <span className="font-semibold text-slate-700">{filteredCandidates.length}</span> of <span className="font-semibold text-slate-700">{candidates.length}</span> candidates</>
              ) : (
                <>0 of <span className="font-semibold text-slate-700">{candidates.length}</span> candidates found</>
              )
            ) : (
              <>Total: <span className="font-semibold text-slate-700">{candidates.length}</span> candidates</>
            )}
          </span>
          {(Object.values(filters).some(Boolean) || searchTerm) && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setFilters({ stage: '', location: '', availability: '', designation: '' });
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              Reset View
            </button>
          )}
        </div>
      </div>

      {/* Candidates Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-medium">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Contact Info</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Current Role</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Present Company</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Location</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Total Experience</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedCandidates.map(candidate => {
                return (
                  <tr 
                    key={candidate.id} 
                    onClick={() => navigate(`/candidates/${candidate.id}`)}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                  >
                    <td className="px-4 py-3.5 align-middle">
                      <Link to={`/candidates/${candidate.id}`} className="block">
                        <span className="font-medium text-blue-600 hover:underline">{candidate.fullName}</span>
                        {candidate.code && (
                          <div className="text-[11px] font-mono text-slate-400 mt-0.5">{candidate.code}</div>
                        )}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 align-middle">
                      <p className="text-slate-800 text-sm font-medium">{candidate.email}</p>
                      <p className="text-slate-500 text-xs mt-0.5">{candidate.phone}</p>
                    </td>
                    <td className="px-4 py-3.5 align-middle">
                      <p className="text-slate-800 text-sm font-medium">{candidate.currentRole || '—'}</p>
                    </td>
                    <td className="px-4 py-3.5 align-middle">
                      <p className="text-slate-600 text-sm">{candidate.currentCompany || '—'}</p>
                    </td>
                    <td className="px-4 py-3.5 align-middle">
                      <p className="text-slate-600 text-sm">{candidate.currentLocation || '—'}</p>
                    </td>
                    <td className="px-4 py-3.5 align-middle">
                      <p className="text-slate-800 text-sm font-medium">{candidate.totalExperience || '—'}</p>
                    </td>
                    <td className="px-4 py-3.5 align-middle text-right">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setCandidateToDelete(candidate);
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors focus:outline-none"
                        title="Delete Candidate"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredCandidates.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-500">
                    No candidates match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Unified Pagination */}
        <Pagination
          currentPage={currentPage}
          totalItems={filteredCandidates.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          itemLabel="candidates"
        />
      </div>

      {/* Full-Screen Smart Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-2xl">
            <SmartCandidateUpload
              onExtractionSuccess={(data, meta) => {
                setExtractedData({
                  ...data,
                  resumeUrl: meta.originalFilename,
                  resumeFileUrl: meta.fileUrl,
                  rawResumeText: meta.rawResumeText,
                  sourceMetadata: meta,
                });
                setShowUpload(false);
                setShowReviewForm(true);
              }}
              onCancel={() => setShowUpload(false)}
            />
          </div>
        </div>
      )}

      {/* Full-Screen Review Form Modal with Side-by-Side Resume View */}
      {showReviewForm && extractedData && (
        <CandidateFormModal
          isOpen={showReviewForm}
          onClose={() => setShowReviewForm(false)}
          initialData={extractedData}
          isEditMode={false}
          uploadedFileUrl={extractedData.resumeFileUrl}
          rawResumeText={extractedData.rawResumeText}
          sourceMetadata={extractedData.sourceMetadata}
          onSaveSuccess={(candidateId) => {
            setShowReviewForm(false);
            navigate(`/candidates/${candidateId}`);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {candidateToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="p-6">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Candidate</h3>
              <p className="text-slate-500 text-sm">
                Are you sure you want to remove <span className="font-semibold text-slate-700">{candidateToDelete.fullName}</span>? This action cannot be undone and will remove all their applications from the system.
              </p>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
              <button
                onClick={() => setCandidateToDelete(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteCandidate(candidateToDelete.id);
                  setCandidateToDelete(null);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Candidate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
