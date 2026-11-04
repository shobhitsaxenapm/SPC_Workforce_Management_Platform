import React, { useState } from 'react';
import { Candidate } from '../types';
import { FileText, FileCode, Eye, Download, Copy, Check, ExternalLink, Sparkles, Building, Briefcase, GraduationCap, MapPin, Mail, Phone, Globe } from 'lucide-react';
import { cn } from '../lib/utils';

interface ResumePreviewPaneProps {
  candidate: Partial<Candidate>;
  resumeUrl?: string;
  resumeFileUrl?: string;
  rawResumeText?: string;
  fileName?: string;
  fileSize?: number | string;
  mimeType?: string;
}

export default function ResumePreviewPane({
  candidate,
  resumeUrl,
  resumeFileUrl,
  rawResumeText,
  fileName,
  fileSize,
  mimeType = 'application/pdf',
}: ResumePreviewPaneProps) {
  const [activeTab, setActiveTab] = useState<'document' | 'pdf' | 'raw'>('document');
  const [copied, setCopied] = useState(false);

  const displayName = fileName || candidate.resumeUrl || resumeUrl || 'Uploaded_Resume.pdf';
  const isPdf = mimeType.includes('pdf') || displayName.toLowerCase().endsWith('.pdf') || (resumeFileUrl && resumeFileUrl.includes('pdf'));

  // Default raw text if not explicitly provided
  const resolvedRawText = rawResumeText || [
    candidate.fullName?.toUpperCase() || 'AMIT SHARMA',
    `Email: ${candidate.email || 'amit.sharma@example.com'} | Phone: ${candidate.phone || '+91 90000 00001'}`,
    `Location: ${candidate.currentLocation || 'Gurugram, Haryana'}`,
    '',
    'PROFESSIONAL SUMMARY',
    candidate.professionalSummary || 'Experienced professional with proven track record in operations and logistics.',
    '',
    'WORK EXPERIENCE',
    ...(candidate.employmentHistory || []).map((exp, i) => [
      `${i + 1}. ${exp.company} — ${exp.role}`,
      `   ${exp.location ? exp.location + ' | ' : ''}${exp.startDate || ''} - ${exp.endDate || 'Present'}`,
      ...(exp.responsibilities || []).map(r => `   • ${r}`),
      ''
    ].join('\n')),
    'EDUCATION',
    ...(candidate.educationEntries || []).map(ed => 
      `• ${ed.qualification} — ${ed.institution}${ed.completionYear ? ` (${ed.completionYear})` : ''}`
    ),
    '',
    'SKILLS',
    (candidate.skills || []).join(', '),
    '',
    'LANGUAGES',
    (candidate.languages || []).join(', ')
  ].join('\n');

  const handleCopyRawText = () => {
    navigator.clipboard.writeText(resolvedRawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-100/70 border-r border-slate-200 overflow-hidden">
      {/* Pane Toolbar */}
      <div className="px-4 py-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 flex-shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 border border-blue-100">
            <FileText className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-slate-800 truncate max-w-[200px]" title={displayName}>
                {displayName}
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-600 rounded">
                {isPdf ? 'PDF' : 'DOCX'}
              </span>
            </div>
            {fileSize && (
              <span className="text-[11px] text-slate-400">
                {typeof fileSize === 'number' ? `${(fileSize / (1024 * 1024)).toFixed(2)} MB` : fileSize}
              </span>
            )}
          </div>
        </div>

        {/* View mode segmented switcher */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('document')}
            className={cn(
              "px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1.5",
              activeTab === 'document' 
                ? "bg-white text-blue-600 shadow-sm" 
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Document</span>
          </button>

          {resumeFileUrl && (
            <button
              type="button"
              onClick={() => setActiveTab('pdf')}
              className={cn(
                "px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1.5",
                activeTab === 'pdf' 
                  ? "bg-white text-blue-600 shadow-sm" 
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>PDF Embed</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('raw')}
            className={cn(
              "px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1.5",
              activeTab === 'raw' 
                ? "bg-white text-blue-600 shadow-sm" 
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Raw Text</span>
          </button>
        </div>
      </div>

      {/* Pane Content Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-5">
        {/* TAB 1: Structured Document View */}
        {activeTab === 'document' && (
          <div className="max-w-xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200/90 p-6 md:p-8 space-y-6 text-slate-800 relative">
            
            {/* Document Header */}
            <div className="border-b border-slate-200 pb-5 relative">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                    {candidate.fullName || 'Amit Sharma'}
                  </h1>
                  <p className="text-sm font-semibold text-blue-600 mt-0.5">
                    {candidate.currentRole || 'Warehouse Associate'}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    Verified
                  </span>
                  <span className="text-[10px] text-slate-400">Original Document</span>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                {candidate.email && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{candidate.email}</span>
                  </div>
                )}
                {candidate.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{candidate.phone}</span>
                  </div>
                )}
                {candidate.currentLocation && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{candidate.currentLocation}</span>
                  </div>
                )}
                {candidate.linkedInUrl && (
                  <div className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{candidate.linkedInUrl}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Professional Summary */}
            {candidate.professionalSummary && (
              <section className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    Professional Summary
                  </h3>
                  <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                    Parsed
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-slate-600 bg-slate-50/70 p-3 rounded-lg border border-slate-100">
                  {candidate.professionalSummary}
                </p>
              </section>
            )}

            {/* Work Experience */}
            {candidate.employmentHistory && candidate.employmentHistory.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                    Work Experience
                  </h3>
                  <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                    {candidate.employmentHistory.length} Role{candidate.employmentHistory.length > 1 ? 's' : ''} Parsed
                  </span>
                </div>

                <div className="space-y-4">
                  {candidate.employmentHistory.map((exp, idx) => (
                    <div key={idx} className="relative pl-3.5 border-l-2 border-blue-200 space-y-1">
                      <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-blue-600 ring-4 ring-white" />
                      <div className="flex items-baseline justify-between gap-2">
                        <h4 className="text-xs font-bold text-slate-900">{exp.role}</h4>
                        <span className="text-[11px] font-medium text-slate-500">{exp.startDate} – {exp.endDate || 'Present'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-600">
                        <span className="font-semibold text-slate-700">{exp.company}</span>
                        {exp.location && <span>• {exp.location}</span>}
                      </div>
                      {exp.responsibilities && exp.responsibilities.length > 0 && (
                        <ul className="list-disc list-inside text-[11px] text-slate-600 space-y-0.5 pt-1">
                          {exp.responsibilities.map((resp, rIdx) => (
                            <li key={rIdx} className="leading-snug">{resp}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Education */}
            {candidate.educationEntries && candidate.educationEntries.length > 0 && (
              <section className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                    Education
                  </h3>
                  <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                    Parsed
                  </span>
                </div>
                <div className="space-y-2">
                  {candidate.educationEntries.map((ed, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-50/70 rounded-lg border border-slate-100 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-slate-800">{ed.qualification}</p>
                        <p className="text-[11px] text-slate-500">{ed.institution}</p>
                      </div>
                      {ed.completionYear && (
                        <span className="text-[11px] font-medium text-slate-500">{ed.completionYear}</span>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Skills & Certifications */}
            {candidate.skills && candidate.skills.length > 0 && (
              <section className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    Skills Extracted
                  </h3>
                  <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                    {candidate.skills.length} Detected
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {candidate.skills.map((skill, idx) => (
                    <span 
                      key={idx} 
                      className="px-2 py-0.5 text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200/70 rounded"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Languages */}
            {candidate.languages && candidate.languages.length > 0 && (
              <section className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Languages
                </h3>
                <div className="flex flex-wrap gap-1.5 text-xs text-slate-600">
                  {candidate.languages.map((lang, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-slate-100 rounded text-[11px] font-medium text-slate-700">
                      {lang}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* TAB 2: Embedded PDF Preview */}
        {activeTab === 'pdf' && resumeFileUrl && (
          <div className="h-full min-h-[500px] flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span>PDF Viewer</span>
              <a
                href={resumeFileUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
              >
                <ExternalLink className="w-3 h-3" /> Open in New Tab
              </a>
            </div>
            <iframe
              src={resumeFileUrl}
              className="w-full flex-1 min-h-[500px] border-0"
              title="Uploaded Resume PDF"
            />
          </div>
        )}

        {/* TAB 3: Raw Extracted Text */}
        {activeTab === 'raw' && (
          <div className="h-full flex flex-col bg-slate-900 rounded-xl shadow-sm border border-slate-800 overflow-hidden text-slate-100 font-mono text-xs">
            <div className="px-4 py-2.5 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Raw Parsed Text Stream</span>
              <button
                type="button"
                onClick={handleCopyRawText}
                className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied' : 'Copy Text'}
              </button>
            </div>
            <div className="p-4 overflow-y-auto whitespace-pre-wrap leading-relaxed select-text text-slate-200">
              {resolvedRawText}
            </div>
          </div>
        )}
      </div>

      {/* Pane Footer Info */}
      <div className="px-4 py-2.5 bg-white border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 flex-shrink-0">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          Synchronized with AI Extractor
        </span>
        <button
          type="button"
          onClick={() => setActiveTab(activeTab === 'document' ? 'raw' : 'document')}
          className="text-blue-600 hover:underline font-medium"
        >
          {activeTab === 'document' ? 'Inspect Raw Text' : 'View Formatted Document'}
        </button>
      </div>
    </div>
  );
}
