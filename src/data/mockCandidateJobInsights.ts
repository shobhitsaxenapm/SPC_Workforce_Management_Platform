export interface CandidateJobMatchInsight {
  candidateId: string;
  jobId: string;
  matchScore: number;
  strengths: string[];
  missingCriteria: string[];
  explanation: string;
  lastEvaluatedDate: string;
}

const mockMatchInsights: CandidateJobMatchInsight[] = [
  {
    candidateId: 'can2', // Aman Verma
    jobId: 'j3', // Warehouse Associate
    matchScore: 88,
    strengths: [
      'Relevant logistics experience',
      'Inventory Management',
      'Barcoding',
      'Dispatch experience',
      'Gurugram location',
      'Immediate availability'
    ],
    missingCriteria: [],
    explanation: 'Aman is a strong match for this Warehouse role due to his direct experience in logistics, specifically with inventory management and barcoding. His immediate availability and location make him highly suitable.',
    lastEvaluatedDate: '2026-07-01T10:00:00Z'
  },
  {
    candidateId: 'can2',
    jobId: 'j2', // Data Entry Operator (Noida) - We make this >= 70 so it appears as a matching job
    matchScore: 75,
    strengths: [
      'Inventory-record handling',
      'Barcoding and data accuracy exposure',
      'Immediate availability'
    ],
    missingCriteria: [
      'Typing speed not verified',
      'Noida location (Candidate is in Gurugram, requires confirmation)'
    ],
    explanation: 'Aman has adjacent data-handling experience from his warehouse roles. While he lacks formal data-entry speed verification and is located in Gurugram, his accuracy and immediate availability make him a solid candidate if he is willing to travel or relocate.',
    lastEvaluatedDate: '2026-07-02T10:00:00Z'
  },
  {
    candidateId: 'can2',
    jobId: 'j1', // Data Entry Operator (Delhi) - Score < 70
    matchScore: 61,
    strengths: [
      'Inventory-record handling',
      'Immediate availability'
    ],
    missingCriteria: [
      'Typing speed not verified',
      'Direct data-entry experience is limited',
      'Delhi location (requires confirmation)'
    ],
    explanation: 'Aman meets basic criteria but requires verification on core data entry skills and location compatibility before proceeding.',
    lastEvaluatedDate: '2026-07-02T10:30:00Z'
  },
  {
    candidateId: 'can2',
    jobId: 'j4', // Patient Support Executive (Delhi)
    matchScore: 42,
    strengths: [
      'Basic communication (Hindi)',
      'Immediate availability'
    ],
    missingCriteria: [
      'No BPO or customer service experience',
      'No healthcare knowledge',
      'Location mismatch (Delhi vs Gurugram)'
    ],
    explanation: 'Aman does not have the required customer service background for this role. Significant training would be required.',
    lastEvaluatedDate: '2026-07-03T09:00:00Z'
  }
];

export const getMatchesForJob = (jobId: string): CandidateJobMatchInsight[] => {
  return mockMatchInsights.filter(insight => insight.jobId === jobId);
};

export const getMatchingJobsForCandidate = (candidateId: string): CandidateJobMatchInsight[] => {
  return mockMatchInsights.filter(insight => insight.candidateId === candidateId);
};
