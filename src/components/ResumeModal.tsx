import React from 'react';
import { X, FileText, Briefcase, GraduationCap, Code, Languages, Download } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface ResumeModalProps {
  candidateId: string;
  onClose: () => void;
}

export default function ResumeModal({ candidateId, onClose }: ResumeModalProps) {
  const { candidates } = useApp();
  const candidate = candidates.find(c => c.id === candidateId);

  if (!candidate) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">{candidate.fullName} - Structured Resume</h2>
              <p className="text-xs text-slate-500">Parsed from {candidate.resumeUrl || 'Manual Entry'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {candidate.resumeUrl && (
              <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200">
                <Download className="w-4 h-4" /> Original PDF
              </button>
            )}
            <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50/50">
          <div className="max-w-3xl mx-auto space-y-8 bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
            
            {/* Header Info */}
            <div className="border-b border-slate-200 pb-6">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">{candidate.fullName}</h1>
              <h2 className="text-lg font-medium text-blue-600 mb-4">{candidate.currentRole || 'No Role Specified'}</h2>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
                <span>{candidate.email}</span>
                <span>{candidate.phone}</span>
                <span>{candidate.currentLocation}</span>
              </div>
            </div>

            {/* Summary */}
            {candidate.professionalSummary && (
              <section>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" /> Professional Summary
                </h3>
                <p className="text-slate-600 leading-relaxed text-sm whitespace-pre-wrap">
                  {candidate.professionalSummary}
                </p>
              </section>
            )}

            {/* Experience */}
            {candidate.employmentHistory && candidate.employmentHistory.length > 0 && (
              <section>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-slate-400" /> Work Experience
                </h3>
                <div className="space-y-6">
                  {candidate.employmentHistory.map((exp, idx) => (
                    <div key={idx} className="relative pl-4 before:absolute before:left-0 before:top-2 before:bottom-0 before:w-0.5 before:bg-slate-200 last:before:hidden">
                      <div className="absolute left-[-4px] top-2 w-2 h-2 rounded-full bg-blue-500 ring-4 ring-white" />
                      <div className="mb-1">
                        <h4 className="font-semibold text-slate-800">{exp.role}</h4>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600 mt-1">
                          <span className="font-medium">{exp.company}</span>
                          <span>•</span>
                          <span>{exp.startDate} - {exp.endDate}</span>
                          {exp.location && (
                            <>
                              <span>•</span>
                              <span>{exp.location}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Skills */}
              {candidate.skills && candidate.skills.length > 0 && (
                <section>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Code className="w-4 h-4 text-slate-400" /> Top Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {candidate.skills.map((skill, idx) => (
                      <span key={idx} className="px-2.5 py-1 bg-slate-100 text-slate-700 text-sm font-medium rounded border border-slate-200">
                        {skill}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {/* Education */}
              {candidate.education && (
                <section>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-slate-400" /> Education
                  </h3>
                  <div className="text-sm text-slate-600">
                    {candidate.education}
                  </div>
                </section>
              )}
            </div>
            
            {/* Languages */}
            {candidate.languages && candidate.languages.length > 0 && (
              <section>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Languages className="w-4 h-4 text-slate-400" /> Languages
                </h3>
                <div className="flex gap-4 text-sm text-slate-600">
                  {candidate.languages.join(', ')}
                </div>
              </section>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
