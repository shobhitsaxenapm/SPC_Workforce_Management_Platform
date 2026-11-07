import React, { useState } from 'react';
import { FileText, Copy, Check, ExternalLink, Download, Sparkles, Building, Briefcase, GraduationCap, Award, Trophy, MapPin, Mail, Phone, Globe, X } from 'lucide-react';
import { cn } from '../lib/utils';

export interface OriginalResumeData {
  fullName: string;
  location: string;
  phone: string;
  email: string;
  linkedInUrl?: string;
  summary: string;
  experience: Array<{
    role: string;
    company: string;
    duration: string;
    location: string;
    bullets: string[];
  }>;
  skills: {
    aiProduct: string[];
    product: string[];
    aiAndData: string[];
    technical: string[];
    tools: string[];
  };
  education: Array<{
    degree: string;
    institution: string;
    year: string;
    cgpa?: string;
  }>;
  certifications: string[];
  achievement: string;
}

export const defaultShobhitResume: OriginalResumeData = {
  fullName: 'SHOBHIT SAXENA',
  location: 'Bangalore, India',
  phone: '+91-7017764335',
  email: 'shobhitsaxena0320@gmail.com',
  linkedInUrl: 'https://linkedin.com/in/shobhitsaxena',
  summary:
    'AI Product Manager with 4+ years of experience building AI-powered SaaS products across enterprise automation and creator intelligence platforms. Strong engineering background with expertise in translating complex business workflows into scalable AI products, collaborating closely with engineering and design teams to deliver measurable customer and business outcomes.',
  experience: [
    {
      role: 'AI Product Manager',
      company: 'Irame.ai',
      duration: 'Nov 2025 – Present',
      location: 'Bangalore',
      bullets: [
        'Defined AI-powered workflow generation that transformed natural-language audit requests into executable validation workflows through planning, orchestration, and execution stages.',
        'Designed multi-agent orchestration enabling Planner, Workflow Generation, Validation, and Execution agents to collaboratively automate enterprise audit workflows under a centralized orchestration layer.',
        'Led product design for intelligent document processing pipelines converting unstructured enterprise documents into structured audit entities using OCR, AI extraction, and configurable schema mapping.',
        'Defined contextual knowledge retrieval enabling AI agents to leverage control libraries, workflow templates, policies, and historical audit artefacts during workflow generation and execution.',
        'Designed AI-driven next-best-action recommendations guiding auditors through evidence collection, exception resolution, reviewer approvals, and audit completion.',
        'Defined human-in-the-loop review workflows ensuring AI-generated recommendations remained explainable, reviewable, and fully traceable for enterprise compliance.',
        'Established AI quality principles centered on grounding, determinism, explainability, auditability, and reviewer trust for production AI workflows.'
      ]
    },
    {
      role: 'Associate Product Manager',
      company: 'Phyllo',
      duration: 'Jul 2023 – Nov 2025',
      location: 'Bangalore',
      bullets: [
        'Led InsightIQ Creator Discovery product development across search, onboarding, and campaign workflows.',
        'Led AI-powered Brand Safety and Background Verification product development for creator risk screening. Analyzed creator videos, images, text, and social content to flag policy violations, reputational risks, and brand suitability.',
        'Launched self-serve onboarding, reducing setup time by 30% through simplified UX and activation flows.',
        'Designed AI-powered creator identity resolution using profile signals and embedding-based ranking, improving accuracy by 40%.',
        'Improved semantic creator discovery, search relevance, filtering, and ranking across large creator datasets.',
        'Defined experiments to measure onboarding activation, creator discovery success, and customer adoption.',
        'Defined and tracked activation, onboarding completion, feature adoption, search success rate, and retention metrics to evaluate product performance and prioritize roadmap improvements.',
        'Managed platform integrations and analytics for creator discovery, campaign management, and reporting.',
        'Prioritized roadmap initiatives with Engineering, Design, CS, and Sales using feedback and product analytics.'
      ]
    },
    {
      role: 'Software Engineer',
      company: 'Phyllo',
      duration: '08/2022 – 07/2023',
      location: 'Bangalore',
      bullets: [
        'Engineered backend APIs and Python services supporting high-scale SaaS data workflows and extraction.',
        'Optimized scalable data systems, significantly improving retrieval efficiency and system performance.',
        'Built scalable API and UI automation frameworks, improving release reliability and reducing manual effort.'
      ]
    },
    {
      role: 'Software Developer',
      company: 'Netmeds',
      duration: '01/2022 – 08/2022',
      location: 'Chennai',
      bullets: [
        'Built production-grade backend services using Java Spring Boot and MySQL supporting B2B and B2C healthcare platforms.',
        'Designed REST APIs, optimized SQL queries, and improved backend reliability for high-scale healthcare workflows.',
        'Worked within Agile product teams delivering secure, scalable, customer-facing features.'
      ]
    }
  ],
  skills: {
    aiProduct: [
      'AI Product Strategy',
      'Generative AI',
      'LLM Applications',
      'AI Agents',
      'Prompt Engineering',
      'AI Workflow Design',
      'AI Evaluation',
      'Human-in-the-loop Systems',
      'AI Orchestration',
      'RAG'
    ],
    product: [
      'Product Strategy',
      'Discovery',
      'Roadmapping',
      'PRDs',
      'Product Analytics',
      'Experimentation',
      'User Research',
      'Prioritization',
      'Stakeholder Management',
      'Agile',
      'B2B SaaS'
    ],
    aiAndData: [
      'Semantic Search',
      'Embeddings',
      'Vector Search',
      'Knowledge Retrieval',
      'Document Intelligence',
      'OCR',
      'Unstructured-to-Structured Data Processing',
      'Workflow Automation',
      'Metadata Extraction',
      'Structured Data Modeling'
    ],
    technical: ['Python', 'SQL', 'MySQL', 'REST APIs', 'Microservices', 'System Design', 'AWS'],
    tools: ['Jira', 'Figma', 'Mixpanel', 'Google Analytics', 'Power BI', 'Postman', 'Claude Code']
  },
  education: [
    {
      degree: 'Master of Science in Information Technology',
      institution: 'DA-IICT, Gandhinagar',
      year: '2020 – 2022',
      cgpa: '7.22'
    }
  ],
  certifications: [
    'Product Management Certification - IIBA',
    'Internal Hackathon Winner',
    'District-level Chess (2nd Position)',
    'Solo Paraglider'
  ],
  achievement:
    'Built an intelligent social profile discovery system that identified creators\' public profiles using PII signals when profile links were unavailable, improving coverage and downstream creator analysis.'
};

