import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Job, Candidate, Application, ClientRequirement, Client, ApplicationStage, Priority, RequirementStatus, Interview, InterviewStatus } from '../types';
import { mockUsers, mockJobs, mockCandidates, mockApplications, mockRequirements, mockClients, mockInterviews } from '../data/mockData';

interface AppContextType {
  currentUser: User | null;
  jobs: Job[];
  candidates: Candidate[];
  applications: Application[];
  requirements: ClientRequirement[];
  clients: Client[];
  interviews: Interview[];
  login: (email: string) => { success: boolean; error?: string };
  logout: () => void;
  createClient: (clientData: Omit<Client, 'id'>) => { success: boolean; error?: string };
  createRequirement: (reqData: Omit<ClientRequirement, 'id' | 'code' | 'positionsFilled' | 'status' | 'createdAt' | 'updatedAt'>) => void;
  createCandidate: (candidateData: Omit<Candidate, 'id' | 'code' | 'duplicateStatus'>) => { success: boolean; error?: string };
  createJob: (jobData: Omit<Job, 'id' | 'code' | 'filled'>, requirementId?: string) => void;
  submitApplication: (
    candidateData: Omit<Candidate, 'id' | 'code' | 'duplicateStatus' | 'source'>,
    jobId: string
  ) => { success: boolean; error?: string };
  updateApplicationStage: (appId: string, stage: ApplicationStage) => void;
  updateRequirementStatus: (reqId: string, status: RequirementStatus) => void;
  updateRequirement: (reqId: string, updates: Partial<ClientRequirement>) => void;
  submitInterviewFeedback: (interviewId: string, feedbackData: Partial<Interview>) => void;
  rescheduleInterview: (interviewId: string, updatedSchedule: Partial<Interview>) => void;
  updateInterviewStatus: (interviewId: string, status: InterviewStatus) => void;
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
    return safeParse<User | null>('spc_user', null);
  });

  // Safe seeding logic: check if key is absent (null), otherwise parse
  const [clients, setClients] = useState<Client[]>(() => {
    if (localStorage.getItem('spc_clients') === null) {
      localStorage.setItem('spc_clients', JSON.stringify(mockClients));
    }
    return safeParse<Client[]>('spc_clients', mockClients);
  });

  const [requirements, setRequirements] = useState<ClientRequirement[]>(() => {
    if (localStorage.getItem('spc_requirements') === null) {
      localStorage.setItem('spc_requirements', JSON.stringify(mockRequirements));
    }
    return safeParse<ClientRequirement[]>('spc_requirements', mockRequirements);
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

  const createClient = (clientData: Omit<Client, 'id'>) => {
    const normName = clientData.name.trim().toLowerCase();
    const dup = clients.find(c => c.name.trim().toLowerCase() === normName);
    if (dup) {
      return { success: false, error: 'A client with this name already exists.' };
    }
    const newClient: Client = {
      ...clientData,
      id: 'cl_' + Math.random().toString(36).substr(2, 9),
    };
    persistClients([newClient, ...clients]);
    return { success: true };
  };

  const createRequirement = (reqData: Omit<ClientRequirement, 'id' | 'code' | 'positionsFilled' | 'status' | 'createdAt' | 'updatedAt'>) => {
    const reqId = 'req_' + Math.random().toString(36).substr(2, 9);
    const reqCode = 'REQ-26-' + Math.floor(100 + Math.random() * 900);
    const now = new Date().toISOString();
    const newReq: ClientRequirement = {
      ...reqData,
      id: reqId,
      code: reqCode,
      positionsFilled: 0,
      status: 'Open' as RequirementStatus,
      createdAt: now,
      updatedAt: now,
    };
    persistRequirements([newReq, ...requirements]);
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

    persistJobs([newJob, ...jobs]);
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

  const updateRequirementStatus = (reqId: string, status: RequirementStatus) => {
    const updated = requirements.map(r => {
      if (r.id === reqId) {
        return { ...r, status, updatedAt: new Date().toISOString() };
      }
      return r;
    });
    persistRequirements(updated);
  };

  const updateRequirement = (reqId: string, updates: Partial<ClientRequirement>) => {
    const updated = requirements.map(r => {
      if (r.id === reqId) {
        return { ...r, ...updates, updatedAt: new Date().toISOString() };
      }
      return r;
    });
    persistRequirements(updated);
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
    const updated = interviews.map(i => {
      if (i.id === interviewId) {
        return { ...i, status };
      }
      return i;
    });
    persistInterviews(updated);
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
        login,
        logout,
        createClient,
        createRequirement,
        createCandidate,
        createJob,
        submitApplication,
        updateApplicationStage,
        updateRequirementStatus,
        updateRequirement,
        submitInterviewFeedback,
        rescheduleInterview,
        updateInterviewStatus,
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
