import React from 'react';
import { Candidate, JobMatch } from '../types';
import { X, MapPin, Briefcase, GraduationCap, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn, formatDate } from '../lib/utils';

interface CandidateMatchProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate | null;
  match: JobMatch | null;
}

export default function CandidateMatchProfileDrawer({ isOpen, onClose, candidate, match }: CandidateMatchProfileDrawerProps) {
  if (!isOpen || !candidate || !match) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-in-right overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800">Candidate Profile</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Candidate Overview */}
          <div className="flex flex-col gap-1 text-center items-center">
            <div className="w-16 h-16 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-2xl font-bold mb-2">
              {candidate.fullName.charAt(0)}
            </div>
            <h3 className="text-xl font-bold text-slate-800">{candidate.fullName}</h3>
            <p className="text-sm font-medium text-slate-600">{candidate.currentRole} at {candidate.currentCompany}</p>
            <p className="text-xs text-slate-500 mt-1 flex items-center justify-center gap-1">
              <MapPin className="w-3 h-3" /> {candidate.currentLocation}
            </p>
          </div>

          {/* Match Score */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
            <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-3">
              <span className="font-semibold text-slate-800">Overall Match Score</span>
              <span className={cn(
                "px-3 py-1 rounded-full text-sm font-bold",
                match.score >= 85 ? "bg-green-100 text-green-700" :
                match.score >= 70 ? "bg-amber-100 text-amber-700" :
                "bg-slate-100 text-slate-700"
              )}>
                {match.score}%
              </span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Skills</span>
                <span className="font-medium text-slate-800">{match.breakdown.skills}/40</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Experience</span>
                <span className="font-medium text-slate-800">{match.breakdown.experience}/20</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Location</span>
                <span className="font-medium text-slate-800">{match.breakdown.location}/15</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Qualification</span>
                <span className="font-medium text-slate-800">{match.breakdown.education}/10</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Availability</span>
                <span className="font-medium text-slate-800">{match.breakdown.availability}/10</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Employment Type</span>
                <span className="font-medium text-slate-800">{match.breakdown.employmentType}/5</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200 text-sm">
              <p className="text-slate-700 italic">"{match.mismatchReasons[0]}"</p>
            </div>
          </div>

          {/* Matching & Missing Skills */}
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Matching Skills
              </h4>
              <div className="flex flex-wrap gap-2">
                {match.matchStrengths.map((s, i) => (
                  <span key={i} className="px-2 py-1 bg-green-50 text-green-700 border border-green-200 rounded text-xs font-medium">
                    {s}
                  </span>
                ))}
              </div>
            </div>
            {match.missingRequirements.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  Missing / Unverified
                </h4>
                <div className="flex flex-wrap gap-2">
                  {match.missingRequirements.map((s, i) => (
                    <span key={i} className="px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded text-xs font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Profile Details */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-slate-800 border-b border-slate-200 pb-2">Experience & Education</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <Briefcase className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-800">Total Experience: {candidate.totalExperience}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <GraduationCap className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-800">Qualification: {candidate.education}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-800">Availability: {candidate.noticePeriod}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-slate-800 border-b border-slate-200 pb-2">Complete Skills</h4>
            <div className="flex flex-wrap gap-2">
              {candidate.skills.map((s, i) => (
                <span key={i} className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded border border-slate-200 text-xs font-medium">
                  {s}
                </span>
              ))}
            </div>
          </div>
          
          <div className="text-xs text-slate-500 text-center pb-4">
            Resume updated: {formatDate(candidate.createdAt || '')}
          </div>
        </div>
      </div>
    </div>
  );
}
