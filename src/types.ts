export type Priority = 'Low' | 'Medium' | 'High' | 'Critical';
export type RequirementLifecycleStatus = 'Draft' | 'Open' | 'On Hold' | 'Closed' | 'Cancelled';
export type RequirementFulfilmentStatus = 'Unfilled' | 'Partially Filled' | 'Fulfilled';
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
export type PrimaryIndustry = 
  | 'BFSI' | 'BPO_KPO_ITES' | 'CONSULTING_PROFESSIONAL_SERVICES' 
  | 'CONSTRUCTION_REAL_ESTATE' | 'EDUCATION_TRAINING' | 'ENERGY_UTILITIES' 
  | 'FMCG_CONSUMER_GOODS' | 'GOVERNMENT_PUBLIC_SECTOR' | 'HEALTHCARE_LIFE_SCIENCES' 
  | 'HOSPITALITY_TRAVEL_TOURISM' | 'INFORMATION_TECHNOLOGY_SOFTWARE' 
  | 'LOGISTICS_TRANSPORTATION_WAREHOUSING' | 'MANUFACTURING_ENGINEERING' 
  | 'MEDIA_ADVERTISING_ENTERTAINMENT' | 'RETAIL_ECOMMERCE' | 'TELECOMMUNICATIONS' 
  | 'OTHER';

export interface Client {
  id: string;
  name: string;
  industry: PrimaryIndustry;
  industryOtherText?: string;
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
  lifecycleStatus: RequirementLifecycleStatus;
  version: number;
  revisions?: RequirementRevision[];
  createdAt: string;
  updatedAt: string;
  notes?: string;
  sourceMetadata?: RequirementSourceMetadata;
}

export interface RequirementRevision {
  id: string;
  requirementId: string;
  version: number;
  changedFields: string[];
  previousValues: Record<string, any>;
  newValues: Record<string, any>;
  changedBy: string;
  changedAt: string;
  reason: string;
  impactSnapshot?: {
    linkedJobsCount?: number;
    pipelineCount?: number;
    filledCount?: number;
    offersCount?: number;
  };
}

export interface RequirementSourceMetadata {
  originalFilename: string;
  mimeType: string;
  size: number;
  uploadedBy: string;
  uploadedAt: string;
  extractionStatus: 'Success' | 'Partial' | 'Failed';
  parserVersion: string;
}

export interface ExtractedRequirementData {
  clientName?: string;
  businessUnit?: string;
  projectName?: string;
  roleTitle?: string;
  positionsRequired?: number;
  locations?: string[];
  employmentType?: string;
  contractDuration?: string;
  targetJoiningDate?: string;
  priority?: string;
  requiredSkills?: string[];
  preferredSkills?: string[];
  experience?: string;
  qualifications?: string[];
  assignedRecruiter?: string;
  notes?: string;
}

export interface JobSourceMetadata {
  originalFilename: string;
  mimeType: string;
  size: number;
  uploadedBy: string;
  uploadedAt: string;
  extractionStatus: 'Success' | 'Partial' | 'Failed';
  parserVersion: string;
}

export interface ExtractedJobData {
  title?: string;
  summary?: string;
  responsibilities?: string[];
  requiredSkills?: string[];
  preferredSkills?: string[];
  experienceRange?: string;
  qualifications?: string[];
  location?: string;
  workArrangement?: string;
  employmentType?: string;
  openings?: number;
  salaryInformation?: string;
  contractDuration?: string;
  applicationDeadline?: string;
  targetJoiningDate?: string;
  linkedClientRequirement?: string;
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
  sourceMetadata?: JobSourceMetadata;
}

export interface EmploymentEntry {
  company: string;
  role: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  responsibilities?: string[];
}

export interface EducationEntry {
  qualification: string;
  institution: string;
  completionYear?: string;
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
  linkedInUrl?: string;
  duplicateStatus: 'None' | 'Possible Duplicate' | 'Confirmed Duplicate';
  createdAt?: string;
  professionalSummary?: string;
  employmentHistory?: EmploymentEntry[];
  educationEntries?: EducationEntry[];
  languages?: string[];
  preferredLocation?: string;
  willingToRelocate?: 'Yes' | 'No' | '';
  availableFrom?: string;
  recruiterNotes?: string;
  createdMethod?: string;
}

export interface ScreeningData {
  status: 'Pending' | 'Passed' | 'Requested Info';
  candidateInterested?: boolean;
  availabilityConfirmed?: boolean;
  noticePeriodConfirmed?: boolean;
  locationConfirmed?: boolean;
  compensationConfirmed?: boolean;
  minQualificationVerified?: boolean;
  skillsReviewed?: boolean;
  communicationNotes?: string;
  recruiterNotes?: string;
  updatedBy?: string;
  updatedAt?: string;
}

export interface Application {
  id: string;
  candidateId: string;
  jobId: string;
  requirementId: string;
  currentStage: ApplicationStage;
  appliedDate: string;
  source: string;
  associationOrigin?: string;
  assignedRecruiterId: string;
  matchScore?: number;
  matchStrengths?: string[];
  matchGaps?: string[];
  rejectionReason?: string;
  screeningData?: ScreeningData;
  lastActivity: string;
}
export interface MatchScoreBreakdown {
  skills: number;
  experience: number;
  location: number;
  education: number;
  availability: number;
  employmentType: number;
}

export interface JobMatch {
  candidateId: string;
  score: number;
  breakdown: MatchScoreBreakdown;
  missingRequirements: string[];
  mismatchReasons: string[];
  matchStrengths: string[];
  dismissed: boolean;
}

export interface JobMatchRun {
  id: string;
  jobId: string;
  timestamp: string;
  engineVersion: string;
  stale: boolean;
  matches: JobMatch[];
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
  interviewerEmail?: string;
  mode: 'Phone' | 'Video' | 'In-person' | 'Manual Link';
  status: InterviewStatus;
  feedbackStatus: 'Not Started' | 'Pending' | 'Submitted';
  timezone?: string;
  provider?: 'Google Meet' | 'Microsoft Teams' | 'Zoom' | 'None';
  meetingLink?: string;
  overallRating?: number;
  feedbackNotes?: string;
  recommendation?: 'Hire' | 'Hold' | 'Reject';
  overallResult?: 'Strong Hire' | 'Hire' | 'Hold' | 'Reject';
  strengths?: string;
  concerns?: string;
  rescheduleReason?: string;
  rescheduledAt?: string;
  cancellationReason?: string;
  cancelledAt?: string;
  candidateInstructions?: string;
  internalNotes?: string;
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

  // Added Comprehensive Offer Fields
  employingEntity?: 'SPC' | 'Client';
  employingEntityName?: string;
  registeredOfficeAddress?: string;
  offerDate?: string;
  offerReference?: string;
  department?: string;
  workLocation?: string;
  employmentType?: string;
  reportingManager?: string;
  annualCTC?: string;
  fixedCompensation?: string;
  variableCompensation?: string;
  otherAllowances?: string;
  probationPeriod?: string;
  noticePeriod?: string;
  workingHours?: string;
  authorizedSignatoryName?: string;
  authorizedSignatoryDesignation?: string;
  additionalTerms?: string;
  
  // Version and Tracking
  templateVersion?: string;
  version?: number;
  deliveryStatus?: 'Not Sent' | 'Sending' | 'Sent' | 'Failed';
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
  role: 'ADMIN' | 'MANAGER' | 'RECRUITER';
  email: string;
  avatarUrl?: string;
}
