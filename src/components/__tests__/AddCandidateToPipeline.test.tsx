import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AddCandidateToJobModal from '../AddCandidateToJobModal';
import { Application, Candidate, Job } from '../../types';

const mockAddMatchToPipeline = vi.fn().mockReturnValue({ success: true, applicationId: 'app_123' });

const mockCandidates: Candidate[] = [
  {
    id: 'can_shobhit',
    code: 'CAN-0001',
    fullName: 'Shobhit Saxena',
    email: 'shobhitsaxena0320@gmail.com',
    phone: '+91 70177 64335',
    currentLocation: 'Bangalore',
    currentRole: 'AI Product Manager',
    currentCompany: 'Irame.ai',
    totalExperience: '4+ Years',
    skills: ['Generative AI', 'Product Strategy', 'LLM Applications'],
    education: 'M.Sc IT',
    currentSalary: '₹25 LPA',
    expectedSalary: '₹35 LPA',
    noticePeriod: '15 Days',
    source: 'Manual Upload',
    duplicateStatus: 'None',
    createdAt: '2026-07-01T00:00:00Z',
    professionalSummary: 'AI Product Manager building multi-agent systems.',
    employmentHistory: [],
    languages: ['English', 'Hindi'],
    availableFrom: '2026-08-01T00:00:00Z',
    preferredLocation: 'Bangalore'
  },
  {
    id: 'can_jatin',
    code: 'CAN-0004',
    fullName: 'Jatin Singh',
    email: 'jatin.s@email.com',
    phone: '+91 98444 55667',
    currentLocation: 'Delhi',
    currentRole: 'Warehouse Supervisor',
    currentCompany: 'Global Warehousing',
    totalExperience: '4 Years',
    skills: ['Logistics', 'Team Management'],
    education: 'B.B.A',
    currentSalary: '₹3.5 LPA',
    expectedSalary: '₹4.5 LPA',
    noticePeriod: '15 Days',
    source: 'Bulk Upload',
    duplicateStatus: 'None',
    createdAt: '2026-07-01T00:00:00Z',
    professionalSummary: 'Warehouse supervisor',
    employmentHistory: [],
    languages: ['English', 'Hindi'],
    availableFrom: '2026-08-01T00:00:00Z',
    preferredLocation: 'Delhi'
  }
];

const mockJobs: Job[] = [
  {
    id: 'job_test_1',
    code: 'JOB-26-738',
    title: 'Senior AI Product Manager',
    clientId: 'client_1',
    projectId: 'req_1',
    projectName: 'SPC Core Tech',
    location: 'Bangalore',
    engagementType: 'Direct Recruitment',
    employmentType: 'Full-time',
    openings: 2,
    filled: 0,
    status: 'Open',
    experienceRange: '4+ Years',
    requiredSkills: ['Generative AI', 'Product Strategy'],
    preferredSkills: ['LLM Applications'],
    summary: 'AI PM role',
    responsibilities: [],
    qualifications: [],
    targetJoiningDate: '2026-08-01',
    applicationDeadline: '2026-07-31',
    assignedRecruiterId: 'u1',
    visibility: 'Public',
    isPublished: true,
    hiringModel: 'Client Hire'
  }
];

const mockApplications: Application[] = [];

vi.mock('../../context/AppContext', () => ({
  useApp: () => ({
    addMatchToPipeline: mockAddMatchToPipeline,
    jobs: mockJobs,
    candidates: mockCandidates,
    applications: mockApplications,
    createCandidate: vi.fn(),
    updateCandidate: vi.fn(),
  })
}));

describe('AddCandidateToJobModal Pipeline Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal with options to upload resume or select from candidate pool', () => {
    render(
      <AddCandidateToJobModal
        jobId="job_test_1"
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Add Candidate to Pipeline')).toBeInTheDocument();
    expect(screen.getByText(/Candidates will enter the/i)).toBeInTheDocument();
    expect(screen.getByText('Sourced')).toBeInTheDocument();
    expect(screen.getByText('Upload & Parse Resume')).toBeInTheDocument();
    expect(screen.getByText('Select from Candidate Pool')).toBeInTheDocument();
  });

  it('allows switching to Candidate Pool tab and adding an existing candidate to Sourced stage', () => {
    const mockOnSuccess = vi.fn();
    const mockOnClose = vi.fn();

    render(
      <AddCandidateToJobModal
        jobId="job_test_1"
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // Switch to Candidate Pool
    const poolTab = screen.getByText('Select from Candidate Pool');
    fireEvent.click(poolTab);

    // Verify candidate items
    expect(screen.getByText('Shobhit Saxena')).toBeInTheDocument();
    expect(screen.getByText('Jatin Singh')).toBeInTheDocument();

    // Click Add to Sourced for Shobhit Saxena
    const addButtons = screen.getAllByText('Add to Sourced');
    expect(addButtons.length).toBe(2);
    fireEvent.click(addButtons[0]);

    // Verify addMatchToPipeline was called with jobId and candidateId
    expect(mockAddMatchToPipeline).toHaveBeenCalledWith(
      'job_test_1',
      'can_shobhit',
      'Added by Recruiter from Talent Pool',
      'Recruiter Added'
    );
    expect(mockOnSuccess).toHaveBeenCalledWith(
      expect.stringContaining('Shobhit Saxena successfully added to the Sourced stage')
    );
    expect(mockOnClose).toHaveBeenCalled();
  });
});
