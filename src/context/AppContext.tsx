import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Job, Candidate, Application, ClientRequirement, Client, ApplicationStage, Priority, RequirementLifecycleStatus, JobStatus, JobMatch, Interview, InterviewStatus, Offer, OfferStatus, Onboarding, OnboardingStatus, JobMatchRun } from '../types';
import { mockUsers, mockJobs, mockCandidates, mockApplications, mockRequirements, mockClients, mockInterviews, mockOffers, mockOnboardings } from '../data/mockData';
import { mockWarehouseCandidates, mockWarehouseMatches, getMockWarehouseMatchRun } from '../data/mockCandidateMatches';
import { calculateMatch } from '../lib/matchingEngine';

interface AppContextType {
  currentUser: User | null;
  jobs: Job[];
  candidates: Candidate[];
  applications: Application[];
  requirements: ClientRequirement[];
  clients: Client[];
  interviews: Interview[];
  offers: Offer[];
  onboardings: Onboarding[];
  matchRuns: JobMatchRun[];
  quickViewRequirementId: string | null;
  setQuickViewRequirementId: (id: string | null) => void;
  login: (email: string) => { success: boolean; error?: string };
  logout: () => void;
  createClient: (clientData: Pick<Client, 'name' | 'industry' | 'industryOtherText' | 'primaryContactName' | 'primaryContactEmail' | 'primaryContactPhone' | 'locations'>) => { success: boolean; error?: string };
  updateClient: (clientId: string, clientData: Partial<Pick<Client, 'name' | 'industry' | 'industryOtherText' | 'primaryContactName' | 'primaryContactEmail' | 'primaryContactPhone' | 'locations'>>) => { success: boolean; error?: string };
  deleteClient: (clientId: string) => void;
  deleteRequirement: (reqId: string) => void;
  createRequirement: (reqData: Omit<ClientRequirement, 'id' | 'code' | 'positionsFilled' | 'lifecycleStatus' | 'version' | 'revisions' | 'createdAt' | 'updatedAt'>) => void;
  createCandidate: (candidateData: Omit<Candidate, 'id' | 'code' | 'duplicateStatus'>) => { success: boolean; error?: string };
  updateCandidate: (candidateId: string, updates: Partial<Candidate>) => void;
  createJob: (jobData: Omit<Job, 'id' | 'code' | 'filled'>, requirementId?: string) => void;
  updateJob: (jobId: string, updates: Partial<Job>) => void;
  updateJobStatus: (jobId: string, status: JobStatus) => void;
  submitApplication: (
    candidateData: Omit<Candidate, 'id' | 'code' | 'duplicateStatus' | 'source'>,
    jobId: string
  ) => { success: boolean; error?: string };
  updateApplicationStage: (appId: string, stage: ApplicationStage) => void;
  updateRequirementLifecycle: (reqId: string, status: RequirementLifecycleStatus, reason?: string) => { success: boolean; error?: string };
  updateRequirement: (reqId: string, updates: Partial<ClientRequirement>, reason?: string, impactSnapshot?: any) => { success: boolean; error?: string };
  submitInterviewFeedback: (interviewId: string, feedbackData: Partial<Interview>) => void;
  scheduleInterview: (interviewDetails: Omit<Interview, 'id' | 'status' | 'feedbackStatus'>) => { success: boolean; error?: string };
  rescheduleInterview: (interviewId: string, updatedSchedule: Partial<Interview>) => void;
  cancelInterview: (interviewId: string, reason: string) => void;
  updateInterviewStatus: (interviewId: string, status: InterviewStatus) => void;
  updateOfferStatus: (offerId: string, status: OfferStatus, metadata?: Partial<Offer>) => void;
  extendOfferExpiry: (offerId: string, newExpiryDate: string) => void;
  startOnboardingFromOffer: (offerId: string) => { success: boolean; error?: string };
  runJobMatching: (jobId: string) => void;
  dismissMatch: (jobId: string, candidateId: string) => void;
  addMatchToPipeline: (jobId: string, candidateId: string) => { success: boolean; error?: string };
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

  const [quickViewRequirementId, setQuickViewRequirementId] = useState<string | null>(null);

