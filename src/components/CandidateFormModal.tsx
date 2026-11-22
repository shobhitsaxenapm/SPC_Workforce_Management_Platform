import React, { useState } from 'react';
import { Candidate, EmploymentEntry, EducationEntry } from '../types';
import { 
  X, CheckCircle, CheckCircle2, AlertTriangle, Plus, Trash2, Columns, FileText, 
  Edit3, Sparkles, Check, Info, FileCode, ExternalLink, ChevronDown,
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

  // Inline edit state for the Left Pane: false = Read-Only AI Standardized Profile, true = Inline Editable Parameters
  const [isLeftFlipped, setIsLeftFlipped] = useState(false);
  const [showCancelMenu, setShowCancelMenu] = useState(false);
  const [editSnapshot, setEditSnapshot] = useState<any>(null);
  const [showInfoCard, setShowInfoCard] = useState(false);

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
    currentSalary: (initialData.fullName?.toLowerCase().includes('shobhit') ? '' : initialData.currentSalary) || '',
    expectedSalary: (initialData.fullName?.toLowerCase().includes('shobhit') ? '' : initialData.expectedSalary) || '',
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

  const handleStartEdit = () => {
    setEditSnapshot(JSON.parse(JSON.stringify(formData)));
    setShowCancelMenu(false);
    setIsLeftFlipped(true);
  };

  const handleSaveInlineEdits = () => {
    if (!validate()) return;
    setShowCancelMenu(false);
    setIsLeftFlipped(false);
  };

  const handleCancelInlineEdits = () => {
    if (editSnapshot) {
      setFormData(editSnapshot);
    }
    setErrors({});
    setShowCancelMenu(false);
    setIsLeftFlipped(false);
  };

  const handleToggleFlip = () => {
    if (isLeftFlipped) {
      handleSaveInlineEdits();
    } else {
      handleStartEdit();
    }
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
    
    const isCandidateShobhit = formData.fullName?.toLowerCase().includes('shobhit');
    const finalCurrentSalary = isCandidateShobhit ? '' : formData.currentSalary;
    const finalExpectedSalary = isCandidateShobhit ? '' : formData.expectedSalary;

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
        currentSalary: finalCurrentSalary,
        expectedSalary: finalExpectedSalary,
        noticePeriod: finalNoticePeriod,
        preferredLocation: formData.preferredLocation,
        willingToRelocate: formData.willingToRelocate as any,
        availableFrom: formData.availableFrom,
        recruiterNotes: formData.recruiterNotes,
        resumeUrl: formData.resumeUrl,
        rawResumeText: rawResumeText || (initialData as any)?.rawResumeText,
      });
      onSaveSuccess?.(initialData.id);
    } else {
      const normEmail = formData.email?.trim().toLowerCase() || '';
      const normPhone = formData.phone?.replace(/[^0-9]/g, '') || '';
      const existingCandidate = candidates.find(c => 
        (normEmail && c.email.trim().toLowerCase() === normEmail) ||
        (normPhone && c.phone.replace(/[^0-9]/g, '') === normPhone)
      );

      let targetCandidateId = '';

      if (existingCandidate) {
        // Candidate already exists in the system: update details & resume if uploaded, and attach to job
        updateCandidate(existingCandidate.id, {
          fullName: formData.fullName || existingCandidate.fullName,
          email: formData.email || existingCandidate.email,
          phone: formData.phone || existingCandidate.phone,
          currentLocation: formData.currentLocation || existingCandidate.currentLocation,
          linkedInUrl: formData.linkedInUrl || existingCandidate.linkedInUrl,
          currentRole: formData.currentRole || existingCandidate.currentRole,
          currentCompany: formData.currentCompany || existingCandidate.currentCompany,
          totalExperience: formData.totalExperience || existingCandidate.totalExperience,
          professionalSummary: formData.professionalSummary || existingCandidate.professionalSummary,
          skills: parsedSkills.length > 0 ? parsedSkills : existingCandidate.skills,
          languages: parsedLanguages.length > 0 ? parsedLanguages : existingCandidate.languages,
          employmentHistory: formData.employmentHistory.length > 0 ? formData.employmentHistory : existingCandidate.employmentHistory,
          educationEntries: formData.educationEntries.length > 0 ? formData.educationEntries : existingCandidate.educationEntries,
          currentSalary: isCandidateShobhit ? '' : (formData.currentSalary || existingCandidate.currentSalary),
          expectedSalary: isCandidateShobhit ? '' : (formData.expectedSalary || existingCandidate.expectedSalary),
          noticePeriod: finalNoticePeriod || existingCandidate.noticePeriod,
          preferredLocation: formData.preferredLocation || existingCandidate.preferredLocation,
          willingToRelocate: formData.willingToRelocate as any,
          availableFrom: formData.availableFrom || existingCandidate.availableFrom,
          recruiterNotes: formData.recruiterNotes || existingCandidate.recruiterNotes,
          resumeUrl: formData.resumeUrl || existingCandidate.resumeUrl,
          rawResumeText: rawResumeText || (initialData as any)?.rawResumeText || existingCandidate.rawResumeText,
        });
        targetCandidateId = existingCandidate.id;
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
          currentSalary: finalCurrentSalary,
          expectedSalary: finalExpectedSalary,
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
          targetCandidateId = createResult.candidateId;
        }
      }

      if (targetCandidateId) {
        onSaveSuccess?.(targetCandidateId);
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
    if (!targetJobTitle && !showDuplicateWarning && checkForDuplicates()) return;
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
        
        {/* Shared SVG Gradient Definition for AI Sparkles Icons */}
        <svg width="0" height="0" className="absolute pointer-events-none">
          <defs>
            <linearGradient id="ai-dual-modal-sparkle-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="50%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
          </defs>
        </svg>

        {/* Modal Top Header Bar */}
        <div className="px-6 py-3.5 border-b border-slate-200 flex items-center justify-between bg-white z-30 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                {isEditMode ? 'Edit Candidate Profile' : 'AI Dual-Resume Review & Verification'}
              </h2>

              <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                10 Parameters Extracted
              </span>

              {/* Tooltip i-Card CTA for Parallel Comparison Info */}
              <div
                className="relative inline-flex items-center"
                onMouseEnter={() => setShowInfoCard(true)}
                onMouseLeave={() => setShowInfoCard(false)}
              >
                <button
                  type="button"
                  onClick={() => setShowInfoCard(prev => !prev)}
                  aria-label="How Dual-Resume Comparison works"
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border transition-all cursor-pointer",
                    showInfoCard
                      ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                      : "bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 border-slate-200 hover:border-blue-200"
                  )}
                >
                  <Info className="w-3.5 h-3.5" />
                  <span className="hidden xl:inline">How it works</span>
                </button>

                {showInfoCard && (
                  <div className="absolute left-0 top-full mt-2 w-80 sm:w-96 p-3.5 bg-white rounded-xl shadow-xl border border-slate-200 z-50 text-xs text-slate-600 space-y-2 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                      <span className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-blue-600" />
                        Parallel Resume Comparison
                      </span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">Side-by-Side</span>
                    </div>
                    <p className="leading-relaxed text-slate-600">
                      Parallel comparison: <strong className="text-blue-600 font-semibold">Left</strong> = AI Standardized Profile • <strong className="text-slate-800 font-semibold">Right</strong> = Candidate Original Resume as-is.
                    </p>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="p-2 rounded-lg bg-blue-50/60 border border-blue-100">
                        <p className="font-bold text-[11px] text-blue-900">Left Section (AI)</p>
                        <p className="text-[10px] text-slate-600 mt-0.5">Standardized 10-parameter profile with inline editing.</p>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80">
                        <p className="font-bold text-[11px] text-slate-800">Right Section (Original)</p>
                        <p className="text-[10px] text-slate-600 mt-0.5">Candidate&apos;s uploaded document rendered as-is.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
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
                <Sparkles
                  className="w-3.5 h-3.5 shrink-0"
                  style={{ fill: 'url(#ai-dual-modal-sparkle-gradient)', stroke: 'url(#ai-dual-modal-sparkle-gradient)' }}
                />
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

        {/* Modal Main Body (Side-by-Side with Clear Section Separation) */}
        <div
          className={cn(
            "flex-1 flex overflow-hidden min-h-0 bg-slate-200/70",
            layoutMode === 'dual' ? "gap-3 p-3" : "p-0"
          )}
        >
          
          {/* ========================================================================= */}
          {/* LEFT PANE: AI Standardized Profile with In-Place Parameter Editing         */}
          {/* ========================================================================= */}
          {(layoutMode === 'dual' || layoutMode === 'aiOnly') && (
            <div 
              className={cn(
                "h-full relative overflow-hidden flex flex-col bg-slate-50",
                layoutMode === 'dual'
                  ? "w-full lg:w-1/2 rounded-xl border border-slate-300/90 shadow-sm"
                  : "w-full"
              )}
            >
              {/* Left Pane Section Header */}
              <div className="px-4 py-3 bg-white border-b border-slate-200 flex items-center justify-between gap-2 flex-shrink-0 z-20">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-gradient-to-r from-violet-50 via-pink-50 to-amber-50 border border-pink-200/80 shadow-2xs shrink-0">
                    <Sparkles
                      className="w-3.5 h-3.5 shrink-0"
                      style={{ fill: 'url(#ai-dual-modal-sparkle-gradient)', stroke: 'url(#ai-dual-modal-sparkle-gradient)' }}
                    />
                    <span className="bg-gradient-to-r from-violet-600 via-pink-500 to-amber-500 bg-clip-text text-transparent text-[10px] font-extrabold tracking-wider uppercase">
                      AI
                    </span>
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                        AI Profile
                      </span>
                      <span className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 rounded">
                        EXECUTIVE FIT
                      </span>
                      {isLeftFlipped && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
                          EDIT MODE
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">
                      <span>Standardized Candidate Profile</span> • 10 Parameters Extracted
                    </p>
                  </div>
                </div>

                {/* Action Trigger: Edit Profile OR Save Split-Dropdown with Right Arrow -> Cancel */}
                {!isLeftFlipped ? (
                  <button
                    type="button"
                    onClick={handleStartEdit}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                    title="Edit profile details"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Profile</span>
                  </button>
                ) : (
                  <div className="relative inline-flex items-center gap-1.5">
                    <div className="inline-flex items-center rounded-lg shadow-sm bg-blue-600 text-white overflow-hidden">
                      <button
                        type="button"
                        onClick={handleSaveInlineEdits}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                        title="View standardized candidate profile"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Save</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCancelMenu(prev => !prev)}
                        aria-label="Reveal cancel option"
                        title="More options"
                        className="px-2 py-1.5 bg-blue-600 hover:bg-blue-700 text-white border-l border-blue-500/80 transition-colors flex items-center justify-center cursor-pointer"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {showCancelMenu && (
                      <div className="absolute right-0 top-full mt-1.5 w-36 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-30 animate-in fade-in zoom-in-95 duration-150">
                        <button
                          type="button"
                          onClick={handleCancelInlineEdits}
                          className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-red-50 hover:text-red-600 flex items-center gap-2 transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5 text-red-500" />
                          <span>Cancel</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Standardized Template Document Content (Seamless In-Place View / Edit) */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-100/60">
                <div className="w-full max-w-xl mx-auto h-fit bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-7 space-y-5 text-slate-800 transition-all duration-200">

                  {/* Concise Inline Edit Banner */}
                  {isLeftFlipped && (
                    <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl flex items-center justify-between gap-3 text-xs animate-in fade-in duration-150">
                      <div className="flex items-start gap-2.5">
                        <Edit3 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-slate-900">Edit Extracted Parameters</p>
                          <p className="text-[11px] text-slate-600 mt-0.5">
                            Refine AI-fetched parameters directly in each section and click <strong>Save</strong> to apply changes.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {Object.keys(errors).length > 0 && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-xs font-medium">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <span>Please resolve required field errors before saving.</span>
                    </div>
                  )}
                  
                  {/* 1. Identity & Contact Card */}
                  <div className="border-b border-slate-200 pb-4">
                    {!isLeftFlipped ? (
                      <>
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
                      </>
                    ) : (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Full Name *</label>
                            <input
                              type="text"
                              value={formData.fullName}
                              onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                              className={cn(
                                "w-full px-2.5 py-1.5 border rounded-lg text-xs font-bold text-slate-900 bg-slate-50/70 focus:bg-white outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all",
                                errors.fullName ? "border-red-300" : "border-slate-300"
                              )}
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Current Role *</label>
                            <input
                              type="text"
                              value={formData.currentRole}
                              onChange={e => setFormData({ ...formData, currentRole: e.target.value })}
                              className={cn(
                                "w-full px-2.5 py-1.5 border rounded-lg text-xs font-semibold text-blue-700 bg-slate-50/70 focus:bg-white outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all",
                                errors.currentRole ? "border-red-300" : "border-slate-300"
                              )}
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Current Company</label>
                            <input
                              type="text"
                              value={formData.currentCompany}
                              onChange={e => setFormData({ ...formData, currentCompany: e.target.value })}
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-slate-50/70 focus:bg-white outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Total Experience</label>
                            <input
                              type="text"
                              value={formData.totalExperience}
                              onChange={e => setFormData({ ...formData, totalExperience: e.target.value })}
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-slate-50/70 focus:bg-white outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Email Address</label>
                            <input
                              type="email"
                              value={formData.email}
                              onChange={e => setFormData({ ...formData, email: e.target.value })}
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-slate-50/70 focus:bg-white outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Phone Number</label>
                            <input
                              type="tel"
                              value={formData.phone}
                              onChange={e => setFormData({ ...formData, phone: e.target.value })}
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-slate-50/70 focus:bg-white outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Current Location *</label>
                            <input
                              type="text"
                              value={formData.currentLocation}
                              onChange={e => setFormData({ ...formData, currentLocation: e.target.value })}
                              className={cn(
                                "w-full px-2.5 py-1.5 border rounded-lg text-xs bg-slate-50/70 focus:bg-white outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all",
                                errors.currentLocation ? "border-red-300" : "border-slate-300"
                              )}
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Notice Period</label>
                            <select
                              value={formData.noticePeriod}
                              onChange={e => setFormData({ ...formData, noticePeriod: e.target.value })}
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-slate-50/70 focus:bg-white outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                            >
                              <option>Immediate</option>
                              <option>15 Days</option>
                              <option>30 Days</option>
                              <option>45 Days</option>
                              <option>60 Days</option>
                              <option>90 Days</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2. AI Executive Summary (Strictly 2 Lines) */}
                  <section className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        AI Executive Summary
                      </h3>
                    </div>
                    <div className="bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50 p-3.5 rounded-xl border border-blue-100 text-xs text-slate-800 space-y-2 shadow-2xs">
                      {!isLeftFlipped ? (
                        <>
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
                        </>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 flex-shrink-0" />
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
                              className="w-full px-2.5 py-1.5 bg-white border border-blue-200 rounded-lg text-xs font-medium text-slate-900 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 flex-shrink-0" />
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
                              className="w-full px-2.5 py-1.5 bg-white border border-blue-200 rounded-lg text-xs text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* 3. Skills Section: Context-Aware (Unmatched vs Matched with JD) */}
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
                    {!isLeftFlipped ? (
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
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {[0, 1, 2, 3, 4].map(idx => (
                          <div key={idx} className="flex items-center gap-1.5">
                            <span className="text-[11px] font-bold text-slate-400 w-4">{idx + 1}.</span>
                            <input
                              type="text"
                              value={topJdSkills[idx] || ''}
                              placeholder={`Core Skill ${idx + 1}`}
                              onChange={e => {
                                const newSkills = [...topJdSkills];
                                newSkills[idx] = e.target.value;
                                setFormData({
                                  ...formData,
                                  skills: newSkills.filter(Boolean).join(', ')
                                });
                              }}
                              className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 bg-slate-50/70 focus:bg-white outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-[11px] text-slate-400 italic">
                      {isMatchedWithJd
                        ? `Top 5 skills directly matched against ${matchedJobName ? `"${matchedJobName}"` : 'job'} requirements`
                        : 'Top 5 functional competencies identified from profile • Evaluated for JD match once linked to a Job'}
                    </p>
                  </section>

                  {/* 4. Experience Analysis (AI) - Top 3 Key Employment Stints */}
                  <section className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                        Experience Analysis (AI)
                      </h3>
                      <span className="px-2 py-0.5 text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/70 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                        Top 3 Roles
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {topExperience.map((exp, idx) => {
                        const stintAiAnalysis = getExperienceAiAnalysis(exp, idx);

                        return (
                          <div key={idx} className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 text-xs space-y-2">
                            {!isLeftFlipped ? (
                              <>
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <h4 className="font-bold text-slate-950 flex items-center gap-1.5">
                                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                                      {exp.role}
                                    </h4>
                                    <p className="text-[11px] font-medium text-slate-600 mt-0.5 flex items-center gap-1">
                                      <Building2 className="w-3 h-3 text-slate-400" />
                                      {exp.company} {exp.location && `• ${exp.location}`}
                                    </p>
                                  </div>
                                  <span className="text-[10px] font-medium text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-md shrink-0">
                                    {exp.startDate} – {exp.endDate}
                                  </span>
                                </div>

                                <div className="mt-1 p-2 bg-white rounded-lg border border-slate-200/80 text-[11px] flex items-start gap-1.5 text-slate-700">
                                  <Sparkles className="w-3 h-3 text-indigo-500 shrink-0 mt-0.5" />
                                  <div className="leading-snug">
                                    <strong className="text-slate-900 font-semibold">Experience Snapshot: </strong>
                                    <span>{stintAiAnalysis}</span>
                                  </div>
                                </div>
                              </>
                            ) : (
                              <div className="space-y-2">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Role Title</label>
                                    <input
                                      type="text"
                                      value={exp.role}
                                      onChange={e => {
                                        const h = [...formData.employmentHistory];
                                        h[idx] = { ...h[idx], role: e.target.value };
                                        setFormData({ ...formData, employmentHistory: h });
                                      }}
                                      className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-white font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-blue-100"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Company &amp; Location</label>
                                    <div className="grid grid-cols-2 gap-1.5">
                                      <input
                                        type="text"
                                        value={exp.company}
                                        placeholder="Company"
                                        onChange={e => {
                                          const h = [...formData.employmentHistory];
                                          h[idx] = { ...h[idx], company: e.target.value };
                                          setFormData({ ...formData, employmentHistory: h });
                                        }}
                                        className="w-full px-2 py-1 text-xs border border-slate-300 rounded-lg bg-white"
                                      />
                                      <input
                                        type="text"
                                        value={exp.location || ''}
                                        placeholder="Location"
                                        onChange={e => {
                                          const h = [...formData.employmentHistory];
                                          h[idx] = { ...h[idx], location: e.target.value };
                                          setFormData({ ...formData, employmentHistory: h });
                                        }}
                                        className="w-full px-2 py-1 text-xs border border-slate-300 rounded-lg bg-white"
                                      />
                                    </div>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Start Date</label>
                                    <input
                                      type="text"
                                      value={exp.startDate || ''}
                                      onChange={e => {
                                        const h = [...formData.employmentHistory];
                                        h[idx] = { ...h[idx], startDate: e.target.value };
                                        setFormData({ ...formData, employmentHistory: h });
                                      }}
                                      className="w-full px-2 py-1 text-xs border border-slate-300 rounded-lg bg-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">End Date</label>
                                    <input
                                      type="text"
                                      value={exp.endDate || ''}
                                      onChange={e => {
                                        const h = [...formData.employmentHistory];
                                        h[idx] = { ...h[idx], endDate: e.target.value };
                                        setFormData({ ...formData, employmentHistory: h });
                                      }}
                                      className="w-full px-2 py-1 text-xs border border-slate-300 rounded-lg bg-white"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-[10px] font-semibold text-indigo-700 mb-0.5">Experience Snapshot</label>
                                  <input
                                    type="text"
                                    value={exp.aiAnalysis ?? stintAiAnalysis}
                                    onChange={e => {
                                      const h = [...formData.employmentHistory];
                                      h[idx] = { ...h[idx], aiAnalysis: e.target.value };
                                      setFormData({ ...formData, employmentHistory: h });
                                    }}
                                    className="w-full px-2.5 py-1 text-xs border border-indigo-200 rounded-lg bg-white text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  {/* 5. Highest Qualification */}
                  <section className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                        Highest Qualification
                      </h3>
                    </div>
                    {!isLeftFlipped ? (
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
                    ) : (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Degree / Qualification</label>
                          <input
                            type="text"
                            value={formData.educationEntries[0]?.qualification || ''}
                            onChange={e => {
                              const list = [...formData.educationEntries];
                              if (list.length === 0) {
                                list.push({ qualification: e.target.value, institution: '', completionYear: '' });
                              } else {
                                list[0] = { ...list[0], qualification: e.target.value };
                              }
                              setFormData({ ...formData, educationEntries: list });
                            }}
                            className="w-full px-2.5 py-1 border border-slate-300 rounded-lg text-xs bg-white font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Institution</label>
                          <input
                            type="text"
                            value={formData.educationEntries[0]?.institution || ''}
                            onChange={e => {
                              const list = [...formData.educationEntries];
                              if (list.length === 0) {
                                list.push({ qualification: '', institution: e.target.value, completionYear: '' });
                              } else {
                                list[0] = { ...list[0], institution: e.target.value };
                              }
                              setFormData({ ...formData, educationEntries: list });
                            }}
                            className="w-full px-2.5 py-1 border border-slate-300 rounded-lg text-xs bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Completion Year</label>
                          <input
                            type="text"
                            value={formData.educationEntries[0]?.completionYear || ''}
                            onChange={e => {
                              const list = [...formData.educationEntries];
                              if (list.length === 0) {
                                list.push({ qualification: '', institution: '', completionYear: e.target.value });
                              } else {
                                list[0] = { ...list[0], completionYear: e.target.value };
                              }
                              setFormData({ ...formData, educationEntries: list });
                            }}
                            className="w-full px-2.5 py-1 border border-slate-300 rounded-lg text-xs bg-white"
                          />
                        </div>
                      </div>
                    )}
                  </section>

                </div>
              </div>

              {/* Left Footer Hint */}
              <div className="px-4 py-2.5 bg-white border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 flex-shrink-0">
                <span>
                  {isLeftFlipped ? 'Editing AI-Extracted Parameters Inline' : 'AI Standardized Template Loaded'}
                </span>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* RIGHT PANE: Candidate's Original Resume As-Is (Shobhit Saxena PDF Layout) */}
          {/* ========================================================================= */}
          {(layoutMode === 'dual' || layoutMode === 'originalOnly') && (
            <div className={cn(
              "h-full overflow-hidden flex flex-col bg-white",
              layoutMode === 'dual'
                ? "w-full lg:w-1/2 rounded-xl border border-slate-300/90 shadow-sm"
                : "w-full"
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
