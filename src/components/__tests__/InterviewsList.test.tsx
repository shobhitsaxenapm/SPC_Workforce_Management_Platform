// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { mockInterviews, mockCandidates, mockJobs, mockClients, mockApplications } from '../../data/mockData';
import InterviewsList from '../InterviewsList';

vi.mock('../../context/AppContext', () => ({
  useApp: () => ({
    interviews: mockInterviews,
    candidates: mockCandidates,
    jobs: mockJobs,
    clients: mockClients,
    applications: mockApplications,
    submitInterviewFeedback: vi.fn(),
    rescheduleInterview: vi.fn(),
    updateInterviewStatus: vi.fn(),
    markInterviewNoShow: vi.fn(),
    cancelInterview: vi.fn(),
    updateApplicationStage: vi.fn(),
    scheduleInterview: vi.fn(),
    addMatchToPipeline: vi.fn(),
    setQuickViewJobId: vi.fn(),
  }),
}));

describe('InterviewsList Unified Filter Button & Permutation Integrity', () => {
  afterEach(() => {
    cleanup();
  });

  const renderInterviewsList = () =>
    render(
      <MemoryRouter initialEntries={['/interviews']}>
        <InterviewsList />
      </MemoryRouter>
    );

  const getFilterSelectByLabel = (labelRegex: RegExp) => {
    return screen.getByLabelText(labelRegex) as HTMLSelectElement;
  };

  it('defaults to All Interviews tab on load so all 5 interviews are immediately visible', () => {
    renderInterviewsList();

    expect(screen.getAllByText(/Showing/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/1–5/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Sana Khan').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Riya Sharma')).toBeTruthy();
    expect(screen.getByText('Pooja Saini')).toBeTruthy();
  });

  it('houses all filters inside the Filters button, defers applying until Done is clicked, and cascades Client -> Job', () => {
    renderInterviewsList();

    // Open the unified Filters popover
    const filtersBtn = screen.getByRole('button', { name: /Filters/i });
    fireEvent.click(filtersBtn);

    // Select Client c1 (NorthStar Healthcare Services) which has j1 & j2 (3 interviews: int1, int1_r2, int3)
    const clientSelect = getFilterSelectByLabel(/^Client$/i);
    fireEvent.change(clientSelect, { target: { value: 'c1' } });

    // Before clicking Done, the underlying table list is NOT mutated yet (still showing 1–5)
    expect(screen.getAllByText(/1–5/i).length).toBeGreaterThanOrEqual(1);

    // Job / Role select inside Filters immediately scopes to c1 jobs (j1, j2), not c4 jobs (j4), in draft state
    const jobSelect = getFilterSelectByLabel(/Job \/ Role/i);
    const optionValues = Array.from(jobSelect.options).map(o => o.value).filter(Boolean);
    expect(optionValues).toContain('j1');
    expect(optionValues).toContain('j2');
    expect(optionValues).not.toContain('j4');

    // Click Done to apply Client c1 filter
    fireEvent.click(screen.getByRole('button', { name: /^Done$/i }));
    expect(screen.getAllByText(/1–3/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Client: NorthStar Healthcare Services/i)).toBeTruthy();

    // Re-open Filters and select Job j1, then click Done
    fireEvent.click(screen.getByRole('button', { name: /Filters/i }));
    fireEvent.change(getFilterSelectByLabel(/Job \/ Role/i), { target: { value: 'j1' } });
    fireEvent.click(screen.getByRole('button', { name: /^Done$/i }));
    expect(screen.getAllByText(/1–1/i).length).toBeGreaterThanOrEqual(1);

    // Re-open Filters, switch Client to c4 (auto-clears incompatible Job j1 in draft), and click Done
    fireEvent.click(screen.getByRole('button', { name: /Filters/i }));
    fireEvent.change(getFilterSelectByLabel(/^Client$/i), { target: { value: 'c4' } });
    fireEvent.click(screen.getByRole('button', { name: /^Done$/i }));
    expect(screen.queryByText(/Job: Data Entry Operator/i)).toBeNull();
    expect(screen.getAllByText(/1–2/i).length).toBeGreaterThanOrEqual(1);
  });

  it('prevents contradictory Tab + Feedback or No-Show permutations by auto-synchronizing state', () => {
    renderInterviewsList();

    // Click No Show tab -> 1 interview (int4_noshow_can)
    const noShowTabBtn = screen.getByRole('button', { name: /No Show/i });
    fireEvent.click(noShowTabBtn);
    expect(screen.getAllByText(/1–1/i).length).toBeGreaterThanOrEqual(1);

    // Open Filters popover, select No-Show Party = Candidate, and click Done
    fireEvent.click(screen.getByRole('button', { name: /Filters/i }));
    const noShowPartySelect = getFilterSelectByLabel(/No-Show Party/i);
    fireEvent.change(noShowPartySelect, { target: { value: 'Candidate' } });
    fireEvent.click(screen.getByRole('button', { name: /^Done$/i }));
    expect(screen.getAllByText(/1–1/i).length).toBeGreaterThanOrEqual(1);

    // Selecting Feedback Status = Received while on No Show tab and clicking Done auto-switches to All Interviews
    // and clears the incompatible No-Show Party filter instead of trapping user in 0 results!
    fireEvent.click(screen.getByRole('button', { name: /Filters/i }));
    const feedbackSelect = getFilterSelectByLabel(/Feedback Status/i);
    fireEvent.change(feedbackSelect, { target: { value: 'Received' } });
    fireEvent.click(screen.getByRole('button', { name: /^Done$/i }));
    expect(screen.getAllByText(/1–1/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Riya Sharma')).toBeTruthy();
  });

  it('filters by multi-panelist interviewer, recruiter outcome, and supports active chip removal', () => {
    renderInterviewsList();

    // Open Filters popover
    fireEvent.click(screen.getByRole('button', { name: /Filters/i }));

    // Pooja Varma is a secondary panelist on int1 (not primary interviewerName)
    const interviewerSelect = getFilterSelectByLabel(/Interviewer \/ Panelist/i);
    fireEvent.change(interviewerSelect, { target: { value: 'Pooja Varma' } });
    fireEvent.click(screen.getByRole('button', { name: /^Done$/i }));
    expect(screen.getAllByText(/1–1/i).length).toBeGreaterThanOrEqual(1);

    // Remove the Interviewer chip via its X button
    const removeInterviewerBtn = screen.getByLabelText(/Remove Interviewer: Pooja Varma filter/i);
    fireEvent.click(removeInterviewerBtn);
    expect(screen.getAllByText(/1–5/i).length).toBeGreaterThanOrEqual(1);

    // Filter by Recruiter Outcome = Pending Decision (int2 is Completed without recruiterOutcome)
    fireEvent.click(screen.getByRole('button', { name: /Filters/i }));
    const outcomeSelect = getFilterSelectByLabel(/Recruiter Outcome/i);
    fireEvent.change(outcomeSelect, { target: { value: 'Pending Decision' } });
    fireEvent.click(screen.getByRole('button', { name: /^Done$/i }));
    expect(screen.getAllByText(/1–1/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Pooja Saini')).toBeTruthy();
  });

  it('removes standalone View button, shows one primary action + View History, highlights selected round in drawer, and keeps feedback not due until completed', () => {
    renderInterviewsList();

    // Standalone "View" button is removed; "View History" is rendered per row
    expect(screen.queryByRole('button', { name: /^View$/i })).toBeNull();
    const viewHistoryButtons = screen.getAllByRole('button', { name: /View History/i });
    expect(viewHistoryButtons.length).toBeGreaterThanOrEqual(5);

    // Uncompleted overdue interview shows "Feedback: Not Due until completed"
    expect(screen.getAllByText(/Feedback: Not Due until completed/i).length).toBeGreaterThanOrEqual(1);

    // Click View History on the first row and verify the selected round is highlighted/expanded in InterviewHistoryDrawer
    fireEvent.click(viewHistoryButtons[0]);
    expect(screen.getByRole('dialog', { name: /Interview History Drawer/i })).toBeTruthy();
    expect(screen.getByText('Selected Round')).toBeTruthy();
  });
});
