export type Priority = 'Low' | 'Medium' | 'High' | 'Critical';
export type RequirementStatus = 'Draft' | 'Open' | 'In Progress' | 'Partially Filled' | 'Fulfilled' | 'On Hold' | 'Closed';
export type JobStatus = 'Draft' | 'Published' | 'Paused' | 'Filled' | 'Closed';
export type JobVisibility = 'Public' | 'Private';
export type ApplicationStage = 'Sourced' | 'Applied' | 'Under Review' | 'Screening' | 'Interview Round 1' | 'Interview Round 2' | 'Shortlisted' | 'Interview Scheduled' | 'Interview Completed' | 'Selected' | 'Offer Extended' | 'Offer Sent' | 'Offer Accepted' | 'Ready for Onboarding' | 'On Hold' | 'Rejected' | 'Withdrawn' | 'No Show' | 'Offer Declined' | 'Joined';
export type InterviewStatus = 'Scheduled' | 'Completed' | 'Cancelled' | 'Rescheduled' | 'No Show';
export type OfferStatus = 'Draft' | 'Approval Pending' | 'Approved' | 'Sent' | 'Viewed' | 'Accepted' | 'Declined' | 'Expired' | 'Rejected' | 'Withdrawn';
export type OnboardingStatus = 'Documents Requested' | 'Documents Submitted' | 'Verification In Progress' | 'Changes Requested' | 'Approved' | 'Joining Scheduled' | 'Completed';
export type DeploymentStatus = 'Scheduled' | 'Active' | 'Completed' | 'Terminated';
export type BillingModel = 'Monthly' | 'Daily' | 'Hourly';
export type AttendanceStatus = 'Draft' | 'Submitted' | 'Client Approved' | 'Rejected' | 'Locked for Billing';
export type BillingStatus = 'Draft' | 'Pending Approval' | 'Approved' | 'Invoice Ready' | 'Sent' | 'Paid' | 'Disputed';
export type OffboardingStatus = 'Initiated' | 'Client Clearance Pending' | 'Final Attendance Pending' | 'Final Settlement Pending' | 'Completed' | 'Cancelled';

export interface Client {
  id: string;
  name: string;
  industry: string;
  status: 'Active' | 'Inactive';
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
  locations: string[];
  activeRequirementsCount: number;
  openPositionsCount: number;
  lastActivity: string;
}

