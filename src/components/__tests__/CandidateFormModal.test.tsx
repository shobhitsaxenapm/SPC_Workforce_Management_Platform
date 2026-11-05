import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CandidateFormModal from '../CandidateFormModal';
import { Candidate } from '../../types';
import '@testing-library/jest-dom';

const mockCreateCandidate = vi.fn().mockReturnValue({ success: true, candidateId: 'new_cand_shobhit' });
const mockUpdateCandidate = vi.fn();

vi.mock('../../context/AppContext', () => ({
  useApp: () => ({
    createCandidate: mockCreateCandidate,
    updateCandidate: mockUpdateCandidate,
    candidates: [],
  })
}));

const mockShobhitData: Partial<Candidate> = {
  fullName: 'Shobhit Saxena',
  email: 'shobhitsaxena0320@gmail.com',
  phone: '+91-7017764335',
  currentLocation: 'Bangalore, India',
  currentRole: 'AI Product Manager',
  currentCompany: 'Irame.ai',
  totalExperience: '4+ Years',
  professionalSummary: 'AI Product Manager with 4+ years of experience building AI-powered SaaS products.',
  skills: ['AI Product Strategy', 'Generative AI', 'LLM Applications', 'RAG'],
  languages: ['English', 'Hindi'],
  employmentHistory: [
    {
      company: 'Irame.ai',
      role: 'AI Product Manager',
      location: 'Bangalore',
      startDate: 'Nov 2025',
      endDate: 'Present',
      responsibilities: ['Defined AI-powered workflow generation']
    }
  ],
  educationEntries: [
    {
      qualification: 'Master of Science in Information Technology (CGPA: 7.22)',
      institution: 'DA-IICT, Gandhinagar',
      completionYear: '2022'
    }
  ],
  resumeUrl: 'Shobhit_Saxena_Resume.pdf'
};

describe('CandidateFormModal Dual-Resume & AI Profile Review', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dual-resume comparison with AI Standardized Template on left and Original Resume on right', () => {
    render(
      <CandidateFormModal
        isOpen={true}
        onClose={vi.fn()}
        initialData={mockShobhitData}
        isEditMode={false}
      />
    );

    // Header and tags
    expect(screen.getByText('AI Dual-Resume Review & Verification')).toBeInTheDocument();
    expect(screen.getAllByText(/10 Parameters Extracted/i).length).toBeGreaterThanOrEqual(1);

    // Left pane: AI Standardized Template
    expect(screen.getByText('Standardized Candidate Profile')).toBeInTheDocument();
    expect(screen.getByText('AI Fit & Executive Summary')).toBeInTheDocument();
    expect(screen.getByText('Top Core Skills')).toBeInTheDocument();
    expect(screen.getByText('Extracted from Resume')).toBeInTheDocument();
    expect(screen.getByText('Experience Analysis (AI)')).toBeInTheDocument();
    expect(screen.getByText('Career Trajectory & Domain Strength')).toBeInTheDocument();
    expect(screen.getByText('Highest Qualification')).toBeInTheDocument();
    expect(screen.queryByText('Certifications, Impact & Recruiter Metrics')).not.toBeInTheDocument();

    // Verify Relocate chip and Param badges are removed
    expect(screen.queryByText(/Relocate:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Params 1–5/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Param 6/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Param 7/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Param 8/i)).not.toBeInTheDocument();

    // Right pane: Original Resume As-Is
    expect(screen.getByText('ORIGINAL PDF')).toBeInTheDocument();
    expect(screen.getByText("Candidate's Uploaded Document")).toBeInTheDocument();
  });

  it('renders Core Matched Skills (JD-Aligned) with target job badge when candidate is matched against a JD', () => {
    render(
      <CandidateFormModal
        isOpen={true}
        onClose={vi.fn()}
        initialData={mockShobhitData}
        isEditMode={false}
        targetJobTitle="Senior AI Product Manager"
        isJobMatched={true}
      />
    );

    expect(screen.getByText('Core Matched Skills (JD-Aligned)')).toBeInTheDocument();
    expect(screen.getByText(/Aligned to Senior AI Product Manager/i)).toBeInTheDocument();
  });

  it('toggles edit profile mode on left pane to reveal editable form inputs and toggles back', async () => {
    const user = userEvent.setup();
    render(
      <CandidateFormModal
        isOpen={true}
        onClose={vi.fn()}
        initialData={mockShobhitData}
        isEditMode={false}
      />
    );

    // Click edit button on left pane
    const flipButton = screen.getByTitle(/Edit profile details/i);
    await user.click(flipButton);

    // Now flipped view with editable form is active
    expect(screen.getByText('Edit Extracted Parameters')).toBeInTheDocument();
    expect(screen.getByText('EDIT MODE')).toBeInTheDocument();

    // Form inputs should be editable
    const nameInput = screen.getByDisplayValue('Shobhit Saxena');
    expect(nameInput).toBeInTheDocument();

    // View profile back
    const flipBackBtn = screen.getByTitle(/View standardized candidate profile/i);
    await user.click(flipBackBtn);

    // Standardized template should be displayed again
    expect(screen.getByText('Standardized Candidate Profile')).toBeInTheDocument();
  });

  it('allows editing values in the flipped view and saving candidate successfully', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    const handleSaveSuccess = vi.fn();

    render(
      <CandidateFormModal
        isOpen={true}
        onClose={handleClose}
        initialData={mockShobhitData}
        isEditMode={false}
        onSaveSuccess={handleSaveSuccess}
      />
    );

    // Click edit button
    const flipButton = screen.getByTitle(/Edit profile details/i);
    await user.click(flipButton);

    const nameInput = screen.getByDisplayValue('Shobhit Saxena');
    await user.clear(nameInput);
    await user.type(nameInput, 'Shobhit Saxena PM');

    const saveButton = screen.getByRole('button', { name: /Save Candidate/i });
    await user.click(saveButton);

    expect(mockCreateCandidate).toHaveBeenCalledWith(expect.objectContaining({
      fullName: 'Shobhit Saxena PM',
      currentLocation: 'Bangalore, India',
      currentRole: 'AI Product Manager',
    }));

    expect(handleSaveSuccess).toHaveBeenCalledWith('new_cand_shobhit');
    expect(handleClose).toHaveBeenCalled();
  });
});
