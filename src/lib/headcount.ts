import { Application, Job, RequirementLifecycleStatus } from '../types';

/**
 * Calculates the total number of openings allocated to non-cancelled jobs for a given requirement.
 * We include Draft, Published, Paused, Filled, and Closed jobs since they still represent allocated demand.
 */
export function getAllocatedOpenings(requirementId: string, jobs: Job[]): number {
  return jobs
    .filter(job => job.requirementId === requirementId)
    .reduce((total, job) => total + (job.openings || 0), 0);
}

/**
 * Calculates the remaining unallocated positions for a requirement.
 */
export function getUnallocatedPositions(requirementId: string, totalRequestedHeadcount: number, jobs: Job[]): number {
  return totalRequestedHeadcount - getAllocatedOpenings(requirementId, jobs);
}

/**
 * Returns true if an application's stage counts as "Fulfilled".
 */
export function isStageFulfilled(stage: string): boolean {
  return stage === 'Hired' || stage === 'Joined' || stage === 'Offer Accepted';
}

/**
 * Calculates fulfilled positions for a single job based on linked applications.
 */
export function getFulfilledPositionsForJob(jobId: string, applications: Application[]): number {
  return applications.filter(app => app.jobId === jobId && isStageFulfilled(app.currentStage)).length;
}

/**
 * Calculates fulfilled positions across all jobs for a requirement.
 */
export function getFulfilledPositions(requirementId: string, jobs: Job[], applications: Application[]): number {
  const reqJobIds = new Set(jobs.filter(j => j.requirementId === requirementId).map(j => j.id));
  return applications.filter(app => reqJobIds.has(app.jobId) && isStageFulfilled(app.currentStage)).length;
}

/**
 * Calculates the number of joined positions across all jobs for a requirement.
 */
export function getJoinedPositions(requirementId: string, jobs: Job[], applications: Application[]): number {
  const reqJobIds = new Set(jobs.filter(j => j.requirementId === requirementId).map(j => j.id));
  return applications.filter(app => reqJobIds.has(app.jobId) && app.currentStage === 'Joined').length;
}

/**
 * Calculates the remaining headcount to fulfil for a requirement.
 */
export function getRemainingToFulfil(requirementId: string, totalRequestedHeadcount: number, jobs: Job[], applications: Application[]): number {
  return totalRequestedHeadcount - getFulfilledPositions(requirementId, jobs, applications);
}

/**
 * Determines the lifecycle status of a requirement based on its allocation and fulfilment.
 */
export function determineRequirementStatus(
  currentStatus: RequirementLifecycleStatus,
  totalRequestedHeadcount: number,
  allocatedOpenings: number,
  fulfilledPositions: number
): RequirementLifecycleStatus {
  // If manually closed, cancelled, or on hold, preserve it
  if (['Closed', 'Cancelled', 'On Hold', 'Draft'].includes(currentStatus)) {
    return currentStatus;
  }

  if (fulfilledPositions >= totalRequestedHeadcount) {
    return 'Fulfilled';
  }
  
  if (fulfilledPositions > 0 && fulfilledPositions < totalRequestedHeadcount) {
    return 'Partially Fulfilled';
  }

  if (allocatedOpenings >= totalRequestedHeadcount) {
    return 'Fully Allocated';
  }

  return 'Open';
}
