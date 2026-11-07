import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import JobOverviewTab from '../JobOverviewTab';
import { getJobIntelligence } from '../../lib/jobIntelligence';
import { Job, Application } from '../../types';

describe('Job Intelligence Engine & JobOverviewTab', () => {
  const sampleJob: Job = {
    id: 'j1',
    code: 'JOB-26-001',
    title: 'Data Entry Operator',
    projectId: 'p1',
    clientId: 'c1',
    projectName: 'Records Digitisation',
    engagementType: 'Direct Recruitment',
    location: 'Delhi',
    openings: 10,
    filled: 2,
    employmentType: 'Contract',
    hiringModel: 'SPC Hire',
    experienceRange: '0-2 Years',
    requiredSkills: ['Typing Speed > 40 WPM', 'MS Excel'],
    preferredSkills: ['Healthcare Terminology'],
    summary: 'Digitize high volume patient records.',
    responsibilities: ['Enter records', 'Verify accuracy'],
    qualifications: ['Any Graduate'],
    targetJoiningDate: '2026-08-01T00:00:00Z',
    applicationDeadline: '2026-07-25T00:00:00Z',
    visibility: 'Internal',
    status: 'Open',
    isPublished: false,
    createdAt: '2026-06-01T00:00:00Z'
  };

  const sampleApps: Application[] = [
    {
      id: 'app1',
      candidateId: 'c1',
      jobId: 'j1',
      appliedAt: '2026-06-02T00:00:00Z',
      source: 'SPC Careers Website',
      currentStage: 'Sourced',
      stageHistory: [],
      lastActivity: '2026-06-02T00:00:00Z'
    }
  ];

  it('correctly derives intelligence for Data Entry Operator role', () => {
    const intel = getJobIntelligence(sampleJob);
    expect(intel.roleMission[0]).toContain('digitize');
    expect(intel.mustHaveSkills).toContain('Typing Speed > 40 WPM');
    expect(intel.screeningQuestions.length).toBe(3);
    expect(intel.impactPillars.length).toBe(3);
    expect(intel.sourcingGuardrails.noticePeriod).toBeDefined();
  });

  it('renders modern Job Overview layout without Draft text or Linked Project', () => {
    const onRefreshMatches = vi.fn();
    const onConfigureHiringModel = vi.fn();

    render(
      <JobOverviewTab
        job={sampleJob}
        applications={sampleApps}
        applicants={sampleApps}
        pipelineApps={sampleApps}
        activeMatches={[]}
        canRunMatching={true}
        isRefreshing={false}
        onRefreshMatches={onRefreshMatches}
        onConfigureHiringModel={onConfigureHiringModel}
      />
    );

    // AI Mission check
    expect(screen.getByText('AI Role Mission & Purpose')).toBeInTheDocument();
    expect(screen.getByText(/Recruiter Brief/i)).toBeInTheDocument();

    // Competency Matrix check
    expect(screen.getByText(/Candidate Competency Matrix/i)).toBeInTheDocument();
    expect(screen.getByText(/Must-Have Requirements/i)).toBeInTheDocument();
    expect(screen.getByText(/Advantageous \/ Bonus Skills/i)).toBeInTheDocument();

    // Core Deliverables check
    expect(screen.getByText(/Core Deliverables & Focus Pillars/i)).toBeInTheDocument();

    // Clean publication status: "Internal Job Opening" without "Draft"
    expect(screen.getByText('Internal Job Opening')).toBeInTheDocument();
    expect(screen.queryByText(/Never published \(Internal \/ Draft\)/i)).not.toBeInTheDocument();

    // Verify Linked Project is NOT present in the card
    expect(screen.queryByText('Linked Project')).not.toBeInTheDocument();

    // Check screening prompts toggle
    const accordionBtn = screen.getByText(/Recruiter Screening Prompts/i);
    expect(accordionBtn).toBeInTheDocument();
    fireEvent.click(accordionBtn);
    // After collapsing, clicking again expands
    fireEvent.click(accordionBtn);
    expect(screen.getByText(/Q1/i)).toBeInTheDocument();
  });
});
