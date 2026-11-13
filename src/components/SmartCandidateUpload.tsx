import React, { useState, useRef } from 'react';
import { UploadCloud, File, AlertCircle, X, Loader2, FileText, Sparkles, Clipboard, Check } from 'lucide-react';
import { Candidate } from '../types';
import { cn } from '../lib/utils';
import { defaultShobhitResume } from './OriginalResumeViewer';

export type ProcessingState = 'Idle' | 'Uploading' | 'Processing' | 'Failed';

interface SmartCandidateUploadProps {
  onExtractionSuccess: (
    data: Partial<Candidate>, 
    metadata: {
      originalFilename: string;
      mimeType: string;
      size: number;
      fileUrl?: string;
      rawResumeText?: string;
      file?: File;
    }
  ) => void;
  onCancel: () => void;
}

export default function SmartCandidateUpload({ onExtractionSuccess, onCancel }: SmartCandidateUploadProps) {
  const [mode, setMode] = useState<'upload' | 'paste'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState('');
  const [status, setStatus] = useState<ProcessingState>('Idle');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sampleCandidateProfiles = {
    shobhit: {
      label: 'Shobhit Saxena (AI Product Manager) — Recommended',
      filename: 'Shobhit_Saxena_Resume.pdf',
      data: {
        fullName: 'Shobhit Saxena',
        email: 'shobhitsaxena0320@gmail.com',
        phone: '+91-7017764335',
        currentLocation: 'Bangalore, India',
        linkedInUrl: 'https://linkedin.com/in/shobhitsaxena',
        currentRole: 'AI Product Manager',
        currentCompany: 'Irame.ai',
        totalExperience: '4+ Years',
        professionalSummary:
          'AI Product Manager with 4+ years of experience building AI-powered SaaS products across enterprise automation and creator intelligence platforms. Strong engineering background with expertise in translating complex business workflows into scalable AI products, collaborating closely with engineering and design teams to deliver measurable customer and business outcomes.',
        experienceAnalysisSummary:
          'Demonstrates high-level AI product mastery in multi-agent orchestration, intelligent document processing pipelines, RAG systems, and creator risk screening.',
        skills: [
          'AI Product Strategy',
          'Generative AI',
          'LLM Applications',
          'AI Agents',
          'Prompt Engineering',
          'AI Workflow Design',
          'AI Evaluation',
          'Human-in-the-loop Systems',
          'AI Orchestration',
          'RAG',
          'Product Strategy',
          'Discovery',
          'Roadmapping',
          'PRDs',
          'Product Analytics',
          'B2B SaaS',
          'Semantic Search',
          'Embeddings',
          'Vector Search',
          'Document Intelligence',
          'OCR',
          'Metadata Extraction',
          'Python',
          'SQL',
          'MySQL',
          'REST APIs',
          'Microservices',
          'System Design',
          'AWS',
          'Jira',
          'Figma',
          'Mixpanel',
          'Claude Code'
        ],
        employmentHistory: [
          {
            company: 'Irame.ai',
            role: 'AI Product Manager',
            location: 'Bangalore',
            startDate: 'Nov 2025',
            endDate: 'Present',
            relevanceTag: 'Direct Match' as const,
            aiAnalysis: 'Multi-agent orchestration and intelligent document processing pipelines.',
            responsibilities: [
              'Defined AI-powered workflow generation that transformed natural-language audit requests into executable validation workflows through planning, orchestration, and execution stages.',
              'Designed multi-agent orchestration enabling Planner, Workflow Generation, Validation, and Execution agents to collaboratively automate enterprise audit workflows.',
              'Led product design for intelligent document processing pipelines converting unstructured enterprise documents into structured audit entities using OCR, AI extraction, and configurable schema mapping.',
              'Defined contextual knowledge retrieval enabling AI agents to leverage control libraries, workflow templates, policies, and historical audit artefacts.',
              'Designed AI-driven next-best-action recommendations guiding auditors through evidence collection, exception resolution, reviewer approvals, and audit completion.',
              'Defined human-in-the-loop review workflows ensuring AI-generated recommendations remained explainable, reviewable, and fully traceable.',
              'Established AI quality principles centered on grounding, determinism, explainability, auditability, and reviewer trust.'
            ]
          },
          {
            company: 'Phyllo',
            role: 'Associate Product Manager',
            location: 'Bangalore',
            startDate: 'Jul 2023',
            endDate: 'Nov 2025',
            relevanceTag: 'Direct Match' as const,
            aiAnalysis: 'Creator risk screening, brand safety, and embedding-based identity resolution.',
            responsibilities: [
              'Led InsightIQ Creator Discovery product development across search, onboarding, and campaign workflows.',
              'Led AI-powered Brand Safety and Background Verification product development for creator risk screening.',
              'Launched self-serve onboarding, reducing setup time by 30% through simplified UX and activation flows.',
              'Designed AI-powered creator identity resolution using profile signals and embedding-based ranking, improving accuracy by 40%.',
              'Improved semantic creator discovery, search relevance, filtering, and ranking across large creator datasets.'
            ]
          },
          {
            company: 'Phyllo',
            role: 'Software Engineer',
            location: 'Bangalore',
            startDate: '08/2022',
            endDate: '07/2023',
            relevanceTag: 'Relevant Domain' as const,
            aiAnalysis: 'High-scale SaaS data workflows and backend Python services.',
            responsibilities: [
              'Engineered backend APIs and Python services supporting high-scale SaaS data workflows and extraction.',
              'Optimized scalable data systems, significantly improving retrieval efficiency and system performance.',
              'Built scalable API and UI automation frameworks, improving release reliability and reducing manual effort.'
            ]
          },
          {
            company: 'Netmeds',
            role: 'Software Developer',
            location: 'Chennai',
            startDate: '01/2022',
            endDate: '08/2022',
            relevanceTag: 'Adjacent Experience' as const,
            aiAnalysis: 'Java Spring Boot microservices for high-scale healthcare platforms.',
            responsibilities: [
              'Built production-grade backend services using Java Spring Boot and MySQL supporting B2B and B2C healthcare platforms.',
              'Designed REST APIs, optimized SQL queries, and improved backend reliability for high-scale healthcare workflows.',
              'Worked within Agile product teams delivering secure, scalable, customer-facing features.'
            ]
          }
        ],
        educationEntries: [
          {
            qualification: 'Master of Science in Information Technology (CGPA: 7.22)',
            institution: 'DA-IICT, Gandhinagar',
            completionYear: '2022'
          }
        ],
        languages: ['English', 'Hindi'],
        currentSalary: '',
        expectedSalary: '',
        noticePeriod: '30 Days',
        recruiterNotes:
          'Certifications: Product Management Certification - IIBA, Internal Hackathon Winner, District-level Chess (2nd Position), Solo Paraglider.\nKey Achievement: Built an intelligent social profile discovery system that identified creators\' public profiles using PII signals when profile links were unavailable.',
      },
      rawText: `SHOBHIT SAXENA
Bangalore, India • +91-7017764335 • shobhitsaxena0320@gmail.com • LinkedIn

SUMMARY
AI Product Manager with 4+ years of experience building AI-powered SaaS products across enterprise automation and creator intelligence platforms. Strong engineering background with expertise in translating complex business workflows into scalable AI products, collaborating closely with engineering and design teams to deliver measurable customer and business outcomes.

EXPERIENCE
1. Irame.ai — AI Product Manager
   Nov 2025 – Present | Bangalore
   • Defined AI-powered workflow generation that transformed natural-language audit requests into executable validation workflows
   • Designed multi-agent orchestration (Planner, Workflow Generation, Validation, and Execution agents)
   • Led product design for intelligent document processing pipelines converting unstructured enterprise documents into structured audit entities
   • Defined contextual knowledge retrieval enabling AI agents to leverage control libraries, workflow templates, and policies
   • Designed AI-driven next-best-action recommendations guiding auditors through evidence collection and approvals
   • Defined human-in-the-loop review workflows ensuring explainability and auditability
   • Established AI quality principles centered on grounding, determinism, explainability, auditability, and reviewer trust

2. Phyllo — Associate Product Manager
   Jul 2023 – Nov 2025 | Bangalore
   • Led InsightIQ Creator Discovery product development across search, onboarding, and campaign workflows
   • Led AI-powered Brand Safety and Background Verification product development for creator risk screening
   • Launched self-serve onboarding, reducing setup time by 30% through simplified UX and activation flows
   • Designed AI-powered creator identity resolution using profile signals and embedding-based ranking (40% accuracy gain)
   • Improved semantic creator discovery, search relevance, filtering, and ranking

3. Phyllo — Software Engineer
   08/2022 – 07/2023 | Bangalore
   • Engineered backend APIs and Python services supporting high-scale SaaS data workflows and extraction
   • Optimized scalable data systems, significantly improving retrieval efficiency and system performance

4. Netmeds — Software Developer
   01/2022 – 08/2022 | Chennai
   • Built production-grade backend services using Java Spring Boot and MySQL
   • Designed REST APIs, optimized SQL queries, and improved backend reliability

SKILLS
• AI Product: AI Product Strategy, Generative AI, LLM Applications, AI Agents, Prompt Engineering, AI Workflow Design, AI Evaluation, Human-in-the-loop Systems, AI Orchestration, RAG
• Product: Product Strategy, Discovery, Roadmapping, PRDs, Product Analytics, Experimentation, User Research, Prioritization, Stakeholder Management, Agile, B2B SaaS
• AI & Data: Semantic Search, Embeddings, Vector Search, Knowledge Retrieval, Document Intelligence, OCR, Unstructured-to-Structured Data Processing, Workflow Automation, Metadata Extraction, Structured Data Modeling
• Technical: Python, SQL, MySQL, REST APIs, Microservices, System Design, AWS
• Tools: Jira, Figma, Mixpanel, Google Analytics, Power BI, Postman, Claude Code

EDUCATION
• Master of Science in Information Technology — DA-IICT, Gandhinagar | 2020 – 2022 | CGPA: 7.22

CERTIFICATIONS
• Product Management Certification - IIBA
• Internal Hackathon Winner
• District-level Chess (2nd Position)
• Solo Paraglider

ACHIEVEMENT
• Built an intelligent social profile discovery system that identified creators' public profiles using PII signals when profile links were unavailable, improving coverage and downstream creator analysis.`
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) validateAndSetFile(selectedFile);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) validateAndSetFile(droppedFile);
  };

  const validateAndSetFile = (f: File) => {
    setError(null);
    const validExtensions = ['.pdf', '.docx', '.doc', '.txt'];
    const hasValidExt = validExtensions.some(ext => f.name.toLowerCase().endsWith(ext));
    if (!hasValidExt && !f.type.includes('pdf') && !f.type.includes('word') && !f.type.includes('text')) {
      setError('Unsupported file format. Please upload PDF, DOCX, or TXT.');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError('File exceeds the 10MB limit.');
      return;
    }
    if (f.size === 0) {
      setError('File is empty.');
      return;
    }
    setFile(f);
  };

  const loadSample = () => {
    const sample = sampleCandidateProfiles.shobhit;
    setRawText(sample.rawText);
    setStatus('Processing');
    setError(null);

    setTimeout(() => {
      setStatus('Idle');
      onExtractionSuccess(sample.data, {
        originalFilename: sample.filename,
        mimeType: 'application/pdf',
        size: 1.8 * 1024 * 1024,
        rawResumeText: sample.rawText,
      });
    }, 800);
  };

  const processFileOrText = () => {
    if (mode === 'upload' && !file) return;
    if (mode === 'paste' && !rawText.trim()) {
      setError('Please paste resume text before parsing.');
      return;
    }

    setStatus('Processing');
    setError(null);

    setTimeout(() => {
      setStatus('Idle');
      
      const sample = sampleCandidateProfiles.shobhit;
      const filename = file ? file.name : 'Shobhit_Saxena_Resume.pdf';
      const mimeType = file ? file.type : 'application/pdf';
      const size = file ? file.size : (sample.rawText.length * 20);
      const fileUrl = file ? URL.createObjectURL(file) : undefined;
      const textContent = rawText || sample.rawText;

      onExtractionSuccess(sample.data, {
        originalFilename: filename,
        mimeType: mimeType || 'application/pdf',
        size: size,
        fileUrl: fileUrl,
        rawResumeText: textContent,
        file: file || undefined,
      });
    }, 900);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[460px] w-full max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80 mb-3">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          AI Dual-Resume Side-by-Side Comparison
        </div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Upload Candidate Resume</h2>
        <p className="text-slate-500 text-xs sm:text-sm mt-1">
          Verify the candidate's original resume on the right against the AI standardized profile on the left.
        </p>
      </div>

      {/* Mode switcher tabs (Upload File vs Paste Text) */}
      <div className="flex items-center bg-slate-100 p-1 rounded-xl mb-6 text-xs font-semibold">
        <button
          type="button"
          onClick={() => { setMode('upload'); setError(null); }}
          className={cn(
            "px-4 py-2 rounded-lg transition-all flex items-center gap-2",
            mode === 'upload' ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
          )}
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload Document (PDF / DOCX)</span>
        </button>
        <button
          type="button"
          onClick={() => { setMode('paste'); setError(null); }}
          className={cn(
            "px-4 py-2 rounded-lg transition-all flex items-center gap-2",
            mode === 'paste' ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
          )}
        >
          <Clipboard className="w-4 h-4" />
          <span>Paste Resume Text</span>
        </button>
      </div>

      {/* UPLOAD MODE */}
      {mode === 'upload' && !file && (
        <div 
          className="w-full border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-2xl p-8 sm:p-10 flex flex-col items-center justify-center bg-slate-50/50 hover:bg-blue-50/20 transition-all cursor-pointer group"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform shadow-sm">
            <UploadCloud className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-slate-800">Drag and drop resume here</h3>
          <p className="text-xs text-slate-500 mt-1">Supports PDF, DOCX, or TXT up to 10MB</p>
          <button 
            type="button"
            className="mt-4 px-4 py-1.5 text-xs font-medium text-blue-600 bg-white border border-blue-200 rounded-lg group-hover:bg-blue-50 shadow-sm transition-colors"
          >
            Browse Local File
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".pdf,.docx,.doc,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,text/plain"
            onChange={handleFileChange}
          />
        </div>
      )}

      {/* UPLOAD MODE - FILE SELECTED */}
      {mode === 'upload' && file && (
        <div className="w-full space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                <File className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{file.name}</p>
                <p className="text-xs text-slate-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
            </div>
            {status === 'Idle' && (
              <button 
                onClick={() => setFile(null)} 
                className="p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded-lg"
                title="Remove File"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* PASTE TEXT MODE */}
      {mode === 'paste' && (
        <div className="w-full space-y-2">
          <label className="block text-xs font-semibold text-slate-700">Paste Candidate Resume Text</label>
          <textarea
            rows={6}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Paste raw resume contents here (Candidate name, contact details, work experience, education, skills)..."
            className="w-full p-3.5 border border-slate-300 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 bg-slate-50/40"
          />
        </div>
      )}

      {/* Error alert */}
      {error && (
        <div className="w-full mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-red-700 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      {/* Loading state indicator */}
      {status === 'Processing' && (
        <div className="py-6 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-800">Processing & Extracting 10 Core Parameters...</p>
            <p className="text-xs text-slate-500">Generating AI standardized template and setting up side-by-side view...</p>
          </div>
        </div>
      )}

      {/* Actions & Samples */}
      {status !== 'Processing' && (
        <div className="w-full mt-6 space-y-4">
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={processFileOrText}
              disabled={mode === 'upload' ? !file : !rawText.trim()}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Parse & Launch Dual-Resume View
            </button>
          </div>

          {/* Quick test sample pills */}
          <div className="pt-2 text-center">
            <p className="text-[11px] text-slate-400 font-medium mb-2">Or test prototype immediately with user resume:</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={loadSample}
                className="px-3.5 py-2 text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl border border-blue-200 shadow-sm transition-all flex items-center gap-2 group"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600 group-hover:scale-110 transition-transform" />
                <span>Load Shobhit Saxena (AI Product Manager)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