interface OriginalResumeViewerProps {
  data?: OriginalResumeData;
  filename?: string;
  onClose?: () => void;
  onDownload?: () => void;
}

export default function OriginalResumeViewer({
  data = defaultShobhitResume,
  filename = 'Shobhit_Saxena_Resume.pdf',
  onClose,
  onDownload,
}: OriginalResumeViewerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyText = () => {
    const raw = `${data.fullName}\n${data.location} • ${data.phone} • ${data.email}\n\nSUMMARY\n${data.summary}\n\nEXPERIENCE\n` +
      data.experience.map(e => `${e.role} | ${e.company} (${e.duration} | ${e.location})\n` + e.bullets.map(b => `• ${b}`).join('\n')).join('\n\n');
    navigator.clipboard.writeText(raw);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-100/80 overflow-hidden">
      {/* Pane Top Header */}
      <div className="px-4 py-3 bg-white border-b border-slate-200 flex items-center justify-between gap-2 flex-shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0 border border-red-100">
            <FileText className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-slate-900 truncate" title={filename}>
                {filename}
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-100 text-red-700 rounded">
                ORIGINAL PDF
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Candidate's Uploaded Document</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyText}
            className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors flex items-center gap-1.5"
            title="Copy Original Resume Text"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy Text'}</span>
          </button>
          {onDownload && (
            <button
              type="button"
              onClick={onDownload}
              className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors flex items-center gap-1.5"
              title="Download Original PDF"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Download</span>
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors ml-1 cursor-pointer"
              title="Close viewer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Actual PDF Document Render Area (A4 Paper Styling) */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 flex justify-center">
        <div className="w-full max-w-[760px] bg-white rounded-lg shadow-md border border-slate-300/80 p-8 md:p-10 text-slate-900 font-sans space-y-5 text-[12px] leading-relaxed select-text">
          
          {/* Header */}
          <div className="border-b border-slate-300 pb-4">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-950">
              {data.fullName}
            </h1>
            <p className="text-xs text-slate-600 mt-1 font-medium flex flex-wrap items-center gap-x-2 gap-y-1">
              <span>{data.location}</span>
              <span>•</span>
              <span>{data.phone}</span>
              <span>•</span>
              <span className="text-blue-600 hover:underline">{data.email}</span>
              <span>•</span>
              <span className="text-blue-600 hover:underline">LinkedIn</span>
            </p>
          </div>

          {/* SUMMARY */}
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5 border-b border-slate-200 pb-0.5">
              SUMMARY
            </h2>
            <p className="text-slate-700 text-[11.5px] leading-normal text-justify">
              {data.summary}
            </p>
          </div>

          {/* EXPERIENCE */}
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5 border-b border-slate-200 pb-0.5">
              EXPERIENCE
            </h2>
            <div className="space-y-4">
              {data.experience.map((exp, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-bold text-slate-900 text-[12.5px]">
                      {exp.role} <span className="font-normal text-slate-600">| {exp.company}</span>
                    </span>
                    <span className="text-[11px] font-semibold text-slate-600 flex-shrink-0">
                      {exp.duration} | {exp.location}
                    </span>
                  </div>
                  <ul className="list-disc list-outside ml-4 space-y-1 text-slate-700 text-[11px] leading-snug">
                    {exp.bullets.map((bullet, bIdx) => (
                      <li key={bIdx} className="pl-0.5 text-justify">
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* SKILLS */}
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 border-b border-slate-200 pb-0.5">
              SKILLS
            </h2>
            <div className="space-y-1.5 text-[11px] text-slate-800">
              <p>
                <strong className="font-bold text-slate-900">AI Product:</strong>{' '}
                {data.skills.aiProduct.join(' • ')}
              </p>
              <p>
                <strong className="font-bold text-slate-900">Product:</strong>{' '}
                {data.skills.product.join(' • ')}
              </p>
              <p>
                <strong className="font-bold text-slate-900">AI & Data:</strong>{' '}
                {data.skills.aiAndData.join(' • ')}
              </p>
              <p>
                <strong className="font-bold text-slate-900">Technical:</strong>{' '}
                {data.skills.technical.join(' • ')}
              </p>
              <p>
                <strong className="font-bold text-slate-900">Tools:</strong>{' '}
                {data.skills.tools.join(' • ')}
              </p>
            </div>
          </div>

          {/* EDUCATION */}
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5 border-b border-slate-200 pb-0.5">
              EDUCATION
            </h2>
            {data.education.map((ed, idx) => (
              <div key={idx} className="text-[11.5px]">
                <p className="font-bold text-slate-900">{ed.degree}</p>
                <p className="text-slate-600 text-[11px]">
                  {ed.institution} | {ed.year} {ed.cgpa && `| CGPA: ${ed.cgpa}`}
                </p>
              </div>
            ))}
          </div>

          {/* CERTIFICATIONS */}
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5 border-b border-slate-200 pb-0.5">
              CERTIFICATIONS
            </h2>
            <ul className="list-disc list-outside ml-4 space-y-0.5 text-slate-700 text-[11px]">
              {data.certifications.map((cert, idx) => (
                <li key={idx}>{cert}</li>
              ))}
            </ul>
          </div>

          {/* ACHIEVEMENT */}
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5 border-b border-slate-200 pb-0.5">
              ACHIEVEMENT
            </h2>
            <p className="text-slate-700 text-[11px] leading-relaxed">
              {data.achievement}
            </p>
          </div>

        </div>
      </div>

      {/* Pane Footer */}
      <div className="px-4 py-2.5 bg-white border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 flex-shrink-0">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          Original Source Document Verified
        </span>
        <span className="font-mono text-slate-400 text-[10px]">
          1 Page • A4 Format
        </span>
      </div>
    </div>
  );
}