export interface ClientRequirement {
  id: string;
  code: string;
  clientId: string;
  title: string;
  roleTitle: string;
  projectName: string;
  locations: string[];
  positionsRequired: number;
  positionsFilled: number;
  employmentType: string;
  contractDuration: string;
  targetJoiningDate: string;
  priority: Priority;
  assignedRecruiterId: string;
  status: RequirementStatus;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface Job {
  id: string;
  code: string;
  requirementId: string;
  clientId: string;
  title: string;
  projectName: string;
  location: string;
  openings: number;
  filled: number;
  employmentType: string;
  experienceRange: string;
  requiredSkills: string[];
  preferredSkills: string[];
  summary: string;
  responsibilities: string[];
  qualifications: string[];
  targetJoiningDate: string;
  applicationDeadline: string;
  assignedRecruiterId: string;
  visibility: JobVisibility;
  status: JobStatus;
  publishedAt?: string;
}

export interface Candidate {
  id: string;
  code: string;
  fullName: string;
  email: string;
  phone: string;
  currentLocation: string;
  totalExperience: string;
  currentCompany: string;
  currentRole: string;
  skills: string[];
  education: string;
  currentSalary: string;
  expectedSalary: string;
  noticePeriod: string;
  resumeUrl?: string;
  source: string;
  duplicateStatus: 'None' | 'Possible Duplicate' | 'Confirmed Duplicate';
  createdAt?: string;
}

export interface Application {
  id: string;
  candidateId: string;
  jobId: string;
  requirementId: string;
  currentStage: ApplicationStage;
  appliedDate: string;
  source: string;
  assignedRecruiterId: string;
  matchScore?: number;
  matchStrengths?: string[];
  matchGaps?: string[];
  rejectionReason?: string;
  lastActivity: string;
}

export interface Interview {
  id: string;
  applicationId: string;
  candidateId: string;
  jobId: string;
  clientId: string;
  interviewType: string;
  scheduledAt: string;
  durationMinutes: number;
  interviewerName: string;
  mode: 'Phone' | 'Video' | 'In-person';
  status: InterviewStatus;
  feedbackStatus: 'Pending' | 'Submitted';
  meetingLink?: string;
  overallRating?: number;
  feedbackNotes?: string;
  recommendation?: 'Hire' | 'Hold' | 'Reject';
  overallResult?: 'Strong Hire' | 'Hire' | 'Hold' | 'Reject';
  strengths?: string;
  concerns?: string;
  rescheduleReason?: string;
  rescheduledAt?: string;
}

export interface Offer {
  id: string;
  applicationId: string;
  candidateId: string;
  jobId: string;
  clientId: string;
  offeredRole: string;
  offeredCompensation: string;
  proposedJoiningDate: string;
  contractDuration: string;
  approvalRequired: boolean;
  approvedBy?: string;
  status: OfferStatus;
  sentDate?: string;
  expiryDate?: string;
  notes?: string;
  onboardingStarted?: boolean;
  onboardingId?: string;
  rejectionReason?: string;
  rejectedAt?: string;
  acceptedAt?: string;
  withdrawnAt?: string;
  extendedAt?: string;
  assignedRecruiterId?: string;
}

export interface Onboarding {
  id: string;
  candidateId: string;
  clientId: string;
  requirementId: string;
  jobId: string;
  role: string;
  proposedJoiningDate: string;
  assignedHrId: string;
  status: OnboardingStatus;
  documents: { name: string; submitted: boolean; approved: boolean }[];
  offerId?: string;
  documentsStatus?: 'Pending' | 'Verified';
  backgroundCheckStatus?: 'Pending' | 'In Progress' | 'Cleared';
  plannedJoiningDate?: string;
}

export interface Employee {
  id: string;
  code: string;
  candidateId: string;
  fullName: string;
  email: string;
  phone: string;
  status: 'Active' | 'Exited' | 'On Bench';
  joinedDate: string;
}

export interface Deployment {
  id: string;
  employeeId: string;
  clientId: string;
  projectName: string;
  location: string;
  role: string;
  startDate: string;
  endDate?: string;
  reportingManager: string;
  billingModel: BillingModel;
  billingRate: number;
  salaryCost: number;
  status: DeploymentStatus;
}

export interface Attendance {
  id: string;
  deploymentId: string;
  clientId: string;
  period: string; // e.g. "July 2026"
  billingModel: BillingModel;
  presentDays?: number;
  absentDays?: number;
  workedDays?: number;
  workedHours?: number;
  overtimeHours?: number;
  status: AttendanceStatus;
}

export interface Billing {
  id: string;
  clientId: string;
  billingCycle: string; // e.g. "July 2026"
  totalAmount: number;
  adjustments: number;
  taxAmount: number;
  finalAmount: number;
  status: BillingStatus;
  items: { deploymentId: string; amount: number; description: string }[];
}

export interface Offboarding {
  id: string;
  deploymentId: string;
  employeeId: string;
  exitType: 'Resignation' | 'Termination' | 'Contract End';
  lastWorkingDate: string;
  exitReason: string;
  clientClearanceRequired: boolean;
  clientClearanceStatus: 'Pending' | 'Cleared' | 'Not Required';
  finalAttendanceStatus: 'Pending' | 'Cleared';
  finalBillingStatus: 'Pending' | 'Cleared';
  documentClosureStatus: 'Pending' | 'Cleared';
  status: OffboardingStatus;
}

export interface TalentPoolEntry {
  id: string;
  candidateId: string;
  experience: string;
  preferredRoles: string[];
  preferredLocations: string[];
  topSkills: string[];
  availability: string;
  poolTags: string[];
  lastContacted: string;
  consentStatus: 'Active' | 'Expiring Soon' | 'Expired' | 'Not Recorded';
}

export interface User {
  id: string;
  name: string;
  role: 'Company Admin' | 'Recruitment Manager' | 'Recruiter' | 'Interviewer';
  email: string;
  avatarUrl?: string;
}
