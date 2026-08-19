import { Candidate, JobMatch, JobMatchRun } from '../types';

export const mockWarehouseCandidates: Candidate[] = [
  {
    id: 'candidate-001',
    code: 'CAN-001',
    fullName: 'Shobhit',
    email: 'shobhit@example.com',
    phone: '+91 90000 00001',
    currentLocation: 'Gurugram',
    totalExperience: '2.2 years',
    currentCompany: 'RapidKart Logistics',
    currentRole: 'Warehouse Associate',
    skills: ['Inventory Management', 'Loading and Unloading', 'Order Packing', 'Physical Fitness', 'Basic English'],
    education: '12th Pass',
    currentSalary: '₹15,000/month',
    expectedSalary: '₹18,000/month',
    noticePeriod: '0 days',
    source: 'Direct Application',
    duplicateStatus: 'None',
    createdAt: '2026-08-10T10:00:00Z', // Resume updated: 10 Aug 2026
  },
  {
    id: 'candidate-002',
    code: 'CAN-002',
    fullName: 'Sunil Kumar',
    email: 'sunil@example.com',
    phone: '+91 90000 00002',
    currentLocation: 'Delhi',
    totalExperience: '1.8 years',
    currentCompany: 'NorthRoute Fulfilment',
    currentRole: 'Picker and Packer',
    skills: ['Order Packing', 'Inventory Counting', 'Loading and Unloading', 'Physical Fitness'],
    education: '12th Pass',
    currentSalary: '₹14,000/month',
    expectedSalary: '₹16,000/month',
    noticePeriod: '7 days',
    source: 'Direct Application',
    duplicateStatus: 'None',
    createdAt: '2026-08-08T10:00:00Z', // Resume updated: 8 Aug 2026
  },
  {
    id: 'candidate-003',
    code: 'CAN-003',
    fullName: 'Pooja Sharma',
    email: 'pooja@example.com',
    phone: '+91 90000 00003',
    currentLocation: 'Gurugram',
    totalExperience: '1.4 years',
    currentCompany: 'MetroStock Services',
    currentRole: 'Inventory Assistant',
    skills: ['Inventory Management', 'Stock Verification', 'Barcode Scanning', 'Basic English'],
    education: '12th Pass',
    currentSalary: '₹14,500/month',
    expectedSalary: '₹17,000/month',
    noticePeriod: '0 days',
    source: 'Direct Application',
    duplicateStatus: 'None',
    createdAt: '2026-08-12T10:00:00Z', // Resume updated: 12 Aug 2026
  },
  {
    id: 'candidate-004',
    code: 'CAN-004',
    fullName: 'Imran Khan',
    email: 'imran@example.com',
    phone: '+91 90000 00004',
    currentLocation: 'Faridabad',
    totalExperience: '2.7 years',
    currentCompany: 'FastMove Distribution',
    currentRole: 'Warehouse Helper',
    skills: ['Loading and Unloading', 'Order Packing', 'Stock Handling', 'Basic English'],
    education: '10th Pass',
    currentSalary: '₹13,500/month',
    expectedSalary: '₹15,000/month',
    noticePeriod: '15 days',
    source: 'Direct Application',
    duplicateStatus: 'None',
    createdAt: '2026-07-30T10:00:00Z', // Resume updated: 30 Jul 2026
  },
  {
    id: 'candidate-005',
    code: 'CAN-005',
    fullName: 'Neha Verma',
    email: 'neha@example.com',
    phone: '+91 90000 00005',
    currentLocation: 'Manesar',
    totalExperience: '1.2 years',
    currentCompany: 'Axis Dispatch Solutions',
    currentRole: 'Dispatch Assistant',
    skills: ['Order Packing', 'Dispatch Documentation', 'Inventory Counting', 'Basic English'],
    education: '12th Pass',
    currentSalary: '₹14,000/month',
    expectedSalary: '₹16,000/month',
    noticePeriod: '7 days',
    source: 'Direct Application',
    duplicateStatus: 'None',
    createdAt: '2026-08-04T10:00:00Z', // Resume updated: 4 Aug 2026
  }
];

export const mockWarehouseMatches: JobMatch[] = [
  {
    candidateId: 'candidate-001',
    score: 91,
    breakdown: {
      skills: 31,
      experience: 20,
      location: 15,
      education: 10,
      availability: 10,
      employmentType: 5
    },
    missingRequirements: [],
    matchStrengths: ['Inventory Management', 'Physical Fitness', 'Basic English'],
    mismatchReasons: ['Strong match across required skills, Gurugram location, relevant experience and immediate availability.'],
    dismissed: false
  },
  {
    candidateId: 'candidate-002',
    score: 84,
    breakdown: {
      skills: 31,
      experience: 18,
      location: 10,
      education: 10,
      availability: 10,
      employmentType: 5
    },
    missingRequirements: ['Basic English not verified'],
    matchStrengths: ['Inventory Counting', 'Loading and Unloading', 'Physical Fitness'],
    mismatchReasons: ['Relevant warehouse experience and good availability. English proficiency should be verified during screening.'],
    dismissed: false
  },
  {
    candidateId: 'candidate-003',
    score: 79,
    breakdown: {
      skills: 24,
      experience: 15,
      location: 15,
      education: 10,
      availability: 10,
      employmentType: 5
    },
    missingRequirements: ['Physical fitness evidence unavailable'],
    matchStrengths: ['Inventory Management', 'Stock Verification', 'Basic English'],
    mismatchReasons: ['Strong inventory, location and availability match. Suitability for repetitive physical work should be confirmed.'],
    dismissed: false
  },
  {
    candidateId: 'candidate-004',
    score: 74,
    breakdown: {
      skills: 30,
      experience: 20,
      location: 8,
      education: 5,
      availability: 6,
      employmentType: 5
    },
    missingRequirements: ['Exact Inventory Management experience', 'Preferred qualification'],
    matchStrengths: ['Loading and Unloading', 'Order Packing', 'Basic English'],
    mismatchReasons: ['Good practical warehouse experience, but inventory-management depth and qualification require review.'],
    dismissed: false
  },
  {
    candidateId: 'candidate-005',
    score: 71,
    breakdown: {
      skills: 28,
      experience: 14,
      location: 10,
      education: 10,
      availability: 4,
      employmentType: 5
    },
    missingRequirements: ['Physical fitness evidence unavailable', 'Exact Gurugram location'],
    matchStrengths: ['Inventory Counting', 'Order Packing', 'Basic English'],
    mismatchReasons: ['Meets minimum experience and qualification requirements. Location and physical-work suitability need confirmation.'],
    dismissed: false
  }
];

export const getMockWarehouseMatchRun = (timestamp: string): JobMatchRun => ({
  id: 'run-j3-mock',
  jobId: 'j3',
  timestamp,
  engineVersion: '1.0',
  stale: false,
  matches: mockWarehouseMatches
});
