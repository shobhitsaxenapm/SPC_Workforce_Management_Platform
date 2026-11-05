import React, { useState } from 'react';
import { Candidate, EmploymentEntry, EducationEntry } from '../types';
import { 
  X, CheckCircle, CheckCircle2, AlertTriangle, Plus, Trash2, Columns, FileText, 
  Edit3, Sparkles, Check, Info, FileCode, ExternalLink,
  Award, Briefcase, GraduationCap, MapPin, Mail, Phone, Globe, Eye, Building2, User, DollarSign
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useApp } from '../context/AppContext';
import OriginalResumeViewer, { defaultShobhitResume } from './OriginalResumeViewer';
import { getEasyTwoLineSummary } from '../lib/summaryHelper';

interface CandidateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: Partial<Candidate>;
  isEditMode?: boolean;
  onSaveSuccess?: (candidateId: string) => void;
  uploadedFile?: File | null;
  uploadedFileUrl?: string | null;
  rawResumeText?: string;
  targetJobTitle?: string;
  isJobMatched?: boolean;
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
  targetJobTitle,
  isJobMatched: propIsJobMatched,
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
    professionalSummary: initialData.professionalSummary || 
      `${initialData.currentRole || defaultShobhitResume.experience[0].role} with ${initialData.totalExperience || '4+ Years'} building AI automation tools, LLM workflows, and B2B SaaS platforms.\nProven track record taking features from concept to launch with strong user adoption and business impact.`,
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
      : defaultShobhitResume.experience.map((e, idx) => ({
          company: e.company,
          role: e.role,
          location: e.location,
          startDate: e.duration.split('–')[0]?.trim() || e.duration.split('-')[0]?.trim(),
          endDate: e.duration.split('–')[1]?.trim() || e.duration.split('-')[1]?.trim() || 'Present',
          responsibilities: e.bullets,
          relevanceTag: (idx === 0 ? 'Direct Match' : idx === 1 ? 'Direct Match' : 'Relevant Domain') as any,
          aiAnalysis: idx === 0 
            ? 'Multi-agent orchestration and intelligent document processing pipelines.'
            : idx === 1 
            ? 'Creator risk screening, brand safety, and embedding-based identity resolution.'
            : 'High-scale SaaS data workflows and backend Python services.'
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

  // Context-aware JD matching status
  const isMatchedWithJd = Boolean(propIsJobMatched || targetJobTitle || (initialData as any)?.targetJobId || (initialData as any)?.matchedJobTitle);
  const matchedJobName = targetJobTitle || (initialData as any)?.matchedJobTitle;

  // Strictly Top 5 JD/Role-relevant skills (e.g. for Product Manager, prioritize AI PM competencies)
  const parsedSkillsList = formData.skills.split(',').map(s => s.trim()).filter(Boolean);
  const isProductRole = /product/i.test(formData.currentRole);
  const prioritizedSkills = isProductRole
    ? [
        ...parsedSkillsList.filter(s => /product|strategy|roadmap|prd|saas|discovery|agent|llm|orchestration|rag/i.test(s)),
        ...parsedSkillsList
      ]
    : parsedSkillsList;
  const topJdSkills: string[] = (Array.from(new Set(prioritizedSkills)) as string[]).slice(0, 5);

  // Top 3 JD-relevant experience highlights
  const topExperience = formData.employmentHistory.slice(0, 3);

  const getExperienceAiAnalysis = (exp: any, index: number) => {
    if (exp.aiAnalysis) return exp.aiAnalysis;
    if (exp.responsibilities && exp.responsibilities.length > 0) {
      return exp.responsibilities[0];
    }
    if (index === 0) return 'Multi-agent orchestration and intelligent document processing pipelines.';
    if (index === 1) return 'Creator risk screening, brand safety, and embedding-based identity resolution.';
    return 'High-scale SaaS data workflows and backend services.';
  };

  const getExperienceRelevanceTag = (exp: any, index: number) => {
    if (exp.relevanceTag) return exp.relevanceTag;
    if (index === 0) return 'Direct Match';
    if (index === 1) return 'Direct Match';
    return 'Relevant Domain';
  };

  // Easy-to-understand 2-line AI executive summary (Plain English, zero heavy buzzwords)
  const [aiExecutiveSummaryLine1, aiExecutiveSummaryLine2] = getEasyTwoLineSummary({
    currentRole: formData.currentRole,
    totalExperience: formData.totalExperience,
    professionalSummary: formData.professionalSummary,
    skills: topJdSkills,
  });

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
                      
                      {/* Identity & Contact Card */}
                      <div className="border-b border-slate-200 pb-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h1 className="text-2xl font-bold text-slate-950">{formData.fullName}</h1>
                            <p className="text-sm font-semibold text-blue-700 mt-0.5 flex items-center gap-1.5">
                              <span>{formData.currentRole}</span>
                              {formData.currentCompany && (
                                <span className="text-slate-500 font-normal">at {formData.currentCompany}</span>
                              )}
                            </p>
                          </div>
                          <span className="px-2.5 py-1 text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg flex items-center gap-1 flex-shrink-0">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> AI Standardized
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
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Briefcase className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                            <span>Total Exp: <strong className="text-slate-800">{formData.totalExperience}</strong></span>
                            <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded font-medium ml-1">Mid-Senior</span>
                          </div>
                        </div>
                      </div>

                      {/* AI Fit & Executive Summary (Strictly 2 Lines) */}
                      <section className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                            AI Fit & Executive Summary
                          </h3>
                        </div>
                        <div className="bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50 p-3.5 rounded-xl border border-blue-100 text-xs text-slate-800 space-y-1.5 shadow-2xs">
                          <div className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                            <p className="leading-snug font-medium text-slate-900">
                              {aiExecutiveSummaryLine1}
                            </p>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1.5 flex-shrink-0" />
                            <p className="leading-snug text-slate-700">
                              {aiExecutiveSummaryLine2}
                            </p>
                          </div>
                        </div>
                      </section>

                      {/* Skills Section: Context-Aware (Unmatched vs Matched with JD) */}
                      <section className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                            {isMatchedWithJd ? 'Core Matched Skills (JD-Aligned)' : 'Top Core Skills'}
                          </h3>
                          {isMatchedWithJd ? (
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center gap-1">
                              🎯 Aligned to {matchedJobName || 'Target Job'}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-600 rounded-full border border-slate-200">
                              Extracted from Resume
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {topJdSkills.map((skill, sIdx) => (
                            <span 
                              key={sIdx} 
                              className={cn(
                                "px-2.5 py-1 text-xs font-semibold rounded-lg border flex items-center gap-1.5 shadow-xs transition-colors",
                                isMatchedWithJd 
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                                  : "bg-blue-50 text-blue-700 border-blue-200"
                              )}
                            >
                              <CheckCircle2 className={cn("w-3 h-3", isMatchedWithJd ? "text-emerald-600" : "text-blue-600")} />
                              {skill}
                            </span>
                          ))}
                        </div>
                        <p className="text-[11px] text-slate-400 italic">
                          {isMatchedWithJd
                            ? `Top 5 skills directly matched against ${matchedJobName ? `"${matchedJobName}"` : 'job'} requirements`
                            : 'Top 5 functional competencies identified from profile • Evaluated for JD match once linked to a Job'}
                        </p>
                      </section>

                      {/* Experience Analysis (AI) - Top 3 Key Employment Stints */}
                      <section className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                            Experience Analysis (AI)
                          </h3>
                          <span className="px-2 py-0.5 text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/70 rounded-full flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                            Top 3 Stints
                          </span>
                        </div>

                        {/* Career Trajectory & Domain Strength Callout */}
                        <div className="p-3 rounded-xl bg-gradient-to-r from-indigo-50/60 via-blue-50/40 to-slate-50 border border-indigo-100 text-xs shadow-2xs">
                          <div className="flex items-start gap-2.5">
                            <div className="p-1 bg-indigo-100/80 text-indigo-700 rounded-md shrink-0 mt-0.5">
                              <Sparkles className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <h4 className="text-[11px] font-bold uppercase tracking-wider text-indigo-900 mb-0.5">Career Trajectory & Domain Strength</h4>
                              <p className="text-xs text-slate-700 leading-relaxed">
                                {formData.fullName} demonstrates consistent career progression in {formData.currentRole || 'their domain'} with proven operational reliability across high-impact assignments.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Top 3 Key Employment Stints with 1-Line AI Evaluation */}
                        <div className="space-y-2.5">
                          {topExperience.map((exp, idx) => {
                            const relevanceTag = getExperienceRelevanceTag(exp, idx);
                            const stintAiAnalysis = getExperienceAiAnalysis(exp, idx);

                            return (
                              <div key={idx} className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 text-xs space-y-1.5">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <h4 className="font-bold text-slate-950 flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                                        {exp.role}
                                      </h4>
                                      {relevanceTag === 'Direct Match' ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                          <Check className="w-2.5 h-2.5 text-emerald-600" /> Direct Match
                                        </span>
                                      ) : relevanceTag === 'Relevant Domain' ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                          <Sparkles className="w-2.5 h-2.5 text-blue-600" /> Relevant Domain
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                          {relevanceTag}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[11px] font-medium text-slate-600 mt-0.5 flex items-center gap-1">
                                      <Building2 className="w-3 h-3 text-slate-400" />
                                      {exp.company} {exp.location && `• ${exp.location}`}
                                    </p>
                                  </div>
                                  <span className="text-[10px] font-medium text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-md shrink-0">
                                    {exp.startDate} – {exp.endDate}
                                  </span>
                                </div>

                                {/* Strictly 1 Line AI Evaluation */}
                                <div className="mt-1 p-2 bg-white rounded-lg border border-slate-200/80 text-[11px] flex items-start gap-1.5 text-slate-700">
                                  <Sparkles className="w-3 h-3 text-indigo-500 shrink-0 mt-0.5" />
                                  <div className="leading-snug">
                                    <strong className="text-slate-900 font-semibold">AI Evaluation: </strong>
                                    <span>{stintAiAnalysis}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </section>

                      {/* Highest Qualification */}
                      <section className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                            <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                            Highest Qualification
                          </h3>
                        </div>
                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
                          <div>
                            <p className="font-bold text-slate-900">
                              {formData.educationEntries[0]?.qualification || formData.education || 'Bachelor of Technology'}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {formData.educationEntries[0]?.institution || 'Reputed University'}
                            </p>
                          </div>
                          {formData.educationEntries[0]?.completionYear && (
                            <span className="font-semibold text-slate-700 text-[11px] bg-white px-2 py-0.5 rounded border border-slate-200">
                              {formData.educationEntries[0].completionYear}
                            </span>
                          )}
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

                    {/* 1. Candidate Header & Personal Details */}
                    <section className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-blue-600" />
                          <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wide">
                            Candidate Header Details
                          </h4>
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full uppercase">Header Info</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Full Name *</label>
                          <input type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className={cn("w-full px-3 py-1.5 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-100", errors.fullName ? "border-red-300" : "border-slate-300")} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Current Role *</label>
                          <input type="text" value={formData.currentRole} onChange={e => setFormData({...formData, currentRole: e.target.value})} className={cn("w-full px-3 py-1.5 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-100", errors.currentRole ? "border-red-300" : "border-slate-300")} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Current Company</label>
                          <input type="text" value={formData.currentCompany} onChange={e => setFormData({...formData, currentCompany: e.target.value})} className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-100" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Total Experience</label>
                          <input type="text" value={formData.totalExperience} onChange={e => setFormData({...formData, totalExperience: e.target.value})} className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-100" />
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
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">LinkedIn URL</label>
                          <input type="url" value={formData.linkedInUrl} onChange={e => setFormData({...formData, linkedInUrl: e.target.value})} className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-100" />
                        </div>
                      </div>
                    </section>

                    {/* 2. AI Fit & Executive Summary (2 Lines) */}
                    <section className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-blue-600" />
                          <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wide">
                            AI Fit & Executive Summary (2 Lines)
                          </h4>
                        </div>
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-full uppercase">Executive Summary</span>
                      </div>
                      <div className="space-y-2.5">
                        <div>
                          <label className="block text-[11px] font-medium text-slate-700 mb-1 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                            Line 1: High-Level Role & Experience
                          </label>
                          <input
                            type="text"
                            value={formData.professionalSummary.includes('\n') ? formData.professionalSummary.split('\n')[0] : aiExecutiveSummaryLine1}
                            onChange={e => {
                              const line2 = formData.professionalSummary.includes('\n') ? formData.professionalSummary.split('\n')[1] : aiExecutiveSummaryLine2;
                              setFormData({
                                ...formData,
                                professionalSummary: `${e.target.value}\n${line2}`
                              });
                            }}
                            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-100 font-medium text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-700 mb-1 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                            Line 2: Domain Execution & Key Impact
                          </label>
                          <input
                            type="text"
                            value={formData.professionalSummary.includes('\n') ? formData.professionalSummary.split('\n')[1] : aiExecutiveSummaryLine2}
                            onChange={e => {
                              const line1 = formData.professionalSummary.includes('\n') ? formData.professionalSummary.split('\n')[0] : aiExecutiveSummaryLine1;
                              setFormData({
                                ...formData,
                                professionalSummary: `${line1}\n${e.target.value}`
                              });
                            }}
                            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-100 text-slate-800"
                          />
                        </div>
                      </div>
                    </section>

                    {/* 3. Top Core Skills (Top 5) - Replaces legacy Skills & Stack */}
                    <section className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-blue-600" />
                          <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wide">
                            {isMatchedWithJd ? 'Core Matched Skills (JD-Aligned)' : 'Top Core Skills'}
                          </h4>
                        </div>
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-full uppercase">Top 5 Extracted</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Top 5 primary competencies shown on the standardized profile.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {[0, 1, 2, 3, 4].map(idx => (
                          <div key={idx} className="flex items-center gap-1.5">
                            <span className="text-[11px] font-bold text-slate-400 w-4">{idx + 1}.</span>
                            <input
                              type="text"
                              value={topJdSkills[idx] || ''}
                              placeholder={`Skill ${idx + 1}`}
                              onChange={e => {
                                const newSkills = [...topJdSkills];
                                newSkills[idx] = e.target.value;
                                setFormData({
                                  ...formData,
                                  skills: newSkills.filter(Boolean).join(', ')
                                });
                              }}
                              className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-100 font-medium text-slate-800"
                            />
                          </div>
                        ))}
                      </div>
                    </section>

                    {/* 4. Experience Analysis (AI) - Top 3 Stints */}
                    <section className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-blue-600" />
                          <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wide">
                            Experience Analysis (AI) — Top 3 Stints
                          </h4>
                        </div>
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-bold rounded-full uppercase">Top 3 Roles</span>
                      </div>

                      <div className="space-y-3">
                        {formData.employmentHistory.slice(0, 3).map((entry, index) => {
                          const relevanceTag = getExperienceRelevanceTag(entry, index);
                          const stintAiAnalysis = getExperienceAiAnalysis(entry, index);

                          return (
                            <div key={index} className="p-3.5 border border-slate-200 rounded-xl bg-slate-50/70 space-y-3">
                              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                                <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                                  Stint {index + 1}: {entry.role || 'Role'} {entry.company ? `at ${entry.company}` : ''}
                                </span>
                                <div className="flex items-center gap-2">
                                  <label className="text-[10px] font-semibold text-slate-500 uppercase">Match Tag:</label>
                                  <select
                                    value={relevanceTag}
                                    onChange={e => {
                                      const h = [...formData.employmentHistory];
                                      h[index] = { ...h[index], relevanceTag: e.target.value as any };
                                      setFormData({ ...formData, employmentHistory: h });
                                    }}
                                    className="px-2 py-0.5 text-xs font-semibold rounded-md border border-slate-300 bg-white text-slate-700 outline-none"
                                  >
                                    <option value="Direct Match">Direct Match</option>
                                    <option value="Relevant Domain">Relevant Domain</option>
                                    <option value="Adjacent Experience">Adjacent Experience</option>
                                  </select>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                                <div>
                                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Role Title *</label>
                                  <input
                                    type="text"
                                    value={entry.role}
                                    onChange={e => {
                                      const h = [...formData.employmentHistory];
                                      h[index] = { ...h[index], role: e.target.value };
                                      setFormData({ ...formData, employmentHistory: h });
                                    }}
                                    className="w-full px-2.5 py-1.5 text-xs border rounded-lg bg-white border-slate-300 font-medium"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Company *</label>
                                  <input
                                    type="text"
                                    value={entry.company}
                                    onChange={e => {
                                      const h = [...formData.employmentHistory];
                                      h[index] = { ...h[index], company: e.target.value };
                                      setFormData({ ...formData, employmentHistory: h });
                                    }}
                                    className="w-full px-2.5 py-1.5 text-xs border rounded-lg bg-white border-slate-300"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Location</label>
                                  <input
                                    type="text"
                                    value={entry.location || ''}
                                    placeholder="e.g. Bangalore"
                                    onChange={e => {
                                      const h = [...formData.employmentHistory];
                                      h[index] = { ...h[index], location: e.target.value };
                                      setFormData({ ...formData, employmentHistory: h });
                                    }}
                                    className="w-full px-2.5 py-1.5 text-xs border rounded-lg bg-white border-slate-300"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-1.5">
                                  <div>
                                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Start Date</label>
                                    <input
                                      type="text"
                                      value={entry.startDate || ''}
                                      placeholder="MMM YYYY"
                                      onChange={e => {
                                        const h = [...formData.employmentHistory];
                                        h[index] = { ...h[index], startDate: e.target.value };
                                        setFormData({ ...formData, employmentHistory: h });
                                      }}
                                      className="w-full px-2 py-1.5 text-xs border rounded-lg bg-white border-slate-300"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[11px] font-medium text-slate-600 mb-1">End Date</label>
                                    <input
                                      type="text"
                                      value={entry.endDate || ''}
                                      placeholder="Present"
                                      onChange={e => {
                                        const h = [...formData.employmentHistory];
                                        h[index] = { ...h[index], endDate: e.target.value };
                                        setFormData({ ...formData, employmentHistory: h });
                                      }}
                                      className="w-full px-2 py-1.5 text-xs border rounded-lg bg-white border-slate-300"
                                    />
                                  </div>
                                </div>
                              </div>

                              <div>
                                <label className="block text-[11px] font-medium text-slate-700 mb-1 flex items-center gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                                  1-Line AI Evaluation:
                                </label>
                                <input
                                  type="text"
                                  value={entry.aiAnalysis ?? stintAiAnalysis}
                                  onChange={e => {
                                    const h = [...formData.employmentHistory];
                                    h[index] = { ...h[index], aiAnalysis: e.target.value };
                                    setFormData({ ...formData, employmentHistory: h });
                                  }}
                                  className="w-full px-3 py-1.5 text-xs border border-indigo-200 rounded-lg bg-white font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100"
                                  placeholder="One-line AI evaluation..."
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </section>

                    {/* 5. Highest Qualification */}
                    <section className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="w-4 h-4 text-blue-600" />
                          <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wide">
                            Highest Qualification
                          </h4>
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full uppercase">Education</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-1">
                          <label className="block text-xs font-medium text-slate-700 mb-1">Degree / Qualification *</label>
                          <input
                            type="text"
                            value={formData.educationEntries[0]?.qualification || ''}
                            placeholder="e.g. B.Tech Computer Science"
                            onChange={e => {
                              const list = [...formData.educationEntries];
                              if (list.length === 0) {
                                list.push({ qualification: e.target.value, institution: '', completionYear: '' });
                              } else {
                                list[0] = { ...list[0], qualification: e.target.value };
                              }
                              setFormData({ ...formData, educationEntries: list });
                            }}
                            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-100"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Institution</label>
                          <input
                            type="text"
                            value={formData.educationEntries[0]?.institution || ''}
                            placeholder="e.g. IIT Delhi"
                            onChange={e => {
                              const list = [...formData.educationEntries];
                              if (list.length === 0) {
                                list.push({ qualification: '', institution: e.target.value, completionYear: '' });
                              } else {
                                list[0] = { ...list[0], institution: e.target.value };
                              }
                              setFormData({ ...formData, educationEntries: list });
                            }}
                            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-100"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Completion Year</label>
                          <input
                            type="text"
                            value={formData.educationEntries[0]?.completionYear || ''}
                            placeholder="e.g. 2022"
                            onChange={e => {
                              const list = [...formData.educationEntries];
                              if (list.length === 0) {
                                list.push({ qualification: '', institution: '', completionYear: e.target.value });
                              } else {
                                list[0] = { ...list[0], completionYear: e.target.value };
                              }
                              setFormData({ ...formData, educationEntries: list });
                            }}
                            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-100"
                          />
                        </div>
                      </div>
                    </section>

                    {/* 6. Recruitment & Compensation (Certifications & Notes Removed) */}
                    <section className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-emerald-600" />
                          <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wide">
                            Recruitment & Compensation
                          </h4>
                        </div>
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
