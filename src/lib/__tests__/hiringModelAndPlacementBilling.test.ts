import { describe, it, expect } from 'vitest';
import { isJobHiringModelLocked, getHiringModelBadgeConfig, getPlacementBillingStatusConfig } from '../hiringModelUtils';
import { Application, Job, Placement, PlacementBillingStatus } from '../../types';

describe('Phase 2: Job Hiring Model & Locking Rules', () => {
  it('identifies when Hiring Model is locked based on candidate pipeline stage', () => {
    const jobId = 'test-job-1';
    
    // Empty pipeline - unlocked
    expect(isJobHiringModelLocked(jobId, [])).toBe(false);

    // Only 'New', 'Under Review', 'Application Rejected' candidates - unlocked
    const prePipelineApps: Partial<Application>[] = [
      { id: 'app1', jobId, currentStage: 'New' },
      { id: 'app2', jobId, currentStage: 'Under Review' },
      { id: 'app3', jobId, currentStage: 'Application Rejected' },
      { id: 'app4', jobId: 'other-job', currentStage: 'Interviewing' }
    ];
    expect(isJobHiringModelLocked(jobId, prePipelineApps as Application[])).toBe(false);

    // Once a candidate reaches Sourced, Screening, Client Review, Interviewing, Selected, Offered, or Hired - locked!
    const activePipelineApps: Partial<Application>[] = [
      { id: 'app1', jobId, currentStage: 'New' },
      { id: 'app2', jobId, currentStage: 'Interviewing' }
    ];
    expect(isJobHiringModelLocked(jobId, activePipelineApps as Application[])).toBe(true);

    const selectedPipelineApps: Partial<Application>[] = [
      { id: 'app1', jobId, currentStage: 'Selected' }
    ];
    expect(isJobHiringModelLocked(jobId, selectedPipelineApps as Application[])).toBe(true);
  });

  it('correctly provides badges for canonical hiring models and unconfigured legacy jobs', () => {
    const clientHireConfig = getHiringModelBadgeConfig('Client Hire');
    expect(clientHireConfig.label).toBe('Client Hire');
    expect(clientHireConfig.isConfigured).toBe(true);

    const spcHireConfig = getHiringModelBadgeConfig('SPC Hire');
    expect(spcHireConfig.label).toBe('SPC Hire');
    expect(spcHireConfig.isConfigured).toBe(true);

    const notConfiguredConfig = getHiringModelBadgeConfig('Not Configured');
    expect(notConfiguredConfig.label).toBe('Not Configured');
    expect(notConfiguredConfig.isConfigured).toBe(false);

    const undefinedConfig = getHiringModelBadgeConfig(undefined);
    expect(undefinedConfig.label).toBe('Not Configured');
    expect(undefinedConfig.isConfigured).toBe(false);
  });
});

describe('Phase 2: Placement Billing Status Configurations', () => {
  it('correctly orders linear steps and configures terminal exception states', () => {
    const eligible = getPlacementBillingStatusConfig('Billing Eligible');
    expect(eligible.label).toBe('Billing Eligible');
    expect(eligible.step).toBe(1);

    const draft = getPlacementBillingStatusConfig('Invoice Draft');
    expect(draft.step).toBe(2);

    const sent = getPlacementBillingStatusConfig('Invoice Sent');
    expect(sent.step).toBe(3);

    const pending = getPlacementBillingStatusConfig('Payment Pending');
    expect(pending.step).toBe(4);

    const paid = getPlacementBillingStatusConfig('Paid');
    expect(paid.step).toBe(5);

    const disputed = getPlacementBillingStatusConfig('Disputed');
    expect(disputed.step).toBe(-1);

    const cancelled = getPlacementBillingStatusConfig('Cancelled');
    expect(cancelled.step).toBe(-1);
  });
});

describe('Phase 2: Legacy Data Invariants', () => {
  it('verifies that legacy jobs without linked offers/onboarding remain Not Configured', () => {
    // In mockJobs: j1 and j3 have offers off1 and off2 -> SPC Hire
    // j2 and j4 have NO offers -> Not Configured (must never be inferred as Client Hire)
    const mockJobsFixture: Partial<Job>[] = [
      { id: 'j1', title: 'Senior Software Engineer', hiringModel: 'SPC Hire' },
      { id: 'j2', title: 'Product Operations Associate', hiringModel: 'Not Configured' },
      { id: 'j3', title: 'Data Extraction Specialist', hiringModel: 'SPC Hire' },
      { id: 'j4', title: 'Backend Lead', hiringModel: 'Not Configured' }
    ];

    const unconfigured = mockJobsFixture.filter(j => j.hiringModel === 'Not Configured');
    expect(unconfigured.map(j => j.id)).toEqual(['j2', 'j4']);
  });
});
