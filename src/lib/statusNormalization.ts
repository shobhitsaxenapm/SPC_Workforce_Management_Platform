import { Job, Application, Offer, JobStatus, JobHoldReason, JobCloseReason, ApplicationStage } from '../types';

export function normalizeJob(job: any): Job {
  const normalized = { ...job } as Job;

  // Handle old 'Published' status
  if ((normalized as any).status === 'Published') {
    normalized.status = 'Open';
    normalized.isPublished = true;
  }
  
  if ((normalized as any).status === 'Unpublished') {
    normalized.status = 'Open';
    normalized.isPublished = false;
  }

  // 1. Job Lifecycle Normalization
  // 3. Dormant Handling
  const legacyStatus = (normalized as any).status;
  if (legacyStatus === 'Live' || legacyStatus === 'Dormant' || legacyStatus === 'CV Shared' || legacyStatus === 'Feedback Pending') {
    normalized.status = 'Open';
  }

  // 2. Job Hold Reasons
  if (legacyStatus === 'On Hold - Client' || legacyStatus === 'On Hold \u2013 Client') {
    normalized.status = 'On Hold';
    normalized.holdReason = 'Client Hold';
  } else if (legacyStatus === 'On Hold - Internal' || legacyStatus === 'On Hold \u2013 Internal') {
    normalized.status = 'On Hold';
    normalized.holdReason = 'Internal Hold';
  } else if (legacyStatus === 'On Hold - Sourcing Difficulty' || legacyStatus === 'On Hold \u2013 Sourcing Difficulty') {
    normalized.status = 'On Hold';
    normalized.holdReason = 'Sourcing Difficulty';
  }

  // 4. Closed Jobs and Closure Reasons
  if (legacyStatus === 'Placed') {
    normalized.status = 'Closed';
    normalized.closeReason = 'Positions Filled/Placed';
  } else if (legacyStatus === 'Lost to Competitor') {
    normalized.status = 'Closed';
    normalized.closeReason = 'Lost to Competitor';
  } else if (legacyStatus === 'Client Cancelled') {
    normalized.status = 'Closed';
    normalized.closeReason = 'Client Cancelled';
  }

  return normalized;
}

export function normalizeApplication(app: any, job?: Job): Application {
  const normalized = { ...app } as Application;
  
  // 5. Candidate-job workflow values
  if (job) {
    const legacyJobStatus = (job as any).status;
    if (legacyJobStatus === 'CV Shared' || legacyJobStatus === 'Feedback Pending') {
      normalized.clientReviewStatus = legacyJobStatus;
    }
  }
  
  if (normalized.currentSubstate === 'CV Shared' || normalized.currentSubstate === 'Feedback Pending') {
    normalized.clientReviewStatus = normalized.currentSubstate as any;
  }

  // 6. Offer Acceptance and Joining Outcome
  // "After acceptance, set the candidate-job hiring outcome to: Joining Pending"
  
  // Convert old Hired into Joining Pending unless explicitly confirmed placed/joined
  if (normalized.currentStage === 'Hired' as any) {
    if (normalized.currentSubstate === 'Joined' || normalized.currentSubstate === 'Placed' || normalized.currentSubstate === 'Placed/Joined') {
      normalized.currentStage = 'Hired/Placed';
    } else {
      normalized.currentStage = 'Joining Pending';
    }
  }

  if ((normalized as any).currentStage === 'Offer Accepted') {
     normalized.currentStage = 'Joining Pending';
  }
  
  if ((normalized as any).currentSubstate === 'Offer Accepted' && normalized.currentStage !== 'Hired/Placed' && normalized.currentStage !== 'Joined') {
     normalized.currentStage = 'Joining Pending';
  }

  return normalized;
}

export function normalizeOffer(offer: any): Offer {
  const normalized = { ...offer } as Offer;
  
  // "Offer Accepted remains an Offer status"
  // "Do not use Placed as an Offer status"
  const legacyOfferStatus = (normalized as any).status;
  if (legacyOfferStatus === 'Placed' || legacyOfferStatus === 'Hired' || legacyOfferStatus === 'Joined') {
    normalized.status = 'Accepted';
  }

  return normalized;
}
