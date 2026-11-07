import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import OriginalResumeViewer, { defaultShobhitResume, OriginalResumeData } from './OriginalResumeViewer';

interface ResumeModalProps {
  candidateId: string;
  onClose: () => void;
}

export default function ResumeModal({ candidateId, onClose }: ResumeModalProps) {
  const { candidates } = useApp();
  const candidate = candidates.find(c => c.id === candidateId);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!candidate) return null;

  const isShobhit = candidate.fullName.toLowerCase().includes('shobhit') || !candidate.employmentHistory || candidate.employmentHistory.length === 0;

  const resumeData: OriginalResumeData = isShobhit
    ? defaultShobhitResume
    : {
        fullName: candidate.fullName.toUpperCase(),
        location: candidate.currentLocation || 'Bangalore, India',
        phone: candidate.phone || '+91-7017764335',
        email: candidate.email || 'candidate@example.com',
        linkedInUrl: candidate.linkedInUrl,
        summary: candidate.professionalSummary || defaultShobhitResume.summary,
        experience: candidate.employmentHistory && candidate.employmentHistory.length > 0
          ? candidate.employmentHistory.map((e, idx) => ({
              role: e.role,
              company: e.company,
              duration: `${e.startDate} – ${e.endDate}`,
              location: e.location || 'Bangalore',
              bullets: e.responsibilities && e.responsibilities.length > 0
                ? e.responsibilities
                : defaultShobhitResume.experience[idx]?.bullets || [e.aiAnalysis || 'Executed core domain workflows and project milestones.']
            }))
          : defaultShobhitResume.experience,
        skills: defaultShobhitResume.skills,
        education: defaultShobhitResume.education,
        certifications: defaultShobhitResume.certifications,
        achievement: defaultShobhitResume.achievement
      };

  const filename = candidate.resumeUrl?.split('/').pop() || `${candidate.fullName.replace(/\s+/g, '_')}_Resume.pdf`;

  const handleDownload = () => {
    if (!candidate.resumeUrl) return;
    const link = document.createElement('a');
    const href = candidate.resumeUrl.startsWith('http') || candidate.resumeUrl.startsWith('blob:')
      ? candidate.resumeUrl
      : `/${candidate.resumeUrl}`;
    link.href = href;
    link.download = filename;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[92vh] flex flex-col overflow-hidden border border-slate-200"
        onClick={e => e.stopPropagation()}
      >
        <OriginalResumeViewer
          data={resumeData}
          filename={filename}
          onClose={onClose}
          onDownload={handleDownload}
        />
      </div>
    </div>
  );
}
