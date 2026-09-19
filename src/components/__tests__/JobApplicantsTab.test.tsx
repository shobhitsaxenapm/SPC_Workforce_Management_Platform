import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import JobApplicantsTab from '../JobApplicantsTab';
import { Application, Candidate } from '../../types';
import '@testing-library/jest-dom';

const mockUpdateStage = vi.fn();
vi.mock('../../context/AppContext', () => ({
  useApp: () => ({
    updateApplicationStage: mockUpdateStage,
    setQuickViewCandidateId: vi.fn()
  })
}));

const mockCandidates: Candidate[] = [
  {
    id: 'c1',
    code: 'C01',
    fullName: 'Alice Smith',
    email: 'alice@example.com',
    phone: '1234567890',
    currentLocation: 'New York',
    totalExperience: '3 Years',
    currentCompany: 'A',
    currentRole: 'Dev',
    skills: [],
    education: '',
    currentSalary: '',
    expectedSalary: '',
    noticePeriod: '',
    source: '',
    duplicateStatus: 'None'
  },
  {
    id: 'c2',
    code: 'C02',
    fullName: 'Bob Johnson',
    email: 'bob@example.com',
    phone: '0987654321',
    currentLocation: 'San Francisco',
    totalExperience: '5 Years',
    currentCompany: 'B',
    currentRole: 'Eng',
    skills: [],
    education: '',
    currentSalary: '',
    expectedSalary: '',
    noticePeriod: '',
    source: '',
    duplicateStatus: 'None'
  }
];

const mockApplications: Application[] = [
  {
    id: 'a1',
    candidateId: 'c1',
    jobId: 'j1',
    projectId: 'p1',
    currentStage: 'New',
    appliedDate: new Date().toISOString(), // Today
    source: 'web',
    assignedRecruiterId: 'r1',
    lastActivity: new Date().toISOString()
  },
  {
    id: 'a2',
    candidateId: 'c2',
    jobId: 'j1',
    projectId: 'p1',
    currentStage: 'Screening',
    appliedDate: '2026-07-01T12:00:00Z', // Past date
    source: 'web',
    assignedRecruiterId: 'r1',
    lastActivity: '2026-07-02T12:00:00Z'
  }
];

describe('JobApplicantsTab Filtering', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-13T12:00:00Z')); // Ensure consistent test time
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders correctly with all applicants initially', () => {
    render(<JobApplicantsTab jobId="j1" applications={mockApplications} candidates={mockCandidates} />);
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    expect(screen.getByText(/Showing 2 of 2 applicants/i)).toBeInTheDocument();
  });

  it('filters by search query (name)', async () => {
    render(<JobApplicantsTab jobId="j1" applications={mockApplications} candidates={mockCandidates} />);
    const searchInput = screen.getByPlaceholderText(/Search candidates/i);
    
    fireEvent.change(searchInput, { target: { value: 'Alice' } });
    
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument();
    expect(screen.getByText(/Showing 1 of 2 applicants/i)).toBeInTheDocument();
  });

  it('filters by multi-select location', async () => {
    render(<JobApplicantsTab jobId="j1" applications={mockApplications} candidates={mockCandidates} />);
    
    // Open Location dropdown
    fireEvent.click(screen.getByText('Location'));
    // Select New York
    fireEvent.click(screen.getByLabelText('New York'));
    
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument();
    
    // Add San Francisco
    fireEvent.click(screen.getByLabelText('San Francisco'));
    
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
  });

  it('filters by multi-select application status (Moved to Pipeline mapping)', async () => {
    render(<JobApplicantsTab jobId="j1" applications={mockApplications} candidates={mockCandidates} />);
    
    fireEvent.click(screen.getByRole('button', { name: /Application Status/i }));
    // "Screening" status is mapped to "Moved to Pipeline" in the table
    fireEvent.click(screen.getByLabelText('Moved to Pipeline'));
    
    expect(screen.queryByText('Alice Smith')).not.toBeInTheDocument(); // Alice is 'New'
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument(); // Bob is 'Moved to Pipeline'
  });

  it('shows empty state when no results match', async () => {
    render(<JobApplicantsTab jobId="j1" applications={mockApplications} candidates={mockCandidates} />);
    
    fireEvent.change(screen.getByPlaceholderText(/Search candidates/i), { target: { value: 'Nobody' } });
    
    expect(screen.getByText('No applicants found')).toBeInTheDocument();
    expect(screen.getByText('Clear all filters')).toBeInTheDocument();
  });

  it('clears filters when Clear all is clicked', async () => {
    render(<JobApplicantsTab jobId="j1" applications={mockApplications} candidates={mockCandidates} />);
    
    fireEvent.change(screen.getByPlaceholderText(/Search candidates/i), { target: { value: 'Alice' } });
    expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument();
    
    // Click Clear all
    fireEvent.click(screen.getByText('Clear all'));
    
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
  });

  it('removes individual filter chips', async () => {
    render(<JobApplicantsTab jobId="j1" applications={mockApplications} candidates={mockCandidates} />);
    
    fireEvent.change(screen.getByPlaceholderText(/Search candidates/i), { target: { value: 'Alice' } });
    
    const chip = screen.getByText('"Alice"');
    expect(chip).toBeInTheDocument();
    
    // Click X inside the chip
    const removeBtn = chip.parentElement?.querySelector('button');
    if (removeBtn) fireEvent.click(removeBtn);
    
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
  });

  it('asks for confirmation and updates stage when Move to Pipeline is clicked', () => {
    // Mock window.confirm
    const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => true);

    render(<JobApplicantsTab jobId="j1" applications={mockApplications} candidates={mockCandidates} />);
    
    // Find the move to pipeline button for Alice (who is in 'New' stage)
    const moveBtn = screen.getByTitle('Move to Pipeline');
    fireEvent.click(moveBtn);
    
    expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to move this applicant to the pipeline?');
    expect(mockUpdateStage).toHaveBeenCalledWith('a1', 'Sourced');
    
    confirmSpy.mockRestore();
    mockUpdateStage.mockClear();
  });
});
