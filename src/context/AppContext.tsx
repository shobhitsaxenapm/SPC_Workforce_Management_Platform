import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Job, Candidate, Application, ClientRequirement, Client, ApplicationStage, Priority, RequirementStatus } from '../types';
import { mockUsers, mockJobs, mockCandidates, mockApplications, mockRequirements, mockClients } from '../data/mockData';

interface AppContextType {
  currentUser: User | null;
  jobs: Job[];
  candidates: Candidate[];
  applications: Application[];
  requirements: ClientRequirement[];
  clients: Client[];
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
    if (localStorage.getItem('spc_candidates') === null) {
      localStorage.setItem('spc_candidates', JSON.stringify(mockCandidates));
    }
    return safeParse<Candidate[]>('spc_candidates', mockCandidates);
  });

  const [applications, setApplications] = useState<Application[]>(() => {
    if (localStorage.getItem('spc_applications') === null) {
      localStorage.setItem('spc_applications', JSON.stringify(mockApplications));
    }
    return safeParse<Application[]>('spc_applications', mockApplications);
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

  return (
    <AppContext.Provider
      value={{
        currentUser,
        jobs,
        candidates,
        applications,
        requirements,
        clients,
        login,
        logout,
        createClient,
        createRequirement,
        createCandidate,
        createJob,
        submitApplication,
        updateApplicationStage,
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
