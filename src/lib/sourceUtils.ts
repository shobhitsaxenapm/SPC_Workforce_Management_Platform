import React from 'react';
import { 
  Globe, 
  Linkedin, 
  Briefcase, 
  Upload, 
  Layers, 
  Sparkles, 
  UserPlus 
} from 'lucide-react';
import { CandidateJobSource, CANONICAL_SOURCES } from '../types';

/**
 * Normalizes any raw source string into one of the 7 canonical CandidateJobSource values.
 */
export function normalizeSource(raw?: string | null): CandidateJobSource {
  if (!raw) return 'SPC Careers Website';
  const clean = raw.trim();

  // Exact match
  if (CANONICAL_SOURCES.includes(clean as CandidateJobSource)) {
    return clean as CandidateJobSource;
  }

  const lower = clean.toLowerCase();

  // Rules:
  // Direct untracked Careers form submission or legacy direct labels -> 'SPC Careers Website'
  if (
    lower.includes('careers website') || 
    lower.includes('direct application') || 
    lower === 'direct' || 
    lower === 'website' || 
    lower === 'web'
  ) {
    return 'SPC Careers Website';
  }

  // Careers form opened using tracked LinkedIn link -> 'LinkedIn'
  if (lower.includes('linkedin')) {
    return 'LinkedIn';
  }

  // Tracked Naukri link / integration -> 'Naukri'
  if (lower.includes('naukri')) {
    return 'Naukri';
  }

  // Single candidate uploaded directly against a Job -> 'Manual Upload'
  if (
    lower.includes('manual upload') || 
    lower === 'manual entry' || 
    lower === 'manual'
  ) {
    return 'Manual Upload';
  }

  // Batch uploaded against a Job -> 'Bulk Upload'
  if (
    lower.includes('bulk') || 
    lower.includes('bulk resume upload')
  ) {
    return 'Bulk Upload';
  }

  // Candidate–Job relationship created from Matches -> 'AI Match'
  if (
    lower.includes('ai match') || 
    lower.includes('internal match') || 
    lower.includes('matching engine') ||
    lower.includes('match')
  ) {
    return 'AI Match';
  }

  // Existing database candidate manually added to a Job -> 'Recruiter Added'
  if (
    lower.includes('recruiter added') || 
    lower.includes('referral') || 
    lower.includes('talent pool') || 
    lower.includes('email') || 
    lower.includes('whatsapp') ||
    lower.includes('job portal')
  ) {
    return 'Recruiter Added';
  }

  return 'SPC Careers Website';
}

export interface SourceDisplayConfig {
  label: CandidateJobSource;
  icon: React.ComponentType<{ className?: string }>;
  badgeClass: string;
  dotClass: string;
}

export function getSourceDisplayConfig(source: string): SourceDisplayConfig {
  const canonical = normalizeSource(source);

  switch (canonical) {
    case 'SPC Careers Website':
      return {
        label: canonical,
        icon: Globe,
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
        dotClass: 'bg-blue-500'
      };
    case 'LinkedIn':
      return {
        label: canonical,
        icon: Linkedin,
        badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
        dotClass: 'bg-sky-500'
      };
    case 'Naukri':
      return {
        label: canonical,
        icon: Briefcase,
        badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        dotClass: 'bg-indigo-500'
      };
    case 'Manual Upload':
      return {
        label: canonical,
        icon: Upload,
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        dotClass: 'bg-amber-500'
      };
    case 'Bulk Upload':
      return {
        label: canonical,
        icon: Layers,
        badgeClass: 'bg-orange-50 text-orange-700 border-orange-200',
        dotClass: 'bg-orange-500'
      };
    case 'AI Match':
      return {
        label: canonical,
        icon: Sparkles,
        badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
        dotClass: 'bg-purple-500'
      };
    case 'Recruiter Added':
      return {
        label: canonical,
        icon: UserPlus,
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dotClass: 'bg-emerald-500'
      };
  }
}
