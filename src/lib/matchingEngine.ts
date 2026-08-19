import { Job, Candidate, JobMatch, MatchScoreBreakdown } from '../types';

/**
 * Deterministically calculates a match score for a Candidate against a Job.
 * Weights:
 * - Skills: 40%
 * - Experience: 20%
 * - Location: 15%
 * - Education: 10%
 * - Availability: 10%
 * - Employment Type: 5%
 */
export function calculateMatch(job: Job, candidate: Candidate): JobMatch {
  let score = 0;
  const breakdown: MatchScoreBreakdown = {
    skills: 0,
    experience: 0,
    location: 0,
    education: 0,
    availability: 0,
    employmentType: 0,
  };
  const missingRequirements: string[] = [];
  const mismatchReasons: string[] = [];
  const matchStrengths: string[] = [];

  // 1. Skills (40%)
  const jobSkills = [...(job.requiredSkills || []), ...(job.preferredSkills || [])];
  if (jobSkills.length === 0) {
    breakdown.skills = 40;
    score += 40;
  } else {
    const candidateSkillsLower = candidate.skills.map(s => s.toLowerCase());
    const matchedSkills = jobSkills.filter(js => 
      candidateSkillsLower.some(cs => cs.includes(js.toLowerCase()) || js.toLowerCase().includes(cs))
    );
    
    breakdown.skills = Math.round((matchedSkills.length / jobSkills.length) * 40);
    score += breakdown.skills;
    
    if (matchedSkills.length > 0) {
      matchStrengths.push(`Matches ${matchedSkills.length} of ${jobSkills.length} requested skills.`);
    }
    const missingSkills = jobSkills.filter(js => !matchedSkills.includes(js));
    if (missingSkills.length > 0) {
      missingRequirements.push(`Missing skills: ${missingSkills.slice(0, 3).join(', ')}${missingSkills.length > 3 ? '...' : ''}`);
    }
  }

  // 2. Experience (20%)
  const jobExp = (job.experienceRange || '').toLowerCase();
  const candExp = (candidate.totalExperience || '').toLowerCase();
  
  if (jobExp.includes('fresher') || jobExp.includes('0-')) {
    if (candExp.includes('fresher') || candExp.includes('0') || !candExp) {
      breakdown.experience = 20;
      score += 20;
    } else {
      breakdown.experience = 20; // Overqualified is fine for deterministic scoring unless strictly capped
      score += 20;
    }
  } else {
    // Try to extract numbers
    const jobNumbers = jobExp.match(/\d+(\.\d+)?/g);
    const candNumbers = candExp.match(/\d+(\.\d+)?/g);
    
    if (!candExp || candExp.trim() === '') {
      mismatchReasons.push('Candidate experience not provided.');
    } else if (jobNumbers && jobNumbers.length > 0 && candNumbers && candNumbers.length > 0) {
      const jobMin = parseFloat(jobNumbers[0]);
      const candYears = parseFloat(candNumbers[0]);
      
      if (candYears >= jobMin) {
        breakdown.experience = 20;
        score += 20;
        matchStrengths.push(`Meets minimum experience of ${jobMin} years.`);
      } else {
        const partial = Math.max(0, Math.round((candYears / jobMin) * 20));
        breakdown.experience = partial;
        score += partial;
        mismatchReasons.push(`Short on experience (has ${candYears}y, needs ${jobMin}y).`);
      }
    } else {
      // Fallback string matching
      if (candExp.includes(jobExp) || jobExp.includes(candExp)) {
        breakdown.experience = 20;
        score += 20;
      } else {
        breakdown.experience = 10; // Partial match fallback
        score += 10;
        mismatchReasons.push(`Experience format mismatch or unclear (Needs: ${job.experienceRange}).`);
      }
    }
  }

  // 3. Location (15%)
  if (!candidate.currentLocation) {
    mismatchReasons.push('Candidate location not provided.');
  } else if (
    candidate.currentLocation.toLowerCase().includes(job.location.toLowerCase()) || 
    job.location.toLowerCase().includes(candidate.currentLocation.toLowerCase()) ||
    job.location.toLowerCase() === 'remote' || 
    job.location.toLowerCase() === 'any'
  ) {
    breakdown.location = 15;
    score += 15;
    matchStrengths.push(`Location matches (${job.location}).`);
  } else {
    mismatchReasons.push(`Location mismatch (Candidate: ${candidate.currentLocation}, Job: ${job.location}).`);
  }

  // 4. Education (10%)
  if (!job.qualifications || job.qualifications.length === 0) {
    breakdown.education = 10;
    score += 10;
  } else if (!candidate.education) {
    mismatchReasons.push('Candidate education not provided.');
  } else {
    const candEdu = candidate.education.toLowerCase();
    const matchedEdu = job.qualifications.some(q => candEdu.includes(q.toLowerCase()) || q.toLowerCase().includes(candEdu) || (q.toLowerCase() === 'graduate' && (candEdu.includes('b.') || candEdu.includes('degree'))));
    if (matchedEdu) {
      breakdown.education = 10;
      score += 10;
      matchStrengths.push('Meets education qualifications.');
    } else {
      breakdown.education = 5; // Partial credit for having some education
      score += 5;
      mismatchReasons.push(`Education may not meet requirements (Needs: ${job.qualifications.join(', ')}).`);
    }
  }

  // 5. Availability (10%)
  if (!candidate.noticePeriod) {
    mismatchReasons.push('Notice period not provided.');
    breakdown.availability = 5;
    score += 5;
  } else {
    const np = candidate.noticePeriod.toLowerCase();
    if (np.includes('immediate')) {
      breakdown.availability = 10;
      score += 10;
      matchStrengths.push('Immediately available.');
    } else if (np.includes('15')) {
      breakdown.availability = 8;
      score += 8;
    } else if (np.includes('30')) {
      breakdown.availability = 5;
      score += 5;
    } else {
      breakdown.availability = 2;
      score += 2;
    }
  }

  // 6. Employment Type Compatibility (5%)
  // Simple default to 5 since candidate model doesn't strictly track preferred employment type
  breakdown.employmentType = 5;
  score += 5;

  return {
    candidateId: candidate.id,
    score,
    breakdown,
    missingRequirements,
    mismatchReasons,
    matchStrengths,
    dismissed: false,
  };
}
