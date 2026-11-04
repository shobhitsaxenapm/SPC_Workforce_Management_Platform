import React, { useState } from 'react';
import { Candidate, EmploymentEntry, EducationEntry } from '../types';
import { 
  X, CheckCircle, CheckCircle2, AlertTriangle, Plus, Trash2, Columns, FileText, 
  Edit3, Sparkles, Check, Info, FileCode, ExternalLink,
  Award, Briefcase, GraduationCap, MapPin, Mail, Phone, Globe, Eye
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useApp } from '../context/AppContext';
import OriginalResumeViewer, { defaultShobhitResume } from './OriginalResumeViewer';

interface CandidateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: Partial<Candidate>;
  isEditMode?: boolean;
  onSaveSuccess?: (candidateId: string) => void;
  uploadedFile?: File | null;
  uploadedFileUrl?: string | null;
  rawResumeText?: string;
  sourceMetadata?: {
    originalFilename?: string;
    mimeType?: string;
    size?: number;
  };
}

export default function CandidateFormModal({
  isOpen,
  onClose,
  initialData,
  isEditMode = false,
  onSaveSuccess,
  uploadedFile,
  uploadedFileUrl,
  rawResumeText,
  sourceMetadata,
}: CandidateFormModalProps) {
  const { createCandidate, updateCandidate, candidates } = useApp();
  
  // Layout mode: 'dual' (Side-by-side Left AI Template vs Right Original Resume), 'aiOnly', 'originalOnly'
  const [layoutMode, setLayoutMode] = useState<'dual' | 'aiOnly' | 'originalOnly'>('dual');

  // Flip card state for the Left Pane: false = AI Standardized Profile, true = Editable Form Inputs
  const [isLeftFlipped, setIsLeftFlipped] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);

  const resolvedFileName = sourceMetadata?.originalFilename || (initialData as any)?.sourceMetadata?.originalFilename || initialData.resumeUrl || 'Shobhit_Saxena_Resume.pdf';

  // Seed default with Shobhit Saxena if standard mock or partial
  const [formData, setFormData] = useState({
    fullName: initialData.fullName || defaultShobhitResume.fullName,
    email: initialData.email || defaultShobhitResume.email,
    phone: initialData.phone || defaultShobhitResume.phone,
    currentLocation: initialData.currentLocation || defaultShobhitResume.location,
    linkedInUrl: initialData.linkedInUrl || defaultShobhitResume.linkedInUrl || '',
    currentRole: initialData.currentRole || defaultShobhitResume.experience[0].role,
    currentCompany: initialData.currentCompany || defaultShobhitResume.experience[0].company,
    totalExperience: initialData.totalExperience || '4+ Years',
    professionalSummary: initialData.professionalSummary || defaultShobhitResume.summary,
    skills: initialData.skills?.join(', ') || [
      'AI Agents & Workflow Design',
      'Prompt Engineering & RAG',
      'Multi-Agent Orchestration',
      'Product Strategy & PRDs',
      'Semantic Search & OCR',
      'Python & REST APIs',
      ...defaultShobhitResume.skills.aiProduct,
      ...defaultShobhitResume.skills.product,
      ...defaultShobhitResume.skills.aiAndData,
      ...defaultShobhitResume.skills.technical,
      ...defaultShobhitResume.skills.tools
    ].filter((v, i, a) => a.indexOf(v) === i).join(', '),
    languages: initialData.languages?.join(', ') || 'English, Hindi',
    employmentHistory: initialData.employmentHistory && initialData.employmentHistory.length > 0 
      ? initialData.employmentHistory 
      : defaultShobhitResume.experience.map(e => ({
          company: e.company,
          role: e.role,
          location: e.location,
          startDate: e.duration.split('–')[0]?.trim() || e.duration.split('-')[0]?.trim(),
          endDate: e.duration.split('–')[1]?.trim() || e.duration.split('-')[1]?.trim() || 'Present',
          responsibilities: e.bullets
        })),
    educationEntries: initialData.educationEntries && initialData.educationEntries.length > 0
      ? initialData.educationEntries
      : defaultShobhitResume.education.map(ed => ({
          qualification: `${ed.degree}${ed.cgpa ? ` (CGPA: ${ed.cgpa})` : ''}`,
          institution: ed.institution,
          completionYear: ed.year.split('–')[1]?.trim() || ed.year
        })),
    currentSalary: initialData.currentSalary || '28.00',
    expectedSalary: initialData.expectedSalary || '35.00',
    noticePeriod: initialData.noticePeriod || '30 Days',
    customNoticePeriod: '',
    preferredLocation: initialData.preferredLocation || 'Bangalore, India',
    willingToRelocate: initialData.willingToRelocate || 'Yes',
    availableFrom: initialData.availableFrom || '',
    recruiterNotes: initialData.recruiterNotes || `Certifications: ${defaultShobhitResume.certifications.join(', ')}\nAchievement: ${defaultShobhitResume.achievement}`,
    resumeUrl: resolvedFileName,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [duplicateCandidateId, setDuplicateCandidateId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleToggleFlip = () => {
    setIsFlipping(true);
    setIsLeftFlipped(prev => !prev);
    setTimeout(() => setIsFlipping(false), 700);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full Name is required';
    if (!formData.email.trim() && !formData.phone.trim()) newErrors.contact = 'Email or Phone is required';
    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) newErrors.email = 'Invalid email format';
    if (formData.currentLocation.trim() === '') newErrors.currentLocation = 'Current Location is required';
    if (formData.currentRole.trim() === '') newErrors.currentRole = 'Current Role is required';
    if (formData.noticePeriod === 'Custom' && !formData.customNoticePeriod) newErrors.customNoticePeriod = 'Custom Notice Period in Days is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const checkForDuplicates = () => {
    if (isEditMode) return false;
    const normEmail = formData.email?.trim().toLowerCase();
    const normPhone = formData.phone?.replace(/[^0-9]/g, '');
    
    const dup = candidates.find(c => 
      (normEmail && c.email.trim().toLowerCase() === normEmail) ||
      (normPhone && c.phone.replace(/[^0-9]/g, '') === normPhone)
    );

    if (dup) {
      setDuplicateCandidateId(dup.id);
      setShowDuplicateWarning(true);
      return true;
    }
    return false;
  };

  const performSave = () => {
    const parsedSkills = formData.skills.split(',').map(s => s.trim()).filter(Boolean);
    const parsedLanguages = formData.languages.split(',').map(s => s.trim()).filter(Boolean);
    const finalNoticePeriod = formData.noticePeriod === 'Custom' ? `${formData.customNoticePeriod} Days` : formData.noticePeriod;
    
    if (isEditMode && initialData.id) {
      updateCandidate(initialData.id, {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        currentLocation: formData.currentLocation,
        linkedInUrl: formData.linkedInUrl,
        currentRole: formData.currentRole,
        currentCompany: formData.currentCompany,
        totalExperience: formData.totalExperience,
        professionalSummary: formData.professionalSummary,
        skills: parsedSkills,
        languages: parsedLanguages,
        employmentHistory: formData.employmentHistory,
        educationEntries: formData.educationEntries,
        currentSalary: formData.currentSalary,
        expectedSalary: formData.expectedSalary,
        noticePeriod: finalNoticePeriod,
        preferredLocation: formData.preferredLocation,
        willingToRelocate: formData.willingToRelocate as any,
        availableFrom: formData.availableFrom,
        recruiterNotes: formData.recruiterNotes,
        resumeUrl: formData.resumeUrl,
        rawResumeText: rawResumeText || (initialData as any)?.rawResumeText,
      });
    } else {
      const createResult = createCandidate({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        currentLocation: formData.currentLocation,
        linkedInUrl: formData.linkedInUrl,
        currentRole: formData.currentRole,
        currentCompany: formData.currentCompany,
        totalExperience: formData.totalExperience,
        professionalSummary: formData.professionalSummary,
        skills: parsedSkills,
        languages: parsedLanguages,
        employmentHistory: formData.employmentHistory,
        educationEntries: formData.educationEntries,
        currentSalary: formData.currentSalary,
        expectedSalary: formData.expectedSalary,
        noticePeriod: finalNoticePeriod,
        preferredLocation: formData.preferredLocation,
        willingToRelocate: formData.willingToRelocate as any,
        availableFrom: formData.availableFrom,
        recruiterNotes: formData.recruiterNotes,
        resumeUrl: formData.resumeUrl,
        rawResumeText: rawResumeText || (initialData as any)?.rawResumeText,
        source: 'Manual Entry',
        education: formData.educationEntries[0]?.qualification || '',
        createdMethod: 'Resume Upload',
      });
      if (createResult && createResult.success && createResult.candidateId) {
        onSaveSuccess?.(createResult.candidateId);
      }
    }
    onClose();
  };

  const handleSave = () => {
    if (!validate()) {
      if (!isLeftFlipped) {
        // Automatically flip to form so user sees validation errors
        setIsLeftFlipped(true);
      }
      return;
    }
    if (!showDuplicateWarning && checkForDuplicates()) return;
    performSave();
  };

  // Top 5-6 JD relevant skills
  const parsedSkillsList = formData.skills.split(',').map(s => s.trim()).filter(Boolean);
  const topJdSkills = parsedSkillsList.slice(0, 6);
  const extraSkillsCount = Math.max(0, parsedSkillsList.length - 6);

  // Top 3 JD-relevant experience highlights
  const topExperience = formData.employmentHistory.slice(0, 3);
  const extraExperienceCount = Math.max(0, formData.employmentHistory.length - 3);

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[1440px] h-[93vh] max-h-[93vh] flex flex-col relative border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Top Header Bar */}
        <div className="px-6 py-3.5 border-b border-slate-200 flex items-center justify-between bg-white z-20 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                  {isEditMode ? 'Edit Candidate Profile' : 'AI Dual-Resume Review & Verification'}
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  10 Parameters Extracted
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">
                Parallel comparison: <strong className="text-blue-600 font-semibold">Left</strong> = AI Standardized Profile • <strong className="text-slate-700 font-semibold">Right</strong> = Candidate Original Resume as-is.
              </p>
            </div>
          </div>

          {/* Center & Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* View Mode Segmented Controls */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setLayoutMode('dual')}
                className={cn(
                  "px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5",
                  layoutMode === 'dual' 
                    ? "bg-white text-blue-600 shadow-sm" 
                    : "text-slate-600 hover:text-slate-900"
                )}
                title="Parallel comparison view: AI Standardized Resume on Left, Original Resume on Right"
              >
                <Columns className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Dual Resume View</span>
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode('aiOnly')}
                className={cn(
                  "px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5",
                  layoutMode === 'aiOnly' 
                    ? "bg-white text-blue-600 shadow-sm" 
                    : "text-slate-600 hover:text-slate-900"
                )}
                title="Full-width AI Standardized Template"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden md:inline">AI Template Only</span>
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode('originalOnly')}
                className={cn(
                  "px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5",
                  layoutMode === 'originalOnly' 
                    ? "bg-white text-blue-600 shadow-sm" 
                    : "text-slate-600 hover:text-slate-900"
                )}
                title="Full-width Original Candidate Resume"
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Original Only</span>
              </button>
            </div>

            <button 
              onClick={onClose} 
              className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-lg transition-colors"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Body (Side-by-Side) */}
        <div className="flex-1 flex overflow-hidden min-h-0 bg-slate-100">
          
          {/* ========================================================================= */}
          {/* LEFT PANE: AI Workspace with 3D Card Transition                            */}
          {/* ========================================================================= */}
          {(layoutMode === 'dual' || layoutMode === 'aiOnly') && (
            <div 
              className={cn(
                "h-full relative overflow-hidden flex flex-col border-r border-slate-200/90",
                layoutMode === 'dual' ? "w-full lg:w-1/2" : "w-full"
              )}
              style={{ perspective: '1400px' }}
            >
              <div 
                className={cn(
                  "w-full h-full relative transition-transform duration-700 ease-in-out",
                  isFlipping && "pointer-events-none"
                )}
                style={{
                  transformStyle: 'preserve-3d',
                  transform: isLeftFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                }}
              >
                {/* ----------------------------------------------------------------- */}
                {/* FRONT FACE: AI Standardized Pre-defined Template Resume (10 params) */}
                {/* ----------------------------------------------------------------- */}
                <div 
                  className="absolute inset-0 w-full h-full flex flex-col bg-slate-50 overflow-hidden"
                  style={{
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                  }}
                >
                  {/* Left Pane Toolbar */}
                  <div className="px-4 py-3 bg-white border-b border-slate-200 flex items-center justify-between gap-2 flex-shrink-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                        AI
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 truncate">
                            Standardized Candidate Profile
                          </span>
                          <span className="px-1.5 py-0.2 text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 rounded">
                            EXECUTIVE FIT
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">10 Parameters Extracted from Document</p>
                      </div>
                    </div>

                    {/* Edit Action Trigger */}
                    <button
                      type="button"
                      onClick={handleToggleFlip}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                      title="Edit profile details"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Profile</span>
                    </button>
                  </div>

                  {/* Standardized Template Document Content */}
                  <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-100/60 flex justify-center">
                    <div className="w-full max-w-xl bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-7 space-y-5 text-slate-800">
                      
                      {/* Identity & Contact Card (Parameters 1 - 5) */}
                      <div className="border-b border-slate-200 pb-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                                Params 1–5: Candidate Overview
                              </span>
                            </div>
                            <h1 className="text-2xl font-bold text-slate-950 mt-1">{formData.fullName}</h1>
                            <p className="text-sm font-semibold text-blue-700 mt-0.5 flex items-center gap-1.5">
                              <span>{formData.currentRole}</span>
                              {formData.currentCompany && (
                                <span className="text-slate-500 font-normal">at {formData.currentCompany}</span>
                              )}
                            </p>
                          </div>
                          <span className="px-2.5 py-1 text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg flex items-center gap-1 flex-shrink-0">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> AI Parsed
                          </span>
                        </div>

                        <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 pt-2.5 border-t border-slate-100">
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                            <span className="truncate">{formData.email}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                            <span>{formData.phone}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                            <span>{formData.currentLocation}</span>
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium ml-1">
                              Relocate: {formData.willingToRelocate || 'Yes'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Briefcase className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                            <span>Total Exp: <strong className="text-slate-800">{formData.totalExperience}</strong></span>
                            <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded font-medium ml-1">Mid-Senior</span>
                          </div>
                        </div>
                      </div>

                      {/* Parameter 6: Professional & AI Fit Summary */}
                      <section className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-blue-600" />
                            AI Fit & Executive Summary
                          </h3>
                          <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                            Param 6 • Summary
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-justify">
                          {formData.professionalSummary}
                        </p>
                      </section>

                      {/* Parameter 7: Key Matched Skills (Top 5-6 JD relevant) */}
                      <section className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                            Core Matched Skills (JD-Aligned)
                          </h3>
                          <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                            Param 7 • {topJdSkills.length} Skills
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {topJdSkills.map((skill, sIdx) => (
                            <span 
                              key={sIdx} 
                              className="px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-700 rounded-lg border border-blue-200 flex items-center gap-1.5 shadow-xs"
                            >
                              <CheckCircle2 className="w-3 h-3 text-blue-600" />
                              {skill}
                            </span>
                          ))}
                          {extraSkillsCount > 0 && (
                            <span className="px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-600 rounded-lg border border-slate-200">
                              +{extraSkillsCount} more skills in profile
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 italic">
                          Verified against job requirements • Selected top competencies for quick recruiter evaluation
                        </p>
                      </section>

                      {/* Parameter 8: Work Experience (Top 3 JD-relevant highlights) */}
                      <section className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                            <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                            Relevant Experience Highlights (Top 3 Roles)
                          </h3>
                          <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                            Param 8 • Top 3 Roles
                          </span>
                        </div>

                        <div className="space-y-3">
                          {topExperience.map((exp, idx) => (
                            <div key={idx} className="p-3 bg-slate-50/70 rounded-xl border border-slate-200 space-y-1.5">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h4 className="text-xs font-bold text-slate-950 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                                    {exp.role}
                                  </h4>
                                  <p className="text-[11px] font-semibold text-slate-600 mt-0.5">
                                    {exp.company} {exp.location && `• ${exp.location}`}
                                  </p>
                                </div>
                                <span className="text-[10px] font-semibold text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded-md flex-shrink-0">
                                  {exp.startDate} – {exp.endDate}
                                </span>
                              </div>

                              {exp.responsibilities && exp.responsibilities.length > 0 && (
                                <ul className="list-disc list-outside ml-4 text-[11px] text-slate-600 space-y-1 pt-1">
                                  {exp.responsibilities.slice(0, 2).map((r, rIdx) => (
                                    <li key={rIdx} className="leading-snug">{r}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ))}

                          {extraExperienceCount > 0 && (
                            <div className="p-2 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-center text-[11px] text-slate-500">
                              +{extraExperienceCount} earlier role in full history • View complete background timeline in original resume on the right
                            </div>
                          )}
                        </div>
                      </section>

                      {/* Parameter 9: Education */}
                      <section className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                            <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                            Education & Academic Background
                          </h3>
                          <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                            Param 9 • Education
                          </span>
                        </div>
                        <div className="space-y-2">
                          {formData.educationEntries.map((ed, eIdx) => (
                            <div key={eIdx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
                              <div>
                                <p className="font-bold text-slate-900">{ed.qualification}</p>
                                <p className="text-[11px] text-slate-500">{ed.institution}</p>
                              </div>
                              <span className="font-semibold text-slate-700 text-[11px] bg-white px-2 py-0.5 rounded border border-slate-200">
                                {ed.completionYear}
                              </span>
                            </div>
                          ))}
                        </div>
                      </section>

                      {/* Parameter 10: Certifications, Impact & Logistics */}
                      <section className="space-y-2 pt-1 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                            <Award className="w-3.5 h-3.5 text-amber-600" />
                            Certifications, Impact & Recruiter Metrics
                          </h3>
                          <span className="text-[10px] text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            Param 10 • Recruiter Fit
                          </span>
                        </div>

                        <div className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-200/70 text-xs text-amber-950 space-y-2">
                          <div>
                            <span className="font-bold text-[11px] text-amber-900">Key Certifications & Awards:</span>
                            <p className="text-[11px] text-slate-700 mt-0.5">
                              Certified Product Manager (IIBA) • Internal Hackathon Winner • District Chess • Solo Paraglider
                            </p>
                          </div>

                          <div>
                            <span className="font-bold text-[11px] text-amber-900">Verified Impact Highlight:</span>
                            <p className="text-[11px] text-slate-700 mt-0.5">
                              Architected intelligent social profile discovery system identifying creators' public profiles using PII signals with high precision.
                            </p>
                          </div>

                          <div className="grid grid-cols-3 gap-2 pt-1.5 border-t border-amber-200/50 text-[11px]">
                            <div>
                              <span className="text-slate-500 block">Current CTC</span>
                              <strong className="text-slate-900">₹{formData.currentSalary} LPA</strong>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Expected CTC</span>
                              <strong className="text-slate-900">₹{formData.expectedSalary} LPA</strong>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Notice Period</span>
                              <strong className="text-slate-900">{formData.noticePeriod}</strong>
                            </div>
                          </div>
                        </div>
                      </section>

                    </div>
                  </div>

                  {/* Left Footer Hint */}
                  <div className="px-4 py-2.5 bg-white border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 flex-shrink-0">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      AI Standardized Template Loaded
                    </span>
                    <button
                      type="button"
                      onClick={handleToggleFlip}
                      className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" /> Edit Profile Details
                    </button>
                  </div>
                </div>

                {/* ----------------------------------------------------------------- */}
                {/* BACK FACE: Editable Form Inputs (Rotated 180° into view)           */}
                {/* ----------------------------------------------------------------- */}
                <div 
                  className="absolute inset-0 w-full h-full flex flex-col bg-slate-50 overflow-hidden"
                  style={{
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                  }}
                >
                  {/* Flipped Toolbar */}
                  <div className="px-4 py-3 bg-white border-b border-slate-200 flex items-center justify-between gap-2 flex-shrink-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                        EDIT
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 truncate">
                            Edit Extracted Parameters
                          </span>
                          <span className="px-1.5 py-0.2 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded">
                            EDIT MODE
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">Edit fields on left while viewing original resume on right</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleToggleFlip}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                      title="View standardized candidate profile"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Profile</span>
                    </button>
                  </div>

                  {/* Form Scrollable Area */}
                  <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 bg-slate-50">
                    
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-emerald-900 text-xs">
                      <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold">Live Side-by-Side Editing:</span> Any adjustments you make here update the AI Standardized template in real time. You can compare directly with the original resume on the right.
                      </div>
                    </div>

                    {Object.keys(errors).length > 0 && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-xs font-medium">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        <span>Please resolve required field errors before saving.</span>
                      </div>
                    )}

                    {/* 1, 2, 3: Personal Details */}
                    <section className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wide">
                          Personal Details (Params 1–3)
                        </h4>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full uppercase">Extracted</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Full Name *</label>
                          <input type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className={cn("w-full px-3 py-1.5 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-100", errors.fullName ? "border-red-300" : "border-slate-300")} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
                          <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-100" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Phone Number</label>
                          <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-100" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Current Location *</label>
                          <input type="text" value={formData.currentLocation} onChange={e => setFormData({...formData, currentLocation: e.target.value})} className={cn("w-full px-3 py-1.5 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-100", errors.currentLocation ? "border-red-300" : "border-slate-300")} />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-medium text-slate-700 mb-1">LinkedIn URL</label>
                          <input type="url" value={formData.linkedInUrl} onChange={e => setFormData({...formData, linkedInUrl: e.target.value})} className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-100" />
                        </div>
                      </div>
                    </section>

                    {/* 6: Summary */}
                    <section className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wide">
                          Professional Summary (Param 6)
                        </h4>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full uppercase">Extracted</span>
                      </div>
                      <textarea
                        rows={3}
                        value={formData.professionalSummary}
                        onChange={e => setFormData({...formData, professionalSummary: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-100 leading-relaxed"
                      />
                    </section>

                    {/* 4, 5, 8: Role, Total Experience & Work Experience */}
                    <section className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wide">
                          Role & Experience (Params 4, 5, 8)
                        </h4>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full uppercase">Extracted</span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Current Role *</label>
                          <input type="text" value={formData.currentRole} onChange={e => setFormData({...formData, currentRole: e.target.value})} className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Current Company</label>
                          <input type="text" value={formData.currentCompany} onChange={e => setFormData({...formData, currentCompany: e.target.value})} className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Total Experience</label>
                          <input type="text" value={formData.totalExperience} onChange={e => setFormData({...formData, totalExperience: e.target.value})} className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs outline-none" />
                        </div>
                      </div>

                      <h5 className="font-semibold text-slate-700 text-xs pt-1">Employment History Entries</h5>
                      <div className="space-y-3">
                        {formData.employmentHistory.map((entry, index) => (
                          <div key={index} className="p-3 border border-slate-200 rounded-lg relative bg-slate-50 space-y-2">
                            <button
                              type="button"
                              onClick={() => {
                                const newHist = [...formData.employmentHistory];
                                newHist.splice(index, 1);
                                setFormData({...formData, employmentHistory: newHist});
                              }}
                              className="absolute top-2 right-2 text-slate-400 hover:text-red-500"
                              title="Delete entry"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <div className="grid grid-cols-2 gap-2 pr-6">
                              <div><label className="block text-[11px] text-slate-500">Company</label><input type="text" value={entry.company} onChange={e => { const h = [...formData.employmentHistory]; h[index].company = e.target.value; setFormData({...formData, employmentHistory: h}); }} className="w-full px-2 py-1 text-xs border rounded bg-white" /></div>
                              <div><label className="block text-[11px] text-slate-500">Role</label><input type="text" value={entry.role} onChange={e => { const h = [...formData.employmentHistory]; h[index].role = e.target.value; setFormData({...formData, employmentHistory: h}); }} className="w-full px-2 py-1 text-xs border rounded bg-white" /></div>
                              <div><label className="block text-[11px] text-slate-500">Start Date</label><input type="text" value={entry.startDate} onChange={e => { const h = [...formData.employmentHistory]; h[index].startDate = e.target.value; setFormData({...formData, employmentHistory: h}); }} className="w-full px-2 py-1 text-xs border rounded bg-white" /></div>
                              <div><label className="block text-[11px] text-slate-500">End Date</label><input type="text" value={entry.endDate} onChange={e => { const h = [...formData.employmentHistory]; h[index].endDate = e.target.value; setFormData({...formData, employmentHistory: h}); }} className="w-full px-2 py-1 text-xs border rounded bg-white" /></div>
                            </div>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => setFormData({...formData, employmentHistory: [...formData.employmentHistory, { company: '', role: '', startDate: '', endDate: 'Present' }]})}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Another Role
                        </button>
                      </div>
                    </section>

                    {/* 7: Skills */}
                    <section className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wide">
                          Skills & Stack (Param 7)
                        </h4>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full uppercase">Extracted</span>
                      </div>
                      <textarea
                        rows={3}
                        value={formData.skills}
                        onChange={e => setFormData({...formData, skills: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-100"
                        placeholder="Comma-separated skills..."
                      />
                    </section>

                    {/* 9: Education */}
                    <section className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wide">
                          Education (Param 9)
                        </h4>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full uppercase">Extracted</span>
                      </div>
                      {formData.educationEntries.map((ed, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <input type="text" value={ed.qualification} onChange={e => { const list = [...formData.educationEntries]; list[idx].qualification = e.target.value; setFormData({...formData, educationEntries: list}); }} className="flex-1 px-2.5 py-1 text-xs border rounded bg-white" placeholder="Degree / Qualification" />
                          <input type="text" value={ed.institution} onChange={e => { const list = [...formData.educationEntries]; list[idx].institution = e.target.value; setFormData({...formData, educationEntries: list}); }} className="flex-1 px-2.5 py-1 text-xs border rounded bg-white" placeholder="Institution" />
                          <input type="text" value={ed.completionYear} onChange={e => { const list = [...formData.educationEntries]; list[idx].completionYear = e.target.value; setFormData({...formData, educationEntries: list}); }} className="w-20 px-2.5 py-1 text-xs border rounded bg-white" placeholder="Year" />
                        </div>
                      ))}
                    </section>

                    {/* 10: Recruitment & Notes */}
                    <section className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wide">
                          Recruitment & Notes (Param 10)
                        </h4>
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full uppercase">Recruiter View</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Current CTC (LPA)</label>
                          <input type="text" value={formData.currentSalary} onChange={e => setFormData({...formData, currentSalary: e.target.value})} className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Expected CTC (LPA)</label>
                          <input type="text" value={formData.expectedSalary} onChange={e => setFormData({...formData, expectedSalary: e.target.value})} className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Notice Period</label>
                          <select value={formData.noticePeriod} onChange={e => setFormData({...formData, noticePeriod: e.target.value})} className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white">
                            <option>Immediate</option>
                            <option>15 Days</option>
                            <option>30 Days</option>
                            <option>45 Days</option>
                            <option>60 Days</option>
                            <option>90 Days</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Certifications & Notes</label>
                        <textarea rows={2} value={formData.recruiterNotes} onChange={e => setFormData({...formData, recruiterNotes: e.target.value})} className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs" />
                      </div>
                    </section>

                  </div>

                  {/* Flipped Footer */}
                  <div className="px-4 py-2.5 bg-white border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 flex-shrink-0">
                    <span className="text-emerald-700 font-medium">
                      ✓ Changes live-sync with AI Standardized profile
                    </span>
                    <button
                      type="button"
                      onClick={handleToggleFlip}
                      className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3 h-3" /> View Profile
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* RIGHT PANE: Candidate's Original Resume As-Is (Shobhit Saxena PDF Layout) */}
          {/* ========================================================================= */}
          {(layoutMode === 'dual' || layoutMode === 'originalOnly') && (
            <div className={cn(
              "h-full overflow-hidden flex flex-col bg-white",
              layoutMode === 'dual' ? "w-full lg:w-1/2" : "w-full"
            )}>
              <OriginalResumeViewer
                data={defaultShobhitResume}
                filename={resolvedFileName}
              />
            </div>
          )}

        </div>

        {/* Modal Sticky Bottom Action Bar */}
        <div className="px-6 py-3.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-white z-20 flex-shrink-0">
          <div className="text-xs text-slate-600 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
            <span>Active Candidate: <strong className="text-slate-900 font-bold">{formData.fullName}</strong> ({resolvedFileName})</span>
          </div>

          <div className="flex items-center gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="button" 
              onClick={handleSave}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              {isEditMode ? 'Save Changes' : 'Save Candidate'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
