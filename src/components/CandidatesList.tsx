import React, { useState } from 'react';
import { Search, AlertTriangle, Plus, X, CheckCircle2 } from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { mockUsers } from '../data/mockData';
import FilterPanel, { FilterField } from './FilterPanel';
import SmartCandidateUpload from './SmartCandidateUpload';
import CandidateFormModal from './CandidateFormModal';
import { FileText, UserPlus, FileCheck, Trash2 } from 'lucide-react';
import Pagination from './Pagination';

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
        <button onClick={() => setShowUpload(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
          <Plus className="w-4 h-4" />
          Add Candidate
        </button>
      </div>

      {/* Search and Filters Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row justify-between gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, skills, role, location..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
            />
          </div>
          <FilterPanel
            fields={filterFields}
            values={filters}
            onChange={(k, v) => setFilters({ ...filters, [k]: v })}
            onClear={() => {
              setFilters({ stage: '', location: '', availability: '', designation: '' });
            }}
          />
        </div>

        <div className="text-xs text-slate-500 font-medium flex items-center justify-between">
          <span>
            {filteredCandidates.length > 0 ? (
              <>Showing <span className="font-semibold text-slate-700">{((currentPage - 1) * itemsPerPage) + 1}–{Math.min(currentPage * itemsPerPage, filteredCandidates.length)}</span> of <span className="font-semibold text-slate-700">{filteredCandidates.length}</span> candidates</>
            ) : (
              '0 candidates found'
            )}
          </span>
        </div>
      </div>

      {/* Candidates Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50/60 border-b border-slate-200 text-slate-500 font-medium">
              <tr>
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider">Name</th>
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider">Contact Info</th>
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider">Current Role</th>
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider">Present Company</th>
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider">Location</th>
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider">Total Experience</th>
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedCandidates.map(candidate => {
                return (
                  <tr 
                    key={candidate.id} 
                    onClick={() => navigate(`/candidates/${candidate.id}`)}
                    className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                  >
                    <td className="px-5 py-3.5">
                      <Link to={`/candidates/${candidate.id}`} className="block">
                        <span className="font-medium text-blue-600 hover:underline">{candidate.fullName}</span>
                        {candidate.code && (
                          <div className="text-[11px] font-mono text-slate-400 mt-0.5">{candidate.code}</div>
                        )}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-slate-800 text-sm font-medium">{candidate.email}</p>
                      <p className="text-slate-500 text-xs mt-0.5">{candidate.phone}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-slate-800 text-sm font-medium">{candidate.currentRole || '—'}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-slate-600 text-sm">{candidate.currentCompany || '—'}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-slate-600 text-sm">{candidate.currentLocation || '—'}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-slate-800 text-sm font-medium">{candidate.totalExperience || '—'}</p>
                    </td>
                    <td className="px-5 py-3.5 text-right">
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
          <div className="relative w-full max-w-4xl max-h-[95vh] flex flex-col bg-slate-50 rounded-2xl shadow-xl overflow-hidden border border-slate-200">
            <button
              onClick={() => setShowUpload(false)}
              className="absolute top-4 right-4 z-10 p-2 bg-white text-slate-400 hover:text-slate-600 rounded-full shadow-sm hover:shadow border border-slate-200 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex-1 overflow-y-auto flex items-center justify-center p-8">
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
