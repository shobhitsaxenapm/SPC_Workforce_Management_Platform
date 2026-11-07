import React, { useState } from 'react';
import { Job, Application } from '../types';
import { getJobIntelligence } from '../lib/jobIntelligence';
import { 
  Sparkles, 
  MapPin, 
  Briefcase, 
  Clock, 
  CheckCircle2, 
  Star, 
  Target, 
  HelpCircle, 
  Layers, 
  Search, 
  Calendar, 
  Globe, 
  Lock, 
  ChevronDown, 
  ChevronUp, 
  Settings,
  AlertCircle
} from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { getHiringModelBadgeConfig } from '../lib/hiringModelUtils';

interface JobOverviewTabProps {
  job: Job;
  applications: Application[];
  applicants: Application[];
  pipelineApps: Application[];
  activeMatches: any[];
  currentMatchRun?: any;
  canRunMatching: boolean;
  isRefreshing: boolean;
  onRefreshMatches: () => void;
  onConfigureHiringModel: () => void;
}

export default function JobOverviewTab({
  job,
  applications,
  applicants,
  pipelineApps,
  activeMatches,
  currentMatchRun,
  canRunMatching,
  isRefreshing,
  onRefreshMatches,
  onConfigureHiringModel,
}: JobOverviewTabProps) {
  const intel = getJobIntelligence(job);
  const [showScreeningQuestions, setShowScreeningQuestions] = useState(true);

  const progress = job.openings > 0 ? (job.filled / job.openings) * 100 : 0;
  const activePipelineCount = pipelineApps.filter(
    a => (a.currentStage as string) !== 'Rejected' && (a.currentStage as string) !== 'Withdrawn' && (a.currentStage as string) !== 'Offer Declined'
  ).length;

  const modelConfig = getHiringModelBadgeConfig(job.hiringModel);
  const ModelIcon = modelConfig.icon;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* LEFT COLUMN (8 cols): AI Job Specification & Recruiter Intelligence */}
      <div className="lg:col-span-8 space-y-6">
        
        {/* Main Job Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          
          {/* Hero Header */}
          <div className="pb-5 border-b border-slate-100 flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
                  {job.code}
                </span>
                <span className={cn(
                  "px-2.5 py-0.5 rounded-full text-xs font-semibold border",
                  job.status === 'Open' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                  job.status === 'On Hold' ? "bg-amber-50 text-amber-700 border-amber-200" :
                  job.status === 'Draft' ? "bg-slate-100 text-slate-700 border-slate-200" :
                  "bg-slate-100 text-slate-500 border-slate-200"
                )}>
                  {job.status}
                </span>
                <span className={cn(
                  "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border",
                  modelConfig.badgeClass
                )}>
                  <ModelIcon className="w-3 h-3" />
                  {modelConfig.label}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {job.title}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2">
                <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {job.location}
                </span>
                <span className="text-slate-300">•</span>
                <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  {job.employmentType || 'Full-time'}
                </span>
                <span className="text-slate-300">•</span>
                <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {job.experienceRange || '3-5 Years'}
                </span>
                <span className="text-slate-300">•</span>
                <span className="font-medium text-slate-700">
                  {job.openings} {job.openings === 1 ? 'Opening' : 'Openings'}
                </span>
              </div>
            </div>

            {/* Quick Sourcing Guardrails Chip */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 shrink-0 self-start text-xs space-y-1 min-w-[200px]">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Target Notice Period</div>
              <div className="font-semibold text-slate-800">{intel.sourcingGuardrails.noticePeriod}</div>
              <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                Min. Education: <strong className="text-slate-700 font-medium">{intel.sourcingGuardrails.education}</strong>
              </div>
            </div>
          </div>

          {/* 1. AI Role Mission (2-Line Plain English Summary) */}
          <div className="bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-slate-50 border border-blue-200/80 rounded-xl p-4 sm:p-5 relative overflow-hidden shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                AI Role Mission &amp; Purpose
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600/80">Recruiter Brief</span>
            </div>
            <div className="space-y-1.5 text-xs sm:text-sm text-slate-800 leading-relaxed">
              <p className="font-semibold text-slate-900">
                {intel.roleMission[0]}
              </p>
              <p className="text-slate-600 font-normal">
                {intel.roleMission[1]}
              </p>
            </div>
          </div>

          {/* 2. Competency Matrix: Must-Have vs. Advantageous */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-slate-500" />
                Candidate Competency Matrix
              </h3>
              <span className="text-[11px] text-slate-400">Hard criteria vs. Bonus qualifications</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Must-Haves */}
              <div className="bg-emerald-50/40 border border-emerald-200/80 rounded-xl p-4">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wide">
                    Must-Have Requirements (Non-Negotiable)
                  </h4>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {intel.mustHaveSkills.map(skill => (
                    <span 
                      key={skill}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-white text-emerald-800 text-xs font-semibold rounded-lg border border-emerald-200 shadow-2xs"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Advantageous / Good-to-Have */}
              <div className="bg-indigo-50/40 border border-indigo-200/80 rounded-xl p-4">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <Star className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wide">
                    Advantageous / Bonus Skills
                  </h4>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {intel.goodToHaveSkills.map(skill => (
                    <span 
                      key={skill}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-white text-indigo-800 text-xs font-medium rounded-lg border border-indigo-200 shadow-2xs"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 3. Operational Deliverables & Focus Pillars */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 mb-3">
              <Layers className="w-4 h-4 text-slate-500" />
              Core Deliverables &amp; Focus Pillars
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {intel.impactPillars.map((pillar, idx) => (
                <div 
                  key={idx}
                  className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-3.5 flex flex-col justify-between hover:border-slate-300 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold text-slate-400">Pillar 0{idx + 1}</span>
                      <span className="text-[10px] font-semibold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {pillar.tag}
                      </span>
                    </div>
                    <h5 className="font-semibold text-slate-900 text-xs mb-1">
                      {pillar.title}
                    </h5>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {pillar.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Ideal Candidate Persona */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
              <span>Ideal Candidate Archetype</span>
            </h4>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              {intel.candidatePersona.targetBackground}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              <strong>Key Traits:</strong> {intel.candidatePersona.keyAttributes}
            </p>
          </div>

          {/* 5. Recruiter Phone Screening Questions (Interactive Accordion) */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <button
              type="button"
              onClick={() => setShowScreeningQuestions(!showScreeningQuestions)}
              className="w-full px-4 py-3 bg-slate-50/90 hover:bg-slate-100/90 flex items-center justify-between transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-900">
                  Recruiter Screening Prompts (Phone Screen Cheat Sheet)
                </span>
                <span className="text-[10px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                  3 Questions
                </span>
              </div>
              {showScreeningQuestions ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {showScreeningQuestions && (
              <div className="p-4 bg-white divide-y divide-slate-100 text-xs">
                {intel.screeningQuestions.map((q, idx) => (
                  <div key={idx} className="py-2.5 first:pt-0 last:pb-0 flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-700 font-bold text-[11px] flex items-center justify-center shrink-0 border border-blue-200 mt-0.5">
                      Q{idx + 1}
                    </span>
                    <p className="text-slate-800 font-medium leading-relaxed">
                      {q}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* RIGHT COLUMN (4 cols): Sourcing Progress & Job Logistics Command */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* Job Progress & Sourcing Live Command Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <h3 className="font-bold text-slate-900 text-sm mb-4">Job Progress &amp; Sourcing</h3>
          
          <div className="flex justify-between items-end mb-2">
            <div>
              <span className="text-3xl font-bold text-slate-900">{job.filled}</span>
              <span className="text-xs font-semibold text-slate-400 ml-1">filled</span>
            </div>
            <div className="text-xs font-medium text-slate-500 mb-1">
              Target: <strong className="text-slate-800">{job.openings}</strong> {job.openings === 1 ? 'Opening' : 'Openings'}
            </div>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-2.5 mb-4 overflow-hidden">
            <div 
              className={cn(
                "h-2.5 rounded-full transition-all duration-500",
                progress === 100 ? "bg-emerald-500" : progress > 50 ? "bg-blue-500" : "bg-amber-500"
              )}
              style={{ width: `${Math.max(progress, 3)}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 text-center">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="block text-base font-bold text-slate-900">{applicants.length}</span>
              <span className="text-[10px] font-semibold text-slate-500">Applicants</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="block text-base font-bold text-blue-700">{activePipelineCount}</span>
              <span className="text-[10px] font-semibold text-slate-500">In Pipeline</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="block text-base font-bold text-emerald-700">{activeMatches.length}</span>
              <span className="text-[10px] font-semibold text-slate-500">AI Matches</span>
            </div>
          </div>

          <div className="pt-3 flex justify-between items-center text-xs text-slate-400">
            <span>Last AI Match:</span>
            <span className="font-medium text-slate-600">
              {currentMatchRun ? formatDate(currentMatchRun.timestamp) : 'Not Run Yet'}
            </span>
          </div>

          {canRunMatching && (
            <button 
              type="button"
              onClick={onRefreshMatches}
              disabled={isRefreshing}
              className="w-full mt-4 py-2.5 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isRefreshing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Scanning Talent Pool...</span>
                </>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5" />
                  <span>{currentMatchRun ? 'Refresh AI Matches' : 'Find AI Matches'}</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Role Logistics & Publication Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Role Logistics &amp; Publication</h3>

          {/* Created Date */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">Created Date</p>
            <p className="text-xs font-semibold text-slate-800">
              {job.createdAt ? formatDate(job.createdAt) : '—'}
            </p>
          </div>

          {/* Publication Status (Draft removed completely) */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Careers Portal Publication</p>
            {job.isPublished ? (
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold">
                  <Globe className="w-3.5 h-3.5 text-emerald-600" />
                  Live on Careers
                </span>
                {job.publishedAt && (
                  <span className="text-[11px] text-slate-400">
                    ({formatDate(job.publishedAt)})
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  Internal Job Opening
                </span>
              </div>
            )}
          </div>

          {/* Target Joining Date */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">Target Joining Date</p>
            <p className="text-xs font-semibold text-slate-800 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {formatDate(job.targetJoiningDate)}
            </p>
          </div>

          {/* Application Deadline */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">Application Deadline</p>
            <p className="text-xs font-semibold text-slate-800 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {formatDate(job.applicationDeadline)}
            </p>
          </div>

          {/* Hiring Model */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Hiring Model</p>
              <button 
                type="button"
                onClick={onConfigureHiringModel}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
              >
                {job.hiringModel && job.hiringModel !== 'Not Configured' ? 'Change' : 'Configure'}
              </button>
            </div>
            <span className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border",
              modelConfig.badgeClass
            )}>
              <ModelIcon className="w-3.5 h-3.5" />
              {modelConfig.label}
            </span>
          </div>

          {/* Note: Linked Project is completely removed as requested */}

        </div>
      </div>

    </div>
  );
}
