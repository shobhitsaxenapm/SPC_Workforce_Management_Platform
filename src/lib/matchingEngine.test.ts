import { describe, it, expect } from 'vitest';
import { calculateMatch } from './matchingEngine';
import { Job, Candidate } from '../types';

describe('calculateMatch', () => {
  const baseJob = {
    id: 'j1',
    requiredSkills: ['React', 'TypeScript'],
    preferredSkills: ['Node.js'],
    experienceRange: '2-4 Years',
    location: 'Remote',
    qualifications: ['Graduate'],
    employmentType: 'Full-time'
  } as Job;

  const baseCandidate = {
    id: 'c1',
    skills: ['React', 'TypeScript', 'Node.js', 'CSS'],
    totalExperience: '3 Years',
    currentLocation: 'Remote',
    education: 'Graduate',
    noticePeriod: 'Immediate'
  } as Candidate;

  it('calculates a perfect score for an exact match', () => {
    const match = calculateMatch(baseJob, baseCandidate);
    
    // Skills: 3/3 matched = 40
    // Experience: '3 Years' is between 2-4 (extracted min 2) => 3 >= 2 = 20
    // Location: 'Remote' = 15
    // Education: 'Graduate' matches 'Graduate' = 10
    // Availability: 'Immediate' = 10
    // Employment Type: default 5
    // Total = 100
    expect(match.score).toBe(100);
    expect(match.breakdown.skills).toBe(40);
    expect(match.breakdown.experience).toBe(20);
    expect(match.breakdown.location).toBe(15);
    expect(match.breakdown.education).toBe(10);
    expect(match.breakdown.availability).toBe(10);
  });

  it('calculates partial scores correctly', () => {
    const job = { ...baseJob, requiredSkills: ['React', 'TypeScript', 'Node.js', 'AWS'] } as Job;
    const candidate = { 
      ...baseCandidate, 
      skills: ['React'], // 1/4 = 25% of 40 = 10
      totalExperience: '1 Year', // 1 < 2 => (1/2) * 20 = 10
      noticePeriod: '30 Days' // 5
    } as Candidate;

    const match = calculateMatch(job, candidate);
    expect(match.breakdown.skills).toBe(8);
    expect(match.breakdown.experience).toBe(10);
    expect(match.breakdown.availability).toBe(5);
    
    expect(match.missingRequirements).toEqual(
      expect.arrayContaining([expect.stringContaining('Missing skills:')])
    );
    expect(match.mismatchReasons).toEqual(
      expect.arrayContaining([expect.stringContaining('Short on experience')])
    );
  });

  it('handles missing candidate fields gracefully', () => {
    const candidate = { id: 'c2', skills: [] } as Candidate;
    const match = calculateMatch(baseJob, candidate);
    
    expect(match.breakdown.skills).toBe(0);
    expect(match.breakdown.experience).toBe(0); // Mismatch format fallback / empty
    expect(match.breakdown.location).toBe(0);
    expect(match.mismatchReasons).toEqual(
      expect.arrayContaining([
        'Candidate experience not provided.',
        'Candidate location not provided.',
        'Candidate education not provided.',
        'Notice period not provided.'
      ])
    );
  });

  it('gives full credit if job lacks specific criteria', () => {
    const looseJob = { ...baseJob, requiredSkills: [], preferredSkills: [], qualifications: [] } as Job;
    const match = calculateMatch(looseJob, baseCandidate);
    
    expect(match.breakdown.skills).toBe(40); // Auto 40 if no skills required
    expect(match.breakdown.education).toBe(10); // Auto 10 if no education required
  });
});
