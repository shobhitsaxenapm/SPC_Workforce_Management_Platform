import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Job, Candidate, Application, Project, Client, ApplicationStage, ApplicationSubstate, Priority, ProjectStatus, JobStatus, JobMatch, Interview, InterviewStatus, InterviewerInvitation, RecruiterInterviewOutcome, DerivedFeedbackStatus, Offer, OfferStatus, OfferActivity, Onboarding, OnboardingStatus, JobMatchRun, InformationRequest, RequestResponse, ClientReviewBatch, CandidateJobSource, HiringModel, Placement, PlacementBillingStatus, PlacementStatus, PlacementBillingHistoryItem } from '../types';
import { mockUsers, mockJobs, mockCandidates, mockApplications, mockProjects, mockClients, mockInterviews, mockOffers, mockOnboardings, mockPlacements } from '../data/mockData';
import { mockWarehouseCandidates, mockWarehouseMatches, getMockWarehouseMatchRun } from '../data/mockCandidateMatches';
import { calculateMatch } from '../lib/matchingEngine';
import { normalizeJob, normalizeApplication, normalizeOffer } from '../lib/statusNormalization';
import { normalizeSource } from '../lib/sourceUtils';
import { isJobHiringModelLocked } from '../lib/hiringModelUtils';
import { normalizeInterviewers, getInterviewFeedbackSummary, generateSecureFeedbackToken } from '../lib/interviewUtils';

