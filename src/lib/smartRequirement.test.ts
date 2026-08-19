import { describe, it, expect } from 'vitest';
import { ExtractedRequirementData, RequirementLifecycleStatus, RequirementFulfilmentStatus, ClientRequirement } from '../types';

describe('Smart Requirement Data Validation', () => {
  it('should correctly type the ExtractedRequirementData interface', () => {
    const data: ExtractedRequirementData = {
      clientName: 'TechCorp',
      businessUnit: 'Engineering',
      roleTitle: 'Frontend Developer',
      positionsRequired: 3,
      locations: ['Remote', 'New York'],
      employmentType: 'Full-time'
    };

    expect(data.clientName).toBe('TechCorp');
    expect(data.positionsRequired).toBe(3);
    expect(data.locations).toContain('Remote');
    expect(data.employmentType).toBe('Full-time');
  });

  it('allows optional fields to be undefined', () => {
    const data: ExtractedRequirementData = {
      roleTitle: 'Backend Engineer'
    };

    expect(data.roleTitle).toBe('Backend Engineer');
    expect(data.clientName).toBeUndefined();
    expect(data.priority).toBeUndefined();
    expect(data.requiredSkills).toBeUndefined();
  });
});

describe('Requirement Lifecycle and Fulfilment', () => {
  it('validates lifecycle statuses', () => {
    const draftStatus: RequirementLifecycleStatus = 'Draft';
    const openStatus: RequirementLifecycleStatus = 'Open';
    const holdStatus: RequirementLifecycleStatus = 'On Hold';
    const closedStatus: RequirementLifecycleStatus = 'Closed';
    const cancelledStatus: RequirementLifecycleStatus = 'Cancelled';

    expect(draftStatus).toBe('Draft');
    expect(openStatus).toBe('Open');
    expect(holdStatus).toBe('On Hold');
    expect(closedStatus).toBe('Closed');
    expect(cancelledStatus).toBe('Cancelled');
  });

  it('validates fulfilment statuses', () => {
    const unfilled: RequirementFulfilmentStatus = 'Unfilled';
    const partiallyFilled: RequirementFulfilmentStatus = 'Partially Filled';
    const fulfilled: RequirementFulfilmentStatus = 'Fulfilled';

    expect(unfilled).toBe('Unfilled');
    expect(partiallyFilled).toBe('Partially Filled');
    expect(fulfilled).toBe('Fulfilled');
  });

  it('validates requirement revisions tracking', () => {
    const req: Partial<ClientRequirement> = {
      id: 'req_1',
      version: 2,
      revisions: [
        {
          id: 'rev_1',
          requirementId: 'req_1',
          version: 1,
          changedFields: [],
          previousValues: {},
          newValues: {},
          changedAt: new Date().toISOString(),
          changedBy: 'user_1',
          reason: 'Initial creation'
        },
        {
          id: 'rev_2',
          requirementId: 'req_1',
          version: 2,
          changedFields: [],
          previousValues: {},
          newValues: {},
          changedAt: new Date().toISOString(),
          changedBy: 'user_1',
          reason: 'Increased headcount'
        }
      ]
    };

    expect(req.version).toBe(2);
    expect(req.revisions?.length).toBe(2);
    expect(req.revisions?.[1].reason).toBe('Increased headcount');
  });
});
