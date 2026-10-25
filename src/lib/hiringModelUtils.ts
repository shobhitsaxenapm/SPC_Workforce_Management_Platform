import { Application, HiringModel, PlacementBillingStatus } from '../types';
import { Building2, Briefcase, AlertCircle, FileText, Send, Clock, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

/**
 * Checks if a Job's Hiring Model is locked.
 * Hiring Model becomes locked once any candidate enters the Job Pipeline
 * (i.e. stage is anything other than 'New', 'Under Review', 'Application Rejected').
 */
export function isJobHiringModelLocked(jobId: string, applications: Application[]): boolean {
  return applications.some(
    a => a.jobId === jobId && !['New', 'Under Review', 'Application Rejected'].includes(a.currentStage)
  );
}

/**
 * Returns display configuration (label, icons, styling classes) for a Job Hiring Model.
 */
export function getHiringModelBadgeConfig(hiringModel?: string | null) {
  switch (hiringModel) {
    case 'Client Hire':
      return {
        label: 'Client Hire',
        shortLabel: 'Client Hire',
        description: 'Candidate is hired directly onto Client payroll. SPC manages placement tracking and placement billing.',
        icon: Building2,
        badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
        dotColor: 'bg-purple-500',
        isConfigured: true,
      };
    case 'SPC Hire':
      return {
        label: 'SPC Hire',
        shortLabel: 'SPC Hire',
        description: 'Candidate is hired onto SPC workforce. Standard SPC offer issuance, acceptance, and onboarding workflow.',
        icon: Briefcase,
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
        dotColor: 'bg-blue-500',
        isConfigured: true,
      };
    default:
      return {
        label: 'Not Configured',
        shortLabel: 'Not Configured',
        description: 'Hiring model has not been set for this job. Configure to proceed with post-selection workflow.',
        icon: AlertCircle,
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-300',
        dotColor: 'bg-amber-500',
        isConfigured: false,
      };
  }
}

/**
 * Returns display configuration for a Placement Billing Status.
 */
export function getPlacementBillingStatusConfig(status?: PlacementBillingStatus | string) {
  switch (status) {
    case 'Billing Eligible':
      return {
        label: 'Billing Eligible',
        icon: CheckCircle2,
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dotColor: 'bg-emerald-500',
        step: 1,
      };
    case 'Invoice Draft':
      return {
        label: 'Invoice Draft',
        icon: FileText,
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
        dotColor: 'bg-blue-500',
        step: 2,
      };
    case 'Invoice Sent':
      return {
        label: 'Invoice Sent',
        icon: Send,
        badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        dotColor: 'bg-indigo-500',
        step: 3,
      };
    case 'Payment Pending':
      return {
        label: 'Payment Pending',
        icon: Clock,
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        dotColor: 'bg-amber-500',
        step: 4,
      };
    case 'Paid':
      return {
        label: 'Paid',
        icon: CheckCircle2,
        badgeClass: 'bg-green-100 text-green-800 border-green-300',
        dotColor: 'bg-green-600',
        step: 5,
      };
    case 'Disputed':
      return {
        label: 'Disputed',
        icon: AlertTriangle,
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
        dotColor: 'bg-rose-500',
        step: -1,
      };
    case 'Cancelled':
      return {
        label: 'Cancelled',
        icon: XCircle,
        badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
        dotColor: 'bg-slate-400',
        step: -1,
      };
    default:
      return {
        label: status || 'Pending',
        icon: Clock,
        badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
        dotColor: 'bg-slate-400',
        step: 0,
      };
  }
}