interface AppContextType {
  currentUser: User | null;
  jobs: Job[];
  candidates: Candidate[];
  applications: Application[];
  projects: Project[];
  clients: Client[];
  interviews: Interview[];
  offers: Offer[];
  onboardings: Onboarding[];
  placements: Placement[];
  matchRuns: JobMatchRun[];
  informationRequests: InformationRequest[];
  clientReviewBatches: ClientReviewBatch[];
  quickViewProjectId: string | null;
  setQuickViewProjectId: (id: string | null) => void;
  quickViewClientId: string | null;
  setQuickViewClientId: (id: string | null) => void;
  quickViewJobId: string | null;
  setQuickViewJobId: (id: string | null) => void;
  quickViewCandidateId: string | null;
  setQuickViewCandidateId: (id: string | null) => void;
  login: (email: string) => { success: boolean; error?: string };
  logout: () => void;
  createClient: (clientData: Pick<Client, 'name' | 'industry' | 'industryOtherText' | 'primaryContactName' | 'primaryContactEmail' | 'primaryContactPhone' | 'locations'>) => { success: boolean; error?: string; clientId?: string };
  updateClient: (clientId: string, clientData: Partial<Pick<Client, 'name' | 'industry' | 'industryOtherText' | 'primaryContactName' | 'primaryContactEmail' | 'primaryContactPhone' | 'locations'>>) => { success: boolean; error?: string };
  deleteClient: (clientId: string) => void;
  deleteProject: (projectId: string) => void;
  createProject: (projectData: Omit<Project, 'id' | 'code' | 'version' | 'revisions' | 'createdAt' | 'updatedAt'>) => void;
  createCandidate: (candidateData: Omit<Candidate, 'id' | 'code' | 'duplicateStatus'>) => { success: boolean; error?: string; candidateId?: string };
  updateCandidate: (candidateId: string, updates: Partial<Candidate>) => void;
  deleteCandidate: (candidateId: string) => void;
  createJob: (jobData: Omit<Job, 'id' | 'code' | 'filled' | 'engagementType'>, projectId?: string) => void;
  updateJob: (jobId: string, updates: Partial<Job>) => void;
  updateJobHiringModel: (jobId: string, hiringModel: HiringModel, isAdminOverride?: boolean) => { success: boolean; error?: string };
  startJoiningTracking: (applicationId: string, expectedJoiningDate: string, notes?: string) => { success: boolean; error?: string; placementId?: string };
  confirmJoined: (applicationId: string, actualJoiningDate: string, notes?: string) => { success: boolean; error?: string };
  recordDidNotJoin: (applicationId: string, reason: string) => { success: boolean; error?: string };
  updatePlacementBillingStatus: (placementId: string, status: PlacementBillingStatus, notes?: string, extra?: { invoiceNumber?: string, feeAmount?: string | number }) => { success: boolean; error?: string };
  submitApplication: (
    candidateData: Omit<Candidate, 'id' | 'code' | 'duplicateStatus' | 'source'>,
    jobId: string,
    source?: CandidateJobSource | string
  ) => { success: boolean; error?: string };
  updateApplicationStage: (appId: string, stage: ApplicationStage, substate?: ApplicationSubstate, rejectionReason?: string) => void;
  updateApplicationScreening: (appId: string, data: any) => void;
  createClientReviewBatch: (batch: Omit<ClientReviewBatch, 'id' | 'token' | 'createdAt' | 'status' | 'candidateStatuses'>) => string;
  submitClientReviewFeedback: (batchId: string, feedback: Record<string, { status: string; comment?: string }>) => void;
  markClientReviewBatchViewed: (batchId: string) => void;
  createInformationRequest: (reqData: Omit<InformationRequest, 'id' | 'status' | 'responses'>) => void;
  recordInformationResponse: (projectId: string, response: Omit<RequestResponse, 'id' | 'requestId'>) => void;
  updateInformationRequestStatus: (projectId: string, status: InformationRequest['status'], reason?: string) => void;
  resolveInformationRequest: (projectId: string) => void;
  cancelInformationRequest: (projectId: string, reason?: string) => void;
  createOffer: (offerData: Omit<Offer, 'id' | 'status'>) => string;
  createRevisedOffer: (parentOfferId: string, offerData: Omit<Offer, 'id' | 'status' | 'version' | 'parentOfferId'>) => string;
  startNegotiation: (offerId: string, note: string) => void;
  updateOffer: (offerId: string, updates: Partial<Offer>) => void;
  submitOfferForApproval: (offerId: string) => void;
  approveOffer: (offerId: string) => void;
  issueOffer: (offerId: string) => void;
  recordOfferResponse: (offerId: string, response: 'Accepted' | 'Declined' | 'Negotiation Requested' | 'Expired' | 'Withdrawn' | 'Continue Negotiation', reason?: string) => void;
  updateProjectStatus: (projectId: string, status: ProjectStatus, reason?: string) => { success: boolean; error?: string };
  updateProject: (projectId: string, updates: Partial<Project>, reason?: string, impactSnapshot?: any) => { success: boolean; error?: string };
  submitInterviewFeedback: (interviewId: string, feedbackData: Partial<Interview>) => void;
  updateOnboarding: (onboardingId: string, updates: Partial<Onboarding>) => void;
  submitIndividualFeedback: (interviewId: string, tokenOrInterviewerId: string, feedbackData: Partial<InterviewerInvitation>) => { success: boolean; error?: string };
  confirmRecruiterOutcome: (interviewId: string, outcome: RecruiterInterviewOutcome, notes?: string, confirmStageChange?: boolean) => { success: boolean; error?: string };
  sendFeedbackReminder: (interviewId: string, interviewerIdOrEmail: string) => { success: boolean; message: string };
  scheduleInterview: (interviewDetails: Omit<Interview, 'id' | 'status' | 'feedbackStatus'>) => { success: boolean; error?: string };
  rescheduleInterview: (interviewId: string, updatedSchedule: Partial<Interview>) => void;
  cancelInterview: (interviewId: string, reason: string) => void;
  updateInterviewStatus: (interviewId: string, status: InterviewStatus) => void;
  markInterviewNoShow: (interviewId: string, who: 'Candidate' | 'Interviewer' | 'Both', note?: string) => void;
  updateOfferStatus: (offerId: string, status: OfferStatus, metadata?: Partial<Offer>) => void;
  extendOfferExpiry: (offerId: string, newExpiryDate: string) => void;
  startOnboardingFromOffer: (offerId: string) => { success: boolean; error?: string };
  runJobMatching: (jobId: string) => void;
  dismissMatch: (jobId: string, candidateId: string) => void;
  addMatchToPipeline: (jobId: string, candidateId: string, associationOrigin?: string, source?: CandidateJobSource | string) => { success: boolean; error?: string; applicationId?: string };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const safeParse = <T,>(key: string, defaultValue: T): T => {
  const data = localStorage.getItem(key);
  if (data === null) {
    return defaultValue;
  }
  try {
    return JSON.parse(data) as T;
  } catch (error) {
    console.error(`Error parsing localStorage key "${key}":`, error);
    // Format corruption fallback
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
};

export const AppContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const user = safeParse<User | null>('spc_user', null);
    if (!user) return null;
    // Migrate legacy roles
    const legacyRoleMap: Record<string, 'ADMIN' | 'MANAGER' | 'RECRUITER'> = {
      'Company Admin': 'ADMIN',
      'Recruitment Manager': 'MANAGER',
      'Recruiter': 'RECRUITER',
      'Employee': 'RECRUITER',
      'Interviewer': 'RECRUITER'
    };
    if (['ADMIN', 'MANAGER', 'RECRUITER'].includes(user.role)) {
      return user;
    }
    if (legacyRoleMap[user.role as string]) {
      return { ...user, role: legacyRoleMap[user.role as string] };
    }
    return null;
  });

  const [quickViewProjectId, setQuickViewProjectId] = useState<string | null>(null);
  const [quickViewClientId, setQuickViewClientId] = useState<string | null>(null);
  const [quickViewJobId, setQuickViewJobId] = useState<string | null>(null);
  const [quickViewCandidateId, setQuickViewCandidateId] = useState<string | null>(null);

  // Safe seeding logic: check if key is absent (null), otherwise parse
  const [clients, setClients] = useState<Client[]>(() => {
    if (localStorage.getItem('spc_clients') === null) {
      localStorage.setItem('spc_clients', JSON.stringify(mockClients));
    }
    const storedClients = safeParse<Client[]>('spc_clients', mockClients);
    
    // Migrate to requirement-driven status
    const initialReqs = safeParse<Project[]>('spc_requirements', mockProjects);
    let changed = false;
    const syncedClients = storedClients.map(client => {
      // Legacy industry mapping
      let mappedIndustry = client.industry as any;
      let mappedOther = client.industryOtherText;
      const lower = (client.industry || '').toLowerCase();
      if (lower) {
        if (['it', 'technology', 'software', 'information technology & software'].includes(lower)) mappedIndustry = 'INFORMATION_TECHNOLOGY_SOFTWARE';
        else if (['healthcare', 'hospital', 'medical', 'healthcare & life sciences'].includes(lower)) mappedIndustry = 'HEALTHCARE_LIFE_SCIENCES';
        else if (['hospitality', 'hotel', 'travel', 'hospitality, travel & tourism'].includes(lower)) mappedIndustry = 'HOSPITALITY_TRAVEL_TOURISM';
        else if (['consulting', 'professional services', 'consulting & professional services'].includes(lower)) mappedIndustry = 'CONSULTING_PROFESSIONAL_SERVICES';
        else if (['banking', 'finance', 'insurance', 'bfsi', 'banking, financial services & insurance (bfsi)'].includes(lower)) mappedIndustry = 'BFSI';
        else if (['retail', 'ecommerce', 'e-commerce', 'retail & e-commerce'].includes(lower)) mappedIndustry = 'RETAIL_ECOMMERCE';
        else if (['logistics', 'transportation', 'warehousing', 'logistics, transportation & warehousing', 'logistics & supply chain'].includes(lower)) mappedIndustry = 'LOGISTICS_TRANSPORTATION_WAREHOUSING';
        else if (['bpo', 'kpo', 'ites', 'business process outsourcing (bpo/kpo/ites)'].includes(lower)) mappedIndustry = 'BPO_KPO_ITES';
        else if (!['CONSTRUCTION_REAL_ESTATE', 'EDUCATION_TRAINING', 'ENERGY_UTILITIES', 'FMCG_CONSUMER_GOODS', 'GOVERNMENT_PUBLIC_SECTOR', 'MANUFACTURING_ENGINEERING', 'MEDIA_ADVERTISING_ENTERTAINMENT', 'TELECOMMUNICATIONS', 'OTHER'].includes(mappedIndustry)) {
          mappedIndustry = 'OTHER';
          mappedOther = mappedOther || client.industry;
        }
      }

      const hasReqs = initialReqs.some(r => r.clientId === client.id);
      const expectedStatus = hasReqs ? 'Active' : 'Inactive';
      if (client.status !== expectedStatus || client.industry !== mappedIndustry || client.industryOtherText !== mappedOther) {
        changed = true;
        return { ...client, status: expectedStatus, industry: mappedIndustry, industryOtherText: mappedOther };
      }
      return client;
    });

    if (changed) {
      localStorage.setItem('spc_clients', JSON.stringify(syncedClients));
    }
    return syncedClients;
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    let reqs: any[] = [];
    if (localStorage.getItem('spc_requirements') === null) {
      reqs = mockProjects;
      localStorage.setItem('spc_requirements', JSON.stringify(mockProjects));
    } else {
      reqs = safeParse<any[]>('spc_requirements', mockProjects);
    }

    const parsedProjects = safeParse<Project[]>('spc_requirements', mockProjects);
    let changed = false;

    const migratedReqs = parsedProjects.map(p => {
      let proj = { ...p };
      
      // Map legacy statuses if needed
      if ((proj as any).status) {
         const legacyStatus = (proj as any).status as string;
         if (legacyStatus === 'Draft') proj.status = 'Draft' as ProjectStatus;
         else if (legacyStatus === 'On Hold') proj.status = 'On Hold' as ProjectStatus;
         else if (legacyStatus === 'Closed') proj.status = 'Completed' as ProjectStatus;
         else if (legacyStatus === 'Cancelled') proj.status = 'Cancelled' as ProjectStatus;
         else if (legacyStatus === 'Open') proj.status = 'Active' as ProjectStatus;
      }

      // Ensure new fields exist
      if (!('version' in proj)) (proj as any).version = 1;
      if (!('revisions' in proj)) (proj as any).revisions = [];
      
      return proj;
    });

    if (migratedReqs.some((r, i) => r.status !== parsedProjects[i].status || !('version' in parsedProjects[i]))) {
      changed = true;
    }
    
    if (changed) {
      localStorage.setItem('spc_requirements', JSON.stringify(migratedReqs));
    }
    return migratedReqs;
  });

  const [jobs, setJobs] = useState<Job[]>(() => {
    if (localStorage.getItem('spc_jobs') === null) {
      localStorage.setItem('spc_jobs', JSON.stringify(mockJobs));
    }
    const parsedJobs = safeParse<Job[]>('spc_jobs', mockJobs);
    const storedOffers = safeParse<Offer[]>('spc_offers', mockOffers);
    const storedOnboardings = safeParse<Onboarding[]>('spc_onboardings', mockOnboardings);

    let changed = false;
    const healedJobs = parsedJobs.map(j => {
      let healed = { ...j, title: j.title || j.projectName || '' };
      healed = normalizeJob(healed);

      if (!healed.createdAt) {
        healed.createdAt = healed.publishedAt 
          ? new Date(new Date(healed.publishedAt).getTime() - 5 * 86400000).toISOString() 
          : (healed.targetJoiningDate ? new Date(new Date(healed.targetJoiningDate).getTime() - 25 * 86400000).toISOString() : '2026-06-10T09:00:00Z');
      }

      if (healed.isPublished && !healed.publishedAt) {
        healed.publishedAt = healed.targetJoiningDate 
          ? new Date(new Date(healed.targetJoiningDate).getTime() - 15 * 86400000).toISOString() 
          : '2026-06-20T10:00:00Z';
      }

      if (healed.isPublished && !healed.firstPublishedAt) {
        healed.firstPublishedAt = healed.publishedAt;
      }

      // Legacy data rule:
      // A legacy Job with an existing linked SPC offer or onboarding record may be classified as SPC Hire because the existing data proves it.
      // Do not infer Client Hire merely because no offer exists.
      // Leave other unclassified legacy Jobs as Not Configured and provide Configure Hiring Model.
      if (!healed.hiringModel || healed.hiringModel === ('Not Configured' as any)) {
        const hasOffer = storedOffers.some(o => o.jobId === j.id);
        const hasOnboarding = storedOnboardings.some(onb => (onb as any).jobId === j.id);
        if (hasOffer || hasOnboarding) {
          healed.hiringModel = 'SPC Hire';
        } else {
          healed.hiringModel = 'Not Configured';
        }
      }
      return healed;
    });

    // If any were healed, save back to storage so they persist
    if (healedJobs.some((j, i) => 
      j.title !== parsedJobs[i].title || 
      j.status !== parsedJobs[i].status || 
      j.hiringModel !== parsedJobs[i].hiringModel || 
      j.publishedAt !== parsedJobs[i].publishedAt ||
      j.createdAt !== parsedJobs[i].createdAt ||
      j.firstPublishedAt !== parsedJobs[i].firstPublishedAt
    )) {
      localStorage.setItem('spc_jobs', JSON.stringify(healedJobs));
    }
    return healedJobs;
  });

  const [placements, setPlacements] = useState<Placement[]>(() => {
    if (localStorage.getItem('spc_placements') === null) {
      localStorage.setItem('spc_placements', JSON.stringify(mockPlacements));
    }
    return safeParse<Placement[]>('spc_placements', mockPlacements);
  });

  const persistPlacements = (newPlacements: Placement[]) => {
    setPlacements(newPlacements);
    localStorage.setItem('spc_placements', JSON.stringify(newPlacements));
  };

  const [candidates, setCandidates] = useState<Candidate[]>(() => {
    let base = safeParse<Candidate[]>('spc_candidates', mockCandidates);
    
    // Merge latest mock data fields if they are missing in cache, and normalize sources
    base = base.map(cached => {
      const mock = mockCandidates.find(m => m.id === cached.id);
      const merged = mock && !cached.professionalSummary ? { ...cached, ...mock } : cached;
      return {
        ...merged,
        source: normalizeSource(merged.source)
      };
    });
    const pipelineSeeds: Candidate[] = [
      { id: 'can_seed_1', code: 'CAN-9001', fullName: 'Rohan Mehta', email: 'rohan.mehta@email.com', phone: '+91 98333 44556', currentLocation: 'Delhi', totalExperience: '1 Year', currentCompany: 'Apex Digitizing', currentRole: 'Data Typist', skills: ['Typing Speed > 40 WPM', 'Excel'], education: 'B.A, Delhi University', currentSalary: '₹2.0 LPA', expectedSalary: '₹2.6 LPA', noticePeriod: 'Immediate', source: 'SPC Careers Website', duplicateStatus: 'None', createdAt: '2026-07-08T10:00:00Z' },
      { id: 'can_seed_2', code: 'CAN-9002', fullName: 'Vikram Malhotra', email: 'vikram.m@email.com', phone: '+91 98444 55667', currentLocation: 'Noida', totalExperience: '2 Years', currentCompany: 'Info Services', currentRole: 'Office Assistant', skills: ['Data Entry', 'Excel'], education: 'B.Sc, Noida University', currentSalary: '₹2.2 LPA', expectedSalary: '₹2.8 LPA', noticePeriod: '15 Days', source: 'Recruiter Added', duplicateStatus: 'None', createdAt: '2026-07-09T11:00:00Z' },
      { id: 'can_seed_3', code: 'CAN-9003', fullName: 'Siddharth Sen', email: 'siddharth.sen@email.com', phone: '+91 98555 66778', currentLocation: 'Delhi', totalExperience: 'Fresher', currentCompany: 'N/A', currentRole: 'Graduate', skills: ['Excel', 'Data Typing'], education: 'B.Com, Delhi University', currentSalary: '0', expectedSalary: '₹2.4 LPA', noticePeriod: 'Immediate', source: 'SPC Careers Website', duplicateStatus: 'None', createdAt: '2026-07-10T12:00:00Z' },
      { id: 'can_seed_4', code: 'CAN-9004', fullName: 'Neha Kapoor', email: 'neha.k@email.com', phone: '+91 98666 77889', currentLocation: 'Delhi', totalExperience: '1.5 Years', currentCompany: 'Alpha Med', currentRole: 'Data Entry Operator', skills: ['Typing Speed > 40 WPM', 'Excel', 'Data Validation'], education: '12th Pass', currentSalary: '₹2.1 LPA', expectedSalary: '₹2.5 LPA', noticePeriod: 'Immediate', source: 'SPC Careers Website', duplicateStatus: 'None', createdAt: '2026-07-11T13:00:00Z' },
      { id: 'can_seed_5', code: 'CAN-9005', fullName: 'Aditya Joshi', email: 'aditya.j@email.com', phone: '+91 98777 88990', currentLocation: 'Gurugram', totalExperience: '3 Years', currentCompany: 'Swift Logistics', currentRole: 'Senior Clerk', skills: ['Data Validation', 'Excel'], education: 'Graduate', currentSalary: '₹2.8 LPA', expectedSalary: '₹3.4 LPA', noticePeriod: '30 Days', source: 'Naukri', duplicateStatus: 'None', createdAt: '2026-07-11T14:00:00Z' },
      { id: 'can_seed_6', code: 'CAN-9006', fullName: 'Karan Malhotra', email: 'karan.m@email.com', phone: '+91 98888 99001', currentLocation: 'Delhi', totalExperience: '2.5 Years', currentCompany: 'Zeta MedTech', currentRole: 'Data Executive', skills: ['Typing Speed > 40 WPM', 'Data Validation'], education: 'B.A, Delhi University', currentSalary: '₹2.4 LPA', expectedSalary: '₹3.0 LPA', noticePeriod: '15 Days', source: 'SPC Careers Website', duplicateStatus: 'None', createdAt: '2026-07-12T09:00:00Z' },
      { id: 'can_seed_7', code: 'CAN-9007', fullName: 'Pooja Hegde', email: 'pooja.h@email.com', phone: '+91 98999 00112', currentLocation: 'Noida', totalExperience: '2 Years', currentCompany: 'DataSoft', currentRole: 'Data Operator', skills: ['Excel', 'Typing Speed > 40 WPM'], education: 'B.Sc, Noida University', currentSalary: '₹2.2 LPA', expectedSalary: '₹2.7 LPA', noticePeriod: 'Immediate', source: 'Recruiter Added', duplicateStatus: 'None', createdAt: '2026-07-12T10:00:00Z' }
    ];
    let changed = false;
    pipelineSeeds.forEach(seed => {
      if (!base.some(c => c.id === seed.id || c.email === seed.email)) {
        base.push(seed);
        changed = true;
      }
    });
    mockWarehouseCandidates.forEach(seed => {
      if (!base.some(c => c.id === seed.id)) {
        base.push({
          ...seed,
          source: normalizeSource(seed.source)
        });
        changed = true;
      }
    });
    mockCandidates.forEach(mock => {
      if (!base.some(c => c.id === mock.id)) {
        base.push({
          ...mock,
          source: normalizeSource(mock.source)
        });
        changed = true;
      }
    });
    if (changed || localStorage.getItem('spc_candidates') === null) {
      localStorage.setItem('spc_candidates', JSON.stringify(base));
    }
    return base;
  });

  const [applications, setApplications] = useState<Application[]>(() => {
    let base = safeParse<Application[]>('spc_applications', mockApplications);
    
    // Repair invalid Offered records and normalize source values
    let repaired = false;
    const parsedOffers = safeParse<Offer[]>('spc_offers', mockOffers);
    base = base.map(app => {
      let normalized = normalizeApplication(app);
      const canonicalSource = normalizeSource(app.source);
      if (normalized.source !== canonicalSource) {
        repaired = true;
      }
      if (app.currentStage === 'Offered') {
        const hasIssuedOffer = parsedOffers.some(o => o.applicationId === app.id && o.status === 'Sent');
        if (!hasIssuedOffer) {
          repaired = true;
          return {
            ...normalized,
            currentStage: 'Interviewing',
            currentSubstate: undefined,
            source: canonicalSource
          };
        }
      }
      return {
        ...normalized,
        source: canonicalSource
      };
    });
    if (repaired) {
       localStorage.setItem('spc_applications', JSON.stringify(base));
    }
    const appSeeds: Application[] = [
      { id: 'app_seed_1', candidateId: 'can_seed_1', jobId: 'j1', projectId: 'r1', currentStage: 'Sourced', appliedDate: '2026-07-08T10:15:00Z', source: 'SPC Careers Website', assignedRecruiterId: 'u3', matchScore: 85, matchStrengths: ['Good typing speed', 'Excel knowledge'], matchGaps: [], lastActivity: '2026-07-08T10:15:00Z' },
      { id: 'app_seed_2', candidateId: 'can_seed_2', jobId: 'j1', projectId: 'r1', currentStage: 'Sourced', appliedDate: '2026-07-09T11:30:00Z', source: 'Recruiter Added', assignedRecruiterId: 'u3', matchScore: 78, matchStrengths: ['2 years experience'], matchGaps: [], lastActivity: '2026-07-09T11:30:00Z' },
      { id: 'app_seed_3', candidateId: 'can_seed_3', jobId: 'j1', projectId: 'r1', currentStage: 'Sourced', appliedDate: '2026-07-10T12:15:00Z', source: 'SPC Careers Website', assignedRecruiterId: 'u3', matchScore: 72, matchStrengths: ['Immediate availability'], matchGaps: [], lastActivity: '2026-07-10T12:15:00Z' },
      { id: 'app_seed_4', candidateId: 'can_seed_4', jobId: 'j1', projectId: 'r1', currentStage: 'Interviewing', appliedDate: '2026-07-11T13:45:00Z', source: 'SPC Careers Website', assignedRecruiterId: 'u3', matchScore: 90, matchStrengths: ['Direct experience matching requirements'], matchGaps: [], lastActivity: '2026-07-11T13:45:00Z' },
      { id: 'app_seed_5', candidateId: 'can_seed_5', jobId: 'j1', projectId: 'r1', currentStage: 'Interviewing', appliedDate: '2026-07-11T14:30:00Z', source: 'Naukri', assignedRecruiterId: 'u3', matchScore: 82, matchStrengths: ['Strong Excel and verification experience'], matchGaps: [], lastActivity: '2026-07-11T14:30:00Z' },
      { id: 'app_seed_6', candidateId: 'can_seed_6', jobId: 'j1', projectId: 'r1', currentStage: 'Interviewing', appliedDate: '2026-07-12T09:15:00Z', source: 'SPC Careers Website', assignedRecruiterId: 'u3', matchScore: 94, matchStrengths: ['Over 2 years experience', 'Fast typing speed'], matchGaps: [], lastActivity: '2026-07-12T09:15:00Z' },
      { id: 'app_seed_7', candidateId: 'can_seed_7', jobId: 'j1', projectId: 'r1', currentStage: 'Interviewing', appliedDate: '2026-07-12T10:30:00Z', source: 'Recruiter Added', assignedRecruiterId: 'u3', matchScore: 89, matchStrengths: ['Immediate joiner', 'Strong background'], matchGaps: [], lastActivity: '2026-07-12T10:30:00Z' }
    ];
    let changed = false;
    appSeeds.forEach(seed => {
      if (!base.some(a => a.id === seed.id || a.candidateId === seed.candidateId)) {
        base.push(seed);
        changed = true;
      }
    });
    if (changed || localStorage.getItem('spc_applications') === null) {
      localStorage.setItem('spc_applications', JSON.stringify(base));
    }
    return base;
  });

  const [interviews, setInterviews] = useState<Interview[]>(() => {
    if (localStorage.getItem('spc_interviews') === null) {
      localStorage.setItem('spc_interviews', JSON.stringify(mockInterviews));
    }
    const parsed = safeParse<Interview[]>('spc_interviews', mockInterviews);
    return parsed.map(iv => ({
      ...iv,
      roundNumber: iv.roundNumber || 1,
      interviewers: normalizeInterviewers(iv)
    }));
  });

  const [offers, setOffers] = useState<Offer[]>(() => {
    if (localStorage.getItem('spc_offers') === null) {
      localStorage.setItem('spc_offers', JSON.stringify(mockOffers));
    }
    const parsedOffers = safeParse<Offer[]>('spc_offers', mockOffers);
    const healedOffers = parsedOffers.map(o => normalizeOffer(o));
    
    let changed = false;
    healedOffers.forEach((o, i) => {
      if (o.status !== parsedOffers[i].status) changed = true;
    });
    
    if (changed) {
      localStorage.setItem('spc_offers', JSON.stringify(healedOffers));
    }
    return healedOffers;
  });

  const [onboardings, setOnboardings] = useState<Onboarding[]>(() => {
    if (localStorage.getItem('spc_onboardings') === null) {
      localStorage.setItem('spc_onboardings', JSON.stringify(mockOnboardings));
    }
    return safeParse<Onboarding[]>('spc_onboardings', mockOnboardings);
  });

  const [matchRuns, setMatchRuns] = useState<JobMatchRun[]>(() => {
    return safeParse<JobMatchRun[]>('spc_match_runs', []);
  });

  const [informationRequests, setInformationRequests] = useState<InformationRequest[]>(() => {
    if (localStorage.getItem('spc_info_reqs') === null) {
      localStorage.setItem('spc_info_reqs', JSON.stringify([]));
    }
    return safeParse<InformationRequest[]>('spc_info_reqs', []);
  });

  const [clientReviewBatches, setClientReviewBatches] = useState<ClientReviewBatch[]>(() => {
    if (localStorage.getItem('spc_client_review_batches') === null) {
      localStorage.setItem('spc_client_review_batches', JSON.stringify([]));
    }
    return safeParse<ClientReviewBatch[]>('spc_client_review_batches', []);
  });

  // Cross-tab synchronization
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'spc_client_review_batches' && e.newValue) {
        setClientReviewBatches(JSON.parse(e.newValue));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Sync session changes
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('spc_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('spc_user');
    }
  }, [currentUser]);

  // Automatic Offer Expiry
  useEffect(() => {
    const checkExpiry = () => {
      setOffers(prevOffers => {
        let changed = false;
        const todayStr = new Date(new Date().setHours(0,0,0,0)).toISOString();
        
        const evaluated = prevOffers.map(offer => {
          // Expire only current issued versions ('Sent' or 'Negotiating')
          if ((offer.status === 'Sent' || offer.status === 'Negotiating') && offer.expiryDate) {
            const expiry = new Date(offer.expiryDate);
            // It expires strictly AFTER the validity date passes
            if (expiry < new Date(todayStr)) {
              changed = true;
              return {
                ...offer,
                status: 'Expired',
                activities: [
                  ...(offer.activities || []),
                  {
                    id: 'act_' + Math.random().toString(36).substr(2, 9),
                    action: 'Offer Expired',
                    date: new Date().toISOString(),
                    actor: 'System',
                    comment: `Offer automatically expired after validity date (${offer.expiryDate}) passed.`
                  }
                ]
              };
            }
          }
          return offer;
        });
        
        if (changed) {
          localStorage.setItem('spc_offers', JSON.stringify(evaluated));
          return evaluated;
        }
        return prevOffers;
      });
    };

    checkExpiry(); // Check immediately
    const intervalId = setInterval(checkExpiry, 60000); // Check every minute
    return () => clearInterval(intervalId);
  }, []);

  // Sync data updates to localStorage
  const persistClients = (newClients: Client[]) => {
    setClients(newClients);
    localStorage.setItem('spc_clients', JSON.stringify(newClients));
  };

  const persistProjects = (newReqs: Project[]) => {
    setProjects(newReqs);
    localStorage.setItem('spc_requirements', JSON.stringify(newReqs));
    
    // Atomically recalculate client statuses based on requirement relationships
    setClients(currentClients => {
      let changed = false;
      const updatedClients = currentClients.map(client => {
        const hasReqs = newReqs.some(r => r.clientId === client.id);
        const expectedStatus = hasReqs ? 'Active' : 'Inactive';
        if (client.status !== expectedStatus) {
          changed = true;
          return { ...client, status: expectedStatus };
        }
        return client;
      });
      if (changed) {
        localStorage.setItem('spc_clients', JSON.stringify(updatedClients));
        return updatedClients;
      }
      return currentClients;
    });
  };

  const persistJobs = (newJobs: Job[]) => {
    setJobs(newJobs);
    localStorage.setItem('spc_jobs', JSON.stringify(newJobs));
  };

  const persistCandidates = (newCandidates: Candidate[]) => {
    setCandidates(newCandidates);
    localStorage.setItem('spc_candidates', JSON.stringify(newCandidates));
  };

  const persistApplications = (newApplications: Application[]) => {
    setApplications(newApplications);
    localStorage.setItem('spc_applications', JSON.stringify(newApplications));
  };

  const persistInterviews = (newInterviews: Interview[]) => {
    setInterviews(newInterviews);
    localStorage.setItem('spc_interviews', JSON.stringify(newInterviews));
  };

  const persistOffers = (newOffers: Offer[]) => {
    setOffers(newOffers);
    localStorage.setItem('spc_offers', JSON.stringify(newOffers));
  };

  const persistInformationRequests = (reqs: InformationRequest[]) => {
    setInformationRequests(reqs);
    localStorage.setItem('spc_info_reqs', JSON.stringify(reqs));
  };

  const persistOnboardings = (newOnboardings: Onboarding[]) => {
    setOnboardings(newOnboardings);
    localStorage.setItem('spc_onboardings', JSON.stringify(newOnboardings));
  };

  const updateOnboarding = (onboardingId: string, updates: Partial<Onboarding>) => {
    const next = onboardings.map(o => o.id === onboardingId ? { ...o, ...updates } : o);
    persistOnboardings(next);
  };

  const login = (email: string) => {
    const user = mockUsers.find(u => u.email.trim().toLowerCase() === email.trim().toLowerCase());
    if (user) {
      setCurrentUser(user);
      return { success: true };
    }
    return { success: false, error: 'Invalid demo credentials email.' };
  };

  const logout = () => {
    setCurrentUser(null);
  };

  type EditableClientFields = Pick<Client, 'name' | 'industry' | 'industryOtherText' | 'primaryContactName' | 'primaryContactEmail' | 'primaryContactPhone' | 'locations'>;

  const createClient = (clientData: EditableClientFields) => {
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'MANAGER')) {
      return { success: false, error: 'Unauthorized to create clients.' };
    }

    const normName = clientData.name.trim().toLowerCase();
    const dup = clients.find(c => c.name.trim().toLowerCase() === normName);
    if (dup) {
      return { success: false, error: 'A client with this name already exists.' };
    }
    
    const newClient: Client = {
      ...clientData,
      id: 'cl_' + Math.random().toString(36).substr(2, 9),
      status: 'Inactive', 
      activeProjectsCount: 0,
      openPositionsCount: 0,
      lastActivity: new Date().toISOString()
    };
    persistClients([newClient, ...clients]);
    return { success: true, clientId: newClient.id };
  };

  const updateClient = (clientId: string, updates: Partial<EditableClientFields>) => {
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'MANAGER')) {
      return { success: false, error: 'Unauthorized. Only Admins and Managers can edit clients.' };
    }

    if (updates.name) {
      const normName = updates.name.trim().toLowerCase();
      const dup = clients.find(c => c.id !== clientId && c.name.trim().toLowerCase() === normName);
      if (dup) {
        return { success: false, error: 'A client with this name already exists.' };
      }
    }
    
    let updated = false;
    const updatedClients = clients.map(c => {
      if (c.id === clientId) {
        updated = true;
        // Safely extract only the editable fields to prevent overwriting system fields like status
        const safeUpdates: Partial<Client> = {};
        if (updates.name !== undefined) safeUpdates.name = updates.name.trim();
        if (updates.industry !== undefined) safeUpdates.industry = updates.industry;
        if (updates.industryOtherText !== undefined) safeUpdates.industryOtherText = updates.industryOtherText;
        if (updates.primaryContactName !== undefined) safeUpdates.primaryContactName = updates.primaryContactName;
        if (updates.primaryContactEmail !== undefined) safeUpdates.primaryContactEmail = updates.primaryContactEmail;
        if (updates.primaryContactPhone !== undefined) safeUpdates.primaryContactPhone = updates.primaryContactPhone;
        if (updates.locations !== undefined) safeUpdates.locations = updates.locations;

        return { ...c, ...safeUpdates, lastActivity: new Date().toISOString() };
      }
      return c;
    });
    
    if (updated) {
      persistClients(updatedClients);
      return { success: true };
    }
    return { success: false, error: 'Client not found.' };
  };

  const deleteClient = (clientId: string) => {
    const updatedClients = clients.filter(c => c.id !== clientId);
    persistClients(updatedClients);
  };

  const deleteProject = (projectId: string) => {
    const updatedReqs = projects.filter(r => r.id !== projectId);
    persistProjects(updatedReqs);
  };

  type CreateReqData = Omit<Project, 'id' | 'code' | 'positionsFilled' | 'lifecycleStatus' | 'version' | 'revisions' | 'createdAt' | 'updatedAt'> & { lifecycleStatus?: ProjectStatus };

  const createProject = (reqData: CreateReqData | CreateReqData[]) => {
    const dataArray = Array.isArray(reqData) ? reqData : [reqData];
    const now = new Date().toISOString();
    
    const newReqs: Project[] = dataArray.map(data => ({
      ...data,
      id: 'req_' + Math.random().toString(36).substr(2, 9),
      code: 'REQ-26-' + Math.floor(100 + Math.random() * 900),
      positionsFilled: 0,
      lifecycleStatus: data.lifecycleStatus || 'Open',
      version: 1,
      revisions: [],
      createdAt: now,
      updatedAt: now,
    }));
    
    // Update clients: activate them and increment counts
    const updatedClients = [...clients];
    newReqs.forEach(req => {
      const clientIndex = updatedClients.findIndex(c => c.id === req.clientId);
      if (clientIndex !== -1) {
        updatedClients[clientIndex] = {
          ...updatedClients[clientIndex],
          status: 'Active',
          activeProjectsCount: updatedClients[clientIndex].activeProjectsCount + 1,
          openPositionsCount: updatedClients[clientIndex].openPositionsCount + req.totalRequestedHeadcount
        };
      }
    });

    persistClients(updatedClients);
    persistProjects([...newReqs, ...projects]);
  };

  const createCandidate = (candidateData: Omit<Candidate, 'id' | 'code' | 'duplicateStatus'>) => {
    const normEmail = candidateData.email?.trim().toLowerCase() || '';
    const normPhone = candidateData.phone?.replace(/[^0-9]/g, '') || '';
    if (normEmail) {
      const dup = candidates.find(c => c.email.trim().toLowerCase() === normEmail);
      if (dup) return { success: false, error: 'A candidate with this email already exists.' };
    } else if (normPhone) {
      const dup = candidates.find(c => c.phone.replace(/[^0-9]/g, '') === normPhone);
      if (dup) return { success: false, error: 'A candidate with this phone number already exists.' };
    }
    const newCandidate: Candidate = {
      ...candidateData,
      id: 'can_' + Math.random().toString(36).substr(2, 9),
      code: 'CAN-26-' + Math.floor(100 + Math.random() * 900),
      duplicateStatus: 'None',
      createdAt: new Date().toISOString(),
    };
    persistCandidates([newCandidate, ...candidates]);
    return { success: true, candidateId: newCandidate.id };
  };

  const updateCandidate = (candidateId: string, updates: Partial<Candidate>) => {
    const updatedCandidates = candidates.map(c => {
      if (c.id === candidateId) {
        return { ...c, ...updates, updatedAt: new Date().toISOString() };
      }
      return c;
    });
    persistCandidates(updatedCandidates);
  };

  const deleteCandidate = (candidateId: string) => {
    const updatedCandidates = candidates.filter(c => c.id !== candidateId);
    persistCandidates(updatedCandidates);
  };

  const createJob = (jobData: Omit<Job, 'id' | 'code' | 'filled'>, projectId?: string) => {
    const jobId = 'j_' + Math.random().toString(36).substr(2, 9);
    const jobCode = 'JOB-26-' + Math.floor(100 + Math.random() * 900);
    
    let clientId = jobData.clientId;
    let projectName = jobData.projectName;
    
    if (projectId && projectId !== 'none') {
      const req = projects.find(r => r.id === projectId);
      if (req) {
        clientId = req.clientId;
        projectName = req.projectName;
      }
    }

    const isJobPublished = jobData.isPublished !== undefined ? jobData.isPublished : (jobData.status === 'Open' || (jobData.status as any) === 'Published');
    const nowIso = new Date().toISOString();
    const newJob: Job = {
      ...jobData,
      id: jobId,
      code: jobCode,
      projectId: projectId || 'none',
      clientId,
      projectName,
      filled: 0,
      hiringModel: jobData.hiringModel || 'Client Hire',
      status: (jobData.status as any) === 'Published' ? 'Open' : (jobData.status || 'Draft'),
      isPublished: isJobPublished,
      createdAt: jobData.createdAt || nowIso,
      publishedAt: jobData.publishedAt || (isJobPublished ? nowIso : undefined),
      firstPublishedAt: isJobPublished ? (jobData.publishedAt || nowIso) : undefined,
    };

    const newJobs: Job[] = [newJob, ...jobs];
    persistJobs(newJobs);

    // Automatically mock 20 fresh candidate applications for this new job in fresh state
    const pool = candidates.length >= 20 ? candidates : mockCandidates;
    const initialApplicants: Application[] = pool.slice(0, 20).map((cand, idx) => ({
      id: `app_${newJob.id}_${cand.id}`,
      candidateId: cand.id,
      jobId: newJob.id,
      projectId: newJob.projectId || 'none',
      currentStage: idx % 4 === 0 ? ('Under Review' as const) : ('New' as const),
      appliedDate: new Date(Date.now() - (idx * 3600 * 1000 * 4)).toISOString(),
      source: (['SPC Careers Website', 'LinkedIn', 'Naukri', 'Bulk Upload'][idx % 4]) as CandidateJobSource,
      assignedRecruiterId: newJob.assignedRecruiterId || 'u1',
      lastActivity: new Date().toISOString()
    }));

    const nextApplications = [...initialApplicants, ...applications];
    persistApplications(nextApplications);

    // Automatically seed 25 AI candidate matches for this new job
    const matchPool = pool.slice(0, 25);
    const initialMatches: JobMatch[] = matchPool.map((c, i) => {
      const baseMatch = calculateMatch(newJob, c);
      const score = Math.max(72, 96 - i);
      return {
        ...baseMatch,
        candidateId: c.id,
        jobId: newJob.id,
        score,
        breakdown: {
          skills: Math.round((score / 100) * 40),
          experience: Math.round((score / 100) * 20),
          location: Math.round((score / 100) * 15),
          education: Math.round((score / 100) * 10),
          availability: Math.round((score / 100) * 10),
          employmentType: Math.round((score / 100) * 5),
        },
        matchStrengths: baseMatch.matchStrengths.length > 0 
          ? baseMatch.matchStrengths 
          : [`Strong alignment with ${newJob.title} criteria.`, 'Relevant work experience.'],
        dismissed: false
      };
    });

    const newRun: JobMatchRun = {
      id: `run_${Date.now()}`,
      jobId: newJob.id,
      timestamp: new Date().toISOString(),
      engineVersion: '1.0.0',
      stale: false,
      matches: initialMatches
    };

    persistMatchRuns([newRun, ...matchRuns]);
  };


  const updateJob = (jobId: string, updates: Partial<Job>) => {
    const updatedJobs = jobs.map(j => {
      if (j.id === jobId) {
        return { ...j, ...updates };
      }
      return j;
    });
    persistJobs(updatedJobs);
  };

  const updateJobHiringModel = (jobId: string, hiringModel: HiringModel, isAdminOverride?: boolean) => {
    const targetJob = jobs.find(j => j.id === jobId);
    if (!targetJob) return { success: false, error: 'Job not found' };

    const isLocked = isJobHiringModelLocked(jobId, applications);
    if (isLocked) {
      const isAdmin = currentUser?.role === 'ADMIN' || (currentUser as any)?.role === 'company_admin';
      if (!isAdmin) {
        return { success: false, error: 'Hiring Model is locked because candidates have entered the pipeline. Only an Administrator can override this.' };
      }
      if (!isAdminOverride) {
        return { success: false, error: 'Confirmation required for administrator override.' };
      }
    }

    const prevModel = targetJob.hiringModel || 'Not Configured';
    const updatedJobs = jobs.map(j => {
      if (j.id === jobId) {
        return {
          ...j,
          hiringModel,
          revisions: isLocked ? [
            ...(j.revisions || []),
            {
              id: 'rev_' + Math.random().toString(36).substr(2, 9),
              projectId: j.projectId,
              version: (j as any).version ? (j as any).version + 1 : 1,
              changedFields: ['hiringModel'],
              previousValues: { hiringModel: prevModel },
              newValues: { hiringModel },
              changedBy: currentUser?.name || 'Administrator',
              changedAt: new Date().toISOString(),
              reason: `Admin Override: Hiring Model changed from ${prevModel} to ${hiringModel}`
            }
          ] : j.revisions
        };
      }
      return j;
    });

    persistJobs(updatedJobs);
    return { success: true };
  };

  const startJoiningTracking = (applicationId: string, expectedJoiningDate: string, notes?: string) => {
    const app = applications.find(a => a.id === applicationId);
    if (!app) return { success: false, error: 'Application not found' };

    const targetJob = jobs.find(j => j.id === app.jobId);
    if (!targetJob) return { success: false, error: 'Job not found' };

    const now = new Date().toISOString();
    let placementId = '';
    const existingPlacement = placements.find(p => p.applicationId === applicationId);

    let updatedPlacements: Placement[];
    if (existingPlacement) {
      placementId = existingPlacement.id;
      updatedPlacements = placements.map(p => {
        if (p.id === existingPlacement.id) {
          return {
            ...p,
            status: 'Joining Pending' as const,
            expectedJoiningDate,
            notes: notes !== undefined ? notes : p.notes,
            updatedAt: now,
          };
        }
        return p;
      });
    } else {
      placementId = 'plc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
      const newPlacement: Placement = {
        id: placementId,
        applicationId,
        candidateId: app.candidateId,
        jobId: app.jobId,
        clientId: targetJob.clientId,
        hiringModel: 'Client Hire',
        status: 'Joining Pending',
        expectedJoiningDate,
        notes,
        createdAt: now,
        updatedAt: now,
      };
      updatedPlacements = [newPlacement, ...placements];
    }

    persistPlacements(updatedPlacements);

    // Update application: currentStage 'Selected', currentSubstate 'Joining Pending'
    const updatedApps = applications.map(a => {
      if (a.id === applicationId) {
        return {
          ...a,
          currentStage: 'Selected' as ApplicationStage,
          currentSubstate: 'Joining Pending' as ApplicationSubstate,
          lastActivity: now,
        };
      }
      return a;
    });
    persistApplications(updatedApps);

    return { success: true, placementId };
  };

  const confirmJoined = (applicationId: string, actualJoiningDate: string, notes?: string) => {
    const app = applications.find(a => a.id === applicationId);
    if (!app) return { success: false, error: 'Application not found' };

    const targetJob = jobs.find(j => j.id === app.jobId);
    const now = new Date().toISOString();

    const existingPlacement = placements.find(p => p.applicationId === applicationId);
    let updatedPlacements: Placement[];

    const historyEntry: PlacementBillingHistoryItem = {
      id: 'bh_' + Date.now(),
      fromStatus: existingPlacement?.billingStatus,
      toStatus: existingPlacement?.billingStatus || 'Billing Eligible',
      changedAt: now,
      changedBy: currentUser?.name || 'Recruiter',
      notes: notes || 'Confirmed joined on Client payroll'
    };

    if (existingPlacement) {
      updatedPlacements = placements.map(p => {
        if (p.id === existingPlacement.id) {
          const nextBillingStatus = p.billingStatus || 'Billing Eligible';
          return {
            ...p,
            status: 'Joined' as const,
            actualJoiningDate,
            billingStatus: nextBillingStatus,
            billingHistory: [...(p.billingHistory || []), historyEntry],
            updatedAt: now,
          };
        }
        return p;
      });
    } else {
      const newPlacement: Placement = {
        id: 'plc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        applicationId,
        candidateId: app.candidateId,
        jobId: app.jobId,
        clientId: targetJob?.clientId || '',
        hiringModel: 'Client Hire',
        status: 'Joined',
        expectedJoiningDate: actualJoiningDate,
        actualJoiningDate,
        billingStatus: 'Billing Eligible',
        billingHistory: [historyEntry],
        createdAt: now,
        updatedAt: now,
      };
      updatedPlacements = [newPlacement, ...placements];
    }

    persistPlacements(updatedPlacements);

    // Move candidate into Completed Outcomes as Joined/Placed
    const wasHired = app.currentStage === 'Hired';
    const updatedApps = applications.map(a => {
      if (a.id === applicationId) {
        return {
          ...a,
          currentStage: 'Hired' as ApplicationStage,
          currentSubstate: 'Joined/Placed' as ApplicationSubstate,
          lastActivity: now,
        };
      }
      return a;
    });
    persistApplications(updatedApps);

    // Update job filled count if not already counted as hired
    if (!wasHired && targetJob) {
      const updatedJobs = jobs.map(j => {
        if (j.id === targetJob.id) {
          return {
            ...j,
            filled: Math.min(j.openings, j.filled + 1)
          };
        }
        return j;
      });
      persistJobs(updatedJobs);
    }

    return { success: true };
  };

  const recordDidNotJoin = (applicationId: string, reason: string) => {
    const now = new Date().toISOString();
    const existingPlacement = placements.find(p => p.applicationId === applicationId);
    if (existingPlacement) {
      const updatedPlacements = placements.map(p => {
        if (p.id === existingPlacement.id) {
          return {
            ...p,
            status: 'Did Not Join' as const,
            didNotJoinReason: reason,
            updatedAt: now,
          };
        }
        return p;
      });
      persistPlacements(updatedPlacements);
    }

    // Leave candidate under Selected; do not reject them automatically!
    const updatedApps = applications.map(a => {
      if (a.id === applicationId) {
        return {
          ...a,
          currentSubstate: 'Did Not Join' as ApplicationSubstate,
          lastActivity: now,
        };
      }
      return a;
    });
    persistApplications(updatedApps);

    return { success: true };
  };

  const updatePlacementBillingStatus = (
    placementId: string, 
    status: PlacementBillingStatus, 
    notes?: string, 
    extra?: { invoiceNumber?: string, feeAmount?: string | number }
  ) => {
    const placement = placements.find(p => p.id === placementId);
    if (!placement) return { success: false, error: 'Placement not found' };

    const now = new Date().toISOString();
    const historyEntry: PlacementBillingHistoryItem = {
      id: 'bh_' + Date.now(),
      fromStatus: placement.billingStatus,
      toStatus: status,
      changedAt: now,
      changedBy: currentUser?.name || 'Recruiter',
      notes,
      invoiceNumber: extra?.invoiceNumber,
      feeAmount: extra?.feeAmount,
    };

    const updatedPlacements = placements.map(p => {
      if (p.id === placementId) {
        return {
          ...p,
          billingStatus: status,
          invoiceNumber: extra?.invoiceNumber || p.invoiceNumber,
          feeAmount: extra?.feeAmount !== undefined ? extra.feeAmount : p.feeAmount,
          paidDate: status === 'Paid' ? (p.paidDate || now) : p.paidDate,
          billingHistory: [...(p.billingHistory || []), historyEntry],
          updatedAt: now,
        };
      }
      return p;
    });

    persistPlacements(updatedPlacements);
    // Rule: Payment completion must not automatically close the Job.
    return { success: true };
  };

  const submitApplication = (
    candidateData: Omit<Candidate, 'id' | 'code' | 'duplicateStatus' | 'source'>,
    jobId: string,
    source?: CandidateJobSource | string
  ) => {
    const canonicalSource = normalizeSource(source || 'SPC Careers Website');

    // Normalization logic
    const normEmail = candidateData.email.trim().toLowerCase();
    const normPhone = candidateData.phone.replace(/[^0-9]/g, '');

    // Duplicate Check
    const existingCandidate = candidates.find(c => {
      const emailMatch = normEmail && c.email.trim().toLowerCase() === normEmail;
      const phoneMatch = normPhone && c.phone.replace(/[^0-9]/g, '') === normPhone;
      return emailMatch || phoneMatch;
    });

    if (existingCandidate) {
      // Check if application for the same job exists
      const hasApplied = applications.some(a => a.candidateId === existingCandidate.id && a.jobId === jobId);
      if (hasApplied) {
        return { success: false, error: 'You have already applied for this opening.' };
      }
    }

    let finalCandidate: Candidate;

    if (existingCandidate) {
      // Preserve original candidate acquisition source separately
      finalCandidate = {
        ...existingCandidate,
        // Update missing profile information
        fullName: existingCandidate.fullName || candidateData.fullName,
        currentLocation: existingCandidate.currentLocation || candidateData.currentLocation,
        totalExperience: existingCandidate.totalExperience || candidateData.totalExperience,
        currentRole: existingCandidate.currentRole || candidateData.currentRole,
        currentCompany: existingCandidate.currentCompany || candidateData.currentCompany,
        skills: existingCandidate.skills?.length ? existingCandidate.skills : candidateData.skills,
        expectedSalary: existingCandidate.expectedSalary || candidateData.expectedSalary,
        noticePeriod: existingCandidate.noticePeriod || candidateData.noticePeriod,
        resumeUrl: existingCandidate.resumeUrl || candidateData.resumeUrl,
      };
      persistCandidates(candidates.map(c => c.id === finalCandidate.id ? finalCandidate : c));
    } else {
      const candidateId = 'can_' + Math.random().toString(36).substr(2, 9);
      const candidateCode = 'CAN-26-' + Math.floor(100 + Math.random() * 900);
      finalCandidate = {
        ...candidateData,
        id: candidateId,
        code: candidateCode,
        duplicateStatus: 'None',
        source: canonicalSource,
      };
      persistCandidates([finalCandidate, ...candidates]);
    }

    const applicationId = 'app_' + Math.random().toString(36).substr(2, 9);
    const targetJob = jobs.find(j => j.id === jobId);
    const newApplication: Application = {
      id: applicationId,
      candidateId: finalCandidate.id,
      jobId: jobId,
      projectId: targetJob ? targetJob.projectId : 'none',
      currentStage: 'New',
      appliedDate: new Date().toISOString(),
      source: canonicalSource,
      assignedRecruiterId: targetJob ? targetJob.assignedRecruiterId : 'u3',
      matchScore: 85, // Default mock score
      lastActivity: new Date().toISOString(),
    };

    persistApplications([newApplication, ...applications]);
    return { success: true };
  };

  const updateApplicationStage = (appId: string, stage: ApplicationStage, substate?: ApplicationSubstate, rejectionReason?: string) => {
    setApplications(prev => {
      const updated = prev.map(a => {
        if (a.id === appId) {
          const updates: Partial<Application> = { currentStage: stage, lastActivity: new Date().toISOString() };
          if (substate !== undefined) updates.currentSubstate = substate;
          if (rejectionReason !== undefined) updates.rejectionReason = rejectionReason;
          return { ...a, ...updates };
        }
        return a;
      });
      localStorage.setItem('spc_applications', JSON.stringify(updated));
      return updated;
    });
  };

  const updateApplicationScreening = (appId: string, screeningData: any) => {
    setApplications(prev => {
      const updated = prev.map(a => {
        if (a.id === appId) {
          return { ...a, screeningData: { ...a.screeningData, ...screeningData }, lastActivity: new Date().toISOString() };
        }
        return a;
      });
      localStorage.setItem('spc_applications', JSON.stringify(updated));
      return updated;
    });
  };

  const createClientReviewBatch = (batchData: Omit<ClientReviewBatch, 'id' | 'token' | 'createdAt' | 'status' | 'candidateStatuses'>) => {
    const newBatch: ClientReviewBatch = {
      ...batchData,
      id: `crb_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      token: `${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
      createdAt: new Date().toISOString(),
      status: 'Submitted',
      candidateStatuses: {}
    };

    batchData.applicationIds.forEach(id => {
      newBatch.candidateStatuses[id] = 'Submitted';
    });

    setClientReviewBatches(prev => {
      const updated = [newBatch, ...prev];
      localStorage.setItem('spc_client_review_batches', JSON.stringify(updated));
      return updated;
    });

    setApplications(prev => {
      const updated = prev.map(a => {
        if (batchData.applicationIds.includes(a.id)) {
          return { ...a, clientReviewStatus: 'Submitted', lastActivity: new Date().toISOString() };
        }
        return a;
      });
      localStorage.setItem('spc_applications', JSON.stringify(updated));
      return updated;
    });

    return newBatch.token;
  };

  const submitClientReviewFeedback = (batchId: string, feedback: Record<string, { status: string; comment?: string }>) => {
    setClientReviewBatches(prev => {
      const updated = prev.map(b => {
        if (b.id === batchId) {
          const newCandidateStatuses = { ...b.candidateStatuses };
          let hasPending = false;
          b.applicationIds.forEach(appId => {
            if (feedback[appId]) {
              newCandidateStatuses[appId] = feedback[appId].status as any;
            }
            if (newCandidateStatuses[appId] === 'Submitted' || newCandidateStatuses[appId] === 'Feedback Pending') {
              hasPending = true;
            }
          });
          return {
            ...b,
            status: hasPending ? 'Submitted' : 'Completed',
            candidateStatuses: newCandidateStatuses
          };
        }
        return b;
      });
      localStorage.setItem('spc_client_review_batches', JSON.stringify(updated));
      return updated;
    });

    setApplications(prev => {
      const updated = prev.map(a => {
        if (feedback[a.id]) {
          const fb = feedback[a.id];
          return { 
            ...a, 
            clientReviewStatus: fb.status, 
            clientReviewComment: fb.comment,
            currentSubstate: fb.status,
            lastActivity: new Date().toISOString() 
          };
        }
        return a;
      });
      localStorage.setItem('spc_applications', JSON.stringify(updated));
      return updated;
    });
  };

  const markClientReviewBatchViewed = (batchId: string) => {
    setClientReviewBatches(prev => {
      const updated = prev.map(b => {
        if (b.id === batchId && !b.viewedAt) {
          return { ...b, viewedAt: new Date().toISOString() };
        }
        return b;
      });
      localStorage.setItem('spc_client_review_batches', JSON.stringify(updated));
      return updated;
    });
  };

  const createInformationRequest = (reqData: Omit<InformationRequest, 'id' | 'status' | 'responses'>) => {
    const newReq: InformationRequest = {
      ...reqData,
      id: 'req_info_' + Math.random().toString(36).substr(2, 9),
      status: reqData.communicationStatus === 'Recorded manually' ? 'Awaiting Response' : 'Draft',
      responses: []
    };
    persistInformationRequests([newReq, ...informationRequests]);
  };

  const recordInformationResponse = (projectId: string, response: Omit<RequestResponse, 'id' | 'requestId'>) => {
    const newResponse: RequestResponse = {
      ...response,
      id: 'resp_' + Math.random().toString(36).substr(2, 9),
      requestId: projectId
    };
    const updated = informationRequests.map(r => {
      if (r.id === projectId) {
        return { 
          ...r, 
          status: 'Response Received' as const, 
          responses: [...(r.responses || []), newResponse]
        };
      }
      return r;
    });
    persistInformationRequests(updated);
  };

  const updateInformationRequestStatus = (projectId: string, status: InformationRequest['status'], reason?: string) => {
    const updated = informationRequests.map(r => {
      if (r.id === projectId) {
        return { ...r, status, cancellationReason: reason };
      }
      return r;
    });
    persistInformationRequests(updated);
  };

  const resolveInformationRequest = (projectId: string) => {
    updateInformationRequestStatus(projectId, 'Resolved');
  };

  const cancelInformationRequest = (projectId: string, reason?: string) => {
    updateInformationRequestStatus(projectId, 'Cancelled', reason);
  };

  const updateProjectStatus = (projectId: string, status: ProjectStatus, reason?: string) => {
    const req = projects.find(r => r.id === projectId);
    if (!req) return { success: false, error: 'Requirement not found' };

    const updated = projects.map(r => {
      if (r.id === projectId) {
        const rev = {
          id: 'rev_' + Math.random().toString(36).substr(2, 9),
          projectId: r.id,
          version: r.version + 1,
          changedFields: ['lifecycleStatus'],
          previousValues: { lifecycleStatus: r.lifecycleStatus },
          newValues: { lifecycleStatus: status },
          changedBy: currentUser?.name || 'System',
          changedAt: new Date().toISOString(),
          reason: reason || `Status changed from ${r.lifecycleStatus} to ${status}`,
        };
        return { 
          ...r, 
          lifecycleStatus: status, 
          version: r.version + 1,
          revisions: [...(r.revisions || []), rev],
          updatedAt: new Date().toISOString() 
        };
      }
      return r;
    });
    persistProjects(updated);
    return { success: true };
  };

  const updateProject = (projectId: string, updates: Partial<Project>, reason?: string, impactSnapshot?: any) => {
    const req = projects.find(r => r.id === projectId);
    if (!req) return { success: false, error: 'Requirement not found' };
    
    if (updates.version && updates.version !== req.version) {
      return { success: false, error: 'Conflict: Requirement was updated by another user. Please reload and try again.' };
    }

    const changedFields = Object.keys(updates).filter(k => k !== 'version' && k !== 'revisions' && k !== 'updatedAt');
    const isMaterial = reason && changedFields.length > 0;

    const updated = projects.map(r => {
      if (r.id === projectId) {
        let revs = r.revisions || [];
        let nextVersion = r.version;
        if (isMaterial) {
          nextVersion++;
          const prevValues: any = {};
          const newValues: any = {};
          changedFields.forEach(k => {
            prevValues[k] = (r as any)[k];
            newValues[k] = (updates as any)[k];
          });
          revs = [...revs, {
            id: 'rev_' + Math.random().toString(36).substr(2, 9),
            projectId: r.id,
            version: nextVersion,
            changedFields,
            previousValues: prevValues,
            newValues: newValues,
            changedBy: currentUser?.name || 'System',
            changedAt: new Date().toISOString(),
            reason: reason,
            impactSnapshot
          }];
        }
        return { 
          ...r, 
          ...updates, 
          version: nextVersion,
          revisions: revs,
          updatedAt: new Date().toISOString() 
        };
      }
      return r;
    });
    persistProjects(updated);
    return { success: true };
  };

  const submitInterviewFeedback = (interviewId: string, feedbackData: Partial<Interview>) => {
    const updated = interviews.map(i => {
      if (i.id === interviewId) {
        const interviewers = normalizeInterviewers(i);
        const updatedInterviewers = interviewers.map((inv, idx) => {
          if (idx === 0 || inv.feedbackStatus !== 'Submitted') {
            return {
              ...inv,
              feedbackStatus: 'Submitted' as const,
              submittedAt: new Date().toISOString(),
              overallRating: feedbackData.overallRating ?? inv.overallRating,
              overallResult: feedbackData.overallResult ?? inv.overallResult,
              recommendation: feedbackData.recommendation ?? inv.recommendation,
              strengths: feedbackData.strengths ?? inv.strengths,
              concerns: feedbackData.concerns ?? inv.concerns,
              feedbackNotes: feedbackData.feedbackNotes ?? inv.feedbackNotes
            };
          }
          return inv;
        });

        const updatedInterview: Interview = {
          ...i,
          ...feedbackData,
          interviewers: updatedInterviewers,
          status: 'Completed' as const
        };

        const summary = getInterviewFeedbackSummary(updatedInterview);
        updatedInterview.feedbackStatus = summary.status;
        return updatedInterview;
      }
      return i;
    });
    persistInterviews(updated);
    // Feedback submission NEVER automatically changes pipeline stage
  };

  const submitIndividualFeedback = (
    interviewId: string,
    tokenOrInterviewerId: string,
    feedbackData: Partial<InterviewerInvitation>
  ): { success: boolean; error?: string } => {
    let found = false;
    const updated = interviews.map(i => {
      const interviewers = normalizeInterviewers(i);
      const matchesInterview = i.id === interviewId || interviewers.some(inv => inv.secureFeedbackToken === tokenOrInterviewerId || inv.id === tokenOrInterviewerId);
      
      if (matchesInterview) {
        const updatedInterviewers = interviewers.map(inv => {
          if (inv.id === tokenOrInterviewerId || inv.secureFeedbackToken === tokenOrInterviewerId || inv.email === tokenOrInterviewerId) {
            found = true;
            return {
              ...inv,
              ...feedbackData,
              feedbackStatus: 'Submitted' as const,
              submittedAt: new Date().toISOString()
            };
          }
          return inv;
        });

        const updatedInterview: Interview = {
          ...i,
          interviewers: updatedInterviewers,
          status: i.status === 'Scheduled' ? 'Completed' : i.status
        };

        const summary = getInterviewFeedbackSummary(updatedInterview);
        updatedInterview.feedbackStatus = summary.status;

        const submittedList = updatedInterviewers.filter(inv => inv.feedbackStatus === 'Submitted');
        if (submittedList.length > 0) {
          const avgRating = Math.round(submittedList.reduce((acc, curr) => acc + (curr.overallRating || 3), 0) / submittedList.length);
          updatedInterview.overallRating = avgRating;
          if (feedbackData.feedbackNotes) updatedInterview.feedbackNotes = feedbackData.feedbackNotes;
          if (feedbackData.strengths) updatedInterview.strengths = feedbackData.strengths;
          if (feedbackData.concerns) updatedInterview.concerns = feedbackData.concerns;
          if (feedbackData.recommendation) updatedInterview.recommendation = feedbackData.recommendation;
          if (feedbackData.overallResult) updatedInterview.overallResult = feedbackData.overallResult;
        }

        return updatedInterview;
      }
      return i;
    });

    if (!found) {
      return { success: false, error: 'Interviewer invitation token not found.' };
    }

    persistInterviews(updated);
    // Feedback submission NEVER automatically changes pipeline stage
    return { success: true };
  };

  const confirmRecruiterOutcome = (
    interviewId: string,
    outcome: RecruiterInterviewOutcome,
    notes?: string,
    confirmStageChange: boolean = true
  ): { success: boolean; error?: string } => {
    const interview = interviews.find(i => i.id === interviewId);
    if (!interview) {
      return { success: false, error: 'Interview not found.' };
    }

    const updated = interviews.map(i => {
      if (i.id === interviewId) {
        return {
          ...i,
          recruiterOutcome: outcome,
          recruiterOutcomeNotes: notes,
          recruiterOutcomeConfirmedAt: new Date().toISOString()
        };
      }
      return i;
    });
    persistInterviews(updated);

    if (confirmStageChange && interview.applicationId) {
      switch (outcome) {
        case 'Selected':
          updateApplicationStage(interview.applicationId, 'Selected');
          break;
        case 'Rejected':
          updateApplicationStage(interview.applicationId, 'Rejected', undefined, notes || 'Rejected after interview review');
          break;
        case 'On Hold':
          updateApplicationStage(interview.applicationId, 'Interviewing', 'On Hold', notes || 'Placed on hold by recruiter');
          break;
        case 'Next Round':
          updateApplicationStage(interview.applicationId, 'Interviewing', 'Next Round To Schedule', notes);
          break;
        case 'Additional Discussion Required':
          updateApplicationStage(interview.applicationId, 'Interviewing', 'Additional Discussion Required', notes);
          break;
      }
    }

    return { success: true };
  };

  const sendFeedbackReminder = (
    interviewId: string,
    interviewerIdOrEmail: string
  ): { success: boolean; message: string } => {
    let found = false;
    let recipientName = 'Interviewer';
    const updated = interviews.map(i => {
      if (i.id === interviewId) {
        const interviewers = normalizeInterviewers(i);
        const updatedInterviewers = interviewers.map(inv => {
          if (inv.id === interviewerIdOrEmail || inv.email === interviewerIdOrEmail || inv.secureFeedbackToken === interviewerIdOrEmail) {
            found = true;
            recipientName = inv.name;
            return {
              ...inv,
              reminderSentAt: new Date().toISOString(),
              reminderCount: (inv.reminderCount || 0) + 1
            };
          }
          return inv;
        });
        return { ...i, interviewers: updatedInterviewers };
      }
      return i;
    });

    if (!found) {
      return { success: false, message: 'Interviewer not found.' };
    }

    persistInterviews(updated);
    return { success: true, message: `Feedback reminder successfully sent to ${recipientName}.` };
  };

  const scheduleInterview = (interviewDetails: Omit<Interview, 'id' | 'status' | 'feedbackStatus'>) => {
    const existing = interviews.find(
      i => i.applicationId === interviewDetails.applicationId && 
           i.interviewType === interviewDetails.interviewType && 
           i.status === 'Scheduled'
    );
    if (existing) {
      return { success: false, error: 'An active interview of this type is already scheduled for this application.' };
    }

    const durationMinutes = interviewDetails.durationMinutes || 45;
    const scheduledEndAt = interviewDetails.scheduledEndAt || 
      new Date(new Date(interviewDetails.scheduledAt).getTime() + durationMinutes * 60000).toISOString();

    const finalInterviewers: InterviewerInvitation[] = (interviewDetails.interviewers && interviewDetails.interviewers.length > 0)
      ? interviewDetails.interviewers.map((inv, idx) => ({
          ...inv,
          id: inv.id || `inv_${Date.now()}_${idx + 1}`,
          secureFeedbackToken: inv.secureFeedbackToken || generateSecureFeedbackToken(),
          feedbackStatus: inv.feedbackStatus || 'Not Due',
          invitedAt: inv.invitedAt || new Date().toISOString()
        }))
      : [
          {
            id: `inv_${Date.now()}_1`,
            name: interviewDetails.interviewerName || 'Assigned Interviewer',
            email: interviewDetails.interviewerEmail || '',
            role: 'Lead Interviewer',
            secureFeedbackToken: generateSecureFeedbackToken(),
            feedbackStatus: 'Not Due',
            invitedAt: new Date().toISOString()
          }
        ];

    const newInterview: Interview = {
      ...interviewDetails,
      id: `iv${Date.now()}`,
      roundNumber: interviewDetails.roundNumber || 1,
      scheduledEndAt,
      interviewers: finalInterviewers,
      status: 'Scheduled',
      feedbackStatus: 'Not Due',
    };

    persistInterviews([...interviews, newInterview]);
    
    // Update the application stage substate to indicate round scheduled
    if (newInterview.applicationId) {
      const substate = newInterview.roundName ? `${newInterview.roundName} Scheduled` : `Round ${newInterview.roundNumber} Scheduled`;
      updateApplicationStage(newInterview.applicationId, 'Interviewing', substate);
    }

    return { success: true };
  };

  const rescheduleInterview = (interviewId: string, updatedSchedule: Partial<Interview>) => {
    const updated = interviews.map(i => {
      if (i.id === interviewId) {
        const scheduledAt = updatedSchedule.scheduledAt || i.scheduledAt;
        const durationMinutes = updatedSchedule.durationMinutes || i.durationMinutes || 45;
        const scheduledEndAt = updatedSchedule.scheduledEndAt || new Date(new Date(scheduledAt).getTime() + durationMinutes * 60000).toISOString();
        
        return { 
          ...i, 
          ...updatedSchedule, 
          scheduledAt,
          durationMinutes,
          scheduledEndAt,
          status: 'Scheduled' as const,
          rescheduledAt: new Date().toISOString()
        };
      }
      return i;
    });
    persistInterviews(updated);
  };

  const updateInterviewStatus = (interviewId: string, status: InterviewStatus) => {
    const updated = interviews.map(i => i.id === interviewId ? { ...i, status } : i);
    persistInterviews(updated);
  };

  const markInterviewNoShow = (interviewId: string, who: 'Candidate' | 'Interviewer' | 'Both', note?: string) => {
    const updated = interviews.map(i => i.id === interviewId ? {
      ...i,
      status: 'No Show' as InterviewStatus,
      noShowWho: who,
      noShowNote: note
    } : i);
    persistInterviews(updated);
  };

  const cancelInterview = (interviewId: string, reason: string) => {
    const updated = interviews.map(i => i.id === interviewId ? { 
      ...i, 
      status: 'Cancelled' as InterviewStatus,
      cancellationReason: reason,
      cancelledAt: new Date().toISOString()
    } : i);
    persistInterviews(updated);
  };

  const updateOfferStatus = (offerId: string, status: OfferStatus, metadata?: Partial<Offer>) => {
    const updated = offers.map(o => {
      if (o.id === offerId) {
        const result = { ...o, status, ...metadata };
        if (status === 'Accepted') {
          result.acceptedAt = new Date().toISOString();
        } else if (status === 'Declined') {
          result.rejectedAt = new Date().toISOString();
        } else if (status === 'Withdrawn') {
          result.withdrawnAt = new Date().toISOString();
        }
        return result;
      }
      return o;
    });
    persistOffers(updated);
  };

  const createOffer = (offerData: Omit<Offer, 'id' | 'status'>) => {
    const newOffer: Offer = {
      ...offerData,
      id: `off_gen_${Date.now()}`,
      status: 'Offer Draft',
      version: 1,
      deliveryStatus: 'Not Sent'
    };
    persistOffers([newOffer, ...offers]);
    return newOffer.id;
  };

  const createRevisedOffer = (parentOfferId: string, offerData: Omit<Offer, 'id' | 'status' | 'version' | 'parentOfferId'>) => {
    const parentOffer = offers.find(o => o.id === parentOfferId);
    const newVersion = (parentOffer?.version || 1) + 1;
    
    const newOffer: Offer = {
      ...offerData,
      id: `off_gen_${Date.now()}`,
      status: 'Offer Draft',
      version: newVersion,
      parentOfferId: parentOffer?.parentOfferId || parentOfferId, // Link to root parent
      deliveryStatus: 'Not Sent'
    };

    const updatedOffers = offers.map(o => 
      o.id === parentOfferId ? { ...o, status: 'Superseded' as const } : o
    );

    persistOffers([newOffer, ...updatedOffers]);
    return newOffer.id;
  };

  const startNegotiation = (offerId: string, note: string) => {
    const offer = offers.find(o => o.id === offerId);
    if (!offer) return;
    
    const newActivity: OfferActivity = {
      id: `act_${Date.now()}`,
      action: 'Started Negotiation',
      date: new Date().toISOString(),
      actor: currentUser?.name || 'Admin',
      comment: note
    };

    updateOffer(offerId, { 
      status: 'Negotiating', 
      negotiationNote: note,
      activities: [...(offer.activities || []), newActivity]
    });
  };

  const updateOffer = (offerId: string, updates: Partial<Offer>) => {
    persistOffers(offers.map(o => o.id === offerId ? { ...o, ...updates } : o));
  };

  const submitOfferForApproval = (offerId: string) => {
    updateOffer(offerId, { status: 'Pending Approval' });
  };

  const approveOffer = (offerId: string) => {
    updateOffer(offerId, { status: 'Approved', approvedBy: currentUser?.name || 'Admin' });
  };

  const issueOffer = (offerId: string) => {
    const offer = offers.find(o => o.id === offerId);
    if (!offer) return;
    
    const updated = offers.map(o => {
      if (o.id === offerId) {
        const newActivity: OfferActivity = {
          id: `act_${Date.now()}`,
          action: 'Issued Offer',
          date: new Date().toISOString(),
          actor: currentUser?.name || 'Admin',
        };
        return { 
          ...o, 
          status: 'Sent', 
          sentDate: new Date().toISOString(), 
          deliveryStatus: 'Not Sent', // Ensure we don't claim email delivery
          activities: [...(o.activities || []), newActivity]
        };
      }
      // Supersede older active offers for the same application
      if (o.applicationId === offer.applicationId && o.id !== offerId && !['Declined', 'Expired', 'Withdrawn', 'Accepted'].includes(o.status)) {
        return { ...o, status: 'Superseded' as const };
      }
      return o;
    });
    
    persistOffers(updated);
    updateApplicationStage(offer.applicationId, 'Offered', '');
  };

  const recordOfferResponse = (offerId: string, response: 'Accepted' | 'Declined' | 'Negotiation Requested' | 'Expired' | 'Withdrawn' | 'Continue Negotiation', reason?: string) => {
    if (response === 'Negotiation Requested') return;
    if (response === 'Continue Negotiation') {
       updateOffer(offerId, { status: 'Negotiating', negotiationNote: reason });
       return;
    }
    const statusMap: Record<string, OfferStatus> = {
      'Accepted': 'Accepted',
      'Declined': 'Declined',
      'Expired': 'Expired',
      'Withdrawn': 'Withdrawn'
    };
    const metadata: Partial<Offer> = {};
    if (reason) metadata.notes = reason;
    updateOfferStatus(offerId, statusMap[response], metadata);
    
    const offer = offers.find(o => o.id === offerId);
    if (offer) {
      if (response === 'Accepted') {
        updateApplicationStage(offer.applicationId, 'Joining Pending', 'Offer Accepted');
      } else if (response === 'Expired' || response === 'Withdrawn') {
        updateApplicationStage(offer.applicationId, 'Rejected', undefined, reason || `Offer ${response}`);
      }
    }
  };

  const extendOfferExpiry = (offerId: string, newExpiryDate: string) => {
    const updated = offers.map(o => {
      if (o.id === offerId) {
        return { 
          ...o, 
          expiryDate: newExpiryDate, 
          extendedAt: new Date().toISOString() 
        };
      }
      return o;
    });
    persistOffers(updated);
  };

  const startOnboardingFromOffer = (offerId: string) => {
    const targetOffer = offers.find(o => o.id === offerId);
    if (!targetOffer) {
      return { success: false, error: 'Offer not found.' };
    }

    const duplicate = onboardings.some(onb => onb.candidateId === targetOffer.candidateId && onb.offerId === offerId);
    if (duplicate) {
      return { success: false, error: 'Onboarding has already been started for this candidate.' };
    }

    const job = jobs.find(j => j.id === targetOffer.jobId);
    const projectId = job ? job.projectId : '';
    const recruiterId = job ? job.assignedRecruiterId : 'u3';

    const newOnboarding: Onboarding = {
      id: `onb_${Date.now()}`,
      candidateId: targetOffer.candidateId,
      offerId: targetOffer.id,
      clientId: targetOffer.clientId,
      projectId: projectId,
      jobId: targetOffer.jobId,
      role: targetOffer.offeredRole,
      proposedJoiningDate: targetOffer.proposedJoiningDate,
      plannedJoiningDate: targetOffer.proposedJoiningDate,
      assignedHrId: recruiterId,
      status: 'Documents Requested',
      documentsStatus: 'Pending',
      backgroundCheckStatus: 'Pending',
      documents: [
        { name: 'PAN Card', submitted: false, approved: false },
        { name: 'Aadhaar Card', submitted: false, approved: false },
        { name: 'Cancelled Cheque', submitted: false, approved: false }
      ]
    };

    const updatedOffers = offers.map(o => {
      if (o.id === offerId) {
        return {
          ...o,
          status: 'Accepted' as const,
          onboardingStarted: true,
          onboardingId: newOnboarding.id
        };
      }
      return o;
    });

    persistOffers(updatedOffers);
    persistOnboardings([newOnboarding, ...onboardings]);
    return { success: true };
  };

  const persistMatchRuns = (newMatchRuns: JobMatchRun[]) => {
    setMatchRuns(newMatchRuns);
    localStorage.setItem('spc_match_runs', JSON.stringify(newMatchRuns));
  };

  const runJobMatching = (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;

    let matches: JobMatch[] = [];

    // Filter eligible candidates
    const eligibleCandidates = (candidates.length >= 25 ? candidates : mockCandidates)
      .filter(c => c.duplicateStatus !== 'Confirmed Duplicate');
    
    const calculated = eligibleCandidates.map(c => calculateMatch(job, c))
      .sort((a, b) => b.score - a.score);

    // Provide 25 candidate matches
    const targetCandidates = (calculated.length >= 25 ? calculated : eligibleCandidates.map(c => calculateMatch(job, c)))
      .slice(0, 25);

    matches = targetCandidates.map((m, i) => {
      const score = Math.max(72, m.score > 0 ? m.score : (95 - i));
      return {
        ...m,
        score,
        breakdown: {
          skills: Math.round((score / 100) * 40),
          experience: Math.round((score / 100) * 20),
          location: Math.round((score / 100) * 15),
          education: Math.round((score / 100) * 10),
          availability: Math.round((score / 100) * 10),
          employmentType: Math.round((score / 100) * 5),
        },
        dismissed: false
      };
    });

    // Keep existing dismissed matches if they still match
    const existingRun = matchRuns.find(r => r.jobId === jobId);
    if (existingRun) {
      matches.forEach(m => {
        const existingMatch = existingRun.matches.find(em => em.candidateId === m.candidateId);
        if (existingMatch && existingMatch.dismissed) {
          m.dismissed = true;
        }
      });
    }

    const newRun: JobMatchRun = {
      id: `run_${Date.now()}`,
      jobId,
      timestamp: new Date().toISOString(),
      engineVersion: '1.0.0',
      stale: false,
      matches,
    };

    persistMatchRuns([newRun, ...matchRuns.filter(r => r.jobId !== jobId)]);
  };

  const dismissMatch = (jobId: string, candidateId: string) => {
    const updatedRuns = matchRuns.map(run => {
      if (run.jobId === jobId) {
        return {
          ...run,
          matches: run.matches.map(m => 
            m.candidateId === candidateId ? { ...m, dismissed: true } : m
          )
        };
      }
      return run;
    });
    persistMatchRuns(updatedRuns);
  };

  const addMatchToPipeline = (
    jobId: string, 
    candidateId: string, 
    associationOrigin?: string,
    source?: CandidateJobSource | string
  ) => {
    // Check if already applied
    const existingApp = applications.find(a => a.jobId === jobId && a.candidateId === candidateId);
    if (existingApp) {
      return { success: false, error: 'Candidate is already in the pipeline for this job.' };
    }

    const job = jobs.find(j => j.id === jobId);
    if (!job) return { success: false, error: 'Job not found.' };
    
    const candidate = candidates.find(c => c.id === candidateId);

    const run = matchRuns.find(r => r.jobId === jobId);
    const match = run?.matches.find(m => m.candidateId === candidateId);

    // Canonical source logic:
    // If source parameter is provided, normalize it.
    // Otherwise default to 'AI Match'.
    const canonicalSource: CandidateJobSource = source 
      ? normalizeSource(source)
      : 'AI Match';

    const newApp: Application = {
      id: `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      candidateId,
      jobId,
      projectId: job.projectId,
      currentStage: 'Sourced',
      appliedDate: new Date().toISOString(),
      source: canonicalSource,
      associationOrigin,
      assignedRecruiterId: currentUser?.id || job.assignedRecruiterId,
      matchScore: match?.score,
      matchStrengths: match?.matchStrengths,
      matchGaps: match?.missingRequirements,
      lastActivity: new Date().toISOString()
    };

    persistApplications([newApp, ...applications]);
    return { success: true, applicationId: newApp.id };
  };



  return (
    <AppContext.Provider
      value={{
        currentUser,
        jobs,
        candidates,
        applications,
        projects,
        clients,
        interviews,
        offers,
        onboardings,
        updateOnboarding,
        placements,
        matchRuns,
        informationRequests,
        clientReviewBatches,
        quickViewProjectId,
        setQuickViewProjectId,
        quickViewClientId,
        setQuickViewClientId,
        quickViewJobId,
        setQuickViewJobId,
        quickViewCandidateId,
        setQuickViewCandidateId,
        login,
        logout,
        createClient,
        updateClient,
        deleteClient,
        deleteProject,
        createProject,
        createCandidate,
        updateCandidate,
        deleteCandidate,
        createJob,
        updateJob,
        updateJobHiringModel,
        startJoiningTracking,
        confirmJoined,
        recordDidNotJoin,
        updatePlacementBillingStatus,
        submitApplication,
        updateApplicationStage,
        updateApplicationScreening,
        createClientReviewBatch,
        submitClientReviewFeedback,
        markClientReviewBatchViewed,
        createInformationRequest,
        recordInformationResponse,
        updateInformationRequestStatus,
        resolveInformationRequest,
        cancelInformationRequest,
        updateProjectStatus,
        updateProject,
        submitInterviewFeedback,
        submitIndividualFeedback,
        confirmRecruiterOutcome,
        sendFeedbackReminder,
        scheduleInterview,
        rescheduleInterview,
        cancelInterview,
        updateInterviewStatus,
        markInterviewNoShow,
        createOffer,
        createRevisedOffer,
        startNegotiation,
        updateOffer,
        submitOfferForApproval,
        approveOffer,
        issueOffer,
        recordOfferResponse,
        updateOfferStatus,
        extendOfferExpiry,
        startOnboardingFromOffer,
        runJobMatching,
        dismissMatch,
        addMatchToPipeline,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppContextProvider');
  }
  return context;
};
