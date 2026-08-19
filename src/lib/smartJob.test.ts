import { describe, it, expect } from 'vitest';
import { ExtractedJobData } from '../types';

describe('Smart Job Data Validation', () => {
  it('should correctly type the ExtractedJobData interface', () => {
    const data: ExtractedJobData = {
      title: 'Software Engineer',
      openings: 5,
      requiredSkills: ['React', 'Node.js'],
      linkedClientRequirement: 'req_123'
    };

    expect(data.title).toBe('Software Engineer');
    expect(data.openings).toBe(5);
    expect(data.requiredSkills).toContain('React');
    expect(data.linkedClientRequirement).toBe('req_123');
  });

  it('allows optional fields to be undefined', () => {
    const data: ExtractedJobData = {
      title: 'Designer'
    };

    expect(data.title).toBe('Designer');
    expect(data.summary).toBeUndefined();
    expect(data.preferredSkills).toBeUndefined();
  });
});