  // Safe seeding logic: check if key is absent (null), otherwise parse
  const [clients, setClients] = useState<Client[]>(() => {
    if (localStorage.getItem('spc_clients') === null) {
      localStorage.setItem('spc_clients', JSON.stringify(mockClients));
    }
    const storedClients = safeParse<Client[]>('spc_clients', mockClients);
    
    // Migrate to requirement-driven status
    const initialReqs = safeParse<ClientRequirement[]>('spc_requirements', mockRequirements);
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

  const [requirements, setRequirements] = useState<ClientRequirement[]>(() => {
    let reqs: any[] = [];
    if (localStorage.getItem('spc_requirements') === null) {
      reqs = mockRequirements;
      localStorage.setItem('spc_requirements', JSON.stringify(mockRequirements));
    } else {
      reqs = safeParse<any[]>('spc_requirements', mockRequirements);
    }

    let changed = false;
    const migratedReqs = reqs.map(r => {
      if ('status' in r) {
        changed = true;
        const legacyStatus = r.status as string;
        let lifecycleStatus = 'Open';
        
        if (legacyStatus === 'Draft') lifecycleStatus = 'Draft';
        else if (legacyStatus === 'On Hold') lifecycleStatus = 'On Hold';
        else if (legacyStatus === 'Closed') lifecycleStatus = 'Closed';
        else if (legacyStatus === 'Cancelled') lifecycleStatus = 'Cancelled';
        
        delete r.status;
        r.lifecycleStatus = lifecycleStatus;
        r.version = 1;
        r.revisions = [];
      }
      return r as ClientRequirement;
    });

    if (changed) {
      localStorage.setItem('spc_requirements', JSON.stringify(migratedReqs));
    }
    return migratedReqs;
  });

  const [jobs, setJobs] = useState<Job[]>(() => {
    if (localStorage.getItem('spc_jobs') === null) {
      localStorage.setItem('spc_jobs', JSON.stringify(mockJobs));
    }
    return safeParse<Job[]>('spc_jobs', mockJobs);
  });

  const [candidates, setCandidates] = useState<Candidate[]>(() => {
    let base = safeParse<Candidate[]>('spc_candidates', mockCandidates);
    const pipelineSeeds: Candidate[] = [
      { id: 'can_seed_1', code: 'CAN-9001', fullName: 'Rohan Mehta', email: 'rohan.mehta@email.com', phone: '+91 98333 44556', currentLocation: 'Delhi', totalExperience: '1 Year', currentCompany: 'Apex Digitizing', currentRole: 'Data Typist', skills: ['Typing Speed > 40 WPM', 'Excel'], education: 'B.A, Delhi University', currentSalary: '₹2.0 LPA', expectedSalary: '₹2.6 LPA', noticePeriod: 'Immediate', source: 'SPC Careers Website', duplicateStatus: 'None', createdAt: '2026-07-08T10:00:00Z' },
      { id: 'can_seed_2', code: 'CAN-9002', fullName: 'Vikram Malhotra', email: 'vikram.m@email.com', phone: '+91 98444 55667', currentLocation: 'Noida', totalExperience: '2 Years', currentCompany: 'Info Services', currentRole: 'Office Assistant', skills: ['Data Entry', 'Excel'], education: 'B.Sc, Noida University', currentSalary: '₹2.2 LPA', expectedSalary: '₹2.8 LPA', noticePeriod: '15 Days', source: 'Referral', duplicateStatus: 'None', createdAt: '2026-07-09T11:00:00Z' },
      { id: 'can_seed_3', code: 'CAN-9003', fullName: 'Siddharth Sen', email: 'siddharth.sen@email.com', phone: '+91 98555 66778', currentLocation: 'Delhi', totalExperience: 'Fresher', currentCompany: 'N/A', currentRole: 'Graduate', skills: ['Excel', 'Data Typing'], education: 'B.Com, Delhi University', currentSalary: '0', expectedSalary: '₹2.4 LPA', noticePeriod: 'Immediate', source: 'SPC Careers Website', duplicateStatus: 'None', createdAt: '2026-07-10T12:00:00Z' },
      { id: 'can_seed_4', code: 'CAN-9004', fullName: 'Neha Kapoor', email: 'neha.k@email.com', phone: '+91 98666 77889', currentLocation: 'Delhi', totalExperience: '1.5 Years', currentCompany: 'Alpha Med', currentRole: 'Data Entry Operator', skills: ['Typing Speed > 40 WPM', 'Excel', 'Data Validation'], education: '12th Pass', currentSalary: '₹2.1 LPA', expectedSalary: '₹2.5 LPA', noticePeriod: 'Immediate', source: 'SPC Careers Website', duplicateStatus: 'None', createdAt: '2026-07-11T13:00:00Z' },
      { id: 'can_seed_5', code: 'CAN-9005', fullName: 'Aditya Joshi', email: 'aditya.j@email.com', phone: '+91 98777 88990', currentLocation: 'Gurugram', totalExperience: '3 Years', currentCompany: 'Swift Logistics', currentRole: 'Senior Clerk', skills: ['Data Validation', 'Excel'], education: 'Graduate', currentSalary: '₹2.8 LPA', expectedSalary: '₹3.4 LPA', noticePeriod: '30 Days', source: 'Job Portal', duplicateStatus: 'None', createdAt: '2026-07-11T14:00:00Z' },
      { id: 'can_seed_6', code: 'CAN-9006', fullName: 'Karan Malhotra', email: 'karan.m@email.com', phone: '+91 98888 99001', currentLocation: 'Delhi', totalExperience: '2.5 Years', currentCompany: 'Zeta MedTech', currentRole: 'Data Executive', skills: ['Typing Speed > 40 WPM', 'Data Validation'], education: 'B.A, Delhi University', currentSalary: '₹2.4 LPA', expectedSalary: '₹3.0 LPA', noticePeriod: '15 Days', source: 'SPC Careers Website', duplicateStatus: 'None', createdAt: '2026-07-12T09:00:00Z' },
      { id: 'can_seed_7', code: 'CAN-9007', fullName: 'Pooja Hegde', email: 'pooja.h@email.com', phone: '+91 98999 00112', currentLocation: 'Noida', totalExperience: '2 Years', currentCompany: 'DataSoft', currentRole: 'Data Operator', skills: ['Excel', 'Typing Speed > 40 WPM'], education: 'B.Sc, Noida University', currentSalary: '₹2.2 LPA', expectedSalary: '₹2.7 LPA', noticePeriod: 'Immediate', source: 'Referral', duplicateStatus: 'None', createdAt: '2026-07-12T10:00:00Z' }
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
        base.push(seed);
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
    const appSeeds: Application[] = [
      { id: 'app_seed_1', candidateId: 'can_seed_1', jobId: 'j1', requirementId: 'r1', currentStage: 'Sourced', appliedDate: '2026-07-08T10:15:00Z', source: 'SPC Careers Website', assignedRecruiterId: 'u3', matchScore: 85, matchStrengths: ['Good typing speed', 'Excel knowledge'], matchGaps: [], lastActivity: '2026-07-08T10:15:00Z' },
      { id: 'app_seed_2', candidateId: 'can_seed_2', jobId: 'j1', requirementId: 'r1', currentStage: 'Applied', appliedDate: '2026-07-09T11:30:00Z', source: 'Referral', assignedRecruiterId: 'u3', matchScore: 78, matchStrengths: ['2 years experience'], matchGaps: [], lastActivity: '2026-07-09T11:30:00Z' },
      { id: 'app_seed_3', candidateId: 'can_seed_3', jobId: 'j1', requirementId: 'r1', currentStage: 'Applied', appliedDate: '2026-07-10T12:15:00Z', source: 'SPC Careers Website', assignedRecruiterId: 'u3', matchScore: 72, matchStrengths: ['Immediate availability'], matchGaps: [], lastActivity: '2026-07-10T12:15:00Z' },
      { id: 'app_seed_4', candidateId: 'can_seed_4', jobId: 'j1', requirementId: 'r1', currentStage: 'Screening', appliedDate: '2026-07-11T13:45:00Z', source: 'SPC Careers Website', assignedRecruiterId: 'u3', matchScore: 90, matchStrengths: ['Direct experience matching requirements'], matchGaps: [], lastActivity: '2026-07-11T13:45:00Z' },
      { id: 'app_seed_5', candidateId: 'can_seed_5', jobId: 'j1', requirementId: 'r1', currentStage: 'Screening', appliedDate: '2026-07-11T14:30:00Z', source: 'Job Portal', assignedRecruiterId: 'u3', matchScore: 82, matchStrengths: ['Strong Excel and verification experience'], matchGaps: [], lastActivity: '2026-07-11T14:30:00Z' },
      { id: 'app_seed_6', candidateId: 'can_seed_6', jobId: 'j1', requirementId: 'r1', currentStage: 'Interview Round 1', appliedDate: '2026-07-12T09:15:00Z', source: 'SPC Careers Website', assignedRecruiterId: 'u3', matchScore: 94, matchStrengths: ['Over 2 years experience', 'Fast typing speed'], matchGaps: [], lastActivity: '2026-07-12T09:15:00Z' },
      { id: 'app_seed_7', candidateId: 'can_seed_7', jobId: 'j1', requirementId: 'r1', currentStage: 'Interview Round 1', appliedDate: '2026-07-12T10:30:00Z', source: 'Referral', assignedRecruiterId: 'u3', matchScore: 89, matchStrengths: ['Immediate joiner', 'Strong background'], matchGaps: [], lastActivity: '2026-07-12T10:30:00Z' }
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
    return safeParse<Interview[]>('spc_interviews', mockInterviews);
  });

  const [offers, setOffers] = useState<Offer[]>(() => {
    if (localStorage.getItem('spc_offers') === null) {
      localStorage.setItem('spc_offers', JSON.stringify(mockOffers));
    }
    return safeParse<Offer[]>('spc_offers', mockOffers);
  });

  const [onboardings, setOnboardings] = useState<Onboarding[]>(() => {
    if (localStorage.getItem('spc_onboardings') === null) {
      localStorage.setItem('spc_onboardings', JSON.stringify(mockOnboardings));
    }
    return safeParse<Onboarding[]>('spc_onboardings', mockOnboardings);
  });

  const [matchRuns, setMatchRuns] = useState<JobMatchRun[]>(() => {
    const runs = safeParse<JobMatchRun[]>('spc_match_runs', []);
    if (!runs.some(r => r.jobId === 'j3')) {
      const mockRun = getMockWarehouseMatchRun(new Date().toISOString());
      runs.push(mockRun);
      localStorage.setItem('spc_match_runs', JSON.stringify(runs));
    }
    return runs;
  });

  // Sync session changes
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('spc_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('spc_user');
    }
  }, [currentUser]);

  // Sync data updates to localStorage
  const persistClients = (newClients: Client[]) => {
    setClients(newClients);
    localStorage.setItem('spc_clients', JSON.stringify(newClients));
  };

  const persistRequirements = (newReqs: ClientRequirement[]) => {
    setRequirements(newReqs);
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

  const persistOnboardings = (newOnboardings: Onboarding[]) => {
    setOnboardings(newOnboardings);
    localStorage.setItem('spc_onboardings', JSON.stringify(newOnboardings));
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
      activeRequirementsCount: 0,
      openPositionsCount: 0,
      lastActivity: new Date().toISOString()
    };
    persistClients([newClient, ...clients]);
    return { success: true };
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

  const deleteRequirement = (reqId: string) => {
    const updatedReqs = requirements.filter(r => r.id !== reqId);
    persistRequirements(updatedReqs);
  };

  type CreateReqData = Omit<ClientRequirement, 'id' | 'code' | 'positionsFilled' | 'lifecycleStatus' | 'version' | 'revisions' | 'createdAt' | 'updatedAt'> & { lifecycleStatus?: RequirementLifecycleStatus };

  const createRequirement = (reqData: CreateReqData | CreateReqData[]) => {
    const dataArray = Array.isArray(reqData) ? reqData : [reqData];
    const now = new Date().toISOString();
    
    const newReqs: ClientRequirement[] = dataArray.map(data => ({
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
          activeRequirementsCount: updatedClients[clientIndex].activeRequirementsCount + 1,
          openPositionsCount: updatedClients[clientIndex].openPositionsCount + req.positionsRequired
        };
      }
    });

    persistClients(updatedClients);
    persistRequirements([...newReqs, ...requirements]);
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
    return { success: true };
  };

  const updateCandidate = (candidateId: string, updates: Partial<Candidate>) => {
    const updatedCandidates = candidates.map(c => {
      if (c.id === candidateId) {
        return { ...c, ...updates };
      }
      return c;
    });
    persistCandidates(updatedCandidates);
  };

  const createJob = (jobData: Omit<Job, 'id' | 'code' | 'filled'>, requirementId?: string) => {
    const jobId = 'j_' + Math.random().toString(36).substr(2, 9);
    const jobCode = 'JOB-26-' + Math.floor(100 + Math.random() * 900);
    
    let clientId = jobData.clientId;
    let projectName = jobData.projectName;
    
    if (requirementId && requirementId !== 'none') {
      const req = requirements.find(r => r.id === requirementId);
      if (req) {
        clientId = req.clientId;
        projectName = req.projectName;
      }
    }

    const newJob: Job = {
      ...jobData,
      id: jobId,
      code: jobCode,
      requirementId: requirementId || 'none',
      clientId,
      projectName,
      filled: 0,
      status: jobData.status || 'Draft',
    };

    const newJobs: Job[] = [newJob, ...jobs];
    persistJobs(newJobs);
  };

  const updateJobStatus = (jobId: string, status: JobStatus) => {
    const updatedJobs = jobs.map(j => {
      if (j.id === jobId) {
        return { 
          ...j, 
          status, 
          publishedAt: status === 'Published' && j.status !== 'Published' ? new Date().toISOString() : j.publishedAt 
        };
      }
      return j;
    });
    persistJobs(updatedJobs);
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

  const submitApplication = (
    candidateData: Omit<Candidate, 'id' | 'code' | 'duplicateStatus' | 'source'>,
    jobId: string
  ) => {
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
      finalCandidate = existingCandidate;
    } else {
      const candidateId = 'can_' + Math.random().toString(36).substr(2, 9);
      const candidateCode = 'CAN-26-' + Math.floor(100 + Math.random() * 900);
      finalCandidate = {
        ...candidateData,
        id: candidateId,
        code: candidateCode,
        duplicateStatus: 'None',
        source: 'Careers Portal',
      };
      persistCandidates([finalCandidate, ...candidates]);
    }

    const applicationId = 'app_' + Math.random().toString(36).substr(2, 9);
    const targetJob = jobs.find(j => j.id === jobId);
    const newApplication: Application = {
      id: applicationId,
      candidateId: finalCandidate.id,
      jobId: jobId,
      requirementId: targetJob ? targetJob.requirementId : 'none',
      currentStage: 'Applied',
      appliedDate: new Date().toISOString(),
      source: 'Careers Portal',
      assignedRecruiterId: targetJob ? targetJob.assignedRecruiterId : 'u3',
      matchScore: 85, // Default mock score
      lastActivity: new Date().toISOString(),
    };

    persistApplications([newApplication, ...applications]);
    return { success: true };
  };

  const updateApplicationStage = (appId: string, stage: ApplicationStage) => {
    const updated = applications.map(a => {
      if (a.id === appId) {
        return { ...a, currentStage: stage, lastActivity: new Date().toISOString() };
      }
      return a;
    });
    persistApplications(updated);
  };

  const updateRequirementLifecycle = (reqId: string, status: RequirementLifecycleStatus, reason?: string) => {
    const req = requirements.find(r => r.id === reqId);
    if (!req) return { success: false, error: 'Requirement not found' };

    const updated = requirements.map(r => {
      if (r.id === reqId) {
        const rev = {
          id: 'rev_' + Math.random().toString(36).substr(2, 9),
          requirementId: r.id,
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
    persistRequirements(updated);
    return { success: true };
  };

  const updateRequirement = (reqId: string, updates: Partial<ClientRequirement>, reason?: string, impactSnapshot?: any) => {
    const req = requirements.find(r => r.id === reqId);
    if (!req) return { success: false, error: 'Requirement not found' };
    
    if (updates.version && updates.version !== req.version) {
      return { success: false, error: 'Conflict: Requirement was updated by another user. Please reload and try again.' };
    }

    const changedFields = Object.keys(updates).filter(k => k !== 'version' && k !== 'revisions' && k !== 'updatedAt');
    const isMaterial = reason && changedFields.length > 0;

    const updated = requirements.map(r => {
      if (r.id === reqId) {
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
            requirementId: r.id,
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
    persistRequirements(updated);
    return { success: true };
  };

  const submitInterviewFeedback = (interviewId: string, feedbackData: Partial<Interview>) => {
    const updated = interviews.map(i => {
      if (i.id === interviewId) {
        return { 
          ...i, 
          ...feedbackData, 
          feedbackStatus: 'Submitted' as const,
          status: 'Completed' as const
        };
      }
      return i;
    });
    persistInterviews(updated);
  };

  const rescheduleInterview = (interviewId: string, updatedSchedule: Partial<Interview>) => {
    const updated = interviews.map(i => {
      if (i.id === interviewId) {
        return { 
          ...i, 
          ...updatedSchedule, 
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

  const scheduleInterview = (interviewDetails: Omit<Interview, 'id' | 'status' | 'feedbackStatus'>) => {
    const existing = interviews.find(
      i => i.applicationId === interviewDetails.applicationId && 
           i.interviewType === interviewDetails.interviewType && 
           i.status === 'Scheduled'
    );
    if (existing) {
      return { success: false, error: 'An active interview of this type is already scheduled for this application.' };
    }

    const newInterview: Interview = {
      ...interviewDetails,
      id: `iv${Date.now()}`,
      status: 'Scheduled',
      feedbackStatus: 'Not Started',
    };

    persistInterviews([...interviews, newInterview]);
    
    // Automatically update the application stage to "Interview Scheduled"
    if (newInterview.applicationId) {
      updateApplicationStage(newInterview.applicationId, 'Interview Scheduled');
    }

    return { success: true };
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
        } else if (status === 'Rejected' || status === 'Declined') {
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
    const requirementId = job ? job.requirementId : '';
    const recruiterId = job ? job.assignedRecruiterId : 'u3';

    const newOnboarding: Onboarding = {
      id: `onb_${Date.now()}`,
      candidateId: targetOffer.candidateId,
      offerId: targetOffer.id,
      clientId: targetOffer.clientId,
      requirementId: requirementId,
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

    if (jobId === 'j3') {
      matches = [...mockWarehouseMatches];
    } else {
      // Filter eligible candidates
      const eligibleCandidates = candidates.filter(c => c.duplicateStatus !== 'Confirmed Duplicate');
      
      matches = eligibleCandidates.map(c => calculateMatch(job, c))
        .filter(m => m.score >= 70)
        .sort((a, b) => b.score - a.score);
    }

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

  const addMatchToPipeline = (jobId: string, candidateId: string) => {
    // Check if already applied
    const existingApp = applications.find(a => a.jobId === jobId && a.candidateId === candidateId);
    if (existingApp) {
      return { success: false, error: 'Candidate is already in the pipeline for this job.' };
    }

    const job = jobs.find(j => j.id === jobId);
    if (!job) return { success: false, error: 'Job not found.' };

    const run = matchRuns.find(r => r.jobId === jobId);
    const match = run?.matches.find(m => m.candidateId === candidateId);

    const newApp: Application = {
      id: `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      candidateId,
      jobId,
      requirementId: job.requirementId,
      currentStage: 'Sourced',
      appliedDate: new Date().toISOString(),
      source: 'Internal Match',
      assignedRecruiterId: currentUser?.id || job.assignedRecruiterId,
      matchScore: match?.score,
      matchStrengths: match?.matchStrengths,
      matchGaps: match?.missingRequirements,
      lastActivity: new Date().toISOString()
    };

    persistApplications([newApp, ...applications]);
    return { success: true };
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        jobs,
        candidates,
        applications,
        requirements,
        clients,
        interviews,
        offers,
        onboardings,
        matchRuns,
        quickViewRequirementId,
        setQuickViewRequirementId,
        login,
        logout,
        createClient,
        updateClient,
        deleteClient,
        deleteRequirement,
        createRequirement,
        createCandidate,
        updateCandidate,
        createJob,
        updateJob,
        updateJobStatus,
        submitApplication,
        updateApplicationStage,
        updateRequirementLifecycle,
        updateRequirement,
        submitInterviewFeedback,
        scheduleInterview,
        rescheduleInterview,
        cancelInterview,
        updateInterviewStatus,
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
